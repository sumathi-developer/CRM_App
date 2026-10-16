export interface WorkspaceEntity {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  avatar?: string | null;
  website?: string | null;
  timezone: string;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE' | string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  _count?: {
    members?: number;
    invites?: number;
    roles?: number;
  };
}

export interface WorkspaceMemberEntity {
  id: string;
  workspaceId: string;
  userId: string;
  roleId?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | string;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    status: string;
  };
  workspaceRole?: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
}

export interface WorkspaceInviteEntity {
  id: string;
  workspaceId: string;
  email: string;
  roleId?: string | null;
  role: string;
  token: string;
  invitedById?: string | null;
  expiresAt: Date;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED' | string;
  createdAt: Date;
  updatedAt: Date;
  invitedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface WorkspaceRoleEntity {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    members?: number;
  };
}

export interface WorkspaceGeneralSettings {
  companyName?: string;
  defaultLanguage?: string;
  industry?: string;
  supportEmail?: string;
}

export interface WorkspaceBrandingSettings {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string;
  accentColor?: string;
  companyPortalUrl?: string | null;
}

export interface WorkspaceLocalizationSettings {
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
}

export interface WorkspacePreferencesSettings {
  emailNotifications: boolean;
  autoAssignLeads: boolean;
  defaultPipelineId?: string | null;
  weeklyDigest: boolean;
}

export interface WorkspaceSecuritySettings {
  enforceTwoFactor: boolean;
  sessionTimeoutMinutes: number;
  allowedEmailDomains: string[];
  ipAllowlist: string[];
}

export interface WorkspaceSettingEntity {
  id: string;
  workspaceId: string;
  general: WorkspaceGeneralSettings;
  branding: WorkspaceBrandingSettings;
  localization: WorkspaceLocalizationSettings;
  preferences: WorkspacePreferencesSettings;
  security: WorkspaceSecuritySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMetricsEntity {
  workspaceId: string;
  workspaceName: string;
  totalMembers: number;
  totalContacts: number;
  totalDeals: number;
  totalWonRevenue: number;
  openPipelineValue: number;
  pendingTasksCount: number;
  activeLeadsCount: number;
  recentActivities: Array<{
    id: string;
    type: string;
    subject: string;
    status: string;
    priority: string;
    scheduledAt?: Date | null;
  }>;
}

export interface WorkspaceContext {
  workspace: WorkspaceEntity;
  member: WorkspaceMemberEntity;
  roleName: string;
  permissions: string[];
}
