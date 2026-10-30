export type DashboardScreenSlug =
  | 'overview'
  | 'sales'
  | 'leads'
  | 'revenue'
  | 'teams'
  | 'custom';

export type AnalyticsTimeframe =
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'CUSTOM';

export type AnalyticsInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';

export type TrendDirection = 'UP' | 'DOWN' | 'FLAT';

export interface MetricWithTrend {
  current: number;
  previous: number;
  change: number;
  percentage: number;
  direction: TrendDirection;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  value: number;
  count?: number;
  secondaryValue?: number;
}

export interface ConversionStage {
  stage: string;
  name: string;
  count: number;
  value: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface LeadSourceMetric {
  source: string;
  count: number;
  convertedCount: number;
  conversionRate: number;
  revenue: number;
  avgLeadScore: number;
  percentageOfTotal: number;
}

export interface PipelineStageMetric {
  stageId: string;
  stageName: string;
  order: number;
  color?: string;
  dealCount: number;
  totalValue: number;
  weightedValue: number;
  winProbability: number;
  avgDaysInStage?: number;
}

export interface TeamMetric {
  teamId: string;
  teamName: string;
  leaderName?: string;
  memberCount: number;
  leadsCount: number;
  dealsCount: number;
  dealsWon: number;
  winRate: number;
  totalRevenue: number;
  activitiesCount: number;
}

export interface RepPerformanceMetric {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  leadsAssigned: number;
  dealsCreated: number;
  dealsWon: number;
  winRate: number;
  totalRevenue: number;
  avgDealSize: number;
  activitiesCompleted: number;
  rank: number;
}

export interface DashboardQueryFilters {
  timeframe?: AnalyticsTimeframe;
  interval?: AnalyticsInterval;
  dateFrom?: string;
  dateTo?: string;
  workspaceId?: string;
  teamId?: string;
  userId?: string;
  pipelineId?: string;
}

export interface OverviewAnalyticsResponse {
  period: {
    startDate: string;
    endDate: string;
    timeframe: string;
    interval: string;
  };
  kpis: {
    totalRevenue: MetricWithTrend;
    dealsWon: MetricWithTrend;
    winRate: MetricWithTrend;
    avgDealSize: MetricWithTrend;
    newLeads: MetricWithTrend;
    leadConversionRate: MetricWithTrend;
    activePipelineValue: MetricWithTrend;
    activitiesCompleted: MetricWithTrend;
  };
  revenueTimeSeries: TimeSeriesPoint[];
  leadsTimeSeries: TimeSeriesPoint[];
  topLeadSources: LeadSourceMetric[];
  funnelSummary: ConversionStage[];
}

export interface SalesAnalyticsResponse {
  timeframe: string;
  interval: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  kpis: {
    totalDeals: MetricWithTrend;
    wonDeals: MetricWithTrend;
    winRate: MetricWithTrend;
    totalRevenue: MetricWithTrend;
    avgDealSize: MetricWithTrend;
    openDealsCount: number;
    lostDealsCount: number;
    avgSalesCycleDays: number;
    salesVelocityPerDay: number;
  };
  timeSeries: TimeSeriesPoint[];
}

export interface RevenueAnalyticsResponse {
  timeframe: string;
  interval: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    closedWonRevenue: MetricWithTrend;
    activePipelineValue: number;
    weightedForecastRevenue: number;
    dealsWonCount: number;
    avgRevenuePerDeal: number;
  };
  timeSeries: TimeSeriesPoint[];
}

export interface PipelineAnalyticsResponse {
  pipelineId: string | null;
  pipelineName: string;
  totalPipelineValue: number;
  totalWeightedValue: number;
  totalDeals: number;
  stages: PipelineStageMetric[];
}

export interface LeadAnalyticsResponse {
  timeframe: string;
  interval: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  kpis: {
    totalLeads: MetricWithTrend;
    convertedLeads: MetricWithTrend;
    conversionRate: MetricWithTrend;
    qualificationRate: MetricWithTrend;
    avgLeadScore: number;
    statusBreakdown: Record<string, number>;
  };
  timeSeries: TimeSeriesPoint[];
}

export interface LeadSourceAnalyticsResponse {
  totalLeads: number;
  sourcesCount: number;
  topPerformingSource: string | null;
  sources: LeadSourceMetric[];
}

export interface ConversionFunnelResponse {
  totalLeads: number;
  totalDealsWon: number;
  overallConversionRate: number;
  stages: ConversionStage[];
}

export interface ActivityAnalyticsResponse {
  timeframe: string;
  interval: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  kpis: {
    totalActivities: MetricWithTrend;
    completedActivities: MetricWithTrend;
    completionRate: MetricWithTrend;
    pendingCount: number;
    cancelledCount: number;
  };
  breakdowns: {
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  };
  timeSeries: TimeSeriesPoint[];
}

export interface TeamAnalyticsResponse {
  totalTeams: number;
  teams: TeamMetric[];
}

export interface RepPerformanceResponse {
  items: RepPerformanceMetric[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardRecentLead {
  id: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  status: string;
  source?: string;
  leadScore?: number;
  estimatedValue?: number;
  owner?: { id: string; name: string };
  createdAt?: string;
}

export interface DashboardRecentDeal {
  id: string;
  title: string;
  value: number;
  currency?: string;
  status: string;
  probability?: number;
  stage?: { id: string; name: string; color?: string };
  owner?: { id: string; name: string };
  organization?: { id: string; name: string };
  contact?: { id: string; firstName: string; lastName: string };
  expectedCloseDate?: string;
  createdAt?: string;
}

export interface DashboardRecentActivity {
  id: string;
  type: string;
  subject: string;
  description?: string;
  status: string;
  priority?: string;
  scheduledAt?: string;
  createdAt?: string;
  assignedTo?: { id?: string; name: string };
  contact?: { id?: string; firstName: string; lastName: string };
  lead?: { id: string; title?: string; firstName?: string; lastName?: string };
  deal?: { id: string; title: string };
}

export interface DashboardLookupOption {
  id: string;
  name: string;
  subtitle?: string;
}

export type CustomWidgetId =
  | 'kpi_summary'
  | 'revenue_summary'
  | 'pipeline_summary'
  | 'lead_funnel'
  | 'lead_sources'
  | 'activity_breakdown'
  | 'recent_deals'
  | 'recent_leads'
  | 'recent_activities'
  | 'team_leaderboard';

export interface CustomWidgetConfig {
  id: CustomWidgetId;
  title: string;
  description: string;
  category: 'KPIs & Revenue' | 'Pipeline & Leads' | 'Activities & Records' | 'Team';
  enabled: boolean;
  span: 'full' | 'half';
}

