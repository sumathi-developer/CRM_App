export type SettingsScreenSlug =
  | 'account'
  | 'profile'
  | 'workspace'
  | 'general'
  | 'leads'
  | 'contacts'
  | 'companies'
  | 'deals'
  | 'pipelines'
  | 'activities'
  | 'notifications'
  | 'email'
  | 'integrations'
  | 'security';

export interface SystemSettingRecord {
  id?: string;
  key: string;
  value: string;
  category: string;
  isPublic: boolean;
}

export interface AccountSettingsState {
  email: string;
  accountStatus: string;
  roleName: string;
  organizationName: string;
  defaultLandingPage: string;
  compactSidebar: boolean;
  keyboardShortcuts: boolean;
  autoSaveDrafts: boolean;
  sessionAlerts: boolean;
}

export interface ProfileSettingsState {
  name: string;
  phone: string;
  jobTitle: string;
  department: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
}

export interface WorkspaceSettingsFormState {
  name: string;
  slug: string;
  description: string;
  website: string;
  companyName: string;
  industry: string;
  supportEmail: string;
  primaryColor: string;
  accentColor: string;
  allowMemberInvites: boolean;
  weeklyWorkspaceDigest: boolean;
}

export interface GeneralSettingsState {
  applicationName: string;
  defaultCurrency: string;
  defaultTimezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  fiscalYearStartMonth: string;
  defaultPaginationLimit: number;
  enableGlobalAuditLog: boolean;
  enableRecycleBin: boolean;
}

export interface LeadSettingsFormState {
  defaultStatus: string;
  defaultSource: string;
  defaultView: 'list' | 'board' | 'table';
  hotScoreThreshold: number;
  warmScoreThreshold: number;
  autoAssignNewLeads: boolean;
  duplicateEmailCheck: boolean;
  requireCompanyOnCreate: boolean;
  autoCreateDealOnConvert: boolean;
}

export interface ContactSettingsState {
  defaultLifecycleStage: 'LEAD' | 'OPPORTUNITY' | 'CUSTOMER' | 'CHURNED';
  defaultView: 'list' | 'table';
  requireEmailOnCreate: boolean;
  requirePhoneOnCreate: boolean;
  enforceUniqueEmail: boolean;
  autoLinkCompanyByDomain: boolean;
  enableContactActivityTimeline: boolean;
}

export interface CompanySettingsState {
  defaultCompanyStatus: 'ACTIVE' | 'INACTIVE';
  requireDomainOnCreate: boolean;
  autoEnrichFromDomain: boolean;
  allowDuplicateCompanyNames: boolean;
  cascadeOwnerToContacts: boolean;
  defaultIndustrySector: string;
}

export interface DealSettingsFormState {
  defaultCurrency: string;
  defaultView: 'list' | 'board' | 'table';
  defaultProbability: number;
  staleDealThresholdDays: number;
  requireExpectedCloseDate: boolean;
  requireContactOrCompany: boolean;
  requireLostReason: boolean;
  celebrateWonDeals: boolean;
}

export interface PipelineSettingsFormState {
  defaultViewMode: 'board' | 'list' | 'table';
  enforceSequentialStageMovement: boolean;
  autoUpdateProbabilityByStage: boolean;
  showWeightedValueOnCards: boolean;
  rottingDealDaysWarning: number;
  allowMultiplePipelines: boolean;
}

export interface ActivitySettingsState {
  defaultActivityType: 'CALL' | 'MEETING' | 'EMAIL' | 'FOLLOW_UP' | 'WHATSAPP';
  defaultPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  defaultReminderMinutes: number;
  defaultCallDurationMinutes: number;
  defaultMeetingDurationMinutes: number;
  autoCompletePastMeetings: boolean;
  createFollowUpTaskOnMissedCall: boolean;
  syncActivitiesToCalendar: boolean;
}

export interface NotificationSettingsState {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  notifyOnNewLeadAssigned: boolean;
  notifyOnDealWonOrLost: boolean;
  notifyOnActivityOverdue: boolean;
  notifyOnMentionInComment: boolean;
  dailyAgendaSummary: boolean;
  weeklyPerformanceDigest: boolean;
}

export interface EmailSettingsState {
  senderDisplayName: string;
  replyToEmail: string;
  bccComplianceAddress: string;
  defaultSignatureHtml: string;
  trackEmailOpens: boolean;
  trackLinkClicks: boolean;
  autoLinkEmailsToContacts: boolean;
  dailySendLimitPerUser: number;
}

export interface IntegrationSettingsState {
  googleWorkspaceConnected: boolean;
  microsoft365Connected: boolean;
  slackWebhookEnabled: boolean;
  slackChannelName: string;
  whatsappBusinessEnabled: boolean;
  zapierWebhooksEnabled: boolean;
  webhookEndpointUrl: string;
  syncIntervalMinutes: number;
}

export interface SecuritySettingsState {
  enforceTwoFactor: boolean;
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  requireSpecialCharacters: boolean;
  allowedEmailDomains: string;
  ipAllowlist: string;
  notifyOnNewDeviceLogin: boolean;
  allowDataExportForNonAdmins: boolean;
}

export interface AllSettingsBundle {
  account: AccountSettingsState;
  profile: ProfileSettingsState;
  workspace: WorkspaceSettingsFormState;
  general: GeneralSettingsState;
  leads: LeadSettingsFormState;
  contacts: ContactSettingsState;
  companies: CompanySettingsState;
  deals: DealSettingsFormState;
  pipelines: PipelineSettingsFormState;
  activities: ActivitySettingsState;
  notifications: NotificationSettingsState;
  email: EmailSettingsState;
  integrations: IntegrationSettingsState;
  security: SecuritySettingsState;
}

