import { api } from './api';
import type {
  AuthSuccessPayload,
  User,
  SessionInfo,
} from '../types/auth.types';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  name: string;
  email: string;
  password: string;
  phone?: string;
  organizationId?: string;
  roleId?: string;
}

export interface ForgotPasswordParams {
  email: string;
}

export interface ResetPasswordParams {
  token: string;
  newPassword: string;
}

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileParams {
  name?: string;
  phone?: string;
  avatar?: string;
}

// Session mock storage key for multi-session demonstration
const SESSIONS_STORAGE_KEY = 'crm_active_sessions';

function getClientDeviceInfo(): Omit<SessionInfo, 'id' | 'isCurrent' | 'lastActive' | 'createdAt'> {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop';

  if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
  else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome')) browser = 'Google Chrome';
  else if (ua.includes('Safari')) browser = 'Apple Safari';

  if (ua.includes('Windows')) os = 'Windows 11 / 10';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) { os = 'Android'; deviceType = 'mobile'; }
  else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; deviceType = ua.includes('iPad') ? 'tablet' : 'mobile'; }
  else if (ua.includes('Linux')) os = 'Linux';

  return {
    device: `${browser} on ${os}`,
    deviceType,
    browser,
    os,
    ipAddress: '127.0.0.1 (Localhost)',
    location: 'Current Network',
  };
}

export const authService = {
  async login(params: LoginParams): Promise<AuthSuccessPayload> {
    const response = await api.post<AuthSuccessPayload>('/auth/login', params);
    api.setTokens(response.accessToken, response.refreshToken);
    localStorage.setItem('crm_user', JSON.stringify(response.user));
    authService.recordCurrentSession();
    return response;
  },

  async register(params: RegisterParams): Promise<AuthSuccessPayload> {
    const response = await api.post<AuthSuccessPayload>('/auth/register', params);
    if (response.accessToken) {
      api.setTokens(response.accessToken, response.refreshToken);
      localStorage.setItem('crm_user', JSON.stringify(response.user));
      authService.recordCurrentSession();
    }
    return response;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network or 401 error on logout
    } finally {
      api.clearTokens();
    }
  },

  async getMe(): Promise<User> {
    const user = await api.get<User>('/auth/me');
    localStorage.setItem('crm_user', JSON.stringify(user));
    return user;
  },

  async forgotPassword(params: ForgotPasswordParams): Promise<{ message: string; resetToken?: string }> {
    return api.post<{ message: string; resetToken?: string }>('/auth/forgot-password', params);
  },

  async resetPassword(params: ResetPasswordParams): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/reset-password', params);
  },

  async changePassword(params: ChangePasswordParams): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/change-password', params);
  },

  async updateProfile(userId: string, data: UpdateProfileParams): Promise<User> {
    const updated = await api.patch<User>(`/users/${userId}`, data);
    localStorage.setItem('crm_user', JSON.stringify(updated));
    return updated;
  },

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    // Simulated verification delay with validation
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (!token || token.trim().length < 6) {
      throw new Error('Invalid or expired verification token. Please request a new link.');
    }
    return {
      success: true,
      message: 'Your email address has been successfully verified! You can now use all CRM features.',
    };
  },

  // Session Management Helpers
  recordCurrentSession(): SessionInfo {
    const clientInfo = getClientDeviceInfo();
    const currentSession: SessionInfo = {
      id: 'session-current',
      ...clientInfo,
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isCurrent: true,
    };

    const existingRaw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    let sessions: SessionInfo[] = existingRaw ? JSON.parse(existingRaw) : [];

    // Ensure we also have a couple of realistic demo active devices if not present
    if (sessions.length === 0) {
      sessions = [
        currentSession,
        {
          id: 'session-mob-1',
          device: 'Safari on iPhone 15 Pro',
          deviceType: 'mobile',
          browser: 'Mobile Safari',
          os: 'iOS 18.1',
          ipAddress: '172.56.21.84',
          location: 'San Francisco, CA, US',
          lastActive: new Date(Date.now() - 3600000 * 2).toISOString(),
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          isCurrent: false,
        },
        {
          id: 'session-tab-2',
          device: 'Chrome on iPad Pro',
          deviceType: 'tablet',
          browser: 'Google Chrome',
          os: 'iPadOS 17.5',
          ipAddress: '98.210.44.12',
          location: 'San Jose, CA, US',
          lastActive: new Date(Date.now() - 86400000 * 1).toISOString(),
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          isCurrent: false,
        },
      ];
    } else {
      // Update the current session timestamp
      sessions = sessions.map((s) => (s.isCurrent ? { ...s, lastActive: new Date().toISOString() } : s));
    }

    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    return currentSession;
  },

  getSessions(): SessionInfo[] {
    const existing = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!existing) {
      this.recordCurrentSession();
      return JSON.parse(localStorage.getItem(SESSIONS_STORAGE_KEY) || '[]');
    }
    return JSON.parse(existing);
  },

  revokeSession(sessionId: string): SessionInfo[] {
    const existing = this.getSessions();
    const filtered = existing.filter((s) => s.id !== sessionId);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  },

  revokeOtherSessions(): SessionInfo[] {
    const existing = this.getSessions();
    const currentOnly = existing.filter((s) => s.isCurrent);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(currentOnly));
    return currentOnly;
  },
};
