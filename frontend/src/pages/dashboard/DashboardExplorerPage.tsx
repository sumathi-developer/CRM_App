import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../../context/useWorkspace';
import { dashboardService } from '../../services/dashboard.service';
import type {
  ActivityAnalyticsResponse,
  ConversionFunnelResponse,
  CustomWidgetConfig,
  CustomWidgetId,
  DashboardLookupOption,
  DashboardQueryFilters,
  DashboardRecentActivity,
  DashboardRecentDeal,
  DashboardRecentLead,
  DashboardScreenSlug,
  LeadAnalyticsResponse,
  LeadSourceAnalyticsResponse,
  OverviewAnalyticsResponse,
  PipelineAnalyticsResponse,
  RepPerformanceResponse,
  RevenueAnalyticsResponse,
  SalesAnalyticsResponse,
  TeamAnalyticsResponse,
} from '../../types/dashboard.types';
import {
  CUSTOM_WIDGETS_STORAGE_KEY,
  DEFAULT_CUSTOM_WIDGETS,
} from './dashboardConstants';
import { DashboardLayout } from './components/DashboardLayout';
import {
  DashboardFilterBar,
  DashboardKpiCard,
  DashboardSkeleton,
  PipelineSummaryWidget,
  RecentActivitiesWidget,
  RecentDealsWidget,
  RecentLeadsWidget,
  RevenueSummaryWidget,
  TeamPerformanceWidget,
} from './components/DashboardWidgets';
import { SectionCard } from '../lead-generation/components/Cards';
import {
  BarList,
  DonutChart,
  Funnel,
  LineChart,
} from '../lead-generation/components/Charts';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  humanize,
} from '../lead-generation/leadGenConstants';
import {
  ActivityIcon,
  AwardIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  DollarSignIcon,
  PlusIcon,
  SlidersIcon,
  TargetIcon,
  TrendingUpIcon,
  UsersIcon,
} from '../../components/common/Icons';

interface DashboardExplorerPageProps {
  screen: DashboardScreenSlug;
}

function loadSavedWidgetConfigs(): CustomWidgetConfig[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_WIDGETS_STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOM_WIDGETS;
    const parsed = JSON.parse(raw) as CustomWidgetConfig[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_CUSTOM_WIDGETS;
    }
    return DEFAULT_CUSTOM_WIDGETS.map((def) => {
      const match = parsed.find((p) => p.id === def.id);
      return match
        ? {
            ...def,
            enabled: Boolean(match.enabled),
            span: match.span === 'full' ? 'full' : 'half',
          }
        : def;
    });
  } catch {
    return DEFAULT_CUSTOM_WIDGETS;
  }
}

export const DashboardExplorerPage: React.FC<DashboardExplorerPageProps> = ({
  screen,
}) => {
  const { currentWorkspace } = useWorkspace();

  // Filter State
  const [filters, setFilters] = useState<DashboardQueryFilters>({
    timeframe: 'LAST_30_DAYS',
  });

  // Lookup Options State
  const [teamsLookup, setTeamsLookup] = useState<DashboardLookupOption[]>([]);
  const [usersLookup, setUsersLookup] = useState<DashboardLookupOption[]>([]);
  const [pipelinesLookup, setPipelinesLookup] = useState<
    DashboardLookupOption[]
  >([]);

  // Analytics & Widget Data State
  const [overviewData, setOverviewData] =
    useState<OverviewAnalyticsResponse | null>(null);
  const [salesData, setSalesData] = useState<SalesAnalyticsResponse | null>(
    null,
  );
  const [revenueData, setRevenueData] =
    useState<RevenueAnalyticsResponse | null>(null);
  const [pipelineData, setPipelineData] =
    useState<PipelineAnalyticsResponse | null>(null);
  const [leadData, setLeadData] = useState<LeadAnalyticsResponse | null>(null);
  const [leadSourcesData, setLeadSourcesData] =
    useState<LeadSourceAnalyticsResponse | null>(null);
  const [conversionData, setConversionData] =
    useState<ConversionFunnelResponse | null>(null);
  const [activityData, setActivityData] =
    useState<ActivityAnalyticsResponse | null>(null);
  const [teamData, setTeamData] = useState<TeamAnalyticsResponse | null>(null);
  const [repData, setRepData] = useState<RepPerformanceResponse | null>(null);

  const [recentDeals, setRecentDeals] = useState<DashboardRecentDeal[]>([]);
  const [recentLeads, setRecentLeads] = useState<DashboardRecentLead[]>([]);
  const [recentActivities, setRecentActivities] = useState<
    DashboardRecentActivity[]
  >([]);

  // Custom Dashboard Builder State
  const [customWidgets, setCustomWidgets] = useState<CustomWidgetConfig[]>(() =>
    loadSavedWidgetConfigs(),
  );
  const [isCustomBuilderOpen, setIsCustomBuilderOpen] =
    useState<boolean>(false);

  // Feedback State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | string[] | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  // Load Screen-Specific Dashboard Data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const activeFilters: DashboardQueryFilters = {
      ...filters,
      workspaceId: currentWorkspace?.id,
    };

    try {
      if (screen === 'overview') {
        const [overview, pipeline, revenue, deals, leads, activities] =
          await Promise.all([
            dashboardService.getOverviewAnalytics(activeFilters),
            dashboardService.getPipelineAnalytics(activeFilters),
            dashboardService.getRevenueAnalytics(activeFilters),
            dashboardService.getRecentDeals({ ...activeFilters, limit: 5 }),
            dashboardService.getRecentLeads({ ...activeFilters, limit: 5 }),
            dashboardService.getRecentActivities({ ...activeFilters, limit: 5 }),
          ]);
        setOverviewData(overview);
        setPipelineData(pipeline);
        setRevenueData(revenue);
        setRecentDeals(deals);
        setRecentLeads(leads);
        setRecentActivities(activities);
      } else if (screen === 'sales') {
        const [sales, pipeline, deals, activities] = await Promise.all([
          dashboardService.getSalesAnalytics(activeFilters),
          dashboardService.getPipelineAnalytics(activeFilters),
          dashboardService.getRecentDeals({ ...activeFilters, limit: 6 }),
          dashboardService.getRecentActivities({ ...activeFilters, limit: 6 }),
        ]);
        setSalesData(sales);
        setPipelineData(pipeline);
        setRecentDeals(deals);
        setRecentActivities(activities);
      } else if (screen === 'leads') {
        const [leadsAnalytics, sources, funnel, recentL] = await Promise.all([
          dashboardService.getLeadAnalytics(activeFilters),
          dashboardService.getLeadSourceAnalytics(activeFilters),
          dashboardService.getConversionFunnel(activeFilters),
          dashboardService.getRecentLeads({ ...activeFilters, limit: 6 }),
        ]);
        setLeadData(leadsAnalytics);
        setLeadSourcesData(sources);
        setConversionData(funnel);
        setRecentLeads(recentL);
      } else if (screen === 'revenue') {
        const [rev, sales, pipeline, deals] = await Promise.all([
          dashboardService.getRevenueAnalytics(activeFilters),
          dashboardService.getSalesAnalytics(activeFilters),
          dashboardService.getPipelineAnalytics(activeFilters),
          dashboardService.getRecentDeals({ ...activeFilters, limit: 6 }),
        ]);
        setRevenueData(rev);
        setSalesData(sales);
        setPipelineData(pipeline);
        setRecentDeals(deals);
      } else if (screen === 'teams') {
        const [teamsRes, repsRes, actAnalytics, recentAct] = await Promise.all([
          dashboardService.getTeamAnalytics(activeFilters),
          dashboardService.getRepPerformance({ ...activeFilters, limit: 15 }),
          dashboardService.getActivityAnalytics(activeFilters),
          dashboardService.getRecentActivities({ ...activeFilters, limit: 6 }),
        ]);
        setTeamData(teamsRes);
        setRepData(repsRes);
        setActivityData(actAnalytics);
        setRecentActivities(recentAct);
      } else if (screen === 'custom') {
        const [
          overview,
          revenue,
          pipeline,
          sources,
          funnel,
          actAnalytics,
          teamsRes,
          repsRes,
          deals,
          leads,
          activities,
        ] = await Promise.all([
          dashboardService.getOverviewAnalytics(activeFilters),
          dashboardService.getRevenueAnalytics(activeFilters),
          dashboardService.getPipelineAnalytics(activeFilters),
          dashboardService.getLeadSourceAnalytics(activeFilters),
          dashboardService.getConversionFunnel(activeFilters),
          dashboardService.getActivityAnalytics(activeFilters),
          dashboardService.getTeamAnalytics(activeFilters),
          dashboardService.getRepPerformance({ ...activeFilters, limit: 10 }),
          dashboardService.getRecentDeals({ ...activeFilters, limit: 5 }),
          dashboardService.getRecentLeads({ ...activeFilters, limit: 5 }),
          dashboardService.getRecentActivities({ ...activeFilters, limit: 5 }),
        ]);
        setOverviewData(overview);
        setRevenueData(revenue);
        setPipelineData(pipeline);
        setLeadSourcesData(sources);
        setConversionData(funnel);
        setActivityData(actAnalytics);
        setTeamData(teamsRes);
        setRepData(repsRes);
        setRecentDeals(deals);
        setRecentLeads(leads);
        setRecentActivities(activities);
      }
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string | string[] } };
      };
      setError(
        apiErr?.response?.data?.message ||
          'Failed to load dashboard metrics. Please try refreshing.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [screen, filters, currentWorkspace?.id]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  // Custom Widget Persistence Helpers
  const saveCustomWidgets = (next: CustomWidgetConfig[]) => {
    setCustomWidgets(next);
    try {
      window.localStorage.setItem(
        CUSTOM_WIDGETS_STORAGE_KEY,
        JSON.stringify(next),
      );
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleToggleWidget = (id: CustomWidgetId) => {
    const next = customWidgets.map((w) =>
      w.id === id ? { ...w, enabled: !w.enabled } : w,
    );
    saveCustomWidgets(next);
  };

  const handleToggleWidgetSpan = (id: CustomWidgetId) => {
    const next: CustomWidgetConfig[] = customWidgets.map((w) =>
      w.id === id
        ? { ...w, span: w.span === 'full' ? ('half' as const) : ('full' as const) }
        : w,
    );
    saveCustomWidgets(next);
  };

  const handleResetCustomWidgets = () => {
    saveCustomWidgets(DEFAULT_CUSTOM_WIDGETS);
    setSuccess('Custom dashboard layout restored to defaults.');
  };

  const handleResetFilters = () => {
    setFilters({ timeframe: 'LAST_30_DAYS' });
  };

  return (
    <DashboardLayout
      screen={screen}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {screen === 'custom' && (
            <button
              type="button"
              onClick={() => setIsCustomBuilderOpen((prev) => !prev)}
              className="lg-btn lg-btn-primary"
            >
              <SlidersIcon size={15} />
              <span>
                {isCustomBuilderOpen
                  ? 'Hide Widget Customizer'
                  : 'Customize Widgets'}
              </span>
            </button>
          )}
          <Link to="/deals/create" className="lg-btn lg-btn-secondary">
            <PlusIcon size={15} />
            <span>New Deal</span>
          </Link>
          <Link to="/leads/create" className="lg-btn lg-btn-secondary">
            <PlusIcon size={15} />
            <span>New Lead</span>
          </Link>
        </div>
      }
      filterBar={
        <DashboardFilterBar
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          onRefresh={() => void loadDashboardData()}
          isLoading={isLoading}
          teams={teamsLookup}
          users={usersLookup}
          pipelines={pipelinesLookup}
          showPipelineFilter={screen !== 'leads' && screen !== 'teams'}
        />
      }
    >
      {isLoading ? (
        <DashboardSkeleton cardCount={screen === 'overview' ? 8 : 4} />
      ) : (
        <>
          {/* ==============================================================
              SCREEN 1: OVERVIEW DASHBOARD
             ============================================================== */}
          {screen === 'overview' && (
            <div className="space-y-6">
              {/* 8 Executive KPI Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardKpiCard
                  label="Total Revenue (Won)"
                  value={formatCurrency(
                    overviewData?.kpis.totalRevenue.current,
                  )}
                  metric={overviewData?.kpis.totalRevenue}
                  formatPrev={formatCurrency}
                  icon={<DollarSignIcon size={20} />}
                  tone="green"
                  to="/dashboard/revenue"
                />
                <DashboardKpiCard
                  label="Active Pipeline Value"
                  value={formatCurrency(
                    overviewData?.kpis.activePipelineValue.current,
                  )}
                  metric={overviewData?.kpis.activePipelineValue}
                  formatPrev={formatCurrency}
                  icon={<BriefcaseIcon size={20} />}
                  tone="blue"
                  to="/pipelines"
                />
                <DashboardKpiCard
                  label="Deals Won"
                  value={formatNumber(overviewData?.kpis.dealsWon.current)}
                  metric={overviewData?.kpis.dealsWon}
                  icon={<AwardIcon size={20} />}
                  tone="purple"
                  to="/deals/won"
                />
                <DashboardKpiCard
                  label="Deal Win Rate"
                  value={formatPercent(overviewData?.kpis.winRate.current)}
                  metric={overviewData?.kpis.winRate}
                  formatPrev={formatPercent}
                  icon={<TrendingUpIcon size={20} />}
                  tone="cyan"
                  to="/dashboard/sales"
                />
                <DashboardKpiCard
                  label="New Leads Captured"
                  value={formatNumber(overviewData?.kpis.newLeads.current)}
                  metric={overviewData?.kpis.newLeads}
                  icon={<TargetIcon size={20} />}
                  tone="amber"
                  to="/dashboard/leads"
                />
                <DashboardKpiCard
                  label="Lead Conversion Rate"
                  value={formatPercent(
                    overviewData?.kpis.leadConversionRate.current,
                  )}
                  metric={overviewData?.kpis.leadConversionRate}
                  formatPrev={formatPercent}
                  icon={<TrendingUpIcon size={20} />}
                  tone="green"
                  to="/leads/conversion"
                />
                <DashboardKpiCard
                  label="Average Deal Size"
                  value={formatCurrency(
                    overviewData?.kpis.avgDealSize.current,
                  )}
                  metric={overviewData?.kpis.avgDealSize}
                  formatPrev={formatCurrency}
                  icon={<DollarSignIcon size={20} />}
                  tone="blue"
                  to="/deals"
                />
                <DashboardKpiCard
                  label="Completed Activities"
                  value={formatNumber(
                    overviewData?.kpis.activitiesCompleted.current,
                  )}
                  metric={overviewData?.kpis.activitiesCompleted}
                  icon={<CheckCircleIcon size={20} />}
                  tone="purple"
                  to="/activities/completed"
                />
              </div>

              {/* Revenue Summary + Pipeline Summary */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <RevenueSummaryWidget revenue={revenueData} />
                <PipelineSummaryWidget pipeline={pipelineData} />
              </div>

              {/* Conversion Funnel + Top Lead Sources */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Full-Funnel Conversion Summary"
                  subtitle="Progression from captured leads to closed-won customer deals"
                >
                  <Funnel
                    steps={(overviewData?.funnelSummary || []).map((st) => ({
                      label: `${st.name} (${formatPercent(st.conversionRate)})`,
                      value: st.count,
                    }))}
                  />
                </SectionCard>

                <SectionCard
                  title="Top Lead Acquisition Sources"
                  subtitle="Highest volume lead channels in the selected period"
                  actions={
                    <Link
                      to="/dashboard/leads"
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Lead Dashboard →
                    </Link>
                  }
                >
                  <BarList
                    data={(overviewData?.topLeadSources || []).map((src) => ({
                      label: humanize(src.source),
                      value: src.count,
                      hint: `Conversion: ${formatPercent(src.conversionRate)} • Attributed: ${formatCurrency(src.revenue)}`,
                    }))}
                    emptyText="No lead source data recorded in this period."
                  />
                </SectionCard>
              </div>

              {/* Recent Records: Deals, Leads, Activities */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <RecentDealsWidget deals={recentDeals} />
                <RecentLeadsWidget leads={recentLeads} />
                <RecentActivitiesWidget activities={recentActivities} />
              </div>
            </div>
          )}

          {/* ==============================================================
              SCREEN 2: SALES DASHBOARD
             ============================================================== */}
          {screen === 'sales' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  label="Win Rate"
                  value={formatPercent(salesData?.kpis.winRate.current)}
                  metric={salesData?.kpis.winRate}
                  formatPrev={formatPercent}
                  icon={<TrendingUpIcon size={20} />}
                  tone="purple"
                  to="/deals"
                />
                <DashboardKpiCard
                  label="Sales Velocity / Day"
                  value={formatCurrency(salesData?.kpis.salesVelocityPerDay)}
                  subtitle={`Avg Sales Cycle: ${formatNumber(salesData?.kpis.avgSalesCycleDays)} days`}
                  icon={<ActivityIcon size={20} />}
                  tone="amber"
                  to="/pipelines"
                />
              </div>

              {/* Secondary Sales Metrics Strip */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <DashboardKpiCard
                  label="Open Deals"
                  value={formatNumber(salesData?.kpis.openDealsCount)}
                  subtitle="Currently active in pipeline"
                  tone="blue"
                  to="/deals"
                />
                <DashboardKpiCard
                  label="Lost Deals"
                  value={formatNumber(salesData?.kpis.lostDealsCount)}
                  subtitle="Closed-lost in period"
                  tone="red"
                  to="/deals/lost"
                />
                <DashboardKpiCard
                  label="Average Won Deal Size"
                  value={formatCurrency(salesData?.kpis.avgDealSize.current)}
                  metric={salesData?.kpis.avgDealSize}
                  formatPrev={formatCurrency}
                  tone="green"
                  to="/deals/won"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                  subtitle="Proportion of Won, Open, and Lost deals"
                >
                  <DonutChart
                    centerLabel="Deals"
                    data={[
                      {
                        label: 'Won Deals',
                        value: salesData?.kpis.wonDeals.current || 0,
                      },
                      {
                        label: 'Open Deals',
                        value: salesData?.kpis.openDealsCount || 0,
                      },
                      {
                        label: 'Lost Deals',
                        value: salesData?.kpis.lostDealsCount || 0,
                      },
                    ]}
                    emptyText="No deal status distribution available."
                  />
                </SectionCard>
              </div>

              <PipelineSummaryWidget pipeline={pipelineData} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <RecentDealsWidget deals={recentDeals} />
                <RecentActivitiesWidget activities={recentActivities} />
              </div>
            </div>
          )}

          {/* ==============================================================
              SCREEN 3: LEAD DASHBOARD
             ============================================================== */}
          {screen === 'leads' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  to="/leads/qualification"
                />
                <DashboardKpiCard
                  label="Average Lead Score"
                  value={formatNumber(leadData?.kpis.avgLeadScore)}
                  subtitle={`Qualification Rate: ${formatPercent(leadData?.kpis.qualificationRate.current)}`}
                  icon={<AwardIcon size={20} />}
                  tone="amber"
                  to="/leads/scoring"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Lead Acquisition Velocity"
                  subtitle="Leads generated over the selected timeframe"
                >
                  <LineChart
                    height={220}
                    points={(leadData?.timeSeries || []).map((pt) => ({
                      label: pt.label || pt.date.slice(5),
                      value: pt.value,
                    }))}
                    emptyText="No leads captured during this period."
                  />
                </SectionCard>

                <SectionCard
                  title="Lead Qualification Status Breakdown"
                  subtitle="Distribution across New, Contacted, Qualified, Converted, and Unqualified"
                >
                  <DonutChart
                    centerLabel="Leads"
                    data={Object.entries(
                      leadData?.kpis.statusBreakdown || {},
                    ).map(([status, count]) => ({
                      label: humanize(status),
                      value: Number(count || 0),
                    }))}
                    emptyText="No lead status breakdown available."
                  />
                </SectionCard>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Lead Source Performance & Attribution"
                  subtitle={`Top source: ${leadSourcesData?.topPerformingSource ? humanize(leadSourcesData.topPerformingSource) : 'N/A'}`}
                  actions={
                    <Link
                      to="/lead-generation/analytics/sources"
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Source Analytics →
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
                  title="Lead-to-Customer Conversion Funnel"
                  subtitle={`Overall Funnel Conversion: ${formatPercent(conversionData?.overallConversionRate)}`}
                >
                  <Funnel
                    steps={(conversionData?.stages || []).map((st) => ({
                      label: `${st.name} (${formatPercent(st.conversionRate)})`,
                      value: st.count,
                    }))}
                  />
                </SectionCard>
              </div>

              <RecentLeadsWidget leads={recentLeads} />
            </div>
          )}

          {/* ==============================================================
              SCREEN 4: REVENUE DASHBOARD
             ============================================================== */}
          {screen === 'revenue' && (
            <div className="space-y-6">
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
                  label="Weighted Forecast Revenue"
                  value={formatCurrency(
                    revenueData?.revenue.weightedForecastRevenue,
                  )}
                  subtitle="Expected value adjusted by stage probability"
                  icon={<TrendingUpIcon size={20} />}
                  tone="blue"
                  to="/pipelines/probability"
                />
                <DashboardKpiCard
                  label="Open Pipeline Value"
                  value={formatCurrency(
                    revenueData?.revenue.activePipelineValue,
                  )}
                  subtitle="Total unclosed deal value"
                  icon={<BriefcaseIcon size={20} />}
                  tone="purple"
                  to="/pipelines"
                />
                <DashboardKpiCard
                  label="Avg Revenue per Won Deal"
                  value={formatCurrency(
                    revenueData?.revenue.avgRevenuePerDeal,
                  )}
                  subtitle={`${formatNumber(revenueData?.revenue.dealsWonCount)} won deals`}
                  icon={<AwardIcon size={20} />}
                  tone="amber"
                  to="/deals/won"
                />
              </div>

              <RevenueSummaryWidget revenue={revenueData} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Revenue by Pipeline Stage"
                  subtitle="Total vs. probability-weighted value across active stages"
                >
                  <BarList
                    data={(pipelineData?.stages || []).map((st) => ({
                      label: `${st.stageName} (${st.dealCount} deals • ${st.winProbability}%)`,
                      value: st.totalValue,
                      hint: `Weighted Forecast: ${formatCurrency(st.weightedValue)}`,
                    }))}
                    formatValue={formatCurrency}
                    emptyText="No stage revenue data available."
                  />
                </SectionCard>

                <RecentDealsWidget deals={recentDeals} />
              </div>
            </div>
          )}

          {/* ==============================================================
              SCREEN 5: TEAM PERFORMANCE DASHBOARD
             ============================================================== */}
          {screen === 'teams' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardKpiCard
                  label="Active Sales Teams"
                  value={formatNumber(teamData?.totalTeams)}
                  subtitle="Teams tracked in period"
                  icon={<UsersIcon size={20} />}
                  tone="blue"
                  to="/teams"
                />
                <DashboardKpiCard
                  label="Ranked Representatives"
                  value={formatNumber(repData?.total)}
                  subtitle="Active sales reps on leaderboard"
                  icon={<AwardIcon size={20} />}
                  tone="purple"
                  to="/users"
                />
                <DashboardKpiCard
                  label="Completed Team Activities"
                  value={formatNumber(
                    activityData?.kpis.completedActivities.current,
                  )}
                  metric={activityData?.kpis.completedActivities}
                  icon={<CheckCircleIcon size={20} />}
                  tone="green"
                  to="/activities/completed"
                />
                <DashboardKpiCard
                  label="Activity Completion Rate"
                  value={formatPercent(
                    activityData?.kpis.completionRate.current,
                  )}
                  metric={activityData?.kpis.completionRate}
                  formatPrev={formatPercent}
                  icon={<ActivityIcon size={20} />}
                  tone="amber"
                  to="/activities"
                />
              </div>

              {/* Team Comparison + Rep Leaderboard */}
              <TeamPerformanceWidget
                teams={teamData?.teams || []}
                reps={repData?.items || []}
              />

              {/* Activity Breakdown by Type & Priority + Recent Activities */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Team Activity Breakdown by Type"
                  subtitle="Calls, Emails, Meetings, Follow-ups, and WhatsApp touchpoints"
                >
                  <BarList
                    data={Object.entries(
                      activityData?.breakdowns.byType || {},
                    ).map(([type, count]) => ({
                      label: humanize(type),
                      value: Number(count || 0),
                    }))}
                    emptyText="No activities logged in the selected period."
                  />
                </SectionCard>

                <RecentActivitiesWidget activities={recentActivities} />
              </div>
            </div>
          )}

          {/* ==============================================================
              SCREEN 6: CUSTOM DASHBOARD
             ============================================================== */}
          {screen === 'custom' && (
            <div className="space-y-6">
              {/* Interactive Widget Customizer Drawer/Card */}
              {isCustomBuilderOpen && (
                <SectionCard
                  title="Customize Your Dashboard Layout"
                  subtitle="Toggle widgets on or off and choose Half-Width or Full-Width layout spans. Preferences are saved automatically."
                  actions={
                    <button
                      type="button"
                      onClick={handleResetCustomWidgets}
                      className="lg-btn lg-btn-secondary"
                    >
                      Restore Default Layout
                    </button>
                  }
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {customWidgets.map((w) => (
                      <div
                        key={w.id}
                        className={`flex flex-col justify-between rounded-xl border p-3.5 transition ${
                          w.enabled
                            ? 'border-blue-300 bg-blue-50/40'
                            : 'border-gray-200 bg-gray-50/60 opacity-75'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-gray-900">
                              <input
                                type="checkbox"
                                checked={w.enabled}
                                onChange={() => handleToggleWidget(w.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>{w.title}</span>
                            </label>
                            <span className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                              {w.category}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[11px] text-gray-600">
                            {w.description}
                          </p>
                        </div>

                        {w.id !== 'kpi_summary' &&
                          w.id !== 'team_leaderboard' && (
                            <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-gray-200/70 pt-2">
                              <span className="text-[10px] font-semibold text-gray-500">
                                Width:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleWidgetSpan(w.id)}
                                className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-700 hover:bg-gray-100"
                              >
                                {w.span === 'full' ? 'Full Width' : 'Half Width'}
                              </button>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Render Enabled Custom Widgets */}
              {customWidgets.filter((w) => w.enabled).length === 0 ? (
                <SectionCard
                  title="No Custom Widgets Enabled"
                  subtitle="Enable one or more widgets to populate your custom dashboard"
                >
                  <div className="py-6 text-center">
                    <button
                      type="button"
                      onClick={handleResetCustomWidgets}
                      className="lg-btn lg-btn-primary"
                    >
                      Restore Default Widgets
                    </button>
                  </div>
                </SectionCard>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {customWidgets
                    .filter((w) => w.enabled)
                    .map((w) => {
                      const colSpanClass =
                        w.span === 'full' ? 'lg:col-span-12' : 'lg:col-span-6';

                      if (w.id === 'kpi_summary') {
                        return (
                          <div key={w.id} className="lg:col-span-12">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <DashboardKpiCard
                                label="Total Revenue"
                                value={formatCurrency(
                                  overviewData?.kpis.totalRevenue.current,
                                )}
                                metric={overviewData?.kpis.totalRevenue}
                                formatPrev={formatCurrency}
                                tone="green"
                                to="/dashboard/revenue"
                              />
                              <DashboardKpiCard
                                label="Pipeline Value"
                                value={formatCurrency(
                                  overviewData?.kpis.activePipelineValue
                                    .current,
                                )}
                                tone="blue"
                                to="/pipelines"
                              />
                              <DashboardKpiCard
                                label="New Leads"
                                value={formatNumber(
                                  overviewData?.kpis.newLeads.current,
                                )}
                                metric={overviewData?.kpis.newLeads}
                                tone="amber"
                                to="/dashboard/leads"
                              />
                              <DashboardKpiCard
                                label="Deal Win Rate"
                                value={formatPercent(
                                  overviewData?.kpis.winRate.current,
                                )}
                                metric={overviewData?.kpis.winRate}
                                formatPrev={formatPercent}
                                tone="purple"
                                to="/dashboard/sales"
                              />
                            </div>
                          </div>
                        );
                      }

                      if (w.id === 'revenue_summary') {
                        return (
                          <div key={w.id} className={colSpanClass}>
                            <RevenueSummaryWidget revenue={revenueData} />
                          </div>
                        );
                      }

                      if (w.id === 'pipeline_summary') {
                        return (
                          <div key={w.id} className={colSpanClass}>
                            <PipelineSummaryWidget pipeline={pipelineData} />
                          </div>
                        );
                      }

                      if (w.id === 'lead_funnel') {
                        return (
                          <div key={w.id} className={colSpanClass}>
                            <SectionCard
                              title="Lead Conversion Funnel"
                              subtitle={`Overall Conversion: ${formatPercent(conversionData?.overallConversionRate)}`}
                            >
                              <Funnel
                                steps={(conversionData?.stages || []).map(
                                  (st) => ({
                                    label: `${st.name} (${formatPercent(st.conversionRate)})`,
                                    value: st.count,
                                  }),
                                )}
                              />
                            </SectionCard>
                          </div>
                        );
                      }

                      if (w.id === 'lead_sources') {
                        return (
                          <div key={w.id} className={colSpanClass}>
                            <SectionCard
                              title="Lead Source Attribution"
                              subtitle="Lead volume and conversion rate by channel"
                            >
                              <BarList
                                data={(leadSourcesData?.sources || []).map(
                                  (s) => ({
                                    label: `${humanize(s.source)} (${formatPercent(s.conversionRate)})`,
                                    value: s.count,
                                  }),
                                )}
                                emptyText="No lead source data."
                              />
                            </SectionCard>
                          </div>
                        );
                      }

                      if (w.id === 'activity_breakdown') {
                        return (
                          <div key={w.id} className={colSpanClass}>
                            <SectionCard
                              title="Activity Breakdown by Type"
                              subtitle="Completed vs. scheduled touchpoints"
                            >
                              <DonutChart
                                centerLabel="Activities"
                                data={Object.entries(
                                  activityData?.breakdowns.byType || {},
                                ).map(([type, count]) => ({
                                  label: humanize(type),
                                  value: Number(count || 0),
                                }))}
                                emptyText="No activity breakdown data."
                              />
                            </SectionCard>
                          </div>
                        );
                      }

                      if (w.id === 'recent_deals') {
                        return (
                          <div key={w.id} className={colSpanClass}>
                            <RecentDealsWidget deals={recentDeals} />
                          </div>
                        );
                      }

                      if (w.id === 'recent_leads') {
                        return (
                          <div key={w.id} className={colSpanClass}>
                            <RecentLeadsWidget leads={recentLeads} />
                          </div>
                        );
                      }

                      if (w.id === 'recent_activities') {
                        return (
                          <div key={w.id} className={colSpanClass}>
                            <RecentActivitiesWidget
                              activities={recentActivities}
                            />
                          </div>
                        );
                      }

                      if (w.id === 'team_leaderboard') {
                        return (
                          <div key={w.id} className="lg:col-span-12">
                            <TeamPerformanceWidget
                              teams={teamData?.teams || []}
                              reps={repData?.items || []}
                            />
                          </div>
                        );
                      }

                      return null;
                    })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};
