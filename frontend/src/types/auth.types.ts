export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  status?: string;
}

export interface UserProfileSetting {
  id?: string;
  theme?: 'dark' | 'light' | 'system';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  roleId?: string | null;
  role?: Role | null;
  organizationId?: string | null;
  organization?: Organization | null;
  profileSettings?: UserProfileSetting | null;
  activeWorkspaceId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: string;
}

export interface AuthSuccessPayload extends AuthTokens {
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error?: string;
  path?: string;
  timestamp?: string;
}

export interface SessionInfo {
  id: string;
  device: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
}
