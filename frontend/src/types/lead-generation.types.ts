/* ==========================================================================
   LEAD GENERATION MODULE TYPES
   Mirrors backend DTOs / response shapes in backend/src/lead-generation
   ========================================================================== */

export type LeadSourceType =
  | 'WEBSITE'
  | 'LANDING_PAGE'
  | 'CAMPAIGN'
  | 'SOCIAL_MEDIA'
  | 'EMAIL'
  | 'REFERRAL'
  | 'MANUAL'
  | 'PAID_SEARCH'
  | 'EVENT'
  | 'OTHER';

export type FormType = 'WEB_FORM' | 'LANDING_PAGE' | 'POPUP' | 'EMBEDDED';
export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ScoringCategory = 'DEMOGRAPHIC' | 'FIRMOGRAPHIC' | 'BEHAVIORAL' | 'SOURCE';

export type RuleOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'IN'
  | 'NOT_EMPTY'
  | 'REGEX';

export type RoutingStrategy = 'ROUND_ROBIN' | 'SPECIFIC_USER' | 'LOAD_BALANCED' | 'SOURCE_BASED';

export type ChannelKey =
  | 'landing-page'
  | 'campaign'
  | 'social'
  | 'website'
  | 'email'
  | 'referral'
  | 'manual';

/* ---------- Shared ---------- */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface MessageResponse {
  message: string;
}

/* ---------- Lead Sources ---------- */

export interface LeadSource {
  id: string;
  name: string;
  code?: string | null;
  type: LeadSourceType;
  description?: string | null;
  status: string;
  cost?: number | null;
  isSystem?: boolean;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  workspaceId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt?: string;
  _count?: { leads?: number; submissions?: number; webForms?: number };
}

export interface LeadSourceMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  qualificationRate: number;
  conversionRate: number;
  totalPipelineValue: number;
  avgScore: number;
  costPerLead: number;
  costPerConversion: number;
  roiMultiplier: number | null;
}

export interface RecentSourceLead {
  id: string;
  title?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  status: string;
  leadScore?: number | null;
  estimatedValue?: number | null;
  createdAt: string;
}

export interface LeadSourceDetails extends LeadSource {
  metrics: LeadSourceMetrics;
  leads?: RecentSourceLead[];
}

export interface LeadSourcePayload {
  name: string;
  code?: string;
  type: LeadSourceType;
  description?: string;
  status?: string;
  cost?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  workspaceId?: string;
}

export interface LeadSourceQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: LeadSourceType | '';
  status?: string;
  workspaceId?: string;
}

/* ---------- Web Forms ---------- */

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'number' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormSettings {
  successMessage?: string;
  redirectUrl?: string;
  notifyEmails?: string[];
  emailNotification?: boolean;
  duplicateHandling?: 'MERGE' | 'UPDATE' | 'ALLOW' | 'REJECT';
  autoScore?: boolean;
  autoQualify?: boolean;
  autoRoute?: boolean;
}

export interface FormStyling {
  primaryColor?: string;
  backgroundColor?: string;
  borderRadius?: string;
  buttonText?: string;
  darkMode?: boolean;
}

export interface WebForm {
  id: string;
  name: string;
  slug: string;
  title: string;
  description?: string | null;
  status: FormStatus;
  formType: FormType;
  fields?: FormField[] | null;
  styling?: FormStyling | null;
  settings?: FormSettings | null;
  defaultSourceId?: string | null;
  defaultOwnerId?: string | null;
  campaignName?: string | null;
  workspaceId?: string | null;
  isPublished?: boolean;
  viewsCount: number;
  submissionsCount: number;
  conversionRate: number;
  createdAt: string;
  updatedAt?: string;
  defaultSource?: { id: string; name: string; code?: string | null; type?: LeadSourceType } | null;
  _count?: { submissions?: number; leads?: number };
}

export interface WebFormDetails extends WebForm {
  publicUrl: string;
  embedSnippet: string;
}

export interface WebFormPayload {
  name: string;
  slug?: string;
  title: string;
  description?: string;
  status?: FormStatus;
  formType?: FormType;
  fields?: FormField[];
  styling?: FormStyling;
  settings?: FormSettings;
  defaultSourceId?: string;
  defaultOwnerId?: string;
  campaignName?: string;
  workspaceId?: string;
}

export interface WebFormQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: FormStatus | '';
  formType?: FormType | '';
  workspaceId?: string;
}

export interface PublishFormResult {
  message: string;
  form: WebForm;
  publicUrl?: string;
  embedSnippet?: string;
}

/* ---------- Submissions ---------- */

export interface FormSubmission {
  id: string;
  formId: string;
  status: string;
  isSpam: boolean;
  payload?: Record<string, any> | null;
  data?: Record<string, any> | null;
  submittedAt: string;
  form?: { id: string; name: string; slug: string; formType: FormType } | null;
  lead?: { id: string; title?: string | null; email?: string | null; status: string; leadScore?: number | null } | null;
  leadSource?: { id: string; name: string; code?: string | null } | null;
}

export interface SubmissionQuery {
  page?: number;
  limit?: number;
  formId?: string;
  status?: string;
  isSpam?: boolean;
  search?: string;
  workspaceId?: string;
}

/* ---------- Channel Leads ---------- */

export interface ChannelLead {
  id: string;
  title?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  status: string;
  source?: string | null;
  channel?: string | null;
  campaign?: string | null;
  medium?: string | null;
  leadScore?: number | null;
  estimatedValue?: number | null;
  createdAt: string;
  owner?: { id: string; name: string; email: string } | null;
  leadSource?: { id: string; name: string; code?: string | null; type?: LeadSourceType } | null;
  webForm?: { id: string; name: string; slug: string; formType: FormType } | null;
}

export interface ChannelLeadQuery {
  page?: number;
  limit?: number;
  search?: string;
  campaign?: string;
  medium?: string;
  source?: string;
  status?: string;
  ownerId?: string;
  minScore?: number;
  workspaceId?: string;
}

export interface ManualLeadPayload {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  estimatedValue?: number;
  channel?: string;
  leadSourceId?: string;
  campaign?: string;
  medium?: string;
  ownerId?: string;
  qualificationNotes?: string;
  workspaceId?: string;
}

export interface ManualLeadResult {
  message: string;
  lead: ChannelLead;
  scoring?: { totalScore: number; breakdown?: ScoreBreakdownItem[] } | null;
  qualification?: QualificationResult | null;
  routing?: { assignedTo?: { id: string; name: string; email: string } | null; reason?: string; [k: string]: any } | null;
}

/* ---------- Scoring ---------- */

export interface ScoringRule {
  id: string;
  name: string;
  description?: string | null;
  category: ScoringCategory;
  conditionField: string;
  operator: RuleOperator;
  conditionValue: string;
  scoreChange: number;
  isActive: boolean;
  priority: number;
  workspaceId?: string | null;
  createdAt?: string;
}

export interface ScoringRulePayload {
  name: string;
  description?: string;
  category: ScoringCategory;
  conditionField: string;
  operator: RuleOperator;
  conditionValue: string;
  scoreChange: number;
  isActive?: boolean;
  priority?: number;
  workspaceId?: string;
}

export interface ScoreBreakdownItem {
  ruleId: string;
  ruleName: string;
  category: string;
  conditionField: string;
  operator: string;
  scoreChange: number;
  matched: boolean;
  reason: string;
}

export interface ScorePreviewResult {
  totalScore: number;
  breakdown: ScoreBreakdownItem[];
}

/* ---------- Qualification ---------- */

export interface QualificationCondition {
  field: string;
  operator: string;
  value: string | number;
}

export interface QualificationRule {
  id: string;
  name: string;
  description?: string | null;
  targetStatus: string;
  minScore?: number | null;
  conditions?: QualificationCondition[] | null;
  autoQualify: boolean;
  isActive: boolean;
  priority: number;
  workspaceId?: string | null;
  createdAt?: string;
}

export interface QualificationRulePayload {
  name: string;
  description?: string;
  targetStatus?: string;
  minScore?: number;
  conditions?: QualificationCondition[];
  autoQualify?: boolean;
  isActive?: boolean;
  priority?: number;
  workspaceId?: string;
}

export interface QualificationResult {
  isQualified: boolean;
  targetStatus: string;
  matchedRules: Array<{ id: string; name: string; targetStatus: string; minScore?: number; autoQualify: boolean }>;
  reasons: string[];
  autoQualify: boolean;
}

/* ---------- Routing / Assignment ---------- */

export interface AssignmentRuleCondition {
  field: string;
  operator: string;
  value: string | number;
}

export interface AssignmentRule {
  id: string;
  name: string;
  description?: string | null;
  routingStrategy: RoutingStrategy;
  targetUserIds: string[];
  conditions?: AssignmentRuleCondition[] | null;
  isActive: boolean;
  priority: number;
  workspaceId?: string | null;
  createdAt?: string;
}

export interface AssignmentRulePayload {
  name: string;
  description?: string;
  routingStrategy: RoutingStrategy;
  targetUserIds: string[];
  conditions?: AssignmentRuleCondition[];
  isActive?: boolean;
  priority?: number;
  workspaceId?: string;
}

export interface RuleQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  workspaceId?: string;
  category?: string;
  targetStatus?: string;
  strategy?: string;
}

export interface RouteLeadPayload {
  ruleId?: string;
  targetUserId?: string;
}

export interface BulkAssignPayload {
  leadIds: string[];
  ownerId?: string;
  ruleId?: string;
}

/* ---------- Analytics ---------- */

export interface LeadGenOverview {
  kpis: {
    totalLeadsGenerated: number;
    totalPipelineValue: number;
    averageLeadScore: number;
    qualificationRate: number;
    conversionRate: number;
    newLeads: number;
    qualifiedLeads: number;
    convertedLeads: number;
    unqualifiedLeads: number;
  };
  forms: {
    totalForms: number;
    activeForms: number;
    totalViews: number;
    totalSubmissions: number;
    overallConversionRate: number;
    rawSubmissions: number;
    spamBlocked: number;
  };
  channelDistribution: Record<string, number>;
  timeSeries: Array<{ date: string; count: number }>;
  topSources: Array<{ id: string; name: string; type: LeadSourceType; leadsCount: number }>;
}

export interface SourceAnalyticsRow {
  id: string;
  name: string;
  code?: string | null;
  type: LeadSourceType;
  status: string;
  cost: number;
  leadsCount: number;
  qualifiedCount: number;
  convertedCount: number;
  qualificationRate: number;
  conversionRate: number;
  pipelineValue: number;
  averageScore: number;
  costPerLead: number;
  cac: number;
  roiMultiplier: number | null;
}

export interface SourceAnalytics {
  summary: {
    totalCost: number;
    totalLeads: number;
    totalConverted: number;
    totalValue: number;
    overallCPL: number;
    overallCAC: number;
  };
  sources: SourceAnalyticsRow[];
}

export interface FormAnalyticsRow {
  id: string;
  name: string;
  slug: string;
  formType: FormType;
  status: FormStatus;
  viewsCount: number;
  submissionsCount: number;
  conversionRate: number;
  dropoffRate: number;
  isPublished: boolean;
  defaultSource?: { id: string; name: string; type?: LeadSourceType } | null;
}
