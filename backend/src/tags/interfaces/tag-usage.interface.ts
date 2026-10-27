import { TagEntityType } from '../enums/tag-entity-type.enum';

export interface TagUsageDetail {
  tagId: string;
  name: string;
  color?: string | null;
  description?: string | null;
  status: string;
  isProtected: boolean;
  workspaceId?: string | null;
  totalUsage: number;
  breakdown: Record<TagEntityType, number>;
  recentEntities: Array<{
    assignmentId: string;
    entityType: TagEntityType;
    entityId: string;
    entityName?: string;
    assignedAt: Date;
    assignedById?: string | null;
  }>;
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
