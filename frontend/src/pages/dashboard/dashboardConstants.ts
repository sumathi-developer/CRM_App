import type {
  AnalyticsInterval,
  AnalyticsTimeframe,
  CustomWidgetConfig,
  DashboardScreenSlug,
} from '../../types/dashboard.types';

export interface DashboardScreenMeta {
  slug: DashboardScreenSlug;
  label: string;
  shortLabel: string;
  path: string;
  subtitle: string;
}

export const DASHBOARD_SCREEN_META: Record<
  DashboardScreenSlug,
  DashboardScreenMeta
> = {
  overview: {
    slug: 'overview',
    label: 'Overview Dashboard',
    shortLabel: 'Overview',
    path: '/dashboard',
    subtitle:
      'Executive CRM summary across revenue, sales velocity, lead conversion funnel, active pipeline, and recent activity.',
  },
  sales: {
    slug: 'sales',
    label: 'Sales Dashboard',
    shortLabel: 'Sales',
    path: '/dashboard/sales',
    subtitle:
      'Deal velocity, win rate, average deal size, sales cycle duration, pipeline stage distribution, and recent opportunities.',
  },
  leads: {
    slug: 'leads',
    label: 'Lead Dashboard',
    shortLabel: 'Leads',
    path: '/dashboard/leads',
    subtitle:
      'Lead acquisition volume, qualification & conversion rates, channel attribution, full-funnel leakage, and top scoring leads.',
  },
  revenue: {
    slug: 'revenue',
    label: 'Revenue Dashboard',
    shortLabel: 'Revenue',
    path: '/dashboard/revenue',
    subtitle:
      'Closed-won revenue, probability-weighted pipeline forecast, revenue trends over time, and highest-value won deals.',
  },
  teams: {
    slug: 'teams',
    label: 'Team Performance',
    shortLabel: 'Team Performance',
    path: '/dashboard/teams',
    subtitle:
      'Compare sales teams, monitor representative leaderboards, and inspect completed sales activities by team and rep.',
  },
  custom: {
    slug: 'custom',
    label: 'Custom Dashboard',
    shortLabel: 'Custom Dashboard',
    path: '/dashboard/custom',
    subtitle:
      'Personalize your workspace view by toggling, rearranging, and resizing CRM KPI, chart, pipeline, and record widgets.',
  },
};

export const TIMEFRAME_OPTIONS: Array<{
  value: AnalyticsTimeframe;
  label: string;
}> = [
  { value: 'TODAY', label: 'Today' },
  { value: 'YESTERDAY', label: 'Yesterday' },
  { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
  { value: 'LAST_30_DAYS', label: 'Last 30 Days' },
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'LAST_MONTH', label: 'Last Month' },
  { value: 'THIS_QUARTER', label: 'This Quarter' },
  { value: 'THIS_YEAR', label: 'This Year' },
  { value: 'CUSTOM', label: 'Custom Range' },
];

export const INTERVAL_OPTIONS: Array<{
  value: AnalyticsInterval;
  label: string;
}> = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
];

export const DEFAULT_CUSTOM_WIDGETS: CustomWidgetConfig[] = [
  {
    id: 'kpi_summary',
    title: 'Executive KPI Cards',
    description: 'Core CRM KPIs with period-over-period trend indicators.',
    category: 'KPIs & Revenue',
    enabled: true,
    span: 'full',
  },
  {
    id: 'revenue_summary',
    title: 'Revenue Summary & Trend',
    description: 'Closed-won revenue, weighted forecast, and revenue time-series.',
    category: 'KPIs & Revenue',
    enabled: true,
    span: 'half',
  },
  {
    id: 'pipeline_summary',
    title: 'Pipeline Stage Summary',
    description: 'Deal counts, stage values, and weighted probabilities across stages.',
    category: 'Pipeline & Leads',
    enabled: true,
    span: 'half',
  },
  {
    id: 'lead_funnel',
    title: 'Lead Conversion Funnel',
    description: 'Stage-by-stage progression from generated leads to won deals.',
    category: 'Pipeline & Leads',
    enabled: true,
    span: 'half',
  },
  {
    id: 'lead_sources',
    title: 'Lead Source Attribution',
    description: 'Lead acquisition channels, conversion rates, and attributed value.',
    category: 'Pipeline & Leads',
    enabled: true,
    span: 'half',
  },
  {
    id: 'recent_deals',
    title: 'Recent Deals',
    description: 'Latest and highest-value sales opportunities with direct links.',
    category: 'Activities & Records',
    enabled: true,
    span: 'half',
  },
  {
    id: 'recent_leads',
    title: 'Recent Leads',
    description: 'Newly captured and high-scoring leads ready for follow-up.',
    category: 'Activities & Records',
    enabled: true,
    span: 'half',
  },
  {
    id: 'recent_activities',
    title: 'Recent Activities',
    description: 'Recent calls, meetings, emails, and tasks across your team.',
    category: 'Activities & Records',
    enabled: true,
    span: 'half',
  },
  {
    id: 'activity_breakdown',
    title: 'Activity Type & Priority Breakdown',
    description: 'Distribution of calls, meetings, emails, and task priorities.',
    category: 'Activities & Records',
    enabled: false,
    span: 'half',
  },
  {
    id: 'team_leaderboard',
    title: 'Team & Rep Performance Leaderboard',
    description: 'Top-performing teams and sales representatives ranked by revenue.',
    category: 'Team',
    enabled: true,
    span: 'full',
  },
];

export const CUSTOM_WIDGETS_STORAGE_KEY = 'crm_custom_dashboard_widgets_v1';

export function formatLeadDisplayName(lead: {
  title?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
}): string {
  const fullName = [lead.firstName, lead.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (lead.title && fullName) return `${lead.title} (${fullName})`;
  return lead.title || fullName || lead.company || lead.email || 'Untitled Lead';
}

