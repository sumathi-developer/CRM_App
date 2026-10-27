const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
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
              const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
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

        if (data) {
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

  delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
