export type TagStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type TagEntityType =
  | 'LEAD'
  | 'CONTACT'
  | 'COMPANY'
  | 'DEAL'
  | 'ACTIVITY'
  | 'DOCUMENT';

export interface TagEntity {
  id: string;
  name: string;
  color: string;
  description?: string | null;
  status: TagStatus;
  isProtected: boolean;
  workspaceId?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface CreateTagPayload {
  name: string;
  color?: string;
  description?: string;
  status?: TagStatus;
  isProtected?: boolean;
  workspaceId?: string;
}

export interface UpdateTagPayload {
  name?: string;
  color?: string;
  description?: string;
  status?: TagStatus;
  isProtected?: boolean;
  workspaceId?: string;
}

export interface TagQueryParams {
  search?: string;
  q?: string;
  status?: TagStatus;
  workspaceId?: string;
  entityType?: TagEntityType;
  isProtected?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedTagsResponse {
  data: TagEntity[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TagRecentAssignment {
  assignmentId: string;
  entityType: TagEntityType;
  entityId: string;
  entityName?: string;
  assignedAt: string;
  assignedById?: string | null;
}

export interface TagUsageDetail {
  tagId: string;
  name: string;
  color?: string | null;
  description?: string | null;
  status: TagStatus | string;
  isProtected: boolean;
  workspaceId?: string | null;
  totalUsage: number;
  breakdown: Record<TagEntityType, number>;
  recentEntities: TagRecentAssignment[];
}

export interface TagUsageSummary {
  totalTags: number;
  activeTags: number;
  inactiveTags: number;
  archivedTags: number;
  totalAssignments: number;
  assignmentsByEntityType: Record<TagEntityType, number>;
  topTags: Array<{
    id: string;
    name: string;
    color?: string | null;
    status: string;
    isProtected: boolean;
    usageCount: number;
  }>;
  unusedTagsCount: number;
}

export interface DeleteTagResult {
  message: string;
  deletedId?: string;
  name?: string;
  detachedAssignments?: number;
  tag?: TagEntity;
  assignmentsPreserved?: number;
}
