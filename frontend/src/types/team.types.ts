export type TeamStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type TeamMemberRole = 'LEADER' | 'MEMBER';

export interface TeamMemberUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  status: string;
  phone?: string | null;
}

export interface TeamMemberEntity {
  id: string;
  teamId: string;
  userId: string;
  role: TeamMemberRole | string;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  user?: TeamMemberUser;
}

export interface TeamEntity {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  avatar?: string | null;
  color?: string | null;
  status: TeamStatus | string;
  targetRevenue: number;
  wonRevenue?: number;
  ownerId: string;
  workspaceId?: string | null;
  organizationId?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  members?: TeamMemberEntity[];
  _count?: {
    members?: number;
    leads?: number;
    deals?: number;
    activities?: number;
  };
}

export interface PaginatedTeamsResponse {
  data: TeamEntity[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface TeamPerformerEntity {
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  wonRevenue: number;
  wonDealsCount: number;
  openDealsCount: number;
  completedActivitiesCount: number;
}

export interface TeamPerformanceEntity {
  teamId: string;
  teamName: string;
  targetRevenue: number;
  wonRevenue: number;
  activePipelineValue: number;
  quotaAttainmentPercentage: number;
  totalLeads: number;
  convertedLeads: number;
  leadConversionRate: string;
  totalDeals: number;
  wonDealsCount: number;
  openDealsCount: number;
  lostDealsCount: number;
  dealWinRate: string;
  totalActivities: number;
  completedActivities: number;
  pendingActivities: number;
  topPerformers: TeamPerformerEntity[];
}

export interface TeamActivityRecord {
  id: string;
  type: string;
  subject: string;
  description?: string | null;
  status: string;
  dueDate?: string | null;
  duration?: number | null;
  createdAt: string;
  updatedAt?: string;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
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

export interface TeamActivitiesResponse {
  teamId: string;
  teamName: string;
  totalActivities: number;
  breakdownByType: Record<string, number>;
  breakdownByStatus: Record<string, number>;
  data: TeamActivityRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface TeamQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  ownerId?: string;
  workspaceId?: string;
}

export interface CreateTeamPayload {
  name: string;
  slug?: string;
  description?: string;
  avatar?: string;
  color?: string;
  status?: string;
  targetRevenue?: number;
  ownerId?: string;
  workspaceId?: string;
  organizationId?: string;
  memberUserIds?: string[];
}

export interface UpdateTeamPayload {
  name?: string;
  slug?: string;
  description?: string;
  avatar?: string;
  color?: string;
  status?: string;
  targetRevenue?: number;
  ownerId?: string;
  workspaceId?: string;
  organizationId?: string;
}

export interface AddTeamMemberPayload {
  userId: string;
  role?: TeamMemberRole;
}

export interface UpdateTeamMemberPayload {
  role: TeamMemberRole;
}

export interface TeamActivitiesQueryFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface TeamPerformanceQueryFilters {
  startDate?: string;
  endDate?: string;
  pipelineId?: string;
}
