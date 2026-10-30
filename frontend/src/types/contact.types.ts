import type {
  ActivityPriority,
  ActivityStatus,
  ActivityType,
  FileAttachmentRecord,
  LeadDocumentRecord,
  LeadOwner,
  PaginationMeta,
  PipelineOption,
  SortDirection,
} from './lead.types';

export type {
  ActivityPriority,
  ActivityStatus,
  ActivityType,
  FileAttachmentRecord,
  PaginationMeta,
  PipelineOption,
  SortDirection,
};

export type ContactStage = 'LEAD' | 'OPPORTUNITY' | 'CUSTOMER' | 'CHURNED';

export type ContactViewMode = 'table' | 'list';

export type ContactScopeMode = 'all' | 'my';

export type ContactSortField =
  | 'createdAt'
  | 'lastName'
  | 'firstName'
  | 'email'
  | 'stage'
  | 'jobTitle';

export type ContactOwner = LeadOwner;

export type ContactDocumentRecord = LeadDocumentRecord;

export interface ContactOrganization {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface ContactCounts {
  deals?: number;
  activities?: number;
  tasks?: number;
  notes?: number;
}

export interface ContactActivity {
  id: string;
  type: ActivityType | string;
  subject: string;
  description?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  status: ActivityStatus | string;
  priority: ActivityPriority | string;
  contactId?: string | null;
  leadId?: string | null;
  dealId?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id?: string; name: string; email: string } | null;
  createdBy?: { id?: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ContactNote {
  id: string;
  title?: string | null;
  content: string;
  contactId?: string | null;
  leadId?: string | null;
  dealId?: string | null;
  authorId?: string | null;
  author?: { id?: string; name: string; email?: string } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ContactTask {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  status: string;
  priority: string;
  contactId?: string | null;
  assignedTo?: { name: string; email: string } | null;
  createdAt: string;
}

export interface ContactDeal {
  id: string;
  title: string;
  value: number;
  currency?: string;
  status: 'OPEN' | 'WON' | 'LOST' | string;
  probability?: number;
  expectedCloseDate?: string | null;
  stageId?: string | null;
  stage?: { id: string; name: string; order?: number } | null;
  pipelineId?: string | null;
  pipeline?: { id: string; name: string } | null;
  createdAt: string;
}

export interface ContactTimelineEvent {
  type: 'CONTACT_CREATED' | 'ACTIVITY' | 'NOTE' | 'TASK' | 'DEAL' | string;
  title: string;
  date: string;
  data?: any;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  stage: ContactStage | string;
  organizationId?: string | null;
  organization?: ContactOrganization | null;
  ownerId?: string | null;
  owner?: ContactOwner | null;
  createdAt: string;
  updatedAt?: string;
  _count?: ContactCounts;
  deals?: ContactDeal[];
  activities?: ContactActivity[];
  notes?: ContactNote[];
  tasks?: ContactTask[];
}

export interface PaginatedContacts {
  data: Contact[];
  meta: PaginationMeta;
}

export interface ContactQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  stage?: string;
  organizationId?: string;
  ownerId?: string;
}

export interface CreateContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  stage?: ContactStage | string;
  organizationId?: string;
  ownerId?: string;
}

export type UpdateContactPayload = Partial<CreateContactPayload>;

export interface ConvertContactPayload {
  dealTitle?: string;
  dealValue?: number;
  pipelineId?: string;
  stageId?: string;
}

export interface ConvertContactResponse {
  message: string;
  contact: Contact;
  deal?: ContactDeal | null;
}

export interface CreateContactActivityPayload {
  type: ActivityType | string;
  subject: string;
  description?: string;
  scheduledAt?: string;
  status?: ActivityStatus | string;
  priority?: ActivityPriority | string;
  contactId: string;
  assignedToId?: string;
}

export interface UpdateContactActivityPayload {
  type?: ActivityType | string;
  subject?: string;
  description?: string;
  scheduledAt?: string;
  status?: ActivityStatus | string;
  priority?: ActivityPriority | string;
  assignedToId?: string;
}

export interface CreateContactNotePayload {
  title?: string;
  content: string;
  contactId: string;
}

export interface UpdateContactNotePayload {
  title?: string;
  content?: string;
}

