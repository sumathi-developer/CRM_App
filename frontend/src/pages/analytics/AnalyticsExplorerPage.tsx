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
import { DashboardScenicHero } from '../dashboard/components/DashboardScenicHero';
import { DashboardLeftRail, DashboardRightRail } from '../dashboard/components/DashboardRails';
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
import { Button } from '../../components/ui';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  humanize,
} from '../lead-generation/leadGenConstants';
import {
  ActivityIcon,
  ArrowRightIcon,
  AwardIcon,
  BarChart2Icon,
  BriefcaseIcon,
  CheckCircleIcon,
  DollarSignIcon,
  PlusIcon,
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
  const [sortBy, setSortBy] = useState<string>('revenue');
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
          const [conversion, leads] = await Promise.all([
            dashboardService.getConversionFunnel(activeFilters),
            dashboardService.getLeadAnalytics(activeFilters),
          ]);
          setConversionData(conversion);
          setLeadData(leads);
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
          <Link to="/dashboard">
            <Button
              variant="secondary"
              pill
              size="sm"
              icon={<BarChart2Icon size={15} />}
            >
              Executive Dashboard
            </Button>
          </Link>
          <Link to="/deals/create">
            <Button
              variant="primary"
              pill
              size="sm"
              icon={<PlusIcon size={15} />}
            >
              New Deal
            </Button>
          </Link>
          <Link to="/leads/create">
            <Button
              variant="outline"
              pill
              size="sm"
              icon={<PlusIcon size={15} />}
            >
              New Lead
            </Button>
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
        <DashboardSkeleton cardCount={8} />
      ) : (
        <div className="space-y-6">
          {/* ==============================================================
              1. SALES ANALYTICS
             ============================================================== */}
          {screen === 'sales' && (
            <div className="space-y-6">
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                badge="Sales Momentum & Execution Hub"
                title="Accelerate Sales Velocity."
                highlight="Maximize Win Rates."
                subtitle="Deep-dive sales execution metrics across your pipeline. Track win rates, cycle velocity, and quota attainment."
                actions={[
                  { label: 'Create Deal', to: '/deals/create', variant: 'secondary', icon: <PlusIcon size={15} /> },
                  { label: 'Pipeline Review', to: '/pipelines', variant: 'outline', icon: <BriefcaseIcon size={15} /> },
                  { label: 'Revenue Forecast', to: '/analytics/revenue', variant: 'accent', icon: <TrendingUpIcon size={15} /> },
                ]}
                tickerItems={[
                  { dotColor: '#10b981', label: 'Total Deals:', value: formatNumber(salesData?.kpis.totalDeals.current) },
                  { dotColor: '#7c3aed', label: 'Deals Won:', value: formatNumber(salesData?.kpis.wonDeals.current) },
                  { dotColor: '#059669', label: 'Win Rate:', value: formatPercent(salesData?.kpis.winRate.current) },
                ]}
              />

              {/* Balanced 3-Column Executive Matrix (Left Rail, 8 KPI Cards, Right Rail) */}
              <div className="crm-dashboard-3col">
                <div className="crm-dashboard-left-rail">
                  <DashboardLeftRail
                    progressTitle="Sales Targets"
                    progress1Label="Quota Attainment"
                    progress1Value="84%"
                    progress1Width="84%"
                    progress2Label="Win Efficiency"
                    progress2Value={formatPercent(salesData?.kpis.winRate.current)}
                    progress2Width={`${Math.min(100, Math.max(10, Math.round(Number(salesData?.kpis.winRate.current || 0))))}%`}
                    progress3Label="Deal Velocity"
                    progress3Value="92%"
                    progress3Width="92%"
                    talliesTitle="Sales Tallies"
                    tally1Label="Open Deals"
                    tally1Value={formatNumber(salesData?.kpis.openDealsCount)}
                    tally2Label="Deals Won"
                    tally2Value={formatNumber(salesData?.kpis.wonDeals.current)}
                    tally3Label="Avg Cycle"
                    tally3Value={`${salesData?.kpis.avgSalesCycleDays || 0}d`}
                    efficiencyLabel="Sales Velocity"
                    efficiencyValue={formatCurrency(salesData?.kpis.salesVelocityPerDay)}
                    auditLabel="Pipeline Audit"
                    auditLink="/analytics/pipeline"
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: '446px' }}>
                    <DashboardKpiCard
                      label="Total Deals in Period"
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
                      label="Deal Win Rate"
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
                    <DashboardKpiCard
                      label="Average Deal Size"
                      value={formatCurrency(salesData?.kpis.avgDealSize.current)}
                      metric={salesData?.kpis.avgDealSize}
                      formatPrev={formatCurrency}
                      icon={<DollarSignIcon size={20} />}
                      tone="cyan"
                    />
                    <DashboardKpiCard
                      label="Avg Sales Cycle"
                      value={`${formatNumber(salesData?.kpis.avgSalesCycleDays)} days`}
                      subtitle="Lead to closed-won"
                      icon={<ActivityIcon size={20} />}
                      tone="blue"
                    />
                    <DashboardKpiCard
                      label="Active Pipeline Deals"
                      value={formatNumber(salesData?.kpis.openDealsCount)}
                      subtitle={`${formatNumber(salesData?.kpis.lostDealsCount)} deals lost`}
                      icon={<BriefcaseIcon size={20} />}
                      tone="purple"
                      to="/pipelines"
                    />
                    <DashboardKpiCard
                      label="Sales Velocity / Day"
                      value={formatCurrency(salesData?.kpis.salesVelocityPerDay)}
                      subtitle="Pipeline revenue momentum"
                      icon={<TrendingUpIcon size={20} />}
                      tone="green"
                    />
                  </div>
                </div>

                <div className="crm-dashboard-right-rail">
                  <DashboardRightRail
                    pulseTitle="Sales Velocity"
                    pulseSubtitle="Quota Momentum"
                    actionLabel="Schedule Sales Call"
                    actionLink="/activities/create"
                  />
                </div>
              </div>

              {/* Lower Tier: Period Comparison Table */}
              {showComparison && (
                <div className="crm-dashboard-tier">
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
                          'Average Deal Size',
                          salesData?.kpis.avgDealSize,
                          formatCurrency,
                        ),
                      ]}
                      rowKey={(r) => r.metric}
                    />
                  </SectionCard>
                </div>
              )}

              {/* Lower Tier: Sales Charts (Line Chart + Donut Chart) */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Sales Revenue & Deal Closure Trend"
                  subtitle="Closed-won deal value over time"
                >
                  <LineChart
                    height={220}
                    points={(salesData?.timeSeries || []).map((p) => ({
                      label: p.label || p.date.slice(5),
                      value: p.value,
                    }))}
                    emptyText="No won deals in the selected timeframe."
                  />
                </SectionCard>

                <SectionCard
                  title="Deal Outcome Distribution"
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

              {/* Lower Tier: Pipeline & Revenue Summary Widgets */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
                <PipelineSummaryWidget pipeline={pipelineData} />
                <RevenueSummaryWidget revenue={revenueData} />
              </div>

              {/* Lower Tier: Time-Series Breakdown Table */}
              <div className="crm-dashboard-tier">
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
              </div>
            </div>
          )}

          {/* ==============================================================
              2. LEAD ANALYTICS
             ============================================================== */}
          {screen === 'leads' && (
            <div className="space-y-6">
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                badge="Demand Generation Hub"
                title="Capture High-Intent Demand."
                highlight="Accelerate Lead Conversions."
                subtitle="Monitor multichannel lead capture, score qualification rates, and optimize top-of-funnel velocity."
                actions={[
                  { label: 'Capture Lead', to: '/leads/create', variant: 'secondary', icon: <PlusIcon size={15} /> },
                  { label: 'Lead Sources', to: '/analytics/lead-sources', variant: 'outline', icon: <TargetIcon size={15} /> },
                  { label: 'Audit Funnel', to: '/analytics/conversion', variant: 'accent', icon: <TrendingUpIcon size={15} /> },
                ]}
                tickerItems={[
                  { dotColor: '#10b981', label: 'Total Leads:', value: formatNumber(leadData?.kpis.totalLeads.current) },
                  { dotColor: '#7c3aed', label: 'Converted:', value: formatNumber(leadData?.kpis.convertedLeads.current) },
                  { dotColor: '#059669', label: 'Conversion Rate:', value: formatPercent(leadData?.kpis.conversionRate.current) },
                ]}
              />

              {/* Balanced 3-Column Executive Matrix (Left Rail, 8 KPI Cards, Right Rail) */}
              <div className="crm-dashboard-3col">
                <div className="crm-dashboard-left-rail">
                  <DashboardLeftRail
                    progressTitle="Lead Inflow"
                    progress1Label="Acquisition Velocity"
                    progress1Value="88%"
                    progress1Width="88%"
                    progress2Label="Qualification Quota"
                    progress2Value={formatPercent(leadData?.kpis.qualificationRate.current)}
                    progress2Width={`${Math.min(100, Math.max(10, Math.round(Number(leadData?.kpis.qualificationRate.current || 0))))}%`}
                    progress3Label="Channel Quality"
                    progress3Value="91%"
                    progress3Width="91%"
                    talliesTitle="Lead Tallies"
                    tally1Label="Captured Leads"
                    tally1Value={formatNumber(leadData?.kpis.totalLeads.current)}
                    tally2Label="Converted Leads"
                    tally2Value={formatNumber(leadData?.kpis.convertedLeads.current)}
                    tally3Label="Avg Score"
                    tally3Value={`${leadData?.kpis.avgLeadScore || 0} pts`}
                    efficiencyLabel="Avg Lead Score"
                    efficiencyValue={`${leadData?.kpis.avgLeadScore || 0} pts`}
                    auditLabel="Lead Attribution Audit"
                    auditLink="/analytics/lead-sources"
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: '446px' }}>
                    <DashboardKpiCard
                      label="Total Leads Captured"
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
                      label="Lead Conversion Rate"
                      value={formatPercent(leadData?.kpis.conversionRate.current)}
                      metric={leadData?.kpis.conversionRate}
                      formatPrev={formatPercent}
                      icon={<TrendingUpIcon size={20} />}
                      tone="purple"
                    />
                    <DashboardKpiCard
                      label="Qualification Rate"
                      value={formatPercent(leadData?.kpis.qualificationRate.current)}
                      metric={leadData?.kpis.qualificationRate}
                      formatPrev={formatPercent}
                      icon={<AwardIcon size={20} />}
                      tone="amber"
                      to="/leads/qualification"
                    />
                    <DashboardKpiCard
                      label="Average Lead Score"
                      value={formatNumber(leadData?.kpis.avgLeadScore)}
                      subtitle="Quality scoring benchmark"
                      icon={<AwardIcon size={20} />}
                      tone="cyan"
                    />
                    <DashboardKpiCard
                      label="Qualified Prospects"
                      value={formatNumber(leadData?.kpis.statusBreakdown?.QUALIFIED || 0)}
                      subtitle="Ready for deal conversion"
                      icon={<CheckCircleIcon size={20} />}
                      tone="green"
                      to="/leads"
                    />
                    <DashboardKpiCard
                      label="Contacted Leads"
                      value={formatNumber(leadData?.kpis.statusBreakdown?.CONTACTED || 0)}
                      subtitle="Active discovery phase"
                      icon={<ActivityIcon size={20} />}
                      tone="blue"
                      to="/leads"
                    />
                    <DashboardKpiCard
                      label="Top Attribution Channel"
                      value={leadSourcesData?.topPerformingSource ? humanize(leadSourcesData.topPerformingSource) : 'Direct Website'}
                      subtitle="Highest volume source"
                      icon={<TargetIcon size={20} />}
                      tone="purple"
                      to="/analytics/lead-sources"
                    />
                  </div>
                </div>

                <div className="crm-dashboard-right-rail">
                  <DashboardRightRail
                    pulseTitle="Lead Velocity"
                    pulseSubtitle="Inflow Acceleration"
                    actionLabel="Capture New Lead"
                    actionLink="/leads/create"
                  />
                </div>
              </div>

              {/* Lower Tier: Period Comparison Table */}
              {showComparison && (
                <div className="crm-dashboard-tier">
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
                        buildComparisonRow(
                          'Lead Qualification Rate',
                          leadData?.kpis.qualificationRate,
                          formatPercent,
                        ),
                      ]}
                      rowKey={(r) => r.metric}
                    />
                  </SectionCard>
                </div>
              )}

              {/* Lower Tier: Charts (Acquisition Trend + Status Distribution) */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
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

              {/* Lower Tier: Top Acquisition Sources & Funnel Summary */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Top Lead Acquisition Sources"
                  subtitle="Channel volume & attribution performance"
                  actions={
                    <Link
                      to="/analytics/lead-sources"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-500 transition"
                    >
                      <span>Channel Analytics</span>
                      <ArrowRightIcon size={13} />
                    </Link>
                  }
                >
                  <BarList
                    data={(leadSourcesData?.sources || []).map((s) => ({
                      label: `${humanize(s.source)} (${formatPercent(s.conversionRate)} conv.)`,
                      value: s.count,
                      hint: `Converted: ${s.convertedCount} • Avg Score: ${s.avgLeadScore} • Est. Value: ${formatCurrency(s.revenue)}`,
                    }))}
                    emptyText="No lead source breakdown available."
                  />
                </SectionCard>

                <SectionCard
                  title="Lead Status Progression Table"
                  subtitle="Summary count per lifecycle stage"
                >
                  <div className="crm-progression-table">
                    {Object.entries(leadData?.kpis.statusBreakdown || {}).map(([st, cnt]) => {
                      const total = leadData?.kpis.totalLeads.current || 0;
                      const countNum = Number(cnt || 0);
                      const pct = total > 0 ? (countNum / total) * 100 : 0;
                      const isSuccess = st === 'QUALIFIED' || st === 'CONVERTED';
                      const tone = isSuccess ? 'green' : 'slate';

                      return (
                        <div key={st} className="crm-progression-row">
                          <div className="crm-progression-stage">
                            <span className={`crm-progression-dot stage-${st.toLowerCase()}`} />
                            <span className="crm-progression-name">{humanize(st)}</span>
                          </div>
                          <div className="crm-progression-metrics">
                            <span className="crm-progression-count">
                              <strong>{formatNumber(countNum)}</strong> leads
                            </span>
                            <Badge tone={tone} title={`${humanize(st)} percentage share`}>
                              {formatPercent(pct)}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>
              </div>

              {/* Lower Tier: Lead Time-Series Table */}
              <div className="crm-dashboard-tier">
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
              </div>
            </div>
          )}

          {/* ==============================================================
              3. LEAD SOURCE ANALYTICS
             ============================================================== */}
          {screen === 'lead-sources' && (
            <div className="space-y-6">
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                badge="Channel Attribution & ROI Engine"
                title="Attribute Marketing Channels."
                highlight="Optimize Lead Sources."
                subtitle="Evaluate channel efficiency, conversion rates, and revenue attribution across all inbound and outbound sources."
                actions={[
                  { label: 'Capture Lead', to: '/leads/create', variant: 'secondary', icon: <PlusIcon size={15} /> },
                  { label: 'Lead Dashboard', to: '/analytics/leads', variant: 'outline', icon: <TargetIcon size={15} /> },
                  { label: 'Revenue Analytics', to: '/analytics/revenue', variant: 'accent', icon: <TrendingUpIcon size={15} /> },
                ]}
                tickerItems={[
                  { dotColor: '#10b981', label: 'Tracked Leads:', value: formatNumber(leadSourcesData?.totalLeads) },
                  { dotColor: '#7c3aed', label: 'Active Channels:', value: formatNumber(filteredSources.length) },
                  { dotColor: '#059669', label: 'Attributed Value:', value: formatCurrency(filteredSources.reduce((s, x) => s + x.revenue, 0)) },
                ]}
              />

              {/* Balanced 3-Column Executive Matrix (Left Rail, 8 KPI Cards, Right Rail) */}
              <div className="crm-dashboard-3col">
                <div className="crm-dashboard-left-rail">
                  <DashboardLeftRail
                    progressTitle="Channel Attainment"
                    progress1Label="Attribution Coverage"
                    progress1Value="96%"
                    progress1Width="96%"
                    progress2Label="Channel Diversity"
                    progress2Value="85%"
                    progress2Width="85%"
                    progress3Label="Conversion Yield"
                    progress3Value="88%"
                    progress3Width="88%"
                    talliesTitle="Source Tallies"
                    tally1Label="Active Channels"
                    tally1Value={filteredSources.length}
                    tally2Label="Total Leads"
                    tally2Value={leadSourcesData?.totalLeads || 0}
                    tally3Label="Top Channel"
                    tally3Value={leadSourcesData?.topPerformingSource ? humanize(leadSourcesData.topPerformingSource) : 'Organic'}
                    efficiencyLabel="Attributed Revenue"
                    efficiencyValue={formatCurrency(filteredSources.reduce((s, x) => s + x.revenue, 0))}
                    auditLabel="Lead Qualification"
                    auditLink="/analytics/leads"
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: '446px' }}>
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
                      label="Active Channels"
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
                      subtitle="Highest volume channel"
                      icon={<AwardIcon size={20} />}
                      tone="green"
                    />
                    <DashboardKpiCard
                      label="Total Attributed Value"
                      value={formatCurrency(
                        filteredSources.reduce((sum, s) => sum + s.revenue, 0),
                      )}
                      subtitle="Estimated pipeline value"
                      icon={<DollarSignIcon size={20} />}
                      tone="amber"
                    />
                    <DashboardKpiCard
                      label="Converted Leads from Source"
                      value={formatNumber(
                        filteredSources.reduce((sum, s) => sum + s.convertedCount, 0),
                      )}
                      subtitle="Won customer opportunities"
                      icon={<CheckCircleIcon size={20} />}
                      tone="green"
                    />
                    <DashboardKpiCard
                      label="Average Channel Conv. Rate"
                      value={formatPercent(
                        filteredSources.length
                          ? filteredSources.reduce((sum, s) => sum + s.conversionRate, 0) /
                              filteredSources.length
                          : 0,
                      )}
                      subtitle="Cross-channel average"
                      icon={<TrendingUpIcon size={20} />}
                      tone="cyan"
                    />
                    <DashboardKpiCard
                      label="Average Lead Score"
                      value={formatNumber(
                        filteredSources.length
                          ? Math.round(
                              filteredSources.reduce((sum, s) => sum + s.avgLeadScore, 0) /
                                filteredSources.length,
                            )
                          : 0,
                      )}
                      subtitle="Channel quality rating"
                      icon={<AwardIcon size={20} />}
                      tone="blue"
                    />
                    <DashboardKpiCard
                      label="Average Deal Size / Source"
                      value={formatCurrency(
                        filteredSources.length
                          ? filteredSources.reduce((sum, s) => sum + s.avgDealSize, 0) /
                              filteredSources.length
                          : 0,
                      )}
                      subtitle="Value per closed customer"
                      icon={<DollarSignIcon size={20} />}
                      tone="purple"
                    />
                  </div>
                </div>

                <div className="crm-dashboard-right-rail">
                  <DashboardRightRail
                    pulseTitle="Channel ROI"
                    pulseSubtitle="Attribution Stream"
                    actionLabel="Create Lead"
                    actionLink="/leads/create"
                  />
                </div>
              </div>

              {/* Lower Tier: Source Volume & Revenue Charts */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
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

              {/* Lower Tier: Lead Source Performance Table */}
              <div className="crm-dashboard-tier">
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
              </div>
            </div>
          )}

          {/* ==============================================================
              4. PIPELINE ANALYTICS
             ============================================================== */}
          {screen === 'pipeline' && (
            <div className="space-y-6">
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                badge="Pipeline Health & Velocity Hub"
                title="Visualize Opportunity Stages."
                highlight="Predict Pipeline Health."
                subtitle="Comprehensive stage-by-stage visibility, deal stage distribution, and weighted probability forecasting."
                actions={[
                  { label: 'View Pipelines', to: '/pipelines', variant: 'secondary', icon: <BriefcaseIcon size={15} /> },
                  { label: 'Create Deal', to: '/deals/create', variant: 'outline', icon: <PlusIcon size={15} /> },
                  { label: 'Revenue Projections', to: '/analytics/revenue', variant: 'accent', icon: <TrendingUpIcon size={15} /> },
                ]}
                tickerItems={[
                  { dotColor: '#10b981', label: 'Active Pipeline:', value: pipelineData?.pipelineName || 'Default' },
                  { dotColor: '#7c3aed', label: 'Pipeline Value:', value: formatCurrency(pipelineData?.totalPipelineValue) },
                  { dotColor: '#059669', label: 'Weighted Forecast:', value: formatCurrency(pipelineData?.totalWeightedValue) },
                ]}
              />

              {/* Balanced 3-Column Executive Matrix (Left Rail, 8 KPI Cards, Right Rail) */}
              <div className="crm-dashboard-3col">
                <div className="crm-dashboard-left-rail">
                  <DashboardLeftRail
                    progressTitle="Pipeline Targets"
                    progress1Label="Pipeline Velocity"
                    progress1Value="92%"
                    progress1Width="92%"
                    progress2Label="Stage Progression"
                    progress2Value="86%"
                    progress2Width="86%"
                    progress3Label="Health Index"
                    progress3Value="89%"
                    progress3Width="89%"
                    talliesTitle="Pipeline Tallies"
                    tally1Label="Total Deals"
                    tally1Value={pipelineData?.totalDeals || 0}
                    tally2Label="Stages Configured"
                    tally2Value={pipelineData?.stages.length || 0}
                    tally3Label="Avg Deal Size"
                    tally3Value={formatCurrency(pipelineData?.avgDealSize || 0)}
                    efficiencyLabel="Weighted Forecast"
                    efficiencyValue={formatCurrency(pipelineData?.totalWeightedValue || 0)}
                    auditLabel="Sales Audit"
                    auditLink="/analytics/sales"
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: '446px' }}>
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
                      subtitle="Sum of all open deals"
                      icon={<DollarSignIcon size={20} />}
                      tone="green"
                    />
                    <DashboardKpiCard
                      label="Weighted Forecast Value"
                      value={formatCurrency(pipelineData?.totalWeightedValue)}
                      subtitle="Probability-adjusted value"
                      icon={<TrendingUpIcon size={20} />}
                      tone="purple"
                    />
                    <DashboardKpiCard
                      label="Total Pipeline Deals"
                      value={formatNumber(pipelineData?.totalDeals)}
                      subtitle="Deals across all stages"
                      icon={<AwardIcon size={20} />}
                      tone="amber"
                      to="/deals"
                    />
                    <DashboardKpiCard
                      label="Average Deal Size"
                      value={formatCurrency(pipelineData?.avgDealSize || salesData?.kpis.avgDealSize.current)}
                      subtitle="Opportunity value avg"
                      icon={<DollarSignIcon size={20} />}
                      tone="cyan"
                    />
                    <DashboardKpiCard
                      label="Closed Won Deals"
                      value={formatNumber(salesData?.kpis.wonDeals.current)}
                      subtitle="Successfully won"
                      icon={<CheckCircleIcon size={20} />}
                      tone="green"
                      to="/deals/won"
                    />
                    <DashboardKpiCard
                      label="Win Probability Avg"
                      value={formatPercent(
                        pipelineData?.stages.length
                          ? pipelineData.stages.reduce((s, st) => s + st.winProbability, 0) /
                              pipelineData.stages.length
                          : 0,
                      )}
                      subtitle="Stage probability avg"
                      icon={<TrendingUpIcon size={20} />}
                      tone="blue"
                    />
                    <DashboardKpiCard
                      label="Deal Cycle Velocity"
                      value={`${formatNumber(salesData?.kpis.avgSalesCycleDays || 18)} days`}
                      subtitle="Average days to close"
                      icon={<ActivityIcon size={20} />}
                      tone="purple"
                    />
                  </div>
                </div>

                <div className="crm-dashboard-right-rail">
                  <DashboardRightRail
                    pulseTitle="Pipeline Health"
                    pulseSubtitle="Stage Progression"
                    actionLabel="Create Opportunity"
                    actionLink="/deals/create"
                  />
                </div>
              </div>

              {/* Lower Tier: Pipeline Summary Widget */}
              <div className="crm-dashboard-tier">
                <PipelineSummaryWidget pipeline={pipelineData} />
              </div>

              {/* Lower Tier: Deal Count by Stage + Weighted Value by Stage */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
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

              {/* Lower Tier: Pipeline Stage Breakdown Table */}
              <div className="crm-dashboard-tier">
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
              </div>
            </div>
          )}

          {/* ==============================================================
              5. REVENUE ANALYTICS
             ============================================================== */}
          {screen === 'revenue' && (
            <div className="space-y-6">
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                badge="Financial Intelligence & Projections"
                title="Maximize Closed Revenue."
                highlight="Forecast Cash Flow."
                subtitle="Analyze historical revenue trajectory, probability-weighted deal forecasts, and average deal size growth."
                actions={[
                  { label: 'Create Deal', to: '/deals/create', variant: 'secondary', icon: <PlusIcon size={15} /> },
                  { label: 'Pipeline Review', to: '/pipelines', variant: 'outline', icon: <BriefcaseIcon size={15} /> },
                  { label: 'Executive Dashboard', to: '/dashboard', variant: 'accent', icon: <TrendingUpIcon size={15} /> },
                ]}
                tickerItems={[
                  { dotColor: '#10b981', label: 'Closed-Won:', value: formatCurrency(revenueData?.revenue.closedWonRevenue.current) },
                  { dotColor: '#7c3aed', label: 'Forecast:', value: formatCurrency(revenueData?.revenue.weightedForecastRevenue) },
                  { dotColor: '#059669', label: 'Pipeline Value:', value: formatCurrency(revenueData?.revenue.activePipelineValue) },
                ]}
              />

              {/* Balanced 3-Column Executive Matrix (Left Rail, 8 KPI Cards, Right Rail) */}
              <div className="crm-dashboard-3col">
                <div className="crm-dashboard-left-rail">
                  <DashboardLeftRail
                    progressTitle="Revenue Targets"
                    progress1Label="Revenue Quota"
                    progress1Value="88%"
                    progress1Width="88%"
                    progress2Label="Forecast Accuracy"
                    progress2Value="91%"
                    progress2Width="91%"
                    progress3Label="Deal Size Velocity"
                    progress3Value="94%"
                    progress3Width="94%"
                    talliesTitle="Revenue Tallies"
                    tally1Label="Closed Won"
                    tally1Value={formatCurrency(revenueData?.revenue.closedWonRevenue.current)}
                    tally2Label="Deals Won"
                    tally2Value={revenueData?.revenue.dealsWonCount || 0}
                    tally3Label="Active Deals"
                    tally3Value={pipelineData?.totalDeals || 0}
                    efficiencyLabel="Avg Revenue / Deal"
                    efficiencyValue={formatCurrency(revenueData?.revenue.avgRevenuePerDeal)}
                    auditLabel="Full Revenue Audit"
                    auditLink="/analytics/sales"
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: '446px' }}>
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
                      subtitle="Probability-adjusted forecast"
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
                    <DashboardKpiCard
                      label="Deals Won Count"
                      value={formatNumber(revenueData?.revenue.dealsWonCount)}
                      subtitle="Successfully closed opportunities"
                      icon={<CheckCircleIcon size={20} />}
                      tone="green"
                      to="/deals/won"
                    />
                    <DashboardKpiCard
                      label="Deal Win Rate"
                      value={formatPercent(salesData?.kpis.winRate.current)}
                      metric={salesData?.kpis.winRate}
                      formatPrev={formatPercent}
                      icon={<TrendingUpIcon size={20} />}
                      tone="cyan"
                    />
                    <DashboardKpiCard
                      label="Active Pipeline Deals"
                      value={formatNumber(pipelineData?.totalDeals)}
                      subtitle="Opportunities in progress"
                      icon={<BriefcaseIcon size={20} />}
                      tone="blue"
                      to="/pipelines"
                    />
                    <DashboardKpiCard
                      label="Sales Velocity / Day"
                      value={formatCurrency(salesData?.kpis.salesVelocityPerDay)}
                      subtitle="Daily revenue momentum"
                      icon={<TrendingUpIcon size={20} />}
                      tone="purple"
                    />
                  </div>
                </div>

                <div className="crm-dashboard-right-rail">
                  <DashboardRightRail
                    pulseTitle="Revenue Stream"
                    pulseSubtitle="Forecast Accuracy"
                    actionLabel="Create New Deal"
                    actionLink="/deals/create"
                  />
                </div>
              </div>

              {/* Lower Tier: Period Comparison Table */}
              {showComparison && (
                <div className="crm-dashboard-tier">
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
                </div>
              )}

              {/* Lower Tier: Revenue Summary Widget */}
              <div className="crm-dashboard-tier">
                <RevenueSummaryWidget revenue={revenueData} />
              </div>

              {/* Lower Tier: Revenue Time-Series Table */}
              <div className="crm-dashboard-tier">
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
              </div>
            </div>
          )}

          {/* ==============================================================
              6. CONVERSION ANALYTICS
             ============================================================== */}
          {screen === 'conversion' && (
            <div className="space-y-6">
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                badge="Full-Funnel Conversion Analysis"
                title="Track Prospect Progression."
                highlight="Eliminate Pipeline Leakage."
                subtitle="Pinpoint drop-off bottlenecks from raw lead capture to closed customer deals across each stage of your sales funnel."
                actions={[
                  { label: 'Capture Lead', to: '/leads/create', variant: 'secondary', icon: <PlusIcon size={15} /> },
                  { label: 'Create Deal', to: '/deals/create', variant: 'outline', icon: <PlusIcon size={15} /> },
                  { label: 'Lead Dashboard', to: '/analytics/leads', variant: 'accent', icon: <TargetIcon size={15} /> },
                ]}
                tickerItems={[
                  { dotColor: '#10b981', label: 'Funnel Leads:', value: formatNumber(conversionData?.totalLeads) },
                  { dotColor: '#7c3aed', label: 'Won Customers:', value: formatNumber(conversionData?.totalDealsWon) },
                  { dotColor: '#059669', label: 'Conversion Rate:', value: formatPercent(conversionData?.overallConversionRate) },
                ]}
              />

              {/* Balanced 3-Column Executive Matrix (Left Rail, 8 KPI Cards, Right Rail) */}
              <div className="crm-dashboard-3col">
                <div className="crm-dashboard-left-rail">
                  <DashboardLeftRail
                    progressTitle="Funnel Health"
                    progress1Label="Funnel Efficiency"
                    progress1Value="86%"
                    progress1Width="86%"
                    progress2Label="Stage Velocity"
                    progress2Value="89%"
                    progress2Width="89%"
                    progress3Label="Retention Quota"
                    progress3Value="93%"
                    progress3Width="93%"
                    talliesTitle="Funnel Tallies"
                    tally1Label="Total Leads"
                    tally1Value={conversionData?.totalLeads || 0}
                    tally2Label="Deals Won"
                    tally2Value={conversionData?.totalDealsWon || 0}
                    tally3Label="Stages Tracked"
                    tally3Value={conversionData?.stages.length || 0}
                    efficiencyLabel="Overall Conv. Rate"
                    efficiencyValue={formatPercent(conversionData?.overallConversionRate)}
                    auditLabel="Lead Conversion"
                    auditLink="/leads/conversion"
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: '446px' }}>
                    <DashboardKpiCard
                      label="Total Funnel Leads"
                      value={formatNumber(conversionData?.totalLeads)}
                      subtitle="Top-of-funnel leads entered"
                      icon={<TargetIcon size={20} />}
                      tone="blue"
                      to="/leads"
                    />
                    <DashboardKpiCard
                      label="Closed-Won Customers"
                      value={formatNumber(conversionData?.totalDealsWon)}
                      subtitle="Bottom-of-funnel won deals"
                      icon={<CheckCircleIcon size={20} />}
                      tone="green"
                      to="/deals/won"
                    />
                    <DashboardKpiCard
                      label="Overall Funnel Conversion"
                      value={formatPercent(conversionData?.overallConversionRate)}
                      subtitle="Lead-to-Won Deal conversion"
                      icon={<TrendingUpIcon size={20} />}
                      tone="purple"
                    />
                    <DashboardKpiCard
                      label="Lead Qualification Rate"
                      value={formatPercent(leadData?.kpis.qualificationRate.current)}
                      subtitle="Leads reaching Qualified stage"
                      icon={<AwardIcon size={20} />}
                      tone="amber"
                    />
                    <DashboardKpiCard
                      label="Qualified Prospects"
                      value={formatNumber(leadData?.kpis.statusBreakdown?.QUALIFIED || 0)}
                      subtitle="High-intent opportunities"
                      icon={<CheckCircleIcon size={20} />}
                      tone="cyan"
                      to="/leads"
                    />
                    <DashboardKpiCard
                      label="Average Lead Score"
                      value={formatNumber(leadData?.kpis.avgLeadScore)}
                      subtitle="Quality rating benchmark"
                      icon={<AwardIcon size={20} />}
                      tone="blue"
                    />
                    <DashboardKpiCard
                      label="First-Stage Drop-Off"
                      value={formatPercent(conversionData?.stages?.[0]?.dropOffRate || 0)}
                      subtitle="Early funnel leakage rate"
                      icon={<ActivityIcon size={20} />}
                      tone="amber"
                    />
                    <DashboardKpiCard
                      label="Funnel Deal Velocity"
                      value={`${formatNumber(salesData?.kpis.avgSalesCycleDays || 18)} days`}
                      subtitle="Avg cycle time to win"
                      icon={<TrendingUpIcon size={20} />}
                      tone="purple"
                    />
                  </div>
                </div>

                <div className="crm-dashboard-right-rail">
                  <DashboardRightRail
                    pulseTitle="Funnel Velocity"
                    pulseSubtitle="Leakage Prevention"
                    actionLabel="Capture New Lead"
                    actionLink="/leads/create"
                  />
                </div>
              </div>

              {/* Lower Tier: Conversion Funnel & Drop-Off Leakage */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
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

              {/* Lower Tier: Funnel Stage Conversion & Drop-Off Table */}
              <div className="crm-dashboard-tier">
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
              </div>
            </div>
          )}

          {/* ==============================================================
              7. ACTIVITY ANALYTICS
             ============================================================== */}
          {screen === 'activities' && (
            <div className="space-y-6">
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                badge="Workforce Engagement & Output"
                title="Monitor Team Touchpoints."
                highlight="Drive Execution Velocity."
                subtitle="Measure sales activity volume, completion velocity, customer interactions, and communication channels across your CRM."
                actions={[
                  { label: 'Log Activity', to: '/activities/create', variant: 'secondary', icon: <PlusIcon size={15} /> },
                  { label: 'Completed Tasks', to: '/activities/completed', variant: 'outline', icon: <CheckCircleIcon size={15} /> },
                  { label: 'Team Leaderboard', to: '/analytics/performance', variant: 'accent', icon: <TrendingUpIcon size={15} /> },
                ]}
                tickerItems={[
                  { dotColor: '#10b981', label: 'Total Activities:', value: formatNumber(activityData?.kpis.totalActivities.current) },
                  { dotColor: '#7c3aed', label: 'Completed:', value: formatNumber(activityData?.kpis.completedActivities.current) },
                  { dotColor: '#059669', label: 'Completion Rate:', value: formatPercent(activityData?.kpis.completionRate.current) },
                ]}
              />

              {/* Balanced 3-Column Executive Matrix (Left Rail, 8 KPI Cards, Right Rail) */}
              <div className="crm-dashboard-3col">
                <div className="crm-dashboard-left-rail">
                  <DashboardLeftRail
                    progressTitle="Activity Output"
                    progress1Label="Activity Output"
                    progress1Value="91%"
                    progress1Width="91%"
                    progress2Label="Completion Velocity"
                    progress2Value="88%"
                    progress2Width="88%"
                    progress3Label="Task Attainment"
                    progress3Value="94%"
                    progress3Width="94%"
                    talliesTitle="Activity Tallies"
                    tally1Label="Total Logged"
                    tally1Value={activityData?.kpis.totalActivities.current || 0}
                    tally2Label="Completed"
                    tally2Value={activityData?.kpis.completedActivities.current || 0}
                    tally3Label="Pending Tasks"
                    tally3Value={activityData?.kpis.pendingCount || 0}
                    efficiencyLabel="Completion Rate"
                    efficiencyValue={formatPercent(activityData?.kpis.completionRate.current)}
                    auditLabel="All Activities"
                    auditLink="/activities"
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: '446px' }}>
                    <DashboardKpiCard
                      label="Total Activities Logged"
                      value={formatNumber(activityData?.kpis.totalActivities.current)}
                      metric={activityData?.kpis.totalActivities}
                      icon={<ActivityIcon size={20} />}
                      tone="blue"
                      to="/activities"
                    />
                    <DashboardKpiCard
                      label="Completed Activities"
                      value={formatNumber(activityData?.kpis.completedActivities.current)}
                      metric={activityData?.kpis.completedActivities}
                      icon={<CheckCircleIcon size={20} />}
                      tone="green"
                      to="/activities/completed"
                    />
                    <DashboardKpiCard
                      label="Activity Completion Rate"
                      value={formatPercent(activityData?.kpis.completionRate.current)}
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
                    <DashboardKpiCard
                      label="Calls Completed"
                      value={formatNumber(activityData?.breakdowns.byType?.CALL || 0)}
                      subtitle="Phone interactions"
                      icon={<ActivityIcon size={20} />}
                      tone="cyan"
                    />
                    <DashboardKpiCard
                      label="Meetings Held"
                      value={formatNumber(activityData?.breakdowns.byType?.MEETING || 0)}
                      subtitle="Demo & discovery sessions"
                      icon={<BriefcaseIcon size={20} />}
                      tone="blue"
                    />
                    <DashboardKpiCard
                      label="Urgent / High Tasks"
                      value={formatNumber(
                        (activityData?.breakdowns.byPriority?.URGENT || 0) +
                          (activityData?.breakdowns.byPriority?.HIGH || 0),
                      )}
                      subtitle="Priority action items"
                      icon={<AwardIcon size={20} />}
                      tone="amber"
                    />
                    <DashboardKpiCard
                      label="Touchpoints per Deal"
                      value={`${formatNumber(activityData?.kpis.avgPerDeal || 4)}`}
                      subtitle="Effort per customer"
                      icon={<TrendingUpIcon size={20} />}
                      tone="purple"
                    />
                  </div>
                </div>

                <div className="crm-dashboard-right-rail">
                  <DashboardRightRail
                    pulseTitle="Activity Stream"
                    pulseSubtitle="Task Execution"
                    actionLabel="Log New Activity"
                    actionLink="/activities/create"
                  />
                </div>
              </div>

              {/* Lower Tier: Period Comparison Table */}
              {showComparison && (
                <div className="crm-dashboard-tier">
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
                </div>
              )}

              {/* Lower Tier: 3-Column Charts (Volume Trend + By Type + By Priority) */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-3">
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

              {/* Lower Tier: Activity Time-Series Table */}
              <div className="crm-dashboard-tier">
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
              </div>
            </div>
          )}

          {/* ==============================================================
              8. TEAM ANALYTICS
             ============================================================== */}
          {screen === 'teams' && (
            <div className="space-y-6">
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                badge="Organizational Benchmarking Hub"
                title="Empower High-Performing Teams."
                highlight="Unify Sales Collaboration."
                subtitle="Compare revenue production, deals closed, team headcount, and activity volume across regional and departmental units."
                actions={[
                  { label: 'Manage Teams', to: '/teams', variant: 'secondary', icon: <UsersIcon size={15} /> },
                  { label: 'Rep Leaderboard', to: '/analytics/performance', variant: 'outline', icon: <AwardIcon size={15} /> },
                  { label: 'Executive Dashboard', to: '/dashboard', variant: 'accent', icon: <TrendingUpIcon size={15} /> },
                ]}
                tickerItems={[
                  { dotColor: '#10b981', label: 'Sales Teams:', value: formatNumber(teamData?.totalTeams) },
                  { dotColor: '#7c3aed', label: 'Combined Revenue:', value: formatCurrency((teamData?.teams || []).reduce((s, t) => s + t.totalRevenue, 0)) },
                  { dotColor: '#059669', label: 'Deals Won:', value: formatNumber((teamData?.teams || []).reduce((s, t) => s + t.dealsWon, 0)) },
                ]}
              />

              {/* Balanced 3-Column Executive Matrix (Left Rail, 8 KPI Cards, Right Rail) */}
              <div className="crm-dashboard-3col">
                <div className="crm-dashboard-left-rail">
                  <DashboardLeftRail
                    progressTitle="Team Targets"
                    progress1Label="Team Quota"
                    progress1Value="87%"
                    progress1Width="87%"
                    progress2Label="Cross-Collaboration"
                    progress2Value="92%"
                    progress2Width="92%"
                    progress3Label="Output Index"
                    progress3Value="90%"
                    progress3Width="90%"
                    talliesTitle="Team Tallies"
                    tally1Label="Sales Teams"
                    tally1Value={teamData?.totalTeams || 0}
                    tally2Label="Deals Won"
                    tally2Value={(teamData?.teams || []).reduce((s, t) => s + t.dealsWon, 0)}
                    tally3Label="Activities"
                    tally3Value={(teamData?.teams || []).reduce((s, t) => s + t.activitiesCount, 0)}
                    efficiencyLabel="Combined Revenue"
                    efficiencyValue={formatCurrency((teamData?.teams || []).reduce((s, t) => s + t.totalRevenue, 0))}
                    auditLabel="Rep Leaderboard"
                    auditLink="/analytics/performance"
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: '446px' }}>
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
                      subtitle="Closed-won revenue"
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
                      subtitle="Opportunities closed"
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
                      subtitle="Customer touchpoints"
                      icon={<ActivityIcon size={20} />}
                      tone="amber"
                    />
                    <DashboardKpiCard
                      label="Top Performing Team"
                      value={
                        (teamData?.teams || []).slice().sort((a, b) => b.totalRevenue - a.totalRevenue)[0]?.teamName || '—'
                      }
                      subtitle="Highest revenue unit"
                      icon={<AwardIcon size={20} />}
                      tone="cyan"
                    />
                    <DashboardKpiCard
                      label="Average Team Win Rate"
                      value={formatPercent(
                        teamData?.teams && teamData.teams.length
                          ? teamData.teams.reduce((s, t) => s + t.winRate, 0) /
                              teamData.teams.length
                          : 0,
                      )}
                      subtitle="Organizational average"
                      icon={<TrendingUpIcon size={20} />}
                      tone="green"
                    />
                    <DashboardKpiCard
                      label="Total Team Members"
                      value={formatNumber(
                        (teamData?.teams || []).reduce(
                          (sum, t) => sum + t.memberCount,
                          0,
                        ),
                      )}
                      subtitle="Active representatives"
                      icon={<UsersIcon size={20} />}
                      tone="blue"
                    />
                    <DashboardKpiCard
                      label="Average Revenue / Team"
                      value={formatCurrency(
                        teamData?.teams && teamData.teams.length
                          ? teamData.teams.reduce((s, t) => s + t.totalRevenue, 0) /
                              teamData.teams.length
                          : 0,
                      )}
                      subtitle="Per-team production avg"
                      icon={<DollarSignIcon size={20} />}
                      tone="purple"
                    />
                  </div>
                </div>

                <div className="crm-dashboard-right-rail">
                  <DashboardRightRail
                    pulseTitle="Team Dynamics"
                    pulseSubtitle="Quota Distribution"
                    actionLabel="Manage Sales Teams"
                    actionLink="/teams"
                  />
                </div>
              </div>

              {/* Lower Tier: Revenue by Sales Team + Deal Volume by Sales Team */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
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

              {/* Lower Tier: Team Analytics Comparison Table */}
              <div className="crm-dashboard-tier">
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
              </div>
            </div>
          )}

          {/* ==============================================================
              9. PERFORMANCE ANALYTICS
             ============================================================== */}
          {screen === 'performance' && (
            <div className="space-y-6">
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                badge="Individual Rep Leaderboard"
                title="Celebrate Top Performers."
                highlight="Benchmark Sales Excellence."
                subtitle="Granular individual performance rankings across revenue attained, deals closed, win rate percentages, and activity dedication."
                actions={[
                  { label: 'View All Users', to: '/users', variant: 'secondary', icon: <UsersIcon size={15} /> },
                  { label: 'Team Analytics', to: '/analytics/teams', variant: 'outline', icon: <AwardIcon size={15} /> },
                  { label: 'Sales Dashboard', to: '/dashboard/sales', variant: 'accent', icon: <TrendingUpIcon size={15} /> },
                ]}
                tickerItems={[
                  { dotColor: '#10b981', label: 'Ranked Reps:', value: formatNumber(repData?.total) },
                  { dotColor: '#7c3aed', label: 'Top Performer:', value: repData?.items?.[0]?.name || '—' },
                  { dotColor: '#059669', label: 'Leaderboard Revenue:', value: formatCurrency((repData?.items || []).reduce((s, r) => s + r.totalRevenue, 0)) },
                ]}
              />

              {/* Balanced 3-Column Executive Matrix (Left Rail, 8 KPI Cards, Right Rail) */}
              <div className="crm-dashboard-3col">
                <div className="crm-dashboard-left-rail">
                  <DashboardLeftRail
                    progressTitle="Rep Attainment"
                    progress1Label="Quota Attainment"
                    progress1Value="89%"
                    progress1Width="89%"
                    progress2Label="Velocity Quota"
                    progress2Value="92%"
                    progress2Width="92%"
                    progress3Label="Rep Engagement"
                    progress3Value="94%"
                    progress3Width="94%"
                    talliesTitle="Rep Tallies"
                    tally1Label="Ranked Reps"
                    tally1Value={repData?.total || 0}
                    tally2Label="Top Rep Deals"
                    tally2Value={repData?.items?.[0]?.dealsWon || 0}
                    tally3Label="Completed Tasks"
                    tally3Value={(repData?.items || []).reduce((s, r) => s + r.activitiesCompleted, 0)}
                    efficiencyLabel="Top Performer"
                    efficiencyValue={repData?.items?.[0]?.name || 'N/A'}
                    auditLabel="Team Analytics"
                    auditLink="/analytics/teams"
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: '446px' }}>
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
                      valueClassName="crm-kpi-value-performer"
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
                      subtitle="Total completed touchpoints"
                      icon={<CheckCircleIcon size={20} />}
                      tone="purple"
                    />
                    <DashboardKpiCard
                      label="Top Win Rate"
                      value={formatPercent(
                        repData?.items?.length
                          ? Math.max(...repData.items.map((r) => r.winRate))
                          : 0,
                      )}
                      subtitle="Highest individual win rate"
                      icon={<TrendingUpIcon size={20} />}
                      tone="cyan"
                    />
                    <DashboardKpiCard
                      label="Total Deals Won by Reps"
                      value={formatNumber(
                        (repData?.items || []).reduce(
                          (sum, r) => sum + r.dealsWon,
                          0,
                        ),
                      )}
                      subtitle="Individual closures"
                      icon={<AwardIcon size={20} />}
                      tone="green"
                    />
                    <DashboardKpiCard
                      label="Average Won Deal Size"
                      value={formatCurrency(
                        repData?.items?.length
                          ? repData.items.reduce((s, r) => s + r.avgDealSize, 0) /
                              repData.items.length
                          : 0,
                      )}
                      subtitle="Benchmark across reps"
                      icon={<DollarSignIcon size={20} />}
                      tone="blue"
                    />
                    <DashboardKpiCard
                      label="Average Leads Assigned"
                      value={formatNumber(
                        repData?.items?.length
                          ? Math.round(
                              repData.items.reduce((s, r) => s + r.leadsAssigned, 0) /
                                repData.items.length,
                            )
                          : 0,
                      )}
                      subtitle="Lead distribution avg"
                      icon={<TargetIcon size={20} />}
                      tone="purple"
                    />
                  </div>
                </div>

                <div className="crm-dashboard-right-rail">
                  <DashboardRightRail
                    pulseTitle="Leaderboard"
                    pulseSubtitle="Individual Output"
                    actionLabel="View Sales Reps"
                    actionLink="/users"
                  />
                </div>
              </div>

              {/* Lower Tier: Representative Revenue Ranking + Activity Output */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
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

              {/* Lower Tier: Sales Representative Performance Leaderboard Table */}
              <div className="crm-dashboard-tier">
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
              </div>
            </div>
          )}
        </div>
      )}
    </AnalyticsLayout>
  );
};
