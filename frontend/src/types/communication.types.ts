export type EmailFolder =
  | 'INBOX'
  | 'SENT'
  | 'DRAFTS'
  | 'TRASH'
  | 'ARCHIVE'
  | 'SPAM'
  | 'ALL';

export type EmailStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'OPENED'
  | 'CLICKED'
  | 'BOUNCED'
  | 'FAILED'
  | 'RECEIVED';

export type EmailDirection = 'INBOUND' | 'OUTBOUND';

export type BatchEmailActionType =
  | 'MARK_READ'
  | 'MARK_UNREAD'
  | 'STAR'
  | 'UNSTAR'
  | 'ARCHIVE'
  | 'UNARCHIVE'
  | 'MOVE_TO_FOLDER'
  | 'DELETE';

export type TemplateCategory =
  | 'SALES'
  | 'MARKETING'
  | 'FOLLOW_UP'
  | 'ONBOARDING'
  | 'SUPPORT'
  | 'GENERAL';

export type CommunicationChannel =
  | 'ALL'
  | 'EMAIL'
  | 'CALL'
  | 'MEETING'
  | 'WHATSAPP'
  | 'NOTE'
  | 'COMMENT'
  | 'FOLLOW_UP';

export interface CommunicationUserRef {
  id: string;
  name: string;
  email?: string;
  avatar?: string | null;
}

export interface CommunicationContactRef {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface CommunicationLeadRef {
  id: string;
  title: string;
  email?: string;
  companyName?: string | null;
}

export interface CommunicationDealRef {
  id: string;
  title: string;
  value?: number;
}

export interface CommunicationOrgRef {
  id: string;
  name: string;
}

export interface EmailAttachmentItem {
  id?: string;
  filename: string;
  contentType?: string;
  size?: number;
  path?: string | null;
  url?: string | null;
  fileRecordId?: string | null;
  createdAt?: string;
}

export interface CommentMentionRef {
  userId: string;
  name: string;
  email: string;
}

export interface CommunicationCommentItem {
  id: string;
  emailId?: string | null;
  email?: { id: string; subject: string } | null;
  threadId?: string | null;
  contactId?: string | null;
  contact?: CommunicationContactRef | null;
  leadId?: string | null;
  lead?: CommunicationLeadRef | null;
  dealId?: string | null;
  deal?: CommunicationDealRef | null;
  organizationId?: string | null;
  workspaceId?: string | null;
  authorId?: string | null;
  author?: CommunicationUserRef | null;
  content: string;
  mentions: CommentMentionRef[];
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailMessageItem {
  id: string;
  messageId?: string | null;
  threadId?: string | null;
  inReplyToId?: string | null;
  folder: EmailFolder | string;
  direction: EmailDirection | string;
  status: EmailStatus | string;
  sender: string;
  senderName?: string | null;
  senderUserId?: string | null;
  senderUser?: CommunicationUserRef | null;
  recipients: string[];
  cc: string[];
  bcc: string[];
  replyTo?: string | null;
  subject: string;
  body: string;
  bodyText?: string | null;
  snippet?: string | null;
  isRead: boolean;
  readAt?: string | null;
  isStarred: boolean;
  isArchived: boolean;
  isDraft: boolean;
  sentAt?: string | null;
  receivedAt?: string | null;
  scheduledAt?: string | null;
  provider?: string | null;
  errorMessage?: string | null;
  openCount: number;
  clickCount: number;
  contactId?: string | null;
  contact?: CommunicationContactRef | null;
  leadId?: string | null;
  lead?: CommunicationLeadRef | null;
  dealId?: string | null;
  deal?: CommunicationDealRef | null;
  organizationId?: string | null;
  organization?: CommunicationOrgRef | null;
  attachments: EmailAttachmentItem[];
  comments?: CommunicationCommentItem[];
  threadMessages?: EmailMessageItem[];
  threadCount?: number;
  _count?: { comments: number };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CommunicationCenterStats {
  overview: {
    totalEmails: number;
    inboxTotal: number;
    inboxUnread: number;
    sentTotal: number;
    draftsTotal: number;
    starredTotal: number;
    trashTotal: number;
    commentsTotal: number;
    templatesTotal: number;
    activeIntegrationsTotal: number;
  };
  performance: {
    deliveryRatePercentage: number;
    openRatePercentage: number;
    statusBreakdown: Record<string, number>;
  };
  recentActivity: {
    emails: EmailMessageItem[];
    comments: CommunicationCommentItem[];
  };
}

export interface CommunicationStreamItem {
  id: string;
  type: 'EMAIL';
  subject: string;
  snippet?: string | null;
  folder: string;
  direction: string;
  status: string;
  isRead: boolean;
  isStarred: boolean;
  createdAt: string;
  sender: { id?: string; name?: string; email?: string; avatar?: string | null };
  relatedEntity?: Record<string, any> | null;
  commentsCount: number;
}

export interface EmailQueryParams {
  search?: string;
  folder?: EmailFolder | string;
  status?: EmailStatus | string;
  direction?: EmailDirection | string;
  isRead?: boolean;
  isStarred?: boolean;
  threadId?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  organizationId?: string;
  workspaceId?: string;
  senderUserId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ComposeEmailPayload {
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyText?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  threadId?: string;
  inReplyToId?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  organizationId?: string;
  workspaceId?: string;
  isDraft?: boolean;
  scheduledAt?: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  attachments?: EmailAttachmentItem[];
  integrationId?: string;
}

export interface UpdateEmailPayload {
  subject?: string;
  body?: string;
  bodyText?: string;
  recipients?: string[];
  cc?: string[];
  bcc?: string[];
  folder?: EmailFolder | string;
  isRead?: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  isDraft?: boolean;
}

export interface ReplyEmailPayload {
  body: string;
  replyAll?: boolean;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachmentItem[];
}

export interface ForwardEmailPayload {
  recipients: string[];
  message?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachmentItem[];
}

export interface CommentQueryParams {
  search?: string;
  emailId?: string;
  threadId?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  mentionedUserId?: string;
  page?: number;
  limit?: number;
}

export interface CreateCommentPayload {
  content: string;
  emailId?: string;
  threadId?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  mentionedUserIds?: string[];
  isInternal?: boolean;
}

export interface EmailTemplateItem {
  id: string;
  name: string;
  description?: string | null;
  category: TemplateCategory | string;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  variables: string[];
  isShared: boolean;
  createdById?: string | null;
  createdBy?: CommunicationUserRef | null;
  workspaceId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateQueryParams {
  search?: string;
  category?: string;
  isShared?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  category?: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables?: string[];
  isShared?: boolean;
}

export interface RenderTemplatePayload {
  contactId?: string;
  leadId?: string;
  dealId?: string;
  organizationId?: string;
  variables?: Record<string, any>;
}

export interface RenderedTemplateResult {
  templateId: string;
  templateName: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  resolvedVariables: Record<string, any>;
}

export interface UnifiedTimelineItem {
  id: string;
  type: 'EMAIL' | 'CALL' | 'MEETING' | 'WHATSAPP' | 'NOTE' | 'COMMENT' | 'FOLLOW_UP';
  channel: string;
  direction: 'INBOUND' | 'OUTBOUND' | 'INTERNAL';
  title: string;
  content: string;
  timestamp: string;
  status?: string;
  author?: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string | null;
  };
  entity?: {
    type: string;
    id: string;
    name?: string;
  };
  metadata?: Record<string, any>;
}

export interface CommunicationHistoryQueryParams {
  search?: string;
  channel?: CommunicationChannel | string;
  direction?: 'INBOUND' | 'OUTBOUND' | 'INTERNAL' | string;
  entityType?: 'CONTACT' | 'LEAD' | 'DEAL' | 'ORGANIZATION' | string;
  entityId?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  organizationId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CommunicationHistoryResponse extends PaginatedResult<UnifiedTimelineItem> {
  summary: {
    totalCommunications: number;
    channelBreakdown: {
      emails: number;
      calls: number;
      meetings: number;
      whatsapp: number;
      notes: number;
      comments: number;
    };
  };
}
