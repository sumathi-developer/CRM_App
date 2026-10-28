import { api } from './api';
import type {
  Paginated,
  MessageResponse,
  LeadSource,
  LeadSourceDetails,
  LeadSourcePayload,
  LeadSourceQuery,
  WebForm,
  WebFormDetails,
  WebFormPayload,
  WebFormQuery,
  PublishFormResult,
  FormSubmission,
  SubmissionQuery,
  ChannelKey,
  ChannelLead,
  ChannelLeadQuery,
  ManualLeadPayload,
  ManualLeadResult,
  ScoringRule,
  ScoringRulePayload,
  ScorePreviewResult,
  QualificationRule,
  QualificationRulePayload,
  QualificationResult,
  AssignmentRule,
  AssignmentRulePayload,
  RuleQuery,
  RouteLeadPayload,
  BulkAssignPayload,
  LeadGenOverview,
  SourceAnalytics,
  FormAnalyticsRow,
} from '../types/lead-generation.types';

const BASE = '/lead-generation';

/** Build a query string, skipping undefined / null / empty values. */
function qs(params?: Record<string, unknown>): string {
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

/** Normalise any list response into the { data, meta } shape. */
function toPaginated<T>(response: any): Paginated<T> {
  if (response?.data && response?.meta) return response as Paginated<T>;
  if (Array.isArray(response)) {
    return {
      data: response,
      meta: { total: response.length, page: 1, limit: response.length || 10, totalPages: 1 },
    };
  }
  return {
    data: response?.data || [],
    meta: response?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 },
  };
}

class LeadGenerationService {
  /* ---------------- Overview & Analytics ---------------- */

  getOverview(workspaceId?: string): Promise<LeadGenOverview> {
    return api.get<LeadGenOverview>(`${BASE}/overview${qs({ workspaceId })}`);
  }

  getGenerationAnalytics(workspaceId?: string): Promise<LeadGenOverview> {
    return api.get<LeadGenOverview>(`${BASE}/analytics/overview${qs({ workspaceId })}`);
  }

  getSourceAnalytics(workspaceId?: string): Promise<SourceAnalytics> {
    return api.get<SourceAnalytics>(`${BASE}/analytics/sources${qs({ workspaceId })}`);
  }

  async getFormAnalytics(workspaceId?: string): Promise<FormAnalyticsRow[]> {
    const res = await api.get<any>(`${BASE}/analytics/forms${qs({ workspaceId })}`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  /* ---------------- Lead Sources ---------------- */

  async getSources(query?: LeadSourceQuery): Promise<Paginated<LeadSource>> {
    return toPaginated<LeadSource>(await api.get<any>(`${BASE}/sources${qs({ ...query })}`));
  }

  getSourceById(id: string): Promise<LeadSourceDetails> {
    return api.get<LeadSourceDetails>(`${BASE}/sources/${id}`);
  }

  createSource(payload: LeadSourcePayload): Promise<LeadSource> {
    return api.post<LeadSource>(`${BASE}/sources`, payload);
  }

  updateSource(id: string, payload: Partial<LeadSourcePayload>): Promise<LeadSource> {
    return api.patch<LeadSource>(`${BASE}/sources/${id}`, payload);
  }

  deleteSource(id: string): Promise<MessageResponse> {
    return api.delete<MessageResponse>(`${BASE}/sources/${id}`);
  }

  /* ---------------- Web Forms ---------------- */

  async getForms(query?: WebFormQuery): Promise<Paginated<WebForm>> {
    return toPaginated<WebForm>(await api.get<any>(`${BASE}/forms${qs({ ...query })}`));
  }

  getFormById(id: string): Promise<WebFormDetails> {
    return api.get<WebFormDetails>(`${BASE}/forms/${id}`);
  }

  createForm(payload: WebFormPayload): Promise<WebForm> {
    return api.post<WebForm>(`${BASE}/forms`, payload);
  }

  updateForm(id: string, payload: Partial<WebFormPayload>): Promise<WebForm> {
    return api.patch<WebForm>(`${BASE}/forms/${id}`, payload);
  }

  deleteForm(id: string): Promise<MessageResponse> {
    return api.delete<MessageResponse>(`${BASE}/forms/${id}`);
  }

  publishForm(id: string): Promise<PublishFormResult> {
    return api.post<PublishFormResult>(`${BASE}/forms/${id}/publish`);
  }

  unpublishForm(id: string): Promise<PublishFormResult> {
    return api.post<PublishFormResult>(`${BASE}/forms/${id}/unpublish`);
  }

  /* ---------------- Submissions ---------------- */

  async getSubmissions(query?: SubmissionQuery): Promise<Paginated<FormSubmission>> {
    return toPaginated<FormSubmission>(await api.get<any>(`${BASE}/submissions${qs({ ...query })}`));
  }

  getSubmissionById(id: string): Promise<FormSubmission> {
    return api.get<FormSubmission>(`${BASE}/submissions/${id}`);
  }

  markSubmissionSpam(id: string, isSpam: boolean): Promise<FormSubmission> {
    return api.patch<FormSubmission>(`${BASE}/submissions/${id}/mark-spam`, { isSpam });
  }

  reprocessSubmission(id: string): Promise<any> {
    return api.post<any>(`${BASE}/submissions/${id}/reprocess`);
  }

  /* ---------------- Channel Leads ---------------- */

  async getChannelLeads(channel: ChannelKey, query?: ChannelLeadQuery): Promise<Paginated<ChannelLead>> {
    return toPaginated<ChannelLead>(await api.get<any>(`${BASE}/leads/${channel}${qs({ ...query })}`));
  }

  captureManualLead(payload: ManualLeadPayload): Promise<ManualLeadResult> {
    return api.post<ManualLeadResult>(`${BASE}/leads/manual`, payload);
  }

  /* ---------------- Scoring ---------------- */

  async getScoringRules(query?: RuleQuery): Promise<Paginated<ScoringRule>> {
    return toPaginated<ScoringRule>(await api.get<any>(`${BASE}/scoring-rules${qs({ ...query })}`));
  }

  createScoringRule(payload: ScoringRulePayload): Promise<ScoringRule> {
    return api.post<ScoringRule>(`${BASE}/scoring-rules`, payload);
  }

  updateScoringRule(id: string, payload: Partial<ScoringRulePayload>): Promise<ScoringRule> {
    return api.patch<ScoringRule>(`${BASE}/scoring-rules/${id}`, payload);
  }

  deleteScoringRule(id: string): Promise<MessageResponse> {
    return api.delete<MessageResponse>(`${BASE}/scoring-rules/${id}`);
  }

  previewScore(lead: Record<string, any>, workspaceId?: string): Promise<ScorePreviewResult> {
    return api.post<ScorePreviewResult>(`${BASE}/scoring/preview`, { lead, workspaceId });
  }

  recalculateLeadScore(leadId: string): Promise<any> {
    return api.post<any>(`${BASE}/leads/${leadId}/calculate-score`);
  }

  /* ---------------- Qualification ---------------- */

  async getQualificationRules(query?: RuleQuery): Promise<Paginated<QualificationRule>> {
    return toPaginated<QualificationRule>(await api.get<any>(`${BASE}/qualification-rules${qs({ ...query })}`));
  }

  createQualificationRule(payload: QualificationRulePayload): Promise<QualificationRule> {
    return api.post<QualificationRule>(`${BASE}/qualification-rules`, payload);
  }

  updateQualificationRule(id: string, payload: Partial<QualificationRulePayload>): Promise<QualificationRule> {
    return api.patch<QualificationRule>(`${BASE}/qualification-rules/${id}`, payload);
  }

  deleteQualificationRule(id: string): Promise<MessageResponse> {
    return api.delete<MessageResponse>(`${BASE}/qualification-rules/${id}`);
  }

  previewQualification(lead: Record<string, any>, workspaceId?: string): Promise<QualificationResult> {
    return api.post<QualificationResult>(`${BASE}/qualification/preview`, { lead, workspaceId });
  }

  evaluateLeadQualification(leadId: string): Promise<any> {
    return api.post<any>(`${BASE}/leads/${leadId}/evaluate-qualification`);
  }

  /* ---------------- Routing / Assignment Rules ---------------- */

  async getAssignmentRules(query?: RuleQuery): Promise<Paginated<AssignmentRule>> {
    return toPaginated<AssignmentRule>(await api.get<any>(`${BASE}/assignment-rules${qs({ ...query })}`));
  }

  createAssignmentRule(payload: AssignmentRulePayload): Promise<AssignmentRule> {
    return api.post<AssignmentRule>(`${BASE}/assignment-rules`, payload);
  }

  updateAssignmentRule(id: string, payload: Partial<AssignmentRulePayload>): Promise<AssignmentRule> {
    return api.patch<AssignmentRule>(`${BASE}/assignment-rules/${id}`, payload);
  }

  deleteAssignmentRule(id: string): Promise<MessageResponse> {
    return api.delete<MessageResponse>(`${BASE}/assignment-rules/${id}`);
  }

  routeLead(leadId: string, payload: RouteLeadPayload): Promise<any> {
    return api.post<any>(`${BASE}/leads/${leadId}/route`, payload);
  }

  bulkAssign(payload: BulkAssignPayload): Promise<any> {
    return api.post<any>(`${BASE}/assignment/bulk`, payload);
  }
}

export const leadGenerationService = new LeadGenerationService();
