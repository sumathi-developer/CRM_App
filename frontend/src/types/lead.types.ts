export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED';

export type LeadSourceType =
  | 'WEBSITE'
  | 'REFERRAL'
  | 'COLD_OUTREACH'
  | 'ADVERTISING'
  | 'EVENT'
  | 'OTHER';

export type LeadViewMode = 'table' | 'list' | 'board';

export type LeadScopeMode = 'all' | 'my';

export type LeadSortField =
  | 'createdAt'
  | 'leadScore'
  | 'estimatedValue'
  | 'title'
  | 'lastName'
  | 'companyName'
  | 'status';

export type SortDirection = 'asc' | 'desc';

export type ScoreTier = '' | 'HOT' | 'WARM' | 'COLD';

export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'WHATSAPP' | 'FOLLOW_UP';
export type ActivityStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type ActivityPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface LeadOwner {
  id: string;
  name: string;
  email: string;
}

export interface LeadCounts {
  activities?: number;
  tasks?: number;
  notes?: number;
}

export interface ScoringBreakdownItem {
  ruleId?: string;
  ruleName?: string;
  category?: string;
  field?: string;
  points: number;
}

export interface LeadActivity {
  id: string;
  type: ActivityType | string;
  subject: string;
  description?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  status: ActivityStatus | string;
  priority: ActivityPriority | string;
  leadId?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id?: string; name: string; email: string } | null;
  createdBy?: { id?: string; name: string; email: string } | null;
  lead?: { id: string; title: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface LeadNote {
  id: string;
  title?: string | null;
  content: string;
  leadId?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  authorId?: string | null;
  author?: { id?: string; name: string; email?: string } | null;
  lead?: { id: string; title: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface LeadTask {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  status: string;
  priority: string;
  leadId?: string | null;
  assignedTo?: { name: string; email: string } | null;
  createdAt: string;
}

export interface LeadTimelineEvent {
  type: 'LEAD_CREATED' | 'ACTIVITY' | 'TASK' | 'NOTE' | string;
  title: string;
  date: string;
  data?: any;
}

export interface FileAttachmentRecord {
  id: string;
  fileId: string;
  entityType: 'CONTACT' | 'LEAD' | 'DEAL' | 'ORGANIZATION' | string;
  entityId: string;
  leadId?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  createdAt?: string;
}

export interface LeadDocumentRecord {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedById?: string | null;
  uploadedBy?: { id: string; name: string; email: string } | null;
  attachments?: FileAttachmentRecord[];
  createdAt: string;
}

export interface Lead {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  status: LeadStatus | string;
  source: LeadSourceType | string;
  leadScore: number;
  estimatedValue?: number | null;
  ownerId?: string | null;
  owner?: LeadOwner | null;
  teamId?: string | null;
  convertedContactId?: string | null;
  convertedDealId?: string | null;
  workspaceId?: string | null;
  leadSourceId?: string | null;
  leadSource?: { id: string; name: string; type?: string } | null;
  webFormId?: string | null;
  webForm?: { id: string; name: string; slug?: string } | null;
  campaign?: string | null;
  medium?: string | null;
  channel?: string | null;
  qualificationNotes?: string | null;
  scoringBreakdown?: ScoringBreakdownItem[] | null;
  createdAt: string;
  updatedAt?: string;
  _count?: LeadCounts;
  activities?: LeadActivity[];
  notes?: LeadNote[];
  tasks?: LeadTask[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginatedLeads {
  data: Lead[];
  meta: PaginationMeta;
}

export interface LeadQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
  ownerId?: string;
}

export interface CreateLeadPayload {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  status?: LeadStatus | string;
  source?: LeadSourceType | string;
  leadScore?: number;
  estimatedValue?: number;
  ownerId?: string;
}

export interface UpdateLeadPayload extends Partial<CreateLeadPayload> {
  qualificationNotes?: string;
}

export interface ConvertLeadPayload {
  companyName?: string;
  dealTitle?: string;
  dealValue?: number;
  pipelineId?: string;
  stageId?: string;
}

export interface ConvertLeadResponse {
  message: string;
  lead: Lead;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    organizationId?: string | null;
  };
  deal: {
    id: string;
    title: string;
    value: number;
    pipelineId?: string | null;
    stageId?: string | null;
  };
}

export interface CreateLeadActivityPayload {
  type: ActivityType | string;
  subject: string;
  description?: string;
  scheduledAt?: string;
  status?: ActivityStatus | string;
  priority?: ActivityPriority | string;
  leadId: string;
  assignedToId?: string;
}

export interface UpdateLeadActivityPayload {
  type?: ActivityType | string;
  subject?: string;
  description?: string;
  scheduledAt?: string;
  status?: ActivityStatus | string;
  priority?: ActivityPriority | string;
  assignedToId?: string;
}

export interface CreateLeadNotePayload {
  title?: string;
  content: string;
  leadId: string;
}

export interface UpdateLeadNotePayload {
  title?: string;
  content?: string;
}

export interface PipelineStageOption {
  id: string;
  name: string;
  order: number;
  winProbability?: number;
}

export interface PipelineOption {
  id: string;
  name: string;
  isDefault?: boolean;
  stages: PipelineStageOption[];
}

export interface LeadModuleSettings {
  defaultStatus: LeadStatus;
  defaultSource: LeadSourceType;
  defaultView: LeadViewMode;
  pageSize: number;
  hotScoreThreshold: number;
  warmScoreThreshold: number;
  requireQualifiedForConversion: boolean;
  autoCreateDealOnConversion: boolean;
  preventDuplicateEmails: boolean;
  autoScoreOnCreate: boolean;
  autoRouteOnCreate: boolean;
}
