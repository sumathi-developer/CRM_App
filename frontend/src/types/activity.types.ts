import type { PaginationMeta, SortDirection } from './lead.types';

export type { PaginationMeta, SortDirection };

export type ActivityItemType =
  | 'CALL'
  | 'MEETING'
  | 'FOLLOW_UP'
  | 'EMAIL'
  | 'TASK'
  | 'WHATSAPP';

export type ActivityRecordStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ActivityRecordPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ActivityViewMode = 'table' | 'list';

export type ActivityScopeMode =
  | 'all'
  | 'my'
  | 'tasks'
  | 'calls'
  | 'meetings'
  | 'follow-ups'
  | 'emails'
  | 'completed'
  | 'overdue';

export type ActivityDateFilter =
  | 'ALL'
  | 'TODAY'
  | 'UPCOMING'
  | 'OVERDUE'
  | 'THIS_WEEK'
  | 'CUSTOM';

export type ActivitySortField =
  | 'scheduledAt'
  | 'createdAt'
  | 'priority'
  | 'subject'
  | 'status'
  | 'type';

export type ActivityRecordSource = 'ACTIVITY' | 'TASK';

export interface ActivityUserRef {
  id: string;
  name: string;
  email?: string;
}

export interface ActivityContactRef {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string | null;
}

export interface ActivityLeadRef {
  id: string;
  title: string;
  firstName?: string;
  lastName?: string;
  companyName?: string | null;
  email?: string;
}

export interface ActivityDealRef {
  id: string;
  title: string;
  value?: number;
  status?: string;
}

export interface ActivityRecord {
  id: string;
  recordSource: ActivityRecordSource;
  type: ActivityItemType | string;
  subject: string;
  description?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  status: ActivityRecordStatus | string;
  priority: ActivityRecordPriority | string;
  contactId?: string | null;
  contact?: ActivityContactRef | null;
  leadId?: string | null;
  lead?: ActivityLeadRef | null;
  dealId?: string | null;
  deal?: ActivityDealRef | null;
  assignedToId?: string | null;
  assignedTo?: ActivityUserRef | null;
  createdById?: string | null;
  createdBy?: ActivityUserRef | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PaginatedActivities {
  data: ActivityRecord[];
  meta: PaginationMeta;
}

export interface ActivityQueryParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  priority?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  assignedToId?: string;
  search?: string;
}

export interface CreateActivityRecordPayload {
  type: ActivityItemType | string;
  subject: string;
  description?: string;
  scheduledAt?: string;
  status?: ActivityRecordStatus | string;
  priority?: ActivityRecordPriority | string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  assignedToId?: string;
}

export interface UpdateActivityRecordPayload {
  type?: ActivityItemType | string;
  subject?: string;
  description?: string;
  scheduledAt?: string;
  completedAt?: string;
  status?: ActivityRecordStatus | string;
  priority?: ActivityRecordPriority | string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  assignedToId?: string;
}

