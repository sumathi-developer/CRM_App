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
import { Button } from '../../components/ui';
import { DashboardScenicHero } from './components/DashboardScenicHero';
import { DashboardLeftRail, DashboardRightRail } from './components/DashboardRails';
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
  ArrowRightIcon,
  AwardIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  DollarSignIcon,
  PlusIcon,
  RefreshCwIcon,
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

  // Load Screen-Specific Dashboard Data (Unified across all streams)
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
        const [sales, pipeline, revenue, deals, leads, activities] =
          await Promise.all([
            dashboardService.getSalesAnalytics(activeFilters),
            dashboardService.getPipelineAnalytics(activeFilters),
            dashboardService.getRevenueAnalytics(activeFilters),
            dashboardService.getRecentDeals({ ...activeFilters, limit: 5 }),
            dashboardService.getRecentLeads({ ...activeFilters, limit: 5 }),
            dashboardService.getRecentActivities({ ...activeFilters, limit: 5 }),
          ]);
        setSalesData(sales);
        setPipelineData(pipeline);
        setRevenueData(revenue);
        setRecentDeals(deals);
        setRecentLeads(leads);
        setRecentActivities(activities);
      } else if (screen === 'leads') {
        const [leadsAnalytics, sources, funnel, deals, recentL, activities] =
          await Promise.all([
            dashboardService.getLeadAnalytics(activeFilters),
            dashboardService.getLeadSourceAnalytics(activeFilters),
            dashboardService.getConversionFunnel(activeFilters),
            dashboardService.getRecentDeals({ ...activeFilters, limit: 5 }),
            dashboardService.getRecentLeads({ ...activeFilters, limit: 5 }),
            dashboardService.getRecentActivities({ ...activeFilters, limit: 5 }),
          ]);
        setLeadData(leadsAnalytics);
        setLeadSourcesData(sources);
        setConversionData(funnel);
        setRecentDeals(deals);
        setRecentLeads(recentL);
        setRecentActivities(activities);
      } else if (screen === 'revenue') {
        const [rev, sales, pipeline, deals, leads, activities] =
          await Promise.all([
            dashboardService.getRevenueAnalytics(activeFilters),
            dashboardService.getSalesAnalytics(activeFilters),
            dashboardService.getPipelineAnalytics(activeFilters),
            dashboardService.getRecentDeals({ ...activeFilters, limit: 5 }),
            dashboardService.getRecentLeads({ ...activeFilters, limit: 5 }),
            dashboardService.getRecentActivities({ ...activeFilters, limit: 5 }),
          ]);
        setRevenueData(rev);
        setSalesData(sales);
        setPipelineData(pipeline);
        setRecentDeals(deals);
        setRecentLeads(leads);
        setRecentActivities(activities);
      } else if (screen === 'teams') {
        const [teamsRes, repsRes, actAnalytics, deals, leads, recentAct] =
          await Promise.all([
            dashboardService.getTeamAnalytics(activeFilters),
            dashboardService.getRepPerformance({ ...activeFilters, limit: 15 }),
            dashboardService.getActivityAnalytics(activeFilters),
            dashboardService.getRecentDeals({ ...activeFilters, limit: 5 }),
            dashboardService.getRecentLeads({ ...activeFilters, limit: 5 }),
            dashboardService.getRecentActivities({ ...activeFilters, limit: 5 }),
          ]);
        setTeamData(teamsRes);
        setRepData(repsRes);
        setActivityData(actAnalytics);
        setRecentDeals(deals);
        setRecentLeads(leads);
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
          <Link to="/deals/create">
            <Button variant="secondary" pill size="sm" icon={<PlusIcon size={15} />}>New Deal</Button>
          </Link>
          <Link to="/leads/create">
            <Button variant="primary" pill size="sm" icon={<PlusIcon size={15} />}>New Lead</Button>
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
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                totalRevenue={formatCurrency(overviewData?.kpis.totalRevenue.current)}
                dealsWon={overviewData?.kpis.dealsWon.current || 0}
                winRate={formatPercent(overviewData?.kpis.winRate.current)}
              />

              {/* Balanced 3-Column Executive Matrix (Left Rail, 8 KPI Cards, Right Rail) */}
              <div className="crm-dashboard-3col">
                <div className="crm-dashboard-left-rail">
                  <DashboardLeftRail
                    totalLeads={overviewData?.kpis.newLeads.current || 0}
                    dealsWon={overviewData?.kpis.dealsWon.current || 0}
                    conversionRate={formatPercent(overviewData?.kpis.leadConversionRate.current)}
                    activitiesCount={overviewData?.kpis.activitiesCompleted.current || 0}
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: "446px" }}>
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
                </div>

                <div className="crm-dashboard-right-rail">
                  <DashboardRightRail />
                </div>
              </div>

              {/* Lower Tier: Full-Width Analytics & Projections */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
                <RevenueSummaryWidget revenue={revenueData} />
                <PipelineSummaryWidget pipeline={pipelineData} />
              </div>

              {/* Lower Tier: Full-Funnel Conversion & Lead Sources */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Full-Funnel Conversion Summary"
                  subtitle="Progression from captured leads to closed-won customer deals"
                  actions={
                    <Link
                      to="/deals"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-500 transition"
                    >
                      <span>Conversion Funnel</span>
                      <ArrowRightIcon size={13} />
                    </Link>
                  }
                  className="crm-funnel-card"
                >
                  <Funnel
                    steps={(overviewData?.funnelSummary || []).map((st) => ({
                      label: `${st.name} (${formatPercent(st.conversionRate)})`,
                      value: st.count,
                    }))}
                  />
                  <div className="mt-2 pt-2 border-t border-emerald-900/10 flex items-center justify-between text-xs text-gray-500">
                    <span>Stage-by-stage pipeline velocity</span>
                    <Link to="/leads/conversion" className="text-emerald-600 font-bold hover:underline">
                      Audit Funnel →
                    </Link>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Top Lead Acquisition Sources"
                  subtitle="Channel volume & attribution performance"
                  actions={
                    <Link
                      to="/dashboard/leads"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-500 transition"
                    >
                      <span>Lead Dashboard</span>
                      <ArrowRightIcon size={13} />
                    </Link>
                  }
                  className="crm-lead-sources-card"
                >
                  {(overviewData?.topLeadSources && overviewData.topLeadSources.length > 0) ? (
                    <div className="crm-lead-sources-breakdown">
                      {overviewData.topLeadSources.map((src, i) => (
                        <div key={src.source || i} className="crm-channel-row">
                          <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                            <span>{humanize(src.source)}</span>
                            <span className="text-emerald-600 font-bold">
                              {src.count} leads ({formatPercent(src.conversionRate)})
                            </span>
                          </div>
                          <div className="crm-channel-track">
                            <div
                              className="crm-channel-fill"
                              style={{
                                width: `${Math.min(100, Math.max(0, (src.count / Math.max(...overviewData.topLeadSources.map((s) => s.count), 1)) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      <div className="mt-2 pt-2 border-t border-emerald-900/10 flex items-center justify-between text-xs text-gray-500">
                        <span>Attribution performance across channels</span>
                        <Link to="/leads/create" className="text-emerald-600 font-bold hover:underline">
                          + New Lead
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="crm-lead-sources-breakdown">
                      <div className="crm-channel-row">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                          <span>Direct & Organic Website</span>
                          <span className="text-emerald-600 font-bold">0 leads (0%)</span>
                        </div>
                        <div className="crm-channel-track">
                          <div className="crm-channel-fill" style={{ width: '0%' }} />
                        </div>
                      </div>
                      <div className="crm-channel-row">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                          <span>Referral & Partner Traffic</span>
                          <span className="text-purple-600 font-bold">0 leads (0%)</span>
                        </div>
                        <div className="crm-channel-track">
                          <div className="crm-channel-fill" style={{ width: '0%', background: '#7c3aed' }} />
                        </div>
                      </div>
                      <div className="crm-channel-row">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                          <span>Outbound Campaigns & Email</span>
                          <span className="text-cyan-600 font-bold">0 leads (0%)</span>
                        </div>
                        <div className="crm-channel-track">
                          <div className="crm-channel-fill" style={{ width: '0%', background: '#06b6d4' }} />
                        </div>
                      </div>
                      <div className="crm-channel-row">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                          <span>Social Media & Paid Ads</span>
                          <span className="text-amber-600 font-bold">0 leads (0%)</span>
                        </div>
                        <div className="crm-channel-track">
                          <div className="crm-channel-fill" style={{ width: '0%', background: '#f59e0b' }} />
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-emerald-900/10 flex items-center justify-between text-xs text-gray-500">
                        <span>Tag source channel when capturing leads.</span>
                        <Link to="/leads/create" className="text-emerald-600 font-bold hover:underline">
                          + New Lead
                        </Link>
                      </div>
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* Lower Tier: Recent Operational Stream */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-3">
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
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                badge="Sales Momentum Engine"
                title="Accelerate Velocity."
                highlight="Maximize Win Rates."
                subtitle="Real-time sales execution across your pipelines. Track quota momentum, analyze won and lost conversion dynamics, and accelerate deal cycles."
                actions={[
                  { label: 'Create Deal', to: '/deals/create', variant: 'secondary', icon: <PlusIcon size={15} /> },
                  { label: 'Pipeline Review', to: '/pipelines', variant: 'outline', icon: <BriefcaseIcon size={15} /> },
                  { label: 'Revenue Forecast', to: '/dashboard/revenue', variant: 'accent', icon: <TrendingUpIcon size={15} /> },
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
                    tally3Label="Sales Tasks"
                    tally3Value={recentActivities.length}
                    efficiencyLabel="Sales Velocity"
                    efficiencyValue={formatCurrency(salesData?.kpis.salesVelocityPerDay)}
                    auditLabel="Full Pipeline Audit"
                    auditLink="/analytics/pipeline"
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: "446px" }}>
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
                      to="/deals"
                    />
                    <DashboardKpiCard
                      label="Sales Velocity / Day"
                      value={formatCurrency(salesData?.kpis.salesVelocityPerDay)}
                      icon={<ActivityIcon size={20} />}
                      tone="amber"
                      to="/pipelines"
                    />
                    <DashboardKpiCard
                      label="Active Open Deals"
                      value={formatNumber(salesData?.kpis.openDealsCount)}
                      subtitle="Active in pipeline stages"
                      icon={<TargetIcon size={20} />}
                      tone="blue"
                      to="/deals"
                    />
                    <DashboardKpiCard
                      label="Closed Lost Deals"
                      value={formatNumber(salesData?.kpis.lostDealsCount)}
                      subtitle="Loss analysis opportunities"
                      icon={<ActivityIcon size={20} />}
                      tone="red"
                      to="/deals/lost"
                    />
                    <DashboardKpiCard
                      label="Average Won Deal Size"
                      value={formatCurrency(salesData?.kpis.avgDealSize.current)}
                      metric={salesData?.kpis.avgDealSize}
                      formatPrev={formatCurrency}
                      icon={<DollarSignIcon size={20} />}
                      tone="green"
                      to="/deals/won"
                    />
                    <DashboardKpiCard
                      label="Avg Sales Cycle Days"
                      value={`${formatNumber(salesData?.kpis.avgSalesCycleDays)} Days`}
                      subtitle="Lead to Closed-Won duration"
                      icon={<CalendarIcon size={20} />}
                      tone="cyan"
                      to="/analytics/pipeline"
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

              {/* Lower Tier: Pipeline & Revenue Summary */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
                <PipelineSummaryWidget pipeline={pipelineData} />
                <RevenueSummaryWidget revenue={revenueData} />
              </div>

              {/* Lower Tier: Recent Operational Stream */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-3">
                <RecentDealsWidget deals={recentDeals} />
                <RecentLeadsWidget leads={recentLeads} />
                <RecentActivitiesWidget activities={recentActivities} />
              </div>
            </div>
          )}

          {/* ==============================================================
              SCREEN 3: LEAD DASHBOARD
             ============================================================== */}
          {screen === 'leads' && (
            <div className="space-y-6">
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                badge="Demand Generation Hub"
                title="Capture High-Intent Demand."
                highlight="Convert Leads."
                subtitle="Drive multichannel lead generation, score marketing attribution, and advance qualified prospects into high-value sales opportunities."
                actions={[
                  { label: 'Capture Lead', to: '/leads/create', variant: 'secondary', icon: <PlusIcon size={15} /> },
                  { label: 'Lead Sources', to: '/lead-generation/sources', variant: 'outline', icon: <TargetIcon size={15} /> },
                  { label: 'Audit Funnel', to: '/leads/conversion', variant: 'accent', icon: <TrendingUpIcon size={15} /> },
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
                    progress3Label="Channel Efficiency"
                    progress3Value="91%"
                    progress3Width="91%"
                    talliesTitle="Lead Tallies"
                    tally1Label="Captured Leads"
                    tally1Value={formatNumber(leadData?.kpis.totalLeads.current)}
                    tally2Label="Converted Leads"
                    tally2Value={formatNumber(leadData?.kpis.convertedLeads.current)}
                    tally3Label="Follow-ups"
                    tally3Value={recentActivities.length}
                    efficiencyLabel="Avg Lead Score"
                    efficiencyValue={`${leadData?.kpis.avgLeadScore || 0} pts`}
                    auditLabel="Lead Attribution Audit"
                    auditLink="/lead-generation/analytics/sources"
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: "446px" }}>
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
                      subtitle="Target: 80+ benchmark"
                      icon={<AwardIcon size={20} />}
                      tone="amber"
                      to="/leads/scoring"
                    />
                    <DashboardKpiCard
                      label="Qualification Rate"
                      value={formatPercent(leadData?.kpis.qualificationRate.current)}
                      metric={leadData?.kpis.qualificationRate}
                      formatPrev={formatPercent}
                      icon={<TrendingUpIcon size={20} />}
                      tone="green"
                      to="/leads/qualification"
                    />
                    <DashboardKpiCard
                      label="Qualified Prospects"
                      value={formatNumber(leadData?.kpis.statusBreakdown?.QUALIFIED || 0)}
                      subtitle="Ready for deal creation"
                      icon={<CheckCircleIcon size={20} />}
                      tone="cyan"
                      to="/leads"
                    />
                    <DashboardKpiCard
                      label="In-Review / Contacted"
                      value={formatNumber(leadData?.kpis.statusBreakdown?.CONTACTED || 0)}
                      subtitle="Active discovery phase"
                      icon={<ActivityIcon size={20} />}
                      tone="blue"
                      to="/leads"
                    />
                    <DashboardKpiCard
                      label="Top Attribution Channel"
                      value={leadSourcesData?.topPerformingSource ? humanize(leadSourcesData.topPerformingSource) : 'Direct Website'}
                      subtitle="Highest conversion channel"
                      icon={<TargetIcon size={20} />}
                      tone="purple"
                      to="/lead-generation/analytics/sources"
                    />
                  </div>
                </div>

                <div className="crm-dashboard-right-rail">
                  <DashboardRightRail
                    pulseTitle="Lead Velocity"
                    pulseSubtitle="Conversion Surge"
                    actionLabel="Schedule Discovery"
                    actionLink="/activities/create"
                  />
                </div>
              </div>

              {/* Lower Tier: Acquisition Velocity & Status Breakdown */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
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

              {/* Lower Tier: Attribution & Conversion Funnel */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Lead-to-Customer Conversion Funnel"
                  subtitle={`Overall Funnel Conversion: ${formatPercent(conversionData?.overallConversionRate)}`}
                  actions={
                    <Link
                      to="/leads/conversion"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-500 transition"
                    >
                      <span>Conversion Funnel</span>
                      <ArrowRightIcon size={13} />
                    </Link>
                  }
                  className="crm-funnel-card"
                >
                  <Funnel
                    steps={(conversionData?.stages || []).map((st) => ({
                      label: `${st.name} (${formatPercent(st.conversionRate)})`,
                      value: st.count,
                    }))}
                  />
                  <div className="mt-2 pt-2 border-t border-emerald-900/10 flex items-center justify-between text-xs text-gray-500">
                    <span>Full stage conversion trajectory</span>
                    <Link to="/leads/conversion" className="text-emerald-600 font-bold hover:underline">
                      Audit Funnel →
                    </Link>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Lead Source Performance & Attribution"
                  subtitle={`Top source: ${leadSourcesData?.topPerformingSource ? humanize(leadSourcesData.topPerformingSource) : 'N/A'}`}
                  actions={
                    <Link
                      to="/lead-generation/analytics/sources"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-500 transition"
                    >
                      <span>Source Analytics</span>
                      <ArrowRightIcon size={13} />
                    </Link>
                  }
                  className="crm-lead-sources-card"
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
              </div>

              {/* Lower Tier: Recent Operational Stream */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-3">
                <RecentDealsWidget deals={recentDeals} />
                <RecentLeadsWidget leads={recentLeads} />
                <RecentActivitiesWidget activities={recentActivities} />
              </div>
            </div>
          )}

          {/* ==============================================================
              SCREEN 4: REVENUE DASHBOARD
             ============================================================== */}
          {screen === 'revenue' && (
            <div className="space-y-6">
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                badge="Financial Intelligence & Forecasting"
                title="Maximize Revenue Streams."
                highlight="Forecast with Precision."
                subtitle="Real-time revenue attribution across all sales stages. Track closed-won trajectory, weighted forecast models, and deal size expansion."
                actions={[
                  { label: 'Create Deal', to: '/deals/create', variant: 'secondary', icon: <PlusIcon size={15} /> },
                  { label: 'Pipeline Summary', to: '/pipelines', variant: 'outline', icon: <BriefcaseIcon size={15} /> },
                  { label: 'Revenue Forecast', to: '/analytics/revenue', variant: 'accent', icon: <TrendingUpIcon size={15} /> },
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
                    efficiencyLabel="Avg Revenue/Deal"
                    efficiencyValue={formatCurrency(revenueData?.revenue.avgRevenuePerDeal)}
                    auditLabel="Full Revenue Audit"
                    auditLink="/analytics/revenue"
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: "446px" }}>
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
                      subtitle="Adjusted by stage probability"
                      icon={<TrendingUpIcon size={20} />}
                      tone="blue"
                      to="/pipelines"
                    />
                    <DashboardKpiCard
                      label="Open Pipeline Value"
                      value={formatCurrency(
                        revenueData?.revenue.activePipelineValue,
                      )}
                      subtitle="Total active pipeline"
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
                    <DashboardKpiCard
                      label="Deals Won Count"
                      value={formatNumber(revenueData?.revenue.dealsWonCount)}
                      subtitle="Closed in current period"
                      icon={<CheckCircleIcon size={20} />}
                      tone="green"
                      to="/deals/won"
                    />
                    <DashboardKpiCard
                      label="Active Pipeline Deals"
                      value={formatNumber(pipelineData?.totalDeals || 0)}
                      subtitle="Deals across active stages"
                      icon={<TargetIcon size={20} />}
                      tone="blue"
                      to="/deals"
                    />
                    <DashboardKpiCard
                      label="Total Pipeline Value"
                      value={formatCurrency(pipelineData?.totalPipelineValue || 0)}
                      subtitle="Gross unweighted pipeline"
                      icon={<DollarSignIcon size={20} />}
                      tone="purple"
                      to="/pipelines"
                    />
                    <DashboardKpiCard
                      label="Deal Win Rate"
                      value={formatPercent(salesData?.kpis.winRate.current)}
                      metric={salesData?.kpis.winRate}
                      formatPrev={formatPercent}
                      icon={<TrendingUpIcon size={20} />}
                      tone="cyan"
                      to="/dashboard/sales"
                    />
                  </div>
                </div>

                <div className="crm-dashboard-right-rail">
                  <DashboardRightRail
                    pulseTitle="Revenue Pulse"
                    pulseSubtitle="Target Momentum"
                    actionLabel="Schedule Review"
                    actionLink="/activities/create"
                  />
                </div>
              </div>

              {/* Lower Tier: Revenue Summary & Pipeline Summary */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
                <RevenueSummaryWidget revenue={revenueData} />
                <PipelineSummaryWidget pipeline={pipelineData} />
              </div>

              {/* Lower Tier: Revenue by Stage & Revenue Trend */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
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

                <SectionCard
                  title="Closed-Won Revenue Trajectory"
                  subtitle="Cumulative revenue generation over timeframe"
                >
                  <LineChart
                    height={220}
                    points={(revenueData?.timeSeries || []).map((p) => ({
                      label: p.label || p.date.slice(5),
                      value: p.value,
                    }))}
                    emptyText="No revenue captured in the selected timeframe."
                  />
                </SectionCard>
              </div>

              {/* Lower Tier: Recent Operational Stream */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-3">
                <RecentDealsWidget deals={recentDeals} />
                <RecentLeadsWidget leads={recentLeads} />
                <RecentActivitiesWidget activities={recentActivities} />
              </div>
            </div>
          )}

          {/* ==============================================================
              SCREEN 5: TEAM PERFORMANCE DASHBOARD
             ============================================================== */}
          {screen === 'teams' && (
            <div className="space-y-6">
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                badge="Team Execution & Leaderboard Hub"
                title="Empower High-Performance Teams."
                highlight="Attain Quota."
                subtitle="Benchmark cross-functional team productivity, rank individual quota attainment, and drive customer activity volume across all channels."
                actions={[
                  { label: 'Schedule Activity', to: '/activities/create', variant: 'secondary', icon: <PlusIcon size={15} /> },
                  { label: 'Team Leaderboard', to: '/analytics/teams', variant: 'outline', icon: <AwardIcon size={15} /> },
                  { label: 'Manage Users', to: '/users', variant: 'accent', icon: <UsersIcon size={15} /> },
                ]}
                tickerItems={[
                  { dotColor: '#10b981', label: 'Active Teams:', value: formatNumber(teamData?.totalTeams) },
                  { dotColor: '#7c3aed', label: 'Ranked Reps:', value: formatNumber(repData?.total) },
                  { dotColor: '#059669', label: 'Completed Tasks:', value: formatNumber(activityData?.kpis.completedActivities.current) },
                ]}
              />

              {/* Balanced 3-Column Executive Matrix (Left Rail, 8 KPI Cards, Right Rail) */}
              <div className="crm-dashboard-3col">
                <div className="crm-dashboard-left-rail">
                  <DashboardLeftRail
                    progressTitle="Team Benchmarks"
                    progress1Label="Activity Quota"
                    progress1Value="86%"
                    progress1Width="86%"
                    progress2Label="Task Completion"
                    progress2Value={formatPercent(activityData?.kpis.completionRate.current)}
                    progress2Width={`${Math.min(100, Math.max(10, Math.round(Number(activityData?.kpis.completionRate.current || 0))))}%`}
                    progress3Label="Rep Engagement"
                    progress3Value="95%"
                    progress3Width="95%"
                    talliesTitle="Team Tallies"
                    tally1Label="Sales Teams"
                    tally1Value={formatNumber(teamData?.totalTeams)}
                    tally2Label="Ranked Reps"
                    tally2Value={formatNumber(repData?.total)}
                    tally3Label="Tasks Completed"
                    tally3Value={formatNumber(activityData?.kpis.completedActivities.current)}
                    efficiencyLabel="Completion Rate"
                    efficiencyValue={formatPercent(activityData?.kpis.completionRate.current)}
                    auditLabel="Team Performance Audit"
                    auditLink="/analytics/teams"
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: "446px" }}>
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
                      subtitle="Sales reps on leaderboard"
                      icon={<AwardIcon size={20} />}
                      tone="purple"
                      to="/users"
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
                      label="Activity Completion Rate"
                      value={formatPercent(
                        activityData?.kpis.completionRate.current,
                      )}
                      metric={activityData?.kpis.completionRate}
                      formatPrev={formatPercent}
                      icon={<TrendingUpIcon size={20} />}
                      tone="amber"
                      to="/activities"
                    />
                    <DashboardKpiCard
                      label="Calls & Meetings"
                      value={formatNumber(
                        (activityData?.breakdowns.byType?.CALL || 0) + (activityData?.breakdowns.byType?.MEETING || 0),
                      )}
                      subtitle="Direct customer touchpoints"
                      icon={<ActivityIcon size={20} />}
                      tone="cyan"
                      to="/activities/calls"
                    />
                    <DashboardKpiCard
                      label="Email Touchpoints"
                      value={formatNumber(activityData?.breakdowns.byType?.EMAIL || 0)}
                      subtitle="Outreach communications"
                      icon={<TargetIcon size={20} />}
                      tone="blue"
                      to="/communications/emails"
                    />
                    <DashboardKpiCard
                      label="Follow-up Tasks"
                      value={formatNumber(activityData?.breakdowns.byType?.FOLLOW_UP || 0)}
                      subtitle="Pipeline nurturing actions"
                      icon={<CheckCircleIcon size={20} />}
                      tone="green"
                      to="/activities/follow-ups"
                    />
                    <DashboardKpiCard
                      label="Pending Action Items"
                      value={formatNumber(activityData?.kpis.pendingCount || 0)}
                      subtitle="Scheduled in queue"
                      icon={<ActivityIcon size={20} />}
                      tone="amber"
                      to="/activities"
                    />
                  </div>
                </div>

                <div className="crm-dashboard-right-rail">
                  <DashboardRightRail
                    pulseTitle="Team Momentum"
                    pulseSubtitle="Quota Sprint"
                    actionLabel="Assign Task"
                    actionLink="/activities/create"
                  />
                </div>
              </div>

              {/* Lower Tier: Full-Width Team Performance & Leaderboard */}
              <div className="crm-dashboard-tier">
                <TeamPerformanceWidget
                  teams={teamData?.teams || []}
                  reps={repData?.items || []}
                />
              </div>

              {/* Lower Tier: Activity Breakdown by Type & Channel Distribution */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
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

                <SectionCard
                  title="Activity Distribution by Channel"
                  subtitle="Relative proportion of customer engagement channels"
                >
                  <DonutChart
                    centerLabel="Activities"
                    data={Object.entries(
                      activityData?.breakdowns.byType || {},
                    ).map(([type, count]) => ({
                      label: humanize(type),
                      value: Number(count || 0),
                    }))}
                    emptyText="No activity breakdown available."
                  />
                </SectionCard>
              </div>

              {/* Lower Tier: Recent Operational Stream */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-3">
                <RecentDealsWidget deals={recentDeals} />
                <RecentLeadsWidget leads={recentLeads} />
                <RecentActivitiesWidget activities={recentActivities} />
              </div>
            </div>
          )}

          {/* ==============================================================
              SCREEN 6: CUSTOM DASHBOARD
             ============================================================== */}
          {screen === 'custom' && (
            <div className="space-y-6">
              {/* Executive Scenic Hero Header */}
              <DashboardScenicHero
                badge="Tailored Intelligence Workspace"
                title="Configure Metrics."
                highlight="Your Bespoke Dashboard."
                subtitle="Personalize high-impact widget layouts, toggle operational streams, and structure real-time telemetry specific to your role."
                actions={[
                  {
                    label: isCustomBuilderOpen ? 'Hide Customizer' : 'Customize Widgets',
                    onClick: () => setIsCustomBuilderOpen((prev) => !prev),
                    variant: 'secondary',
                    icon: <SlidersIcon size={15} />,
                  },
                  {
                    label: 'Revenue Forecast',
                    to: '/dashboard/revenue',
                    variant: 'accent',
                    icon: <TrendingUpIcon size={15} />,
                  },
                ]}
                tickerItems={[
                  { dotColor: '#10b981', label: 'Active Widgets:', value: `${customWidgets.filter((w) => w.enabled).length} Enabled` },
                  { dotColor: '#7c3aed', label: 'Revenue:', value: formatCurrency(revenueData?.revenue.closedWonRevenue.current || overviewData?.kpis.totalRevenue.current) },
                  { dotColor: '#059669', label: 'Pipeline Deals:', value: `${pipelineData?.totalDeals || 0} Deals` },
                ]}
              />

              {/* Interactive Widget Customizer Drawer/Card */}
              {/* Interactive Widget Customizer Drawer/Card */}
              {isCustomBuilderOpen && (
                <div className="crm-dashboard-tier">
                  <SectionCard
                    title="Customize Your Dashboard Layout"
                    subtitle="Toggle widgets on or off and choose Half-Width or Full-Width layout spans. Preferences are saved automatically."
                    actions={
                      <Button
                        variant="outline"
                        size="sm"
                        pill
                        onClick={handleResetCustomWidgets}
                        icon={<RefreshCwIcon size={14} />}
                      >
                        Restore Default Layout
                      </Button>
                    }
                  >
                    <div className="crm-customizer-grid">
                      {customWidgets.map((w) => (
                        <div
                          key={w.id}
                          className={`crm-widget-opt-card ${w.enabled ? "is-enabled" : "is-disabled"}`}
                        >
                          <div>
                            <div className="crm-widget-opt-head">
                              <label className="crm-widget-opt-label">
                                <input
                                  type="checkbox"
                                  checked={w.enabled}
                                  onChange={() => handleToggleWidget(w.id)}
                                  className="crm-widget-opt-checkbox"
                                />
                                <span className="crm-widget-opt-title">{w.title}</span>
                              </label>
                              <span className="crm-widget-opt-badge">
                                {w.category}
                              </span>
                            </div>
                            <p className="crm-widget-opt-desc">
                              {w.description}
                            </p>
                          </div>

                          <div className="crm-widget-opt-footer">
                            <span className="crm-widget-opt-footer-label">
                              Width Span:
                            </span>
                            {w.id !== "kpi_summary" && w.id !== "team_leaderboard" ? (
                              <button
                                type="button"
                                onClick={() => handleToggleWidgetSpan(w.id)}
                                className="crm-widget-span-btn"
                              >
                                {w.span === "full" ? "Full Width (100%)" : "Half Width (50%)"}
                              </button>
                            ) : (
                              <span className="crm-widget-span-fixed">
                                Full Width (Fixed)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* Balanced 3-Column Executive Matrix (Left Rail, 8 KPI Cards, Right Rail) */}
              <div className="crm-dashboard-3col">
                <div className="crm-dashboard-left-rail">
                  <DashboardLeftRail
                    totalLeads={overviewData?.kpis.newLeads.current || 0}
                    dealsWon={overviewData?.kpis.dealsWon.current || 0}
                    conversionRate={formatPercent(overviewData?.kpis.leadConversionRate.current)}
                    activitiesCount={overviewData?.kpis.activitiesCompleted.current || 0}
                  />
                </div>

                <div className="crm-dashboard-center-kpis" style={{ minWidth: 0 }}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ height: "446px" }}>
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
                </div>

                <div className="crm-dashboard-right-rail">
                  <DashboardRightRail />
                </div>
              </div>

              {/* Render Enabled Custom Widgets in Structured Tiers */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
                <RevenueSummaryWidget revenue={revenueData} />
                <PipelineSummaryWidget pipeline={pipelineData} />
              </div>

              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Lead Conversion Funnel"
                  subtitle={`Overall Conversion: ${formatPercent(conversionData?.overallConversionRate)}`}
                  className="crm-funnel-card"
                >
                  <Funnel
                    steps={(conversionData?.stages || []).map((st) => ({
                      label: `${st.name} (${formatPercent(st.conversionRate)})`,
                      value: st.count,
                    }))}
                  />
                </SectionCard>

                <SectionCard
                  title="Lead Source Attribution"
                  subtitle="Lead volume and conversion rate by channel"
                  className="crm-lead-sources-card"
                >
                  <BarList
                    data={(leadSourcesData?.sources || []).map((s) => ({
                      label: `${humanize(s.source)} (${formatPercent(s.conversionRate)})`,
                      value: s.count,
                    }))}
                    emptyText="No lead source data."
                  />
                </SectionCard>
              </div>

              {/* Lower Tier: Recent Operational Stream */}
              <div className="crm-dashboard-tier grid grid-cols-1 gap-6 lg:grid-cols-3">
                <RecentDealsWidget deals={recentDeals} />
                <RecentLeadsWidget leads={recentLeads} />
                <RecentActivitiesWidget activities={recentActivities} />
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};
