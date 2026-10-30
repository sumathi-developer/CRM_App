import { api } from './api';
import { activityService } from './activity.service';
import type {
  BatchEmailActionType,
  CommentQueryParams,
  CommunicationCenterStats,
  CommunicationCommentItem,
  CommunicationContactRef,
  CommunicationDealRef,
  CommunicationHistoryQueryParams,
  CommunicationHistoryResponse,
  CommunicationLeadRef,
  CommunicationStreamItem,
  CommunicationUserRef,
  ComposeEmailPayload,
  CreateCommentPayload,
  CreateTemplatePayload,
  EmailFolder,
  EmailMessageItem,
  EmailQueryParams,
  EmailTemplateItem,
  ForwardEmailPayload,
  PaginatedResult,
  RenderedTemplateResult,
  RenderTemplatePayload,
  ReplyEmailPayload,
  TemplateQueryParams,
  UpdateEmailPayload,
} from '../types/communication.types';

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    sp.append(key, String(typeof value === 'string' ? value.trim() : value));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object' && 'email' in item) {
          return String((item as { email: string }).email).trim();
        }
        return '';
      })
      .filter(Boolean);
  }
  if (typeof val === 'string' && val.trim()) {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeComment(raw: any): CommunicationCommentItem {
  return {
    id: raw.id,
    emailId: raw.emailId ?? null,
    email: raw.email ?? null,
    threadId: raw.threadId ?? null,
    contactId: raw.contactId ?? null,
    contact: raw.contact ?? null,
    leadId: raw.leadId ?? null,
    lead: raw.lead ?? null,
    dealId: raw.dealId ?? null,
    deal: raw.deal ?? null,
    organizationId: raw.organizationId ?? null,
    workspaceId: raw.workspaceId ?? null,
    authorId: raw.authorId ?? null,
    author: raw.author ?? null,
    content: raw.content || '',
    mentions: Array.isArray(raw.mentions) ? raw.mentions : [],
    isInternal: raw.isInternal ?? true,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  };
}

function normalizeEmail(raw: any): EmailMessageItem {
  return {
    id: raw.id,
    messageId: raw.messageId ?? null,
    threadId: raw.threadId ?? null,
    inReplyToId: raw.inReplyToId ?? null,
    folder: raw.folder || 'INBOX',
    direction: raw.direction || 'OUTBOUND',
    status: raw.status || 'SENT',
    sender: raw.sender || raw.senderUser?.email || 'noreply@crm.com',
    senderName: raw.senderName || raw.senderUser?.name || null,
    senderUserId: raw.senderUserId ?? null,
    senderUser: raw.senderUser ?? null,
    recipients: toStringArray(raw.recipients),
    cc: toStringArray(raw.cc),
    bcc: toStringArray(raw.bcc),
    replyTo: raw.replyTo ?? null,
    subject: raw.subject || '(No Subject)',
    body: raw.body || '',
    bodyText: raw.bodyText ?? null,
    snippet: raw.snippet ?? null,
    isRead: Boolean(raw.isRead),
    readAt: raw.readAt ?? null,
    isStarred: Boolean(raw.isStarred),
    isArchived: Boolean(raw.isArchived),
    isDraft: Boolean(raw.isDraft),
    sentAt: raw.sentAt ?? null,
    receivedAt: raw.receivedAt ?? null,
    scheduledAt: raw.scheduledAt ?? null,
    provider: raw.provider ?? 'SYSTEM',
    errorMessage: raw.errorMessage ?? null,
    openCount: Number(raw.openCount || 0),
    clickCount: Number(raw.clickCount || 0),
    contactId: raw.contactId ?? raw.contact?.id ?? null,
    contact: raw.contact ?? null,
    leadId: raw.leadId ?? raw.lead?.id ?? null,
    lead: raw.lead ?? null,
    dealId: raw.dealId ?? raw.deal?.id ?? null,
    deal: raw.deal ?? null,
    organizationId: raw.organizationId ?? raw.organization?.id ?? null,
    organization: raw.organization ?? null,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    comments: Array.isArray(raw.comments)
      ? raw.comments.map(normalizeComment)
      : undefined,
    threadMessages: Array.isArray(raw.threadMessages)
      ? raw.threadMessages.map(normalizeEmail)
      : undefined,
    threadCount: raw.threadCount ?? undefined,
    _count: raw._count,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  };
}

function normalizeTemplate(raw: any): EmailTemplateItem {
  return {
    id: raw.id,
    name: raw.name || 'Untitled Template',
    description: raw.description ?? null,
    category: raw.category || 'GENERAL',
    subject: raw.subject || '',
    bodyHtml: raw.bodyHtml || '',
    bodyText: raw.bodyText ?? null,
    variables: Array.isArray(raw.variables) ? raw.variables : [],
    isShared: raw.isShared ?? true,
    createdById: raw.createdById ?? null,
    createdBy: raw.createdBy ?? null,
    workspaceId: raw.workspaceId ?? null,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  };
}

function extractPaginated<T>(
  res: any,
  mapper: (item: any) => T,
  fallbackPage = 1,
  fallbackLimit = 20,
): PaginatedResult<T> {
  const payload = res?.data && !Array.isArray(res.data) ? res.data : res;
  const rawItems = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : [];
  const meta = payload?.meta || res?.meta || {};
  const total = Number(meta.total ?? payload?.total ?? rawItems.length);
  const page = Number(meta.page ?? payload?.page ?? fallbackPage);
  const limit = Number(meta.limit ?? payload?.limit ?? fallbackLimit);
  const totalPages = Number(
    meta.totalPages ??
      payload?.totalPages ??
      Math.max(1, Math.ceil(total / Math.max(1, limit))),
  );

  return {
    items: rawItems.map(mapper),
    total,
    page,
    limit,
    totalPages,
  };
}

class CommunicationApiService {
  /* ---------------- Communication Center ---------------- */

  async getCenterStats(workspaceId?: string): Promise<CommunicationCenterStats> {
    const res = await api.get<any>(
      `/communications/center/stats${buildQuery(workspaceId ? { workspaceId } : undefined)}`,
    );
    const data = res?.data || res;
    return {
      overview: {
        totalEmails: data?.overview?.totalEmails ?? 0,
        inboxTotal: data?.overview?.inboxTotal ?? 0,
        inboxUnread: data?.overview?.inboxUnread ?? 0,
        sentTotal: data?.overview?.sentTotal ?? 0,
        draftsTotal: data?.overview?.draftsTotal ?? 0,
        starredTotal: data?.overview?.starredTotal ?? 0,
        trashTotal: data?.overview?.trashTotal ?? 0,
        commentsTotal: data?.overview?.commentsTotal ?? 0,
        templatesTotal: data?.overview?.templatesTotal ?? 0,
        activeIntegrationsTotal: data?.overview?.activeIntegrationsTotal ?? 0,
      },
      performance: {
        deliveryRatePercentage: data?.performance?.deliveryRatePercentage ?? 100,
        openRatePercentage: data?.performance?.openRatePercentage ?? 0,
        statusBreakdown: data?.performance?.statusBreakdown || {},
      },
      recentActivity: {
        emails: Array.isArray(data?.recentActivity?.emails)
          ? data.recentActivity.emails.map(normalizeEmail)
          : [],
        comments: Array.isArray(data?.recentActivity?.comments)
          ? data.recentActivity.comments.map(normalizeComment)
          : [],
      },
    };
  }

  async getCenterStream(workspaceId?: string): Promise<CommunicationStreamItem[]> {
    const res = await api.get<any>(
      `/communications/center/stream${buildQuery(workspaceId ? { workspaceId } : undefined)}`,
    );
    const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return list;
  }

  /* ---------------- Emails & Folders ---------------- */

  async getEmails(
    query?: EmailQueryParams,
  ): Promise<PaginatedResult<EmailMessageItem>> {
    const res = await api.get<any>(
      `/communications/emails${buildQuery(query as Record<string, unknown>)}`,
    );
    return extractPaginated(res, normalizeEmail, query?.page, query?.limit);
  }

  async getInboxEmails(
    query?: EmailQueryParams,
  ): Promise<PaginatedResult<EmailMessageItem>> {
    const res = await api.get<any>(
      `/communications/emails/inbox${buildQuery(query as Record<string, unknown>)}`,
    );
    return extractPaginated(res, normalizeEmail, query?.page, query?.limit);
  }

  async getSentEmails(
    query?: EmailQueryParams,
  ): Promise<PaginatedResult<EmailMessageItem>> {
    const res = await api.get<any>(
      `/communications/emails/sent${buildQuery(query as Record<string, unknown>)}`,
    );
    return extractPaginated(res, normalizeEmail, query?.page, query?.limit);
  }

  async getDraftEmails(
    query?: EmailQueryParams,
  ): Promise<PaginatedResult<EmailMessageItem>> {
    const res = await api.get<any>(
      `/communications/emails/drafts${buildQuery(query as Record<string, unknown>)}`,
    );
    return extractPaginated(res, normalizeEmail, query?.page, query?.limit);
  }

  async getStarredEmails(
    query?: EmailQueryParams,
  ): Promise<PaginatedResult<EmailMessageItem>> {
    const res = await api.get<any>(
      `/communications/emails/starred${buildQuery(query as Record<string, unknown>)}`,
    );
    return extractPaginated(res, normalizeEmail, query?.page, query?.limit);
  }

  async getTrashEmails(
    query?: EmailQueryParams,
  ): Promise<PaginatedResult<EmailMessageItem>> {
    const res = await api.get<any>(
      `/communications/emails/trash${buildQuery(query as Record<string, unknown>)}`,
    );
    return extractPaginated(res, normalizeEmail, query?.page, query?.limit);
  }

  async getEmailById(id: string): Promise<EmailMessageItem> {
    const res = await api.get<any>(`/communications/emails/${id}`);
    const data = res?.data || res;
    return normalizeEmail(data);
  }

  async composeEmail(payload: ComposeEmailPayload): Promise<EmailMessageItem> {
    const res = await api.post<any>('/communications/emails/compose', payload);
    const data = res?.data || res;
    return normalizeEmail(data);
  }

  async updateEmail(
    id: string,
    payload: UpdateEmailPayload,
  ): Promise<EmailMessageItem> {
    const res = await api.patch<any>(`/communications/emails/${id}`, payload);
    const data = res?.data || res;
    return normalizeEmail(data);
  }

  async deleteEmail(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/communications/emails/${id}`);
    return res?.data || res || { message: 'Email deleted' };
  }

  async replyToEmail(
    id: string,
    payload: ReplyEmailPayload,
  ): Promise<EmailMessageItem> {
    const res = await api.post<any>(
      `/communications/emails/${id}/reply`,
      payload,
    );
    const data = res?.data || res;
    return normalizeEmail(data);
  }

  async forwardEmail(
    id: string,
    payload: ForwardEmailPayload,
  ): Promise<EmailMessageItem> {
    const res = await api.post<any>(
      `/communications/emails/${id}/forward`,
      payload,
    );
    const data = res?.data || res;
    return normalizeEmail(data);
  }

  async batchEmailAction(params: {
    emailIds: string[];
    action: BatchEmailActionType;
    targetFolder?: EmailFolder;
  }): Promise<{ success: boolean; count: number; action: string }> {
    const res = await api.patch<any>('/communications/emails/batch', params);
    return res?.data || res;
  }

  /* ---------------- Internal Comments & Mentions ---------------- */

  async getComments(
    query?: CommentQueryParams,
  ): Promise<PaginatedResult<CommunicationCommentItem>> {
    const res = await api.get<any>(
      `/communications/comments${buildQuery(query as Record<string, unknown>)}`,
    );
    return extractPaginated(res, normalizeComment, query?.page, query?.limit);
  }

  async getCommentsByEmail(emailId: string): Promise<CommunicationCommentItem[]> {
    const res = await api.get<any>(`/communications/emails/${emailId}/comments`);
    const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return list.map(normalizeComment);
  }

  async createComment(
    payload: CreateCommentPayload,
  ): Promise<CommunicationCommentItem> {
    const res = await api.post<any>('/communications/comments', payload);
    const data = res?.data || res;
    return normalizeComment(data);
  }

  async updateComment(
    id: string,
    payload: { content: string; mentionedUserIds?: string[] },
  ): Promise<CommunicationCommentItem> {
    const res = await api.patch<any>(`/communications/comments/${id}`, payload);
    const data = res?.data || res;
    return normalizeComment(data);
  }

  async deleteComment(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/communications/comments/${id}`);
    return res?.data || res || { message: 'Comment deleted' };
  }

  /* ---------------- Templates ---------------- */

  async getTemplates(
    query?: TemplateQueryParams,
  ): Promise<PaginatedResult<EmailTemplateItem>> {
    const res = await api.get<any>(
      `/communications/templates${buildQuery(query as Record<string, unknown>)}`,
    );
    return extractPaginated(res, normalizeTemplate, query?.page, query?.limit);
  }

  async getTemplateById(id: string): Promise<EmailTemplateItem> {
    const res = await api.get<any>(`/communications/templates/${id}`);
    return normalizeTemplate(res?.data || res);
  }

  async createTemplate(
    payload: CreateTemplatePayload,
  ): Promise<EmailTemplateItem> {
    const res = await api.post<any>('/communications/templates', payload);
    return normalizeTemplate(res?.data || res);
  }

  async updateTemplate(
    id: string,
    payload: Partial<CreateTemplatePayload>,
  ): Promise<EmailTemplateItem> {
    const res = await api.patch<any>(
      `/communications/templates/${id}`,
      payload,
    );
    return normalizeTemplate(res?.data || res);
  }

  async deleteTemplate(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/communications/templates/${id}`);
    return res?.data || res || { message: 'Template deleted' };
  }

  async cloneTemplate(id: string): Promise<EmailTemplateItem> {
    const res = await api.post<any>(`/communications/templates/${id}/clone`, {});
    return normalizeTemplate(res?.data || res);
  }

  async renderTemplate(
    id: string,
    payload: RenderTemplatePayload,
  ): Promise<RenderedTemplateResult> {
    const res = await api.post<any>(
      `/communications/templates/${id}/render`,
      payload,
    );
    return res?.data || res;
  }

  async getAvailableTemplateVariables(): Promise<Record<string, any>> {
    try {
      const res = await api.get<any>(
        '/communications/templates/variables/available',
      );
      return res?.data || res || {};
    } catch {
      return {};
    }
  }

  /* ---------------- Communication History ---------------- */

  async getHistoryTimeline(
    query?: CommunicationHistoryQueryParams,
  ): Promise<CommunicationHistoryResponse> {
    const res = await api.get<any>(
      `/communications/history${buildQuery(query as Record<string, unknown>)}`,
    );
    const payload = res?.data && !Array.isArray(res.data) ? res.data : res;
    const base = extractPaginated<any>(
      payload,
      (item) => item,
      query?.page,
      query?.limit,
    );
    const summary = payload?.summary || res?.summary || {
      totalCommunications: base.total,
      channelBreakdown: {
        emails: 0,
        calls: 0,
        meetings: 0,
        whatsapp: 0,
        notes: 0,
        comments: 0,
      },
    };
    return {
      ...base,
      summary,
    };
  }

  /* ---------------- CRM Entity Lookups ---------------- */

  async getUsersLookup(): Promise<CommunicationUserRef[]> {
    return activityService.getAssignableUsers();
  }

  async getContactsLookup(): Promise<CommunicationContactRef[]> {
    return activityService.getContactsLookup();
  }

  async getLeadsLookup(): Promise<CommunicationLeadRef[]> {
    return activityService.getLeadsLookup();
  }

  async getDealsLookup(): Promise<CommunicationDealRef[]> {
    return activityService.getDealsLookup();
  }
}

export const communicationService = new CommunicationApiService();
export default communicationService;

