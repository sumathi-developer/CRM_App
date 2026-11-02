export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const localOverride = localStorage.getItem('crm_api_base_url');
    if (localOverride && localOverride.trim()) {
      return localOverride.trim().replace(/\/+$/, '');
    }
    const winOverride = (window as any).__CRM_API_URL__;
    if (winOverride && typeof winOverride === 'string' && winOverride.trim()) {
      return winOverride.trim().replace(/\/+$/, '');
    }
  }

  const envUrl = (import.meta.env.VITE_API_URL as string | undefined) || '';
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return '';
}

export function setApiBaseUrl(url: string | null): void {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('crm_api_base_url');
    } else {
      localStorage.setItem('crm_api_base_url', url.trim().replace(/\/+$/, ''));
    }
    window.dispatchEvent(new CustomEvent('crm:api-url-changed', { detail: { url } }));
  }
}

export function isApiConfigured(): boolean {
  if (typeof window === 'undefined') return true;
  const isLocal = ['localhost', '127.0.0.1', '::1', ''].includes(window.location.hostname);
  if (isLocal) return true; // On localhost, Vite dev server proxies requests
  return Boolean(getApiBaseUrl());
}

let hasWarnedMissingUrl = false;

export function resolveUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    if (
      typeof window !== 'undefined' &&
      !['localhost', '127.0.0.1', '::1', ''].includes(window.location.hostname) &&
      !hasWarnedMissingUrl
    ) {
      hasWarnedMissingUrl = true;
      console.warn(
        `[CRM Config] No backend API URL configured. Outgoing request to "${cleanEndpoint}" is directed to the static frontend host and may return 404. ` +
        `Set VITE_API_URL in Render Static Site -> Environment, or set it via localStorage.setItem('crm_api_base_url', 'https://your-backend.onrender.com').`
      );
    }
    return cleanEndpoint;
  }
  return `${baseUrl}${cleanEndpoint}`;
}

export class ApiError extends Error {
  statusCode: number;
  error?: string;
  validationErrors?: string[];

  constructor(message: string, statusCode: number, error?: string, validationErrors?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.error = error;
    this.validationErrors = validationErrors;
  }
}

class ApiClient {
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  getAccessToken(): string | null {
    return localStorage.getItem('crm_access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('crm_refresh_token');
  }

  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('crm_access_token', accessToken);
    localStorage.setItem('crm_refresh_token', refreshToken);
  }

  clearTokens() {
    localStorage.removeItem('crm_access_token');
    localStorage.removeItem('crm_refresh_token');
    localStorage.removeItem('crm_user');
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const url = resolveUrl(endpoint);
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type');
      let data: any = null;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : {};
      }

      // Handle 401 Unauthorized - Token Refresh
      if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            try {
              const refreshRes = await fetch(resolveUrl('/auth/refresh'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
              });

              const refreshData = await refreshRes.json();
              if (refreshRes.ok) {
                const newTokens = refreshData.data || refreshData;
                this.setTokens(newTokens.accessToken, newTokens.refreshToken || refreshToken);
                this.isRefreshing = false;
                this.onRefreshed(newTokens.accessToken);
                return this.request<T>(endpoint, options, true);
              } else {
                this.isRefreshing = false;
                this.clearTokens();
                window.dispatchEvent(new CustomEvent('auth:expired'));
                throw new ApiError('Session expired. Please log in again.', 401);
              }
            } catch (err) {
              this.isRefreshing = false;
              this.clearTokens();
              window.dispatchEvent(new CustomEvent('auth:expired'));
              throw err;
            }
          } else {
            // Wait for existing refresh to finish
            return new Promise<T>((resolve, reject) => {
              this.subscribeTokenRefresh(async (newToken) => {
                try {
                  const retryHeaders = {
                    ...headers,
                    Authorization: `Bearer ${newToken}`,
                  };
                  const res = await fetch(url, { ...options, headers: retryHeaders });
                  const resData = await res.json();
                  resolve(resData.data !== undefined ? resData.data : resData);
                } catch (retryErr) {
                  reject(retryErr);
                }
              });
            });
          }
        }
      }

      if (!response.ok) {
        let errorMessage = 'An error occurred. Please try again.';
        let validationErrors: string[] | undefined;

        if (response.status === 404 && !isApiConfigured()) {
          errorMessage =
            'Backend API server not found (404). Backend service URL is not configured. Please set VITE_API_URL in Render Environment settings or connect backend URL.';
        } else if (data) {
          if (Array.isArray(data.message)) {
            validationErrors = data.message;
            errorMessage = data.message.join(', ');
          } else if (typeof data.message === 'string') {
            errorMessage = data.message;
          } else if (data.error) {
            errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
          }
        }

        throw new ApiError(errorMessage, response.status, data?.error, validationErrors);
      }

      // Backend wraps in { success: true, statusCode: 200, data: T }
      if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
        return data.data as T;
      }

      return data as T;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error.message || 'Unable to connect to server. Please check your network.',
        0,
        'NetworkError'
      );
    }
  }

  get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  getApiBaseUrl(): string {
    return getApiBaseUrl();
  }

  setApiBaseUrl(url: string | null): void {
    setApiBaseUrl(url);
  }

  isApiConfigured(): boolean {
    return isApiConfigured();
  }

  resolveUrl(endpoint: string): string {
    return resolveUrl(endpoint);
  }
}

export const api = new ApiClient();
