export type AnalyticsScreenSlug =
  | 'sales'
  | 'leads'
  | 'lead-sources'
  | 'pipeline'
  | 'revenue'
  | 'conversion'
  | 'activities'
  | 'teams'
  | 'performance';

export interface AnalyticsScreenMeta {
  slug: AnalyticsScreenSlug;
  label: string;
  shortLabel: string;
  path: string;
  subtitle: string;
}

export const ANALYTICS_SCREEN_META: Record<
  AnalyticsScreenSlug,
  AnalyticsScreenMeta
> = {
  sales: {
    slug: 'sales',
    label: 'Sales Analytics',
    shortLabel: 'Sales',
    path: '/analytics/sales',
    subtitle:
      'Analyze deal volume, win rates, average deal size, sales cycle length, daily sales velocity, and time-series progression.',
  },
  leads: {
    slug: 'leads',
    label: 'Lead Analytics',
    shortLabel: 'Leads',
    path: '/analytics/leads',
    subtitle:
      'Track lead acquisition volume, qualification and conversion rates, average lead scores, status distribution, and period trends.',
  },
  'lead-sources': {
    slug: 'lead-sources',
    label: 'Lead Source Analytics',
    shortLabel: 'Lead Sources',
    path: '/analytics/lead-sources',
    subtitle:
      'Evaluate acquisition channels by lead volume, conversion rate, average lead quality score, and attributed pipeline revenue.',
  },
  pipeline: {
    slug: 'pipeline',
    label: 'Pipeline Analytics',
    shortLabel: 'Pipeline',
    path: '/analytics/pipeline',
    subtitle:
      'Inspect stage-by-stage opportunity distribution, win probabilities, total stage values, and probability-weighted forecasts.',
  },
  revenue: {
    slug: 'revenue',
    label: 'Revenue Analytics',
    shortLabel: 'Revenue',
    path: '/analytics/revenue',
    subtitle:
      'Monitor closed-won revenue, active pipeline value, weighted revenue projections, average revenue per deal, and period comparisons.',
  },
  conversion: {
    slug: 'conversion',
    label: 'Conversion Analytics',
    shortLabel: 'Conversion',
    path: '/analytics/conversion',
    subtitle:
      'Examine stage-by-stage funnel conversion rates, stage drop-off percentages, and full-funnel leakage from lead to won customer.',
  },
  activities: {
    slug: 'activities',
    label: 'Activity Analytics',
    shortLabel: 'Activities',
    path: '/analytics/activities',
    subtitle:
      'Measure sales activity volume, completion rates, activity type breakdowns (calls, meetings, emails, follow-ups), and priority levels.',
  },
  teams: {
    slug: 'teams',
    label: 'Team Analytics',
    shortLabel: 'Teams',
    path: '/analytics/teams',
    subtitle:
      'Compare sales teams across lead volume, deal creation, deals won, win rates, completed activities, and closed revenue.',
  },
  performance: {
    slug: 'performance',
    label: 'Performance Analytics',
    shortLabel: 'Performance',
    path: '/analytics/performance',
    subtitle:
      'Rank and compare individual sales representatives by revenue won, deals closed, win rate, average deal size, and activity output.',
  },
};

export const LEAD_SOURCE_FILTER_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: '', label: 'All Lead Sources' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'EMAIL_CAMPAIGN', label: 'Email Campaign' },
  { value: 'PAID_ADS', label: 'Paid Ads' },
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'EVENT', label: 'Event / Trade Show' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'OTHER', label: 'Other' },
];

export const PERFORMANCE_SORT_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: 'REVENUE', label: 'Total Revenue Won' },
  { value: 'DEALS_WON', label: 'Deals Won Count' },
  { value: 'WIN_RATE', label: 'Win Rate (%)' },
  { value: 'ACTIVITIES', label: 'Activities Completed' },
  { value: 'DEALS_CREATED', label: 'Deals Created' },
];

