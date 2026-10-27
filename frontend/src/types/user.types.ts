import type { User, Role, Organization } from './auth.types';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission?: {
    id: string;
    name: string;
    resource: string;
    action: string;
    description?: string;
  };
}

export interface UserRole extends Role {
  permissions?: RolePermission[];
  _count?: {
    users?: number;
    permissions?: number;
  };
}

export type UserOrganization = Organization;

export interface PaginatedUsersResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface UserQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus | '';
  roleId?: string;
  organizationId?: string;
}

export interface CreateUserPayload {
  email: string;
  name: string;
  password: string;
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

export interface UserActivityEntity {
  id: string;
  type: string;
  subject: string;
  description?: string | null;
  status?: string;
  dueDate?: string | null;
  duration?: number | null;
  createdAt: string;
  updatedAt?: string;
  assignedToId?: string | null;
  createdById?: string | null;
  contact?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  } | null;
  lead?: {
    id: string;
    title?: string;
    company?: string;
    email?: string;
    status?: string;
  } | null;
  deal?: {
    id: string;
    title?: string;
    value?: number;
    currency?: string;
    status?: string;
  } | null;
}

export interface UserTaskEntity {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority?: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt?: string;
  assignedToId?: string | null;
  createdById?: string | null;
  contact?: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
  lead?: {
    id: string;
    title?: string;
    company?: string;
  } | null;
  deal?: {
    id: string;
    title?: string;
  } | null;
}

export interface UserDealEntity {
  id: string;
  title: string;
  value: number;
  currency?: string;
  status?: string;
  expectedCloseDate?: string | null;
  createdAt: string;
  updatedAt?: string;
  ownerId?: string | null;
  stage?: {
    id: string;
    name: string;
    order?: number;
  } | null;
  pipeline?: {
    id: string;
    name: string;
  } | null;
  organization?: {
    id: string;
    name: string;
  } | null;
  contact?: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

export interface UserPerformanceMetrics {
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  openDeals: number;
  winRate: number;
  totalPipelineValue: number;
  wonRevenue: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  totalActivities: number;
  callsCount: number;
  meetingsCount: number;
  emailsCount: number;
  otherActivitiesCount: number;
}
