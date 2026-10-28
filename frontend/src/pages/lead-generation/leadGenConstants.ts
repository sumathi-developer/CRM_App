import type {
  LeadSourceType,
  FormType,
  FormStatus,
  ScoringCategory,
  RuleOperator,
  RoutingStrategy,
  ChannelKey,
} from '../../types/lead-generation.types';

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export const SOURCE_TYPE_OPTIONS: Option<LeadSourceType>[] = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'LANDING_PAGE', label: 'Landing Page' },
  { value: 'CAMPAIGN', label: 'Campaign' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'PAID_SEARCH', label: 'Paid Search' },
  { value: 'EVENT', label: 'Event' },
  { value: 'OTHER', label: 'Other' },
];

export const FORM_TYPE_OPTIONS: Option<FormType>[] = [
  { value: 'WEB_FORM', label: 'Web Form' },
  { value: 'LANDING_PAGE', label: 'Landing Page' },
  { value: 'POPUP', label: 'Popup' },
  { value: 'EMBEDDED', label: 'Embedded' },
];

export const FORM_STATUS_OPTIONS: Option<FormStatus>[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export const FIELD_TYPE_OPTIONS: Option[] = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Dropdown' },
  { value: 'number', label: 'Number' },
  { value: 'checkbox', label: 'Checkbox' },
];

export const DUPLICATE_HANDLING_OPTIONS: Option[] = [
  { value: 'UPDATE', label: 'Update existing lead' },
  { value: 'MERGE', label: 'Merge into existing lead' },
  { value: 'ALLOW', label: 'Allow duplicates' },
  { value: 'REJECT', label: 'Reject duplicates' },
];

export const SCORING_CATEGORY_OPTIONS: Option<ScoringCategory>[] = [
  { value: 'DEMOGRAPHIC', label: 'Demographic' },
  { value: 'FIRMOGRAPHIC', label: 'Firmographic' },
  { value: 'BEHAVIORAL', label: 'Behavioral' },
  { value: 'SOURCE', label: 'Source' },
];

export const OPERATOR_OPTIONS: Option<RuleOperator>[] = [
  { value: 'EQUALS', label: 'Equals' },
  { value: 'NOT_EQUALS', label: 'Does not equal' },
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'NOT_CONTAINS', label: 'Does not contain' },
  { value: 'GREATER_THAN', label: 'Greater than / equal' },
  { value: 'LESS_THAN', label: 'Less than / equal' },
  { value: 'IN', label: 'Is one of (comma list)' },
  { value: 'NOT_EMPTY', label: 'Is not empty' },
  { value: 'REGEX', label: 'Matches pattern' },
];

/** Operators the qualification/assignment condition builders support. */
export const CONDITION_OPERATOR_OPTIONS: Option[] = [
  { value: 'EQUALS', label: 'Equals' },
  { value: 'NOT_EQUALS', label: 'Does not equal' },
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'GREATER_THAN', label: 'Greater than / equal' },
  { value: 'LESS_THAN', label: 'Less than / equal' },
  { value: 'NOT_EMPTY', label: 'Is not empty' },
];

export const SCORING_FIELD_OPTIONS: Option[] = [
  { value: 'jobTitle', label: 'Job title' },
  { value: 'companyName', label: 'Company name' },
  { value: 'email', label: 'Email' },
  { value: 'estimatedValue', label: 'Estimated value' },
  { value: 'channel', label: 'Channel' },
  { value: 'source', label: 'Source' },
  { value: 'phone', label: 'Phone' },
  { value: 'country', label: 'Country' },
];

export const CONDITION_FIELD_OPTIONS: Option[] = [
  { value: 'estimatedValue', label: 'Estimated value' },
  { value: 'leadScore', label: 'Lead score' },
  { value: 'companyName', label: 'Company name' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'channel', label: 'Channel' },
  { value: 'source', label: 'Source' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'medium', label: 'Medium' },
];

export const ROUTING_STRATEGY_OPTIONS: Option<RoutingStrategy>[] = [
  { value: 'ROUND_ROBIN', label: 'Round robin' },
  { value: 'LOAD_BALANCED', label: 'Load balanced' },
  { value: 'SOURCE_BASED', label: 'Source based' },
  { value: 'SPECIFIC_USER', label: 'Specific user' },
];

export const QUALIFICATION_STATUS_OPTIONS: Option[] = [
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'UNQUALIFIED', label: 'Unqualified' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'REVIEW_REQUIRED', label: 'Review required' },
];

export const LEAD_STATUS_OPTIONS: Option[] = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'UNQUALIFIED', label: 'Unqualified' },
  { value: 'CONVERTED', label: 'Converted' },
];

export const SUBMISSION_STATUS_OPTIONS: Option[] = [
  { value: 'PROCESSED', label: 'Processed' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'DUPLICATE', label: 'Duplicate' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'FAILED', label: 'Failed' },
];

export const MANUAL_CHANNEL_OPTIONS: Option[] = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'LANDING_PAGE', label: 'Landing Page' },
  { value: 'CAMPAIGN', label: 'Campaign' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'EVENT', label: 'Event' },
  { value: 'OTHER', label: 'Other' },
];

export interface ChannelConfig {
  key: ChannelKey;
  path: string;
  label: string;
  title: string;
  description: string;
}

export const CHANNELS: ChannelConfig[] = [
  {
    key: 'landing-page',
    path: 'landing-page',
    label: 'Landing Page',
    title: 'Landing Page Leads',
    description: 'Leads captured through dedicated conversion landing pages.',
  },
  {
    key: 'campaign',
    path: 'campaign',
    label: 'Campaign',
    title: 'Campaign Leads',
    description: 'Leads generated via marketing campaigns, UTM tracking and paid ads.',
  },
  {
    key: 'social',
    path: 'social',
    label: 'Social Media',
    title: 'Social Media Leads',
    description: 'Leads originating from LinkedIn, Facebook, X, Instagram and other networks.',
  },
  {
    key: 'website',
    path: 'website',
    label: 'Website',
    title: 'Website Leads',
    description: 'Organic visitors, contact forms and widgets on your website.',
  },
  {
    key: 'email',
    path: 'email',
    label: 'Email',
    title: 'Email Leads',
    description: 'Leads from newsletters, email campaigns and inbound email inquiries.',
  },
  {
    key: 'referral',
    path: 'referral',
    label: 'Referral',
    title: 'Referral Leads',
    description: 'Partner, affiliate and customer referral leads.',
  },
  {
    key: 'manual',
    path: 'manual',
    label: 'Manual',
    title: 'Manually Captured Leads',
    description: 'Leads entered directly by your sales team.',
  },
];

export const CHANNEL_LABELS: Record<string, string> = {
  WEBSITE: 'Website',
  LANDING_PAGE: 'Landing Page',
  CAMPAIGN: 'Campaign',
  SOCIAL_MEDIA: 'Social Media',
  EMAIL: 'Email',
  REFERRAL: 'Referral',
  MANUAL: 'Manual',
  PAID_SEARCH: 'Paid Search',
  EVENT: 'Event',
  OTHER: 'Other',
  ADVERTISING: 'Advertising',
  COLD_OUTREACH: 'Cold Outreach',
};

export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate' | 'cyan';

export function toneForStatus(status?: string | null): Tone {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
    case 'PUBLISHED':
    case 'QUALIFIED':
    case 'CONVERTED':
    case 'PROCESSED':
      return 'green';
    case 'NEW':
    case 'CONTACTED':
    case 'PENDING':
      return 'blue';
    case 'DRAFT':
    case 'DUPLICATE':
    case 'REVIEW_REQUIRED':
      return 'amber';
    case 'UNQUALIFIED':
    case 'SPAM':
    case 'FAILED':
      return 'red';
    case 'INACTIVE':
    case 'ARCHIVED':
      return 'slate';
    default:
      return 'slate';
  }
}

export function labelFor(options: Option[], value?: string | null): string {
  if (!value) return '—';
  return options.find((o) => o.value === value)?.label || value.replace(/_/g, ' ');
}

export function humanize(value?: string | null): string {
  if (!value) return '—';
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatCurrency(value?: number | null): string {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function formatNumber(value?: number | null): string {
  return Number(value || 0).toLocaleString();
}

export function formatPercent(value?: number | null): string {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function fullName(first?: string | null, last?: string | null, fallback = '—'): string {
  const name = `${first || ''} ${last || ''}`.trim();
  return name || fallback;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
