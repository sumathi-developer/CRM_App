export interface WorkspaceOwner {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface WorkspaceSettingsGeneral {
  companyName?: string;
  industry?: string;
  supportEmail?: string;
}

export interface WorkspaceSettingsBranding {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  companyPortalUrl?: string;
}

export interface WorkspaceSettingsLocalization {
  timezone?: string;
  currency?: string;
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
}

export interface WorkspaceSettingsPreferences {
  emailNotifications?: boolean;
  autoAssignLeads?: boolean;
  defaultPipelineId?: string;
  weeklyDigest?: boolean;
}

export interface WorkspaceSettingsSecurity {
  enforceTwoFactor?: boolean;
  sessionTimeoutMinutes?: number;
  allowedEmailDomains?: string[];
  ipAllowlist?: string[];
}

export interface WorkspaceSettings {
  id?: string;
  workspaceId?: string;
  general?: WorkspaceSettingsGeneral;
  branding?: WorkspaceSettingsBranding;
  localization?: WorkspaceSettingsLocalization;
  preferences?: WorkspaceSettingsPreferences;
  security?: WorkspaceSettingsSecurity;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceRole {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    members?: number;
  };
}

export interface WorkspaceMemberUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  status?: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  roleId?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  joinedAt?: string;
  createdAt?: string;
  user: WorkspaceMemberUser;
  customRole?: WorkspaceRole | null;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED';
  token?: string;
  invitedById?: string;
  expiresAt: string;
  createdAt: string;
}

export interface WorkspaceMetrics {
  members: number;
  contacts: number;
  leads: number;
  deals: number;
  wonRevenue: number;
  tasks: number;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  avatar?: string | null;
  website?: string | null;
  timezone?: string;
  currency?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  ownerId: string;
  owner?: WorkspaceOwner;
  myRole?: string;
  memberStatus?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  members?: WorkspaceMember[];
  roles?: WorkspaceRole[];
  settings?: WorkspaceSettings;
  _count?: {
    members?: number;
    invites?: number;
    roles?: number;
  };
}

export interface SwitchWorkspaceResponse {
  message: string;
  activeWorkspaceId: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
    avatar?: string | null;
    plan: string;
    currency: string;
    timezone: string;
  };
  memberRole: string;
  permissions: string[];
}

export interface CreateWorkspaceDto {
  name: string;
  slug?: string;
  description?: string;
  timezone?: string;
  currency?: string;
  website?: string;
  plan?: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
  slug?: string;
  description?: string;
  avatar?: string;
  timezone?: string;
  currency?: string;
  website?: string;
  status?: string;
  plan?: string;
}

export interface AddMemberDto {
  userId?: string;
  email?: string;
  role?: string;
  roleId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateMemberDto {
  role?: string;
  roleId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface InviteMemberDto {
  email: string;
  role?: string;
  roleId?: string;
}

export interface CreateWorkspaceRoleDto {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateWorkspaceRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
}
