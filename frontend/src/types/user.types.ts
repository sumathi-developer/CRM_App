export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Permission {
  id: string;
  name: string;
  action: string;
  resource: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission?: Permission;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
  permissions?: RolePermission[];
  _count?: {
    users?: number;
    permissions?: number;
  };
}

export interface Organization {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
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
  status: UserStatus;
  roleId?: string | null;
  role?: Role | null;
  organizationId?: string | null;
  organization?: Organization | null;
  profileSettings?: UserProfileSetting | null;
  activeWorkspaceId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus | string;
  roleId?: string;
  organizationId?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedUsersResponse {
  data: User[];
  meta: PaginationMeta;
}

export interface CreateUserPayload {
  email: string;
  name: string;
  password?: string;
  phone?: string;
  status?: UserStatus;
  roleId?: string;
  organizationId?: string;
}

export interface UpdateUserPayload {
  email?: string;
  name?: string;
  phone?: string;
  avatar?: string;
  status?: UserStatus;
  roleId?: string;
  organizationId?: string;
}

export interface InviteUserPayload {
  email: string;
  name?: string;
  roleId?: string;
  organizationId?: string;
  sendEmail?: boolean;
  customMessage?: string;
}

export interface UserActivity {
  id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'WHATSAPP' | 'FOLLOW_UP' | string;
  subject: string;
  description?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string;
  contactId?: string | null;
  contact?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  leadId?: string | null;
  lead?: {
    id: string;
    name?: string;
    company?: string;
    email?: string;
  } | null;
  dealId?: string | null;
  deal?: {
    id: string;
    title?: string;
    value?: number;
    currency?: string;
  } | null;
  assignedToId?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UserTask {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string;
  contactId?: string | null;
  contact?: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
  leadId?: string | null;
  lead?: {
    id: string;
    name?: string;
  } | null;
  dealId?: string | null;
  deal?: {
    id: string;
    title?: string;
  } | null;
  assignedToId?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UserDeal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stageId?: string | null;
  stage?: {
    id: string;
    name: string;
    color?: string;
  } | null;
  pipelineId?: string | null;
  pipeline?: {
    id: string;
    name: string;
  } | null;
  status: 'OPEN' | 'WON' | 'LOST' | string;
  probability: number;
  expectedCloseDate?: string | null;
  closedAt?: string | null;
  organizationId?: string | null;
  organization?: {
    id: string;
    name: string;
  } | null;
  contactId?: string | null;
  contact?: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
  ownerId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UserPerformanceMetrics {
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalPipelineValue: number;
  wonRevenue: number;
  winRate: number;
  avgDealSize: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  taskCompletionRate: number;
  totalActivities: number;
  activityBreakdown: {
    calls: number;
    emails: number;
    meetings: number;
    followUps: number;
    others: number;
  };
}
