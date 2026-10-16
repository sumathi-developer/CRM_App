export interface TeamEntity {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  avatar?: string | null;
  color?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | string;
  targetRevenue: number;
  ownerId: string;
  workspaceId?: string | null;
  organizationId?: string | null;
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
    leads?: number;
    deals?: number;
    activities?: number;
  };
}

export interface TeamMemberEntity {
  id: string;
  teamId: string;
  userId: string;
  role: 'LEADER' | 'MEMBER' | string;
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

export interface TeamActivitiesResponse {
  teamId: string;
  teamName: string;
  totalActivities: number;
  breakdownByType: Record<string, number>;
  breakdownByStatus: Record<string, number>;
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
