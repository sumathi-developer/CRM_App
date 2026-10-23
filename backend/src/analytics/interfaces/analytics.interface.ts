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
  conversionRate: number; // % of total or previous stage
  dropOffRate: number; // % lost
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

export interface AnalyticsOverview {
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
