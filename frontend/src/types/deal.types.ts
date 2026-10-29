

import type {
  ActivityPriority,
  ActivityStatus,
  ActivityType,
  FileAttachmentRecord,
  LeadDocumentRecord,
  PaginationMeta,
  SortDirection,
} from './lead.types';
import type {
  CreatePipelineDealPayload,
  DealQueryParams,
  DealStatus,
  PaginatedDeals,
  Pipeline,
  PipelineDeal,
  PipelineStage,
  UpdatePipelineDealPayload,
} from './pipeline.types';

export type {
  ActivityPriority,
  ActivityStatus,
  ActivityType,
  CreatePipelineDealPayload as CreateDealPayload,
  DealQueryParams,
  DealStatus,
  FileAttachmentRecord,
  PaginatedDeals,
  PaginationMeta,
  Pipeline,
  PipelineDeal as Deal,
  PipelineStage,
  SortDirection,
  UpdatePipelineDealPayload as UpdateDealPayload,
};

export interface DealOrganizationOption {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
}

export interface DealUserOption {
  id: string;
  name: string;
  email: string;
}

export type DealViewMode = 'table' | 'list' | 'board';

export type DealScopeMode = 'all' | 'my' | 'won' | 'lost';

export type DealSortField =
  | 'createdAt'
  | 'value'
  | 'probability'
  | 'expectedCloseDate'
  | 'title'
  | 'status';

export type DealDocumentRecord = LeadDocumentRecord;

export interface DealActivity {
  id: string;
  type: ActivityType | string;
  subject: string;
  description?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  status: ActivityStatus | string;
  priority: ActivityPriority | string;
  dealId?: string | null;
  contactId?: string | null;
  leadId?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id?: string; name: string; email: string } | null;
  createdBy?: { id?: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface DealNote {
  id: string;
  title?: string | null;
  content: string;
  dealId?: string | null;
  contactId?: string | null;
  leadId?: string | null;
  authorId?: string | null;
  author?: { id?: string; name: string; email?: string } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface DealTask {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  status: string;
  priority: string;
  dealId?: string | null;
  assignedTo?: { name: string; email: string } | null;
  createdAt: string;
}

export interface DealTimelineEvent {
  type: 'DEAL_CREATED' | 'ACTIVITY' | 'TASK' | 'NOTE' | string;
  title: string;
  date: string;
  data?: any;
}

export interface CreateDealActivityPayload {
  type: ActivityType | string;
  subject: string;
  description?: string;
  scheduledAt?: string;
  status?: ActivityStatus | string;
  priority?: ActivityPriority | string;
  dealId: string;
  assignedToId?: string;
}

export interface UpdateDealActivityPayload {
  type?: ActivityType | string;
  subject?: string;
  description?: string;
  scheduledAt?: string;
  status?: ActivityStatus | string;
  priority?: ActivityPriority | string;
  assignedToId?: string;
}

export interface CreateDealNotePayload {
  title?: string;
  content: string;
  dealId: string;
}

export interface UpdateDealNotePayload {
  title?: string;
  content?: string;
}

export interface DealModuleSettings {
  defaultView: DealViewMode;
  defaultCurrency: string;
  defaultProbability: number;
  pageSize: number;
  showWeightedValue: boolean;
  requireNoteOnLost: boolean;
  celebrateWonDeals: boolean;
}
