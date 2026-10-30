import type {
  AllSettingsBundle,
  SettingsScreenSlug,
} from '../../types/settings.types';

export interface SettingsScreenMeta {
  slug: SettingsScreenSlug;
  label: string;
  shortLabel: string;
  path: string;
  group: 'Personal & Workspace' | 'CRM Modules' | 'Communications & Security';
  subtitle: string;
  requiresAdminOrManager?: boolean;
}

export const SETTINGS_SCREEN_META: Record<
  SettingsScreenSlug,
  SettingsScreenMeta
> = {
  account: {
    slug: 'account',
    label: 'Account Settings',
    shortLabel: 'Account',
    path: '/settings/account',
    group: 'Personal & Workspace',
    subtitle:
      'Manage your CRM account identity, default start page, keyboard shortcuts, and personal session alerts.',
  },
  profile: {
    slug: 'profile',
    label: 'Profile Settings',
    shortLabel: 'Profile',
    path: '/settings/profile',
    group: 'Personal & Workspace',
    subtitle:
      'Update your display name, phone number, job title, interface theme, language, and personal timezone.',
  },
  workspace: {
    slug: 'workspace',
    label: 'Workspace Settings',
    shortLabel: 'Workspace',
    path: '/settings/workspace',
    group: 'Personal & Workspace',
    subtitle:
      'Configure your active workspace identity, company details, brand colors, support email, and member invite policies.',
    requiresAdminOrManager: true,
  },
  general: {
    slug: 'general',
    label: 'General Settings',
    shortLabel: 'General',
    path: '/settings/general',
    group: 'Personal & Workspace',
    subtitle:
      'Configure system-wide currency, timezone, date/time formatting, fiscal year calendar, and global audit logging.',
    requiresAdminOrManager: true,
  },
  leads: {
    slug: 'leads',
    label: 'Lead Settings',
    shortLabel: 'Leads',
    path: '/settings/leads',
    group: 'CRM Modules',
    subtitle:
      'Define default lead statuses, acquisition sources, score tier thresholds, duplicate detection, and conversion rules.',
  },
  contacts: {
    slug: 'contacts',
    label: 'Contact Settings',
    shortLabel: 'Contacts',
    path: '/settings/contacts',
    group: 'CRM Modules',
    subtitle:
      'Configure contact lifecycle stages, required contact fields, unique email validation, and domain-based company linking.',
  },
  companies: {
    slug: 'companies',
    label: 'Company Settings',
    shortLabel: 'Companies',
    path: '/settings/companies',
    group: 'CRM Modules',
    subtitle:
      'Set organization defaults, domain requirements, account owner cascading rules, and duplicate company checks.',
  },
  deals: {
    slug: 'deals',
    label: 'Deal Settings',
    shortLabel: 'Deals',
    path: '/settings/deals',
    group: 'CRM Modules',
    subtitle:
      'Manage deal currency defaults, initial win probabilities, stale deal warnings, and required close-date/lost-reason policies.',
  },
  pipelines: {
    slug: 'pipelines',
    label: 'Pipeline Settings',
    shortLabel: 'Pipelines',
    path: '/settings/pipelines',
    group: 'CRM Modules',
    subtitle:
      'Control pipeline board layout defaults, sequential stage enforcement, automatic probability updates, and rotting deal alerts.',
  },
  activities: {
    slug: 'activities',
    label: 'Activity Settings',
    shortLabel: 'Activities',
    path: '/settings/activities',
    group: 'CRM Modules',
    subtitle:
      'Customize default activity types, priority levels, call/meeting durations, reminder offsets, and calendar sync behavior.',
  },
  notifications: {
    slug: 'notifications',
    label: 'Notification Settings',
    shortLabel: 'Notifications',
    path: '/settings/notifications',
    group: 'Communications & Security',
    subtitle:
      'Choose how and when you receive email, push, and in-app alerts for leads, deals, overdue tasks, mentions, and digests.',
  },
  email: {
    slug: 'email',
    label: 'Email Settings',
    shortLabel: 'Email',
    path: '/settings/email',
    group: 'Communications & Security',
    subtitle:
      'Configure outbound sender display name, reply-to address, compliance BCC, email signature, open/click tracking, and send limits.',
  },
  integrations: {
    slug: 'integrations',
    label: 'Integration Settings',
    shortLabel: 'Integrations',
    path: '/settings/integrations',
    group: 'Communications & Security',
    subtitle:
      'Connect and configure Google Workspace, Microsoft 365, Slack notifications, WhatsApp Business, and outbound webhooks.',
    requiresAdminOrManager: true,
  },
  security: {
    slug: 'security',
    label: 'Security Settings',
    shortLabel: 'Security',
    path: '/settings/security',
    group: 'Communications & Security',
    subtitle:
      'Enforce two-factor authentication, session timeout policies, password complexity, domain allowlists, and IP restrictions.',
    requiresAdminOrManager: true,
  },
};

export const SETTINGS_NAV_LIST: SettingsScreenMeta[] = [
  SETTINGS_SCREEN_META.account,
  SETTINGS_SCREEN_META.profile,
  SETTINGS_SCREEN_META.workspace,
  SETTINGS_SCREEN_META.general,
  SETTINGS_SCREEN_META.leads,
  SETTINGS_SCREEN_META.contacts,
  SETTINGS_SCREEN_META.companies,
  SETTINGS_SCREEN_META.deals,
  SETTINGS_SCREEN_META.pipelines,
  SETTINGS_SCREEN_META.activities,
  SETTINGS_SCREEN_META.notifications,
  SETTINGS_SCREEN_META.email,
  SETTINGS_SCREEN_META.integrations,
  SETTINGS_SCREEN_META.security,
];

export const DEFAULT_SETTINGS_BUNDLE: AllSettingsBundle = {
  account: {
    email: 'user@crm.com',
    accountStatus: 'ACTIVE',
    roleName: 'ADMIN',
    organizationName: 'Acme Organization',
    defaultLandingPage: '/dashboard',
    compactSidebar: false,
    keyboardShortcuts: true,
    autoSaveDrafts: true,
    sessionAlerts: true,
  },
  profile: {
    name: '',
    phone: '',
    jobTitle: 'Sales Executive',
    department: 'Revenue Operations',
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
  },
  workspace: {
    name: 'Acme Workspace',
    slug: 'acme-workspace',
    description: 'Primary enterprise CRM workspace',
    website: 'https://acme.example.com',
    companyName: 'Acme Corporation',
    industry: 'Technology & SaaS',
    supportEmail: 'support@acme.example.com',
    primaryColor: '#2563eb',
    accentColor: '#10b981',
    allowMemberInvites: true,
    weeklyWorkspaceDigest: true,
  },
  general: {
    applicationName: 'Acme Enterprise CRM',
    defaultCurrency: 'USD',
    defaultTimezone: 'America/New_York',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    fiscalYearStartMonth: 'JANUARY',
    defaultPaginationLimit: 20,
    enableGlobalAuditLog: true,
    enableRecycleBin: true,
  },
  leads: {
    defaultStatus: 'NEW',
    defaultSource: 'WEBSITE',
    defaultView: 'list',
    hotScoreThreshold: 75,
    warmScoreThreshold: 40,
    autoAssignNewLeads: true,
    duplicateEmailCheck: true,
    requireCompanyOnCreate: false,
    autoCreateDealOnConvert: true,
  },
  contacts: {
    defaultLifecycleStage: 'LEAD',
    defaultView: 'list',
    requireEmailOnCreate: true,
    requirePhoneOnCreate: false,
    enforceUniqueEmail: true,
    autoLinkCompanyByDomain: true,
    enableContactActivityTimeline: true,
  },
  companies: {
    defaultCompanyStatus: 'ACTIVE',
    requireDomainOnCreate: false,
    autoEnrichFromDomain: true,
    allowDuplicateCompanyNames: false,
    cascadeOwnerToContacts: true,
    defaultIndustrySector: 'Software & Technology',
  },
  deals: {
    defaultCurrency: 'USD',
    defaultView: 'board',
    defaultProbability: 25,
    staleDealThresholdDays: 14,
    requireExpectedCloseDate: true,
    requireContactOrCompany: true,
    requireLostReason: true,
    celebrateWonDeals: true,
  },
  pipelines: {
    defaultViewMode: 'board',
    enforceSequentialStageMovement: false,
    autoUpdateProbabilityByStage: true,
    showWeightedValueOnCards: true,
    rottingDealDaysWarning: 21,
    allowMultiplePipelines: true,
  },
  activities: {
    defaultActivityType: 'CALL',
    defaultPriority: 'MEDIUM',
    defaultReminderMinutes: 15,
    defaultCallDurationMinutes: 30,
    defaultMeetingDurationMinutes: 45,
    autoCompletePastMeetings: false,
    createFollowUpTaskOnMissedCall: true,
    syncActivitiesToCalendar: true,
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    notifyOnNewLeadAssigned: true,
    notifyOnDealWonOrLost: true,
    notifyOnActivityOverdue: true,
    notifyOnMentionInComment: true,
    dailyAgendaSummary: true,
    weeklyPerformanceDigest: true,
  },
  email: {
    senderDisplayName: 'Acme CRM Sales Team',
    replyToEmail: 'sales@acme.example.com',
    bccComplianceAddress: 'archive@acme.example.com',
    defaultSignatureHtml:
      'Best regards,\nAcme Revenue Team\nhttps://acme.example.com',
    trackEmailOpens: true,
    trackLinkClicks: true,
    autoLinkEmailsToContacts: true,
    dailySendLimitPerUser: 500,
  },
  integrations: {
    googleWorkspaceConnected: true,
    microsoft365Connected: false,
    slackWebhookEnabled: true,
    slackChannelName: '#crm-deal-alerts',
    whatsappBusinessEnabled: true,
    zapierWebhooksEnabled: false,
    webhookEndpointUrl: 'https://hooks.acme.example.com/crm-events',
    syncIntervalMinutes: 15,
  },
  security: {
    enforceTwoFactor: false,
    sessionTimeoutMinutes: 1440,
    passwordMinLength: 8,
    requireSpecialCharacters: true,
    allowedEmailDomains: 'acme.com, acme.example.com',
    ipAllowlist: '',
    notifyOnNewDeviceLogin: true,
    allowDataExportForNonAdmins: false,
  },
};

export const TIMEZONE_SELECT_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
];

export const CURRENCY_SELECT_OPTIONS = [
  { value: 'USD', label: 'USD ($) — US Dollar' },
  { value: 'EUR', label: 'EUR (€) — Euro' },
  { value: 'GBP', label: 'GBP (£) — British Pound' },
  { value: 'INR', label: 'INR (₹) — Indian Rupee' },
  { value: 'CAD', label: 'CAD ($) — Canadian Dollar' },
  { value: 'AUD', label: 'AUD ($) — Australian Dollar' },
  { value: 'JPY', label: 'JPY (¥) — Japanese Yen' },
];

export const LANGUAGE_SELECT_OPTIONS = [
  { value: 'en', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
];

