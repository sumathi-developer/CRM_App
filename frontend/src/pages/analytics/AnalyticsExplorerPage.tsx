import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../../context/useWorkspace';
import { dashboardService } from '../../services/dashboard.service';
import type {
  ActivityAnalyticsResponse,
  ConversionFunnelResponse,
  ConversionStage,
  DashboardLookupOption,
  DashboardQueryFilters,
  LeadAnalyticsResponse,
  LeadSourceAnalyticsResponse,
  LeadSourceMetric,
  MetricWithTrend,
  PipelineAnalyticsResponse,
  PipelineStageMetric,
  RepPerformanceMetric,
  RepPerformanceResponse,
  RevenueAnalyticsResponse,
  SalesAnalyticsResponse,
  TeamAnalyticsResponse,
  TeamMetric,
  TimeSeriesPoint,
} from '../../types/dashboard.types';
import {
  ANALYTICS_SCREEN_META,
  type AnalyticsScreenSlug,
} from './analyticsConstants';
import { AnalyticsLayout } from './components/AnalyticsLayout';
import { AnalyticsFilterBar } from './components/AnalyticsFilterBar';
import {
  DashboardKpiCard,
  DashboardSkeleton,
  PipelineSummaryWidget,
  RevenueSummaryWidget,
} from '../dashboard/components/DashboardWidgets';
import {
  Badge,
  ScorePill,
  SectionCard,
} from '../lead-generation/components/Cards';
import {
  BarList,
  DonutChart,
  Funnel,
  LineChart,
} from '../lead-generation/components/Charts';
import { DataTable, type Column } from '../lead-generation/components/DataTable';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  humanize,
} from '../lead-generation/leadGenConstants';
import {
  ActivityIcon,
  AwardIcon,
  BarChart2Icon,
  BriefcaseIcon,
  CheckCircleIcon,
  DollarSignIcon,
  TargetIcon,
  TrendingUpIcon,
  UsersIcon,
} from '../../components/common/Icons';

interface AnalyticsExplorerPageProps {
  screen: AnalyticsScreenSlug;
}

interface ComparisonRow {
  metric: string;
  currentFormatted: string;
  previousFormatted: string;
  deltaFormatted: string;
  percentage: number;
  direction: 'UP' | 'DOWN' | 'FLAT';
}

function buildComparisonRow(
  metricName: string,
  m: MetricWithTrend | undefined,
  formatter: (n: number) => string = formatNumber,
): ComparisonRow {
  const current = Number(m?.current ?? 0);
  const previous = Number(m?.previous ?? 0);
  const change = Number(m?.change ?? current - previous);
  const percentage = Number(m?.percentage ?? 0);
  const direction = m?.direction || 'FLAT';
  const sign = change > 0 ? '+' : '';

  return {
    metric: metricName,
    currentFormatted: formatter(current),
    previousFormatted: formatter(previous),
    deltaFormatted: `${sign}${formatter(change)}`,
    percentage,
    direction,
  };
}

const COMPARISON_COLUMNS: Column<ComparisonRow>[] = [
  {
    key: 'metric',
    header: 'Analytics Metric',
    render: (r) => <strong className="text-gray-900">{r.metric}</strong>,
  },
  {
    key: 'current',
    header: 'Current Period',
    align: 'right',
    render: (r) => (
      <span className="font-bold text-gray-900">{r.currentFormatted}</span>
    ),
  },
  {
    key: 'previous',
    header: 'Previous Period',
    align: 'right',
    render: (r) => <span className="text-gray-600">{r.previousFormatted}</span>,
  },
  {
    key: 'delta',
    header: 'Net Change',
    align: 'right',
    render: (r) => <span className="font-medium">{r.deltaFormatted}</span>,
  },
  {
    key: 'pct',
    header: 'Period Comparison',
    align: 'right',
    render: (r) => (
      <Badge
        tone={
          r.direction === 'UP'
            ? 'green'
            : r.direction === 'DOWN'
              ? 'red'
              : 'slate'
        }
      >
        {r.direction === 'UP' ? '↑ ' : r.direction === 'DOWN' ? '↓ ' : '→ '}
        {Math.abs(r.percentage).toFixed(1)}%
      </Badge>
    ),
  },
];

const TIMESERIES_COLUMNS: Column<TimeSeriesPoint>[] = [
  {
    key: 'label',
    header: 'Period Bucket',
    render: (pt) => <strong>{pt.label || pt.date}</strong>,
  },
  {
    key: 'date',
    header: 'ISO Date Key',
    render: (pt) => <span className="text-gray-500">{pt.date}</span>,
  },
  {
    key: 'value',
    header: 'Primary Value',
    align: 'right',
    render: (pt) => (
      <span className="font-bold text-gray-900">{formatNumber(pt.value)}</span>
    ),
  },
  {
    key: 'count',
    header: 'Record Count',
    align: 'right',
    render: (pt) =>
      pt.count !== undefined ? formatNumber(pt.count) : <span>—</span>,
  },
  {
    key: 'secondary',
    header: 'Secondary / Comparison Metric',
    align: 'right',
    render: (pt) =>
      pt.secondaryValue !== undefined ? (
        formatNumber(pt.secondaryValue)
      ) : (
        <span>—</span>
      ),
  },
];

const LEAD_SOURCE_COLUMNS: Column<LeadSourceMetric>[] = [
  {
    key: 'source',
    header: 'Lead Source',
    render: (s) => (
      <div className="flex items-center gap-2">
        <Badge tone="purple">{humanize(s.source)}</Badge>
      </div>
    ),
  },
  {
    key: 'count',
    header: 'Leads Captured',
    align: 'right',
    render: (s) => <strong>{formatNumber(s.count)}</strong>,
  },
  {
    key: 'share',
    header: 'Share of Volume',
    align: 'right',
    render: (s) => formatPercent(s.percentageOfTotal),
  },
  {
    key: 'converted',
    header: 'Converted Leads',
    align: 'right',
    render: (s) => formatNumber(s.convertedCount),
  },
  {
    key: 'convRate',
    header: 'Conversion Rate',
    align: 'right',
    render: (s) => (
      <Badge tone={s.conversionRate >= 20 ? 'green' : 'amber'}>
        {formatPercent(s.conversionRate)}
      </Badge>
    ),
  },
  {
    key: 'score',
    header: 'Avg Lead Score',
    align: 'right',
    render: (s) => <ScorePill score={s.avgLeadScore} />,
  },
  {
    key: 'revenue',
    header: 'Attributed Value',
    align: 'right',
    render: (s) => (
      <span className="font-bold text-gray-900">
        {formatCurrency(s.revenue)}
      </span>
    ),
  },
];

const PIPELINE_STAGE_COLUMNS: Column<PipelineStageMetric>[] = [
  {
    key: 'stage',
    header: 'Pipeline Stage',
    render: (st) => (
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: st.color || '#3b82f6' }}
        />
        <Link
          to={`/deals?stageId=${st.stageId}`}
          className="font-bold text-gray-900 hover:text-blue-600"
        >
          {st.stageName}
        </Link>
      </div>
    ),
  },
  {
    key: 'order',
    header: 'Stage Order',
    align: 'right',
    render: (st) => `#${st.order}`,
  },
  {
    key: 'deals',
    header: 'Active Deals',
    align: 'right',
    render: (st) => <strong>{formatNumber(st.dealCount)}</strong>,
  },
  {
    key: 'prob',
    header: 'Win Probability',
    align: 'right',
    render: (st) => <Badge tone="blue">{formatPercent(st.winProbability)}</Badge>,
  },
  {
    key: 'total',
    header: 'Total Stage Value',
    align: 'right',
    render: (st) => (
      <span className="font-bold text-gray-900">
        {formatCurrency(st.totalValue)}
      </span>
    ),
  },
  {
    key: 'weighted',
    header: 'Weighted Forecast',
    align: 'right',
    render: (st) => (
      <span className="font-semibold text-emerald-700">
        {formatCurrency(st.weightedValue)}
      </span>
    ),
  },
];

const CONVERSION_STAGE_COLUMNS: Column<ConversionStage>[] = [
  {
    key: 'name',
    header: 'Funnel Stage',
    render: (st) => (
      <div>
        <strong className="text-gray-900">{st.name}</strong>
        <span className="ml-2 text-xs text-gray-400">({st.stage})</span>
      </div>
    ),
  },
  {
    key: 'count',
    header: 'Record Volume',
    align: 'right',
    render: (st) => <strong>{formatNumber(st.count)}</strong>,
  },
  {
    key: 'value',
    header: 'Stage Value',
    align: 'right',
    render: (st) => formatCurrency(st.value),
  },
  {
    key: 'conversion',
    header: 'Cumulative Conversion',
    align: 'right',
    render: (st) => (
      <Badge tone={st.conversionRate >= 25 ? 'green' : 'blue'}>
        {formatPercent(st.conversionRate)}
      </Badge>
    ),
  },
  {
    key: 'dropoff',
    header: 'Stage Drop-Off / Leakage',
    align: 'right',
    render: (st) => (
      <Badge tone={st.dropOffRate > 50 ? 'red' : 'amber'}>
        {formatPercent(st.dropOffRate)}
      </Badge>
    ),
  },
];

const TEAM_ANALYTICS_COLUMNS: Column<TeamMetric>[] = [
  {
    key: 'team',
    header: 'Sales Team',
    render: (t) => (
      <div>
        <Link
          to={`/teams/${t.teamId}/performance`}
          className="font-bold text-gray-900 hover:text-blue-600"
        >
          {t.teamName}
        </Link>
        {t.leaderName && (
          <p className="text-[11px] text-gray-400">Leader: {t.leaderName}</p>
        )}
      </div>
    ),
  },
  {
    key: 'members',
    header: 'Members',
    align: 'right',
    render: (t) => formatNumber(t.memberCount),
  },
  {
    key: 'leads',
    header: 'Leads Assigned',
    align: 'right',
    render: (t) => formatNumber(t.leadsCount),
  },
  {
    key: 'deals',
    header: 'Deals Created',
    align: 'right',
    render: (t) => formatNumber(t.dealsCount),
  },
  {
    key: 'won',
    header: 'Deals Won',
    align: 'right',
    render: (t) => <strong>{formatNumber(t.dealsWon)}</strong>,
  },
  {
    key: 'winRate',
    header: 'Win Rate',
    align: 'right',
    render: (t) => (
      <Badge tone={t.winRate >= 40 ? 'green' : 'amber'}>
        {formatPercent(t.winRate)}
      </Badge>
    ),
  },
  {
    key: 'activities',
    header: 'Activities',
    align: 'right',
    render: (t) => formatNumber(t.activitiesCount),
  },
  {
    key: 'revenue',
    header: 'Closed Revenue',
    align: 'right',
    render: (t) => (
      <span className="font-bold text-gray-900">
        {formatCurrency(t.totalRevenue)}
      </span>
    ),
  },
];

const REP_PERFORMANCE_COLUMNS: Column<RepPerformanceMetric>[] = [
  {
    key: 'rank',
    header: 'Rank',
    render: (r) => (
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          r.rank === 1
            ? 'bg-amber-100 text-amber-800'
            : r.rank === 2
              ? 'bg-gray-200 text-gray-800'
              : r.rank === 3
                ? 'bg-orange-100 text-orange-800'
                : 'bg-blue-50 text-blue-700'
        }`}
      >
        #{r.rank}
      </span>
    ),
  },
  {
    key: 'rep',
    header: 'Sales Representative',
    render: (r) => (
      <div>
        <Link
          to={`/users/${r.userId}/performance`}
          className="font-bold text-gray-900 hover:text-blue-600"
        >
          {r.name}
        </Link>
        <p className="text-[11px] text-gray-400">
          {r.email} {r.role ? `• ${r.role}` : ''}
        </p>
      </div>
    ),
  },
  {
    key: 'leads',
    header: 'Leads Assigned',
    align: 'right',
    render: (r) => formatNumber(r.leadsAssigned),
  },
  {
    key: 'dealsCreated',
    header: 'Deals Created',
    align: 'right',
    render: (r) => formatNumber(r.dealsCreated),
  },
  {
    key: 'dealsWon',
    header: 'Deals Won',
    align: 'right',
    render: (r) => <strong>{formatNumber(r.dealsWon)}</strong>,
  },
  {
    key: 'winRate',
    header: 'Win Rate',
    align: 'right',
    render: (r) => (
      <Badge tone={r.winRate >= 40 ? 'green' : 'slate'}>
        {formatPercent(r.winRate)}
      </Badge>
    ),
  },
  {
    key: 'avgDeal',
    header: 'Avg Deal Size',
    align: 'right',
    render: (r) => formatCurrency(r.avgDealSize),
  },
  {
    key: 'activities',
    header: 'Completed Activities',
    align: 'right',
    render: (r) => formatNumber(r.activitiesCompleted),
  },
  {
    key: 'revenue',
    header: 'Total Revenue Won',
    align: 'right',
    render: (r) => (
      <span className="font-bold text-gray-900">
        {formatCurrency(r.totalRevenue)}
      </span>
    ),
  },
];

export const AnalyticsExplorerPage: React.FC<AnalyticsExplorerPageProps> = ({
  screen,
}) => {
  const { currentWorkspace } = useWorkspace();
  const meta = ANALYTICS_SCREEN_META[screen] || ANALYTICS_SCREEN_META.sales;

  // Filter & Comparison State
  const [filters, setFilters] = useState<DashboardQueryFilters>({
    timeframe: 'LAST_30_DAYS',
  });
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [showComparison, setShowComparison] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>('REVENUE');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter Lookup Options
  const [teamsLookup, setTeamsLookup] = useState<DashboardLookupOption[]>([]);
  const [usersLookup, setUsersLookup] = useState<DashboardLookupOption[]>([]);
  const [pipelinesLookup, setPipelinesLookup] = useState<
    DashboardLookupOption[]
  >([]);

  // Analytics Data State
  const [salesData, setSalesData] = useState<SalesAnalyticsResponse | null>(
    null,
  );
  const [leadData, setLeadData] = useState<LeadAnalyticsResponse | null>(null);
  const [leadSourcesData, setLeadSourcesData] =
    useState<LeadSourceAnalyticsResponse | null>(null);
  const [pipelineData, setPipelineData] =
    useState<PipelineAnalyticsResponse | null>(null);
  const [revenueData, setRevenueData] =
    useState<RevenueAnalyticsResponse | null>(null);
  const [conversionData, setConversionData] =
    useState<ConversionFunnelResponse | null>(null);
  const [activityData, setActivityData] =
    useState<ActivityAnalyticsResponse | null>(null);
  const [teamData, setTeamData] = useState<TeamAnalyticsResponse | null>(null);
  const [repData, setRepData] = useState<RepPerformanceResponse | null>(null);

  // UI Feedback State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | string[] | null>(null);

  // Load Filter Lookups Once
  useEffect(() => {
    let active = true;
    dashboardService
      .getFilterLookups()
      .then((res) => {
        if (!active) return;
        setTeamsLookup(res.teams);
        setUsersLookup(res.users);
        setPipelinesLookup(res.pipelines);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Load Analytics Data for Active Screen
  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const activeFilters: DashboardQueryFilters = {
      ...filters,
      workspaceId: currentWorkspace?.id,
    };

    try {
      switch (screen) {
        case 'sales': {
          const [sales, pipeline] = await Promise.all([
            dashboardService.getSalesAnalytics(activeFilters),
            dashboardService.getPipelineAnalytics(activeFilters),
          ]);
          setSalesData(sales);
          setPipelineData(pipeline);
          break;
        }
        case 'leads': {
          const [leads, sources] = await Promise.all([
            dashboardService.getLeadAnalytics(activeFilters),
            dashboardService.getLeadSourceAnalytics(activeFilters),
          ]);
          setLeadData(leads);
          setLeadSourcesData(sources);
          break;
        }
        case 'lead-sources': {
          const [sources, leads] = await Promise.all([
            dashboardService.getLeadSourceAnalytics(activeFilters),
            dashboardService.getLeadAnalytics(activeFilters),
          ]);
          setLeadSourcesData(sources);
          setLeadData(leads);
          break;
        }
        case 'pipeline': {
          const [pipeline, sales] = await Promise.all([
            dashboardService.getPipelineAnalytics(activeFilters),
            dashboardService.getSalesAnalytics(activeFilters),
          ]);
          setPipelineData(pipeline);
          setSalesData(sales);
          break;
        }
        case 'revenue': {
          const [revenue, sales, pipeline] = await Promise.all([
            dashboardService.getRevenueAnalytics(activeFilters),
            dashboardService.getSalesAnalytics(activeFilters),
            dashboardService.getPipelineAnalytics(activeFilters),
          ]);
          setRevenueData(revenue);
          setSalesData(sales);
          setPipelineData(pipeline);
          break;
        }
        case 'conversion': {
          const [conversion, leads, sources] = await Promise.all([
            dashboardService.getConversionFunnel(activeFilters),
            dashboardService.getLeadAnalytics(activeFilters),
            dashboardService.getLeadSourceAnalytics(activeFilters),
          ]);
          setConversionData(conversion);
          setLeadData(leads);
          setLeadSourcesData(sources);
          break;
        }
        case 'activities': {
          const act = await dashboardService.getActivityAnalytics(activeFilters);
          setActivityData(act);
          break;
        }
        case 'teams': {
          const [teams, reps] = await Promise.all([
            dashboardService.getTeamAnalytics(activeFilters),
            dashboardService.getRepPerformance({ ...activeFilters, limit: 15 }),
          ]);
          setTeamData(teams);
          setRepData(reps);
          break;
        }
        case 'performance': {
          const [reps, teams] = await Promise.all([
            dashboardService.getRepPerformance({
              ...activeFilters,
              sortBy,
              sortOrder,
              limit: 25,
            }),
            dashboardService.getTeamAnalytics(activeFilters),
          ]);
          setRepData(reps);
          setTeamData(teams);
          break;
        }
      }
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string | string[] } };
      };
      setError(
        apiErr?.response?.data?.message ||
          `Failed to load ${meta.label}. Please try again.`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [screen, filters, sortBy, sortOrder, currentWorkspace?.id, meta.label]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  // Filtered Lead Sources when sourceFilter is selected
  const filteredSources = useMemo(() => {
    const all = leadSourcesData?.sources || [];
    if (!sourceFilter) return all;
    return all.filter(
      (s) => s.source.toUpperCase() === sourceFilter.toUpperCase(),
    );
  }, [leadSourcesData?.sources, sourceFilter]);

  const handleResetFilters = () => {
    setFilters({ timeframe: 'LAST_30_DAYS' });
    setSourceFilter('');
    setSortBy('REVENUE');
    setSortOrder('desc');
  };

  return (
    <AnalyticsLayout
      screen={screen}
      error={error}
      onDismissError={() => setError(null)}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/dashboard" className="lg-btn lg-btn-secondary">
            <BarChart2Icon size={15} />
            <span>Executive Dashboard</span>
          </Link>
        </div>
      }
      filterBar={
        <AnalyticsFilterBar
          screen={screen}
          filters={filters}
          onChangeFilters={setFilters}
          sourceFilter={sourceFilter}
          onChangeSourceFilter={setSourceFilter}
          showComparison={showComparison}
          onToggleComparison={setShowComparison}
          sortBy={sortBy}
          onChangeSortBy={setSortBy}
          sortOrder={sortOrder}
          onChangeSortOrder={setSortOrder}
          onReset={handleResetFilters}
          onRefresh={() => void loadAnalytics()}
          isLoading={isLoading}
          teams={teamsLookup}
          users={usersLookup}
          pipelines={pipelinesLookup}
        />
      }
    >
      {isLoading ? (
        <DashboardSkeleton cardCount={4} />
      ) : (
        <div className="space-y-6">
          {/* ==============================================================
              1. SALES ANALYTICS
             ============================================================== */}
          {screen === 'sales' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardKpiCard
                  label="Total Deals"
                  value={formatNumber(salesData?.kpis.totalDeals.current)}
                  metric={salesData?.kpis.totalDeals}
                  icon={<BriefcaseIcon size={20} />}
                  tone="blue"
                  to="/deals"
                />
                <DashboardKpiCard
                  label="Deals Won"
                  value={formatNumber(salesData?.kpis.wonDeals.current)}
                  metric={salesData?.kpis.wonDeals}
                  icon={<AwardIcon size={20} />}
                  tone="green"
                  to="/deals/won"
                />
                <DashboardKpiCard
                  label="Win Rate"
                  value={formatPercent(salesData?.kpis.winRate.current)}
                  metric={salesData?.kpis.winRate}
                  formatPrev={formatPercent}
                  icon={<TrendingUpIcon size={20} />}
                  tone="purple"
                />
                <DashboardKpiCard
                  label="Won Revenue"
                  value={formatCurrency(salesData?.kpis.totalRevenue.current)}
                  metric={salesData?.kpis.totalRevenue}
                  formatPrev={formatCurrency}
                  icon={<DollarSignIcon size={20} />}
                  tone="amber"
                  to="/analytics/revenue"
                />
              </div>

              {/* Analytics Summary Banner */}
              <SectionCard
                title="Sales Analytics Summary"
                subtitle="Key sales velocity, deal cycle, and pipeline health indicators"
              >
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase">
                      Avg Deal Size
                    </span>
                    <p className="mt-1 text-base font-bold text-gray-900">
                      {formatCurrency(salesData?.kpis.avgDealSize.current)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase">
                      Avg Sales Cycle
                    </span>
                    <p className="mt-1 text-base font-bold text-gray-900">
                      {formatNumber(salesData?.kpis.avgSalesCycleDays)} days
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase">
                      Sales Velocity / Day
                    </span>
                    <p className="mt-1 text-base font-bold text-emerald-700">
                      {formatCurrency(salesData?.kpis.salesVelocityPerDay)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase">
                      Open vs. Lost Deals
                    </span>
                    <p className="mt-1 text-base font-bold text-gray-900">
                      {formatNumber(salesData?.kpis.openDealsCount)} Open /{' '}
                      {formatNumber(salesData?.kpis.lostDealsCount)} Lost
                    </p>
                  </div>
                </div>
              </SectionCard>

              {/* Period Comparison Table */}
              {showComparison && (
                <SectionCard
                  title="Period-over-Period Sales Comparison"
                  subtitle="Current timeframe performance compared against the immediately preceding period"
                >
                  <DataTable
                    columns={COMPARISON_COLUMNS}
                    rows={[
                      buildComparisonRow(
                        'Total Deals Created',
                        salesData?.kpis.totalDeals,
                        formatNumber,
                      ),
                      buildComparisonRow(
                        'Closed-Won Deals',
                        salesData?.kpis.wonDeals,
                        formatNumber,
                      ),
                      buildComparisonRow(
                        'Win Rate (%)',
                        salesData?.kpis.winRate,
                        formatPercent,
                      ),
                      buildComparisonRow(
                        'Closed-Won Revenue',
                        salesData?.kpis.totalRevenue,
                        formatCurrency,
                      ),
                      buildComparisonRow(
                        'Average Won Deal Size',
                        salesData?.kpis.avgDealSize,
                        formatCurrency,
                      ),
                    ]}
                    rowKey={(r) => r.metric}
                  />
                </SectionCard>
              )}

              {/* Charts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Sales Revenue Time-Series"
                  subtitle="Closed-won revenue across the selected interval buckets"
                >
                  <LineChart
                    height={220}
                    points={(salesData?.timeSeries || []).map((pt) => ({
                      label: pt.label || pt.date.slice(5),
                      value: pt.value,
                    }))}
                    emptyText="No sales revenue recorded in this period."
                  />
                </SectionCard>

                <SectionCard
                  title="Deal Status Breakdown"
                  subtitle="Distribution of Won, Open, and Lost opportunities"
                >
                  <DonutChart
                    centerLabel="Deals"
                    data={[
                      {
                        label: 'Won',
                        value: salesData?.kpis.wonDeals.current || 0,
                      },
                      {
                        label: 'Open',
                        value: salesData?.kpis.openDealsCount || 0,
                      },
                      {
                        label: 'Lost',
                        value: salesData?.kpis.lostDealsCount || 0,
                      },
                    ]}
                    emptyText="No deals recorded in this period."
                  />
                </SectionCard>
              </div>

              {/* Time-Series Breakdown Table */}
              <SectionCard
                title="Sales Time-Series Breakdown Table"
                subtitle="Detailed bucket-by-bucket revenue, won deal count, and created deal count"
              >
                <DataTable
                  columns={TIMESERIES_COLUMNS}
                  rows={salesData?.timeSeries || []}
                  rowKey={(pt) => pt.date}
                  emptyTitle="No sales time-series buckets"
                  emptyDescription="Adjust the date filter to view sales buckets."
                />
              </SectionCard>
            </>
          )}

          {/* ==============================================================
              2. LEAD ANALYTICS
             ============================================================== */}
          {screen === 'leads' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardKpiCard
                  label="Total Leads"
                  value={formatNumber(leadData?.kpis.totalLeads.current)}
                  metric={leadData?.kpis.totalLeads}
                  icon={<TargetIcon size={20} />}
                  tone="blue"
                  to="/leads"
                />
                <DashboardKpiCard
                  label="Converted Leads"
                  value={formatNumber(leadData?.kpis.convertedLeads.current)}
                  metric={leadData?.kpis.convertedLeads}
                  icon={<CheckCircleIcon size={20} />}
                  tone="green"
                  to="/leads/conversion"
                />
                <DashboardKpiCard
                  label="Conversion Rate"
                  value={formatPercent(leadData?.kpis.conversionRate.current)}
                  metric={leadData?.kpis.conversionRate}
                  formatPrev={formatPercent}
                  icon={<TrendingUpIcon size={20} />}
                  tone="purple"
                />
                <DashboardKpiCard
                  label="Qualification Rate"
                  value={formatPercent(
                    leadData?.kpis.qualificationRate.current,
                  )}
                  subtitle={`Avg Lead Score: ${formatNumber(leadData?.kpis.avgLeadScore)}`}
                  icon={<AwardIcon size={20} />}
                  tone="amber"
                  to="/leads/qualification"
                />
              </div>

              {showComparison && (
                <SectionCard
                  title="Period-over-Period Lead Comparison"
                  subtitle="Compare lead acquisition and conversion metrics against the previous period"
                >
                  <DataTable
                    columns={COMPARISON_COLUMNS}
                    rows={[
                      buildComparisonRow(
                        'Total Leads Generated',
                        leadData?.kpis.totalLeads,
                        formatNumber,
                      ),
                      buildComparisonRow(
                        'Converted Leads',
                        leadData?.kpis.convertedLeads,
                        formatNumber,
                      ),
                      buildComparisonRow(
                        'Lead Conversion Rate',
                        leadData?.kpis.conversionRate,
                        formatPercent,
                      ),
                    ]}
                    rowKey={(r) => r.metric}
                  />
                </SectionCard>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Lead Acquisition Trend"
                  subtitle="New leads captured over time"
                >
                  <LineChart
                    height={220}
                    points={(leadData?.timeSeries || []).map((pt) => ({
                      label: pt.label || pt.date.slice(5),
                      value: pt.value,
                    }))}
                    emptyText="No leads captured in this period."
                  />
                </SectionCard>

                <SectionCard
                  title="Lead Status Distribution"
                  subtitle="Breakdown across New, Contacted, Qualified, Converted, and Unqualified"
                >
                  <DonutChart
                    centerLabel="Leads"
                    data={Object.entries(
                      leadData?.kpis.statusBreakdown || {},
                    ).map(([status, count]) => ({
                      label: humanize(status),
                      value: Number(count || 0),
                    }))}
                    emptyText="No lead status data available."
                  />
                </SectionCard>
              </div>

              <SectionCard
                title="Lead Time-Series Table"
                subtitle="Bucket-by-bucket lead generation and conversion counts"
              >
                <DataTable
                  columns={TIMESERIES_COLUMNS}
                  rows={leadData?.timeSeries || []}
                  rowKey={(pt) => pt.date}
                  emptyTitle="No lead time-series data"
                />
              </SectionCard>
            </>
          )}

          {/* ==============================================================
              3. LEAD SOURCE ANALYTICS
             ============================================================== */}
          {screen === 'lead-sources' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardKpiCard
                  label="Total Leads Tracked"
                  value={formatNumber(leadSourcesData?.totalLeads)}
                  subtitle={
                    sourceFilter
                      ? `Filtered by: ${humanize(sourceFilter)}`
                      : 'Across all acquisition channels'
                  }
                  icon={<TargetIcon size={20} />}
                  tone="blue"
                />
                <DashboardKpiCard
                  label="Active Sources"
                  value={formatNumber(filteredSources.length)}
                  subtitle="Channels generating leads"
                  icon={<BarChart2Icon size={20} />}
                  tone="purple"
                />
                <DashboardKpiCard
                  label="Top Performing Source"
                  value={
                    leadSourcesData?.topPerformingSource
                      ? humanize(leadSourcesData.topPerformingSource)
                      : '—'
                  }
                  subtitle="Highest volume acquisition channel"
                  icon={<AwardIcon size={20} />}
                  tone="green"
                />
                <DashboardKpiCard
                  label="Total Attributed Value"
                  value={formatCurrency(
                    filteredSources.reduce((sum, s) => sum + s.revenue, 0),
                  )}
                  subtitle="Estimated pipeline value from sources"
                  icon={<DollarSignIcon size={20} />}
                  tone="amber"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Lead Volume by Source"
                  subtitle="Proportional comparison of lead acquisition channels"
                >
                  <BarList
                    data={filteredSources.map((s) => ({
                      label: humanize(s.source),
                      value: s.count,
                      hint: `Conversion: ${formatPercent(s.conversionRate)} • Value: ${formatCurrency(s.revenue)}`,
                    }))}
                    emptyText="No lead sources match the current filter."
                  />
                </SectionCard>

                <SectionCard
                  title="Attributed Revenue by Source"
                  subtitle="Estimated deal value generated per acquisition source"
                >
                  <BarList
                    data={filteredSources.map((s) => ({
                      label: humanize(s.source),
                      value: s.revenue,
                      hint: `${s.count} leads • Avg Score: ${s.avgLeadScore}`,
                    }))}
                    formatValue={formatCurrency}
                    emptyText="No attributed source revenue available."
                  />
                </SectionCard>
              </div>

              <SectionCard
                title="Lead Source Performance Table"
                subtitle="Detailed channel breakdown with conversion rates, average lead scores, and revenue attribution"
              >
                <DataTable
                  columns={LEAD_SOURCE_COLUMNS}
                  rows={filteredSources}
                  rowKey={(s) => s.source}
                  emptyTitle="No lead source records found"
                  emptyDescription="Try clearing the source filter or expanding the date range."
                />
              </SectionCard>
            </>
          )}

          {/* ==============================================================
              4. PIPELINE ANALYTICS
             ============================================================== */}
          {screen === 'pipeline' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardKpiCard
                  label="Active Pipeline"
                  value={pipelineData?.pipelineName || 'Default Pipeline'}
                  subtitle={`${formatNumber(pipelineData?.stages.length)} stages configured`}
                  icon={<BriefcaseIcon size={20} />}
                  tone="blue"
                  to="/pipelines"
                />
                <DashboardKpiCard
                  label="Total Pipeline Value"
                  value={formatCurrency(pipelineData?.totalPipelineValue)}
                  subtitle="Sum of all deals in pipeline"
                  icon={<DollarSignIcon size={20} />}
                  tone="green"
                />
                <DashboardKpiCard
                  label="Weighted Forecast Value"
                  value={formatCurrency(pipelineData?.totalWeightedValue)}
                  subtitle="Probability-adjusted pipeline value"
                  icon={<TrendingUpIcon size={20} />}
                  tone="purple"
                  to="/pipelines/probability"
                />
                <DashboardKpiCard
                  label="Total Pipeline Deals"
                  value={formatNumber(pipelineData?.totalDeals)}
                  subtitle="Opportunities across all stages"
                  icon={<AwardIcon size={20} />}
                  tone="amber"
                  to="/deals"
                />
              </div>

              <PipelineSummaryWidget pipeline={pipelineData} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Deal Count by Stage"
                  subtitle="Distribution of opportunities across pipeline stages"
                >
                  <DonutChart
                    centerLabel="Deals"
                    data={(pipelineData?.stages || []).map((st) => ({
                      label: st.stageName,
                      value: st.dealCount,
                    }))}
                    emptyText="No deals in pipeline stages."
                  />
                </SectionCard>

                <SectionCard
                  title="Weighted Value by Stage"
                  subtitle="Probability-weighted forecast contribution per stage"
                >
                  <BarList
                    data={(pipelineData?.stages || []).map((st) => ({
                      label: `${st.stageName} (${st.winProbability}%)`,
                      value: st.weightedValue,
                      hint: `Total: ${formatCurrency(st.totalValue)} across ${st.dealCount} deals`,
                    }))}
                    formatValue={formatCurrency}
                    emptyText="No stage forecast values available."
                  />
                </SectionCard>
              </div>

              <SectionCard
                title="Pipeline Stage Breakdown Table"
                subtitle="Stage order, deal count, win probability, total value, and weighted forecast"
              >
                <DataTable
                  columns={PIPELINE_STAGE_COLUMNS}
                  rows={pipelineData?.stages || []}
                  rowKey={(st) => st.stageId}
                  emptyTitle="No pipeline stages found"
                />
              </SectionCard>
            </>
          )}

          {/* ==============================================================
              5. REVENUE ANALYTICS
             ============================================================== */}
          {screen === 'revenue' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardKpiCard
                  label="Closed-Won Revenue"
                  value={formatCurrency(
                    revenueData?.revenue.closedWonRevenue.current,
                  )}
                  metric={revenueData?.revenue.closedWonRevenue}
                  formatPrev={formatCurrency}
                  icon={<DollarSignIcon size={20} />}
                  tone="green"
                  to="/deals/won"
                />
                <DashboardKpiCard
                  label="Weighted Revenue Forecast"
                  value={formatCurrency(
                    revenueData?.revenue.weightedForecastRevenue,
                  )}
                  subtitle="Expected value from open deals"
                  icon={<TrendingUpIcon size={20} />}
                  tone="blue"
                />
                <DashboardKpiCard
                  label="Open Pipeline Value"
                  value={formatCurrency(
                    revenueData?.revenue.activePipelineValue,
                  )}
                  subtitle="Unclosed opportunity value"
                  icon={<BriefcaseIcon size={20} />}
                  tone="purple"
                />
                <DashboardKpiCard
                  label="Avg Revenue per Won Deal"
                  value={formatCurrency(
                    revenueData?.revenue.avgRevenuePerDeal,
                  )}
                  subtitle={`${formatNumber(revenueData?.revenue.dealsWonCount)} won deals`}
                  icon={<AwardIcon size={20} />}
                  tone="amber"
                />
              </div>

              {showComparison && (
                <SectionCard
                  title="Period-over-Period Revenue Comparison"
                  subtitle="Closed-won revenue and deal size comparison against previous period"
                >
                  <DataTable
                    columns={COMPARISON_COLUMNS}
                    rows={[
                      buildComparisonRow(
                        'Closed-Won Revenue',
                        revenueData?.revenue.closedWonRevenue,
                        formatCurrency,
                      ),
                      buildComparisonRow(
                        'Average Won Deal Size',
                        salesData?.kpis.avgDealSize,
                        formatCurrency,
                      ),
                      buildComparisonRow(
                        'Deals Won Count',
                        salesData?.kpis.wonDeals,
                        formatNumber,
                      ),
                    ]}
                    rowKey={(r) => r.metric}
                  />
                </SectionCard>
              )}

              <RevenueSummaryWidget revenue={revenueData} />

              <SectionCard
                title="Revenue Time-Series Table"
                subtitle="Interval breakdown of closed-won revenue and won deal count"
              >
                <DataTable
                  columns={TIMESERIES_COLUMNS}
                  rows={revenueData?.timeSeries || []}
                  rowKey={(pt) => pt.date}
                  emptyTitle="No revenue buckets recorded"
                />
              </SectionCard>
            </>
          )}

          {/* ==============================================================
              6. CONVERSION ANALYTICS
             ============================================================== */}
          {screen === 'conversion' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardKpiCard
                  label="Total Funnel Leads"
                  value={formatNumber(conversionData?.totalLeads)}
                  subtitle="Top-of-funnel leads entered"
                  icon={<TargetIcon size={20} />}
                  tone="blue"
                />
                <DashboardKpiCard
                  label="Closed-Won Customers"
                  value={formatNumber(conversionData?.totalDealsWon)}
                  subtitle="Bottom-of-funnel won deals"
                  icon={<CheckCircleIcon size={20} />}
                  tone="green"
                />
                <DashboardKpiCard
                  label="Overall Funnel Conversion"
                  value={formatPercent(conversionData?.overallConversionRate)}
                  subtitle="Lead-to-Won Deal conversion rate"
                  icon={<TrendingUpIcon size={20} />}
                  tone="purple"
                />
                <DashboardKpiCard
                  label="Lead Qualification Rate"
                  value={formatPercent(
                    leadData?.kpis.qualificationRate.current,
                  )}
                  subtitle="Leads reaching Qualified stage"
                  icon={<AwardIcon size={20} />}
                  tone="amber"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Stage-by-Stage Conversion Funnel"
                  subtitle="Visual progression from Total Leads to Closed-Won Deals"
                >
                  <Funnel
                    steps={(conversionData?.stages || []).map((st) => ({
                      label: `${st.name} (${formatPercent(st.conversionRate)})`,
                      value: st.count,
                    }))}
                  />
                </SectionCard>

                <SectionCard
                  title="Stage Drop-Off & Leakage Analysis"
                  subtitle="Percentage of prospects dropping off at each funnel stage"
                >
                  <BarList
                    data={(conversionData?.stages || []).map((st) => ({
                      label: st.name,
                      value: st.dropOffRate,
                      hint: `Volume: ${st.count} (${formatCurrency(st.value)})`,
                    }))}
                    formatValue={formatPercent}
                    emptyText="No funnel drop-off metrics available."
                  />
                </SectionCard>
              </div>

              <SectionCard
                title="Funnel Stage Conversion & Drop-Off Table"
                subtitle="Detailed stage counts, monetary values, conversion percentages, and leakage rates"
              >
                <DataTable
                  columns={CONVERSION_STAGE_COLUMNS}
                  rows={conversionData?.stages || []}
                  rowKey={(st) => st.stage}
                  emptyTitle="No funnel conversion stages"
                />
              </SectionCard>
            </>
          )}

          {/* ==============================================================
              7. ACTIVITY ANALYTICS
             ============================================================== */}
          {screen === 'activities' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardKpiCard
                  label="Total Activities"
                  value={formatNumber(
                    activityData?.kpis.totalActivities.current,
                  )}
                  metric={activityData?.kpis.totalActivities}
                  icon={<ActivityIcon size={20} />}
                  tone="blue"
                  to="/activities"
                />
                <DashboardKpiCard
                  label="Completed Activities"
                  value={formatNumber(
                    activityData?.kpis.completedActivities.current,
                  )}
                  metric={activityData?.kpis.completedActivities}
                  icon={<CheckCircleIcon size={20} />}
                  tone="green"
                  to="/activities/completed"
                />
                <DashboardKpiCard
                  label="Completion Rate"
                  value={formatPercent(
                    activityData?.kpis.completionRate.current,
                  )}
                  metric={activityData?.kpis.completionRate}
                  formatPrev={formatPercent}
                  icon={<TrendingUpIcon size={20} />}
                  tone="purple"
                />
                <DashboardKpiCard
                  label="Pending Activities"
                  value={formatNumber(activityData?.kpis.pendingCount)}
                  subtitle={`${formatNumber(activityData?.kpis.cancelledCount)} cancelled`}
                  icon={<AwardIcon size={20} />}
                  tone="amber"
                  to="/activities"
                />
              </div>

              {showComparison && (
                <SectionCard
                  title="Period-over-Period Activity Comparison"
                  subtitle="Compare team activity volume and completion rate against the previous period"
                >
                  <DataTable
                    columns={COMPARISON_COLUMNS}
                    rows={[
                      buildComparisonRow(
                        'Total Activities Logged',
                        activityData?.kpis.totalActivities,
                        formatNumber,
                      ),
                      buildComparisonRow(
                        'Completed Activities',
                        activityData?.kpis.completedActivities,
                        formatNumber,
                      ),
                      buildComparisonRow(
                        'Activity Completion Rate',
                        activityData?.kpis.completionRate,
                        formatPercent,
                      ),
                    ]}
                    rowKey={(r) => r.metric}
                  />
                </SectionCard>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <SectionCard
                  title="Activity Volume Trend"
                  subtitle="Activities logged over time"
                >
                  <LineChart
                    height={200}
                    points={(activityData?.timeSeries || []).map((pt) => ({
                      label: pt.label || pt.date.slice(5),
                      value: pt.value,
                    }))}
                    emptyText="No activity trend data."
                  />
                </SectionCard>

                <SectionCard
                  title="Activities by Type"
                  subtitle="Calls, Emails, Meetings, Follow-ups, WhatsApp"
                >
                  <DonutChart
                    centerLabel="Activities"
                    data={Object.entries(
                      activityData?.breakdowns.byType || {},
                    ).map(([type, count]) => ({
                      label: humanize(type),
                      value: Number(count || 0),
                    }))}
                    emptyText="No activity type breakdown."
                  />
                </SectionCard>

                <SectionCard
                  title="Activities by Priority"
                  subtitle="Urgent, High, Medium, and Low priority distribution"
                >
                  <BarList
                    data={Object.entries(
                      activityData?.breakdowns.byPriority || {},
                    ).map(([priority, count]) => ({
                      label: humanize(priority),
                      value: Number(count || 0),
                    }))}
                    emptyText="No priority breakdown data."
                  />
                </SectionCard>
              </div>

              <SectionCard
                title="Activity Time-Series Table"
                subtitle="Interval breakdown of total activities created vs. completed"
              >
                <DataTable
                  columns={TIMESERIES_COLUMNS}
                  rows={activityData?.timeSeries || []}
                  rowKey={(pt) => pt.date}
                  emptyTitle="No activity time-series data"
                />
              </SectionCard>
            </>
          )}

          {/* ==============================================================
              8. TEAM ANALYTICS
             ============================================================== */}
          {screen === 'teams' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardKpiCard
                  label="Total Sales Teams"
                  value={formatNumber(teamData?.totalTeams)}
                  subtitle="Teams compared in period"
                  icon={<UsersIcon size={20} />}
                  tone="blue"
                  to="/teams"
                />
                <DashboardKpiCard
                  label="Combined Team Revenue"
                  value={formatCurrency(
                    (teamData?.teams || []).reduce(
                      (sum, t) => sum + t.totalRevenue,
                      0,
                    ),
                  )}
                  subtitle="Closed-won revenue across teams"
                  icon={<DollarSignIcon size={20} />}
                  tone="green"
                />
                <DashboardKpiCard
                  label="Combined Deals Won"
                  value={formatNumber(
                    (teamData?.teams || []).reduce(
                      (sum, t) => sum + t.dealsWon,
                      0,
                    ),
                  )}
                  subtitle="Total won opportunities by teams"
                  icon={<AwardIcon size={20} />}
                  tone="purple"
                />
                <DashboardKpiCard
                  label="Team Activities Logged"
                  value={formatNumber(
                    (teamData?.teams || []).reduce(
                      (sum, t) => sum + t.activitiesCount,
                      0,
                    ),
                  )}
                  subtitle="Total touchpoints across teams"
                  icon={<ActivityIcon size={20} />}
                  tone="amber"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Revenue by Sales Team"
                  subtitle="Comparison of closed-won revenue generated per team"
                >
                  <BarList
                    data={(teamData?.teams || []).map((t) => ({
                      label: `${t.teamName} (${t.dealsWon} won • ${formatPercent(t.winRate)})`,
                      value: t.totalRevenue,
                    }))}
                    formatValue={formatCurrency}
                    emptyText="No team revenue data recorded."
                  />
                </SectionCard>

                <SectionCard
                  title="Deal Volume by Sales Team"
                  subtitle="Opportunities created per team"
                >
                  <DonutChart
                    centerLabel="Deals"
                    data={(teamData?.teams || []).map((t) => ({
                      label: t.teamName,
                      value: t.dealsCount,
                    }))}
                    emptyText="No team deal volume recorded."
                  />
                </SectionCard>
              </div>

              <SectionCard
                title="Team Analytics Comparison Table"
                subtitle="Full comparison of team headcount, leads, deals created, deals won, win rate, activities, and revenue"
              >
                <DataTable
                  columns={TEAM_ANALYTICS_COLUMNS}
                  rows={teamData?.teams || []}
                  rowKey={(t) => t.teamId}
                  emptyTitle="No sales teams found"
                  emptyDescription="Create teams in the Users & Teams module to track team analytics."
                />
              </SectionCard>
            </>
          )}

          {/* ==============================================================
              9. PERFORMANCE ANALYTICS
             ============================================================== */}
          {screen === 'performance' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardKpiCard
                  label="Ranked Representatives"
                  value={formatNumber(repData?.total)}
                  subtitle={`Sorted by: ${humanize(sortBy)} (${sortOrder.toUpperCase()})`}
                  icon={<UsersIcon size={20} />}
                  tone="blue"
                  to="/users"
                />
                <DashboardKpiCard
                  label="Top Performer"
                  value={repData?.items?.[0]?.name || '—'}
                  subtitle={
                    repData?.items?.[0]
                      ? `${formatCurrency(repData.items[0].totalRevenue)} revenue • ${repData.items[0].dealsWon} won`
                      : 'No ranked reps yet'
                  }
                  icon={<AwardIcon size={20} />}
                  tone="amber"
                />
                <DashboardKpiCard
                  label="Leaderboard Revenue"
                  value={formatCurrency(
                    (repData?.items || []).reduce(
                      (sum, r) => sum + r.totalRevenue,
                      0,
                    ),
                  )}
                  subtitle="Combined revenue of ranked reps"
                  icon={<DollarSignIcon size={20} />}
                  tone="green"
                />
                <DashboardKpiCard
                  label="Completed Rep Activities"
                  value={formatNumber(
                    (repData?.items || []).reduce(
                      (sum, r) => sum + r.activitiesCompleted,
                      0,
                    ),
                  )}
                  subtitle="Total completed activities by reps"
                  icon={<CheckCircleIcon size={20} />}
                  tone="purple"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Representative Revenue Ranking"
                  subtitle="Closed-won revenue by sales representative"
                >
                  <BarList
                    data={(repData?.items || []).slice(0, 10).map((r) => ({
                      label: `#${r.rank} ${r.name} (${formatPercent(r.winRate)} win rate)`,
                      value: r.totalRevenue,
                      hint: `Deals Won: ${r.dealsWon} • Avg Deal: ${formatCurrency(r.avgDealSize)}`,
                    }))}
                    formatValue={formatCurrency}
                    emptyText="No representative revenue data."
                  />
                </SectionCard>

                <SectionCard
                  title="Representative Activity Output"
                  subtitle="Completed activities per sales representative"
                >
                  <BarList
                    data={(repData?.items || []).slice(0, 10).map((r) => ({
                      label: `${r.name} (${r.dealsCreated} deals created)`,
                      value: r.activitiesCompleted,
                    }))}
                    emptyText="No representative activity data."
                  />
                </SectionCard>
              </div>

              <SectionCard
                title="Sales Representative Performance Leaderboard Table"
                subtitle="Individual rankings across leads assigned, deals created, deals won, win rate, avg deal size, activities, and revenue"
              >
                <DataTable
                  columns={REP_PERFORMANCE_COLUMNS}
                  rows={repData?.items || []}
                  rowKey={(r) => r.userId}
                  emptyTitle="No sales representatives found"
                  emptyDescription="Adjust team or date filters to view representative performance."
                />
              </SectionCard>
            </>
          )}
        </div>
      )}
    </AnalyticsLayout>
  );
};

