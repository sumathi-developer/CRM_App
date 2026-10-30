import { api } from './api';
import type {
  ActivityAnalyticsResponse,
  ConversionFunnelResponse,
  DashboardLookupOption,
  DashboardQueryFilters,
  DashboardRecentActivity,
  DashboardRecentDeal,
  DashboardRecentLead,
  LeadAnalyticsResponse,
  LeadSourceAnalyticsResponse,
  MetricWithTrend,
  OverviewAnalyticsResponse,
  PipelineAnalyticsResponse,
  RepPerformanceResponse,
  RevenueAnalyticsResponse,
  SalesAnalyticsResponse,
  TeamAnalyticsResponse,
} from '../types/dashboard.types';

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    sp.append(key, String(typeof value === 'string' ? value.trim() : value));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function normalizeMetric(raw: any): MetricWithTrend {
  if (raw && typeof raw === 'object' && 'current' in raw) {
    return {
      current: Number(raw.current ?? 0),
      previous: Number(raw.previous ?? 0),
      change: Number(raw.change ?? 0),
      percentage: Number(raw.percentage ?? 0),
      direction:
        raw.direction === 'UP' || raw.direction === 'DOWN'
          ? raw.direction
          : 'FLAT',
    };
  }
  const val = Number(raw ?? 0);
  return {
    current: val,
    previous: 0,
    change: 0,
    percentage: 0,
    direction: 'FLAT',
  };
}

function unwrap<T = any>(res: any): T {
  if (res && typeof res === 'object' && 'data' in res && !Array.isArray(res.data)) {
    return res.data as T;
  }
  return res as T;
}

function extractList<T = any>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  return [];
}

class DashboardApiService {
  /**
   * GET /analytics/overview
   */
  async getOverviewAnalytics(
    filters?: DashboardQueryFilters,
  ): Promise<OverviewAnalyticsResponse> {
    const res = await api.get<any>(
      `/analytics/overview${buildQuery(filters as Record<string, unknown>)}`,
    );
    const data = unwrap<any>(res);
    const kpis = data?.kpis || {};

    return {
      period: {
        startDate: data?.period?.startDate || '',
        endDate: data?.period?.endDate || '',
        timeframe: data?.period?.timeframe || filters?.timeframe || 'LAST_30_DAYS',
        interval: data?.period?.interval || filters?.interval || 'DAILY',
      },
      kpis: {
        totalRevenue: normalizeMetric(kpis.totalRevenue),
        dealsWon: normalizeMetric(kpis.dealsWon),
        winRate: normalizeMetric(kpis.winRate),
        avgDealSize: normalizeMetric(kpis.avgDealSize),
        newLeads: normalizeMetric(kpis.newLeads),
        leadConversionRate: normalizeMetric(kpis.leadConversionRate),
        activePipelineValue: normalizeMetric(kpis.activePipelineValue),
        activitiesCompleted: normalizeMetric(kpis.activitiesCompleted),
      },
      revenueTimeSeries: Array.isArray(data?.revenueTimeSeries)
        ? data.revenueTimeSeries
        : [],
      leadsTimeSeries: Array.isArray(data?.leadsTimeSeries)
        ? data.leadsTimeSeries
        : [],
      topLeadSources: Array.isArray(data?.topLeadSources)
        ? data.topLeadSources
        : [],
      funnelSummary: Array.isArray(data?.funnelSummary)
        ? data.funnelSummary
        : [],
    };
  }

  /**
   * GET /analytics/sales
   */
  async getSalesAnalytics(
    filters?: DashboardQueryFilters,
  ): Promise<SalesAnalyticsResponse> {
    const res = await api.get<any>(
      `/analytics/sales${buildQuery(filters as Record<string, unknown>)}`,
    );
    const data = unwrap<any>(res);
    const kpis = data?.kpis || {};

    return {
      timeframe: data?.timeframe || filters?.timeframe || 'LAST_30_DAYS',
      interval: data?.interval || filters?.interval || 'DAILY',
      dateRange: {
        startDate: data?.dateRange?.startDate || '',
        endDate: data?.dateRange?.endDate || '',
      },
      kpis: {
        totalDeals: normalizeMetric(kpis.totalDeals),
        wonDeals: normalizeMetric(kpis.wonDeals),
        winRate: normalizeMetric(kpis.winRate),
        totalRevenue: normalizeMetric(kpis.totalRevenue),
        avgDealSize: normalizeMetric(kpis.avgDealSize),
        openDealsCount: Number(kpis.openDealsCount ?? 0),
        lostDealsCount: Number(kpis.lostDealsCount ?? 0),
        avgSalesCycleDays: Number(kpis.avgSalesCycleDays ?? 0),
        salesVelocityPerDay: Number(kpis.salesVelocityPerDay ?? 0),
      },
      timeSeries: Array.isArray(data?.timeSeries) ? data.timeSeries : [],
    };
  }

  /**
   * GET /analytics/revenue
   */
  async getRevenueAnalytics(
    filters?: DashboardQueryFilters,
  ): Promise<RevenueAnalyticsResponse> {
    const res = await api.get<any>(
      `/analytics/revenue${buildQuery(filters as Record<string, unknown>)}`,
    );
    const data = unwrap<any>(res);
    const rev = data?.revenue || {};

    return {
      timeframe: data?.timeframe || filters?.timeframe || 'LAST_30_DAYS',
      interval: data?.interval || filters?.interval || 'DAILY',
      dateRange: {
        startDate: data?.dateRange?.startDate || '',
        endDate: data?.dateRange?.endDate || '',
      },
      revenue: {
        closedWonRevenue: normalizeMetric(rev.closedWonRevenue),
        activePipelineValue: Number(rev.activePipelineValue ?? 0),
        weightedForecastRevenue: Number(rev.weightedForecastRevenue ?? 0),
        dealsWonCount: Number(rev.dealsWonCount ?? 0),
        avgRevenuePerDeal: Number(rev.avgRevenuePerDeal ?? 0),
      },
      timeSeries: Array.isArray(data?.timeSeries) ? data.timeSeries : [],
    };
  }

  /**
   * GET /analytics/pipeline
   */
  async getPipelineAnalytics(
    filters?: DashboardQueryFilters,
  ): Promise<PipelineAnalyticsResponse> {
    const res = await api.get<any>(
      `/analytics/pipeline${buildQuery(filters as Record<string, unknown>)}`,
    );
    const data = unwrap<any>(res);

    return {
      pipelineId: data?.pipelineId ?? null,
      pipelineName: data?.pipelineName || 'Primary Sales Pipeline',
      totalPipelineValue: Number(data?.totalPipelineValue ?? 0),
      totalWeightedValue: Number(data?.totalWeightedValue ?? 0),
      totalDeals: Number(data?.totalDeals ?? 0),
      stages: Array.isArray(data?.stages) ? data.stages : [],
    };
  }

  /**
   * GET /analytics/leads
   */
  async getLeadAnalytics(
    filters?: DashboardQueryFilters,
  ): Promise<LeadAnalyticsResponse> {
    const res = await api.get<any>(
      `/analytics/leads${buildQuery(filters as Record<string, unknown>)}`,
    );
    const data = unwrap<any>(res);
    const kpis = data?.kpis || {};

    return {
      timeframe: data?.timeframe || filters?.timeframe || 'LAST_30_DAYS',
      interval: data?.interval || filters?.interval || 'DAILY',
      dateRange: {
        startDate: data?.dateRange?.startDate || '',
        endDate: data?.dateRange?.endDate || '',
      },
      kpis: {
        totalLeads: normalizeMetric(kpis.totalLeads),
        convertedLeads: normalizeMetric(kpis.convertedLeads),
        conversionRate: normalizeMetric(kpis.conversionRate),
        qualificationRate: normalizeMetric(kpis.qualificationRate),
        avgLeadScore: Number(kpis.avgLeadScore ?? 0),
        statusBreakdown: kpis.statusBreakdown || {},
      },
      timeSeries: Array.isArray(data?.timeSeries) ? data.timeSeries : [],
    };
  }

  /**
   * GET /analytics/lead-sources
   */
  async getLeadSourceAnalytics(
    filters?: DashboardQueryFilters,
  ): Promise<LeadSourceAnalyticsResponse> {
    const res = await api.get<any>(
      `/analytics/lead-sources${buildQuery(filters as Record<string, unknown>)}`,
    );
    const data = unwrap<any>(res);

    return {
      totalLeads: Number(data?.totalLeads ?? 0),
      sourcesCount: Number(data?.sourcesCount ?? 0),
      topPerformingSource: data?.topPerformingSource || null,
      sources: Array.isArray(data?.sources) ? data.sources : [],
    };
  }

  /**
   * GET /analytics/conversion
   */
  async getConversionFunnel(
    filters?: DashboardQueryFilters,
  ): Promise<ConversionFunnelResponse> {
    const res = await api.get<any>(
      `/analytics/conversion${buildQuery(filters as Record<string, unknown>)}`,
    );
    const data = unwrap<any>(res);

    return {
      totalLeads: Number(data?.totalLeads ?? 0),
      totalDealsWon: Number(data?.totalDealsWon ?? 0),
      overallConversionRate: Number(data?.overallConversionRate ?? 0),
      stages: Array.isArray(data?.stages) ? data.stages : [],
    };
  }

  /**
   * GET /analytics/activities
   */
  async getActivityAnalytics(
    filters?: DashboardQueryFilters,
  ): Promise<ActivityAnalyticsResponse> {
    const res = await api.get<any>(
      `/analytics/activities${buildQuery(filters as Record<string, unknown>)}`,
    );
    const data = unwrap<any>(res);
    const kpis = data?.kpis || {};

    return {
      timeframe: data?.timeframe || filters?.timeframe || 'LAST_30_DAYS',
      interval: data?.interval || filters?.interval || 'DAILY',
      dateRange: {
        startDate: data?.dateRange?.startDate || '',
        endDate: data?.dateRange?.endDate || '',
      },
      kpis: {
        totalActivities: normalizeMetric(kpis.totalActivities),
        completedActivities: normalizeMetric(kpis.completedActivities),
        completionRate: normalizeMetric(kpis.completionRate),
        pendingCount: Number(kpis.pendingCount ?? 0),
        cancelledCount: Number(kpis.cancelledCount ?? 0),
      },
      breakdowns: {
        byType: data?.breakdowns?.byType || {},
        byPriority: data?.breakdowns?.byPriority || {},
      },
      timeSeries: Array.isArray(data?.timeSeries) ? data.timeSeries : [],
    };
  }

  /**
   * GET /analytics/teams
   */
  async getTeamAnalytics(
    filters?: DashboardQueryFilters,
  ): Promise<TeamAnalyticsResponse> {
    const res = await api.get<any>(
      `/analytics/teams${buildQuery(filters as Record<string, unknown>)}`,
    );
    const data = unwrap<any>(res);

    return {
      totalTeams: Number(data?.totalTeams ?? 0),
      teams: Array.isArray(data?.teams) ? data.teams : [],
    };
  }

  /**
   * GET /analytics/performance
   */
  async getRepPerformance(
    filters?: DashboardQueryFilters & {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    },
  ): Promise<RepPerformanceResponse> {
    const res = await api.get<any>(
      `/analytics/performance${buildQuery(filters as Record<string, unknown>)}`,
    );
    const payload = res?.data && !Array.isArray(res.data) ? res.data : res;
    const items = extractList<any>(res);
    const meta = payload?.meta || res?.meta || {};

    return {
      items,
      total: Number(meta.total ?? items.length),
      page: Number(meta.page ?? 1),
      limit: Number(meta.limit ?? 20),
      totalPages: Number(meta.totalPages ?? 1),
    };
  }

  /**
   * Fetch recent / top deals via /deals or fallback to /reports/sales
   */
  async getRecentDeals(
    filters?: DashboardQueryFilters & { limit?: number },
  ): Promise<DashboardRecentDeal[]> {
    try {
      const res = await api.get<any>(
        `/deals${buildQuery({
          limit: filters?.limit || 6,
          ownerId: filters?.userId,
          pipelineId: filters?.pipelineId,
          workspaceId: filters?.workspaceId,
        })}`,
      );
      const list = extractList<DashboardRecentDeal>(res);
      if (list.length > 0) return list.slice(0, filters?.limit || 6);
    } catch {
      // Fallback to /reports/sales
    }

    try {
      const reportRes = await api.get<any>('/reports/sales');
      const data = unwrap<any>(reportRes);
      if (Array.isArray(data?.topDeals)) {
        return data.topDeals.slice(0, filters?.limit || 6);
      }
    } catch {
      // Ignore
    }
    return [];
  }

  /**
   * Fetch recent / top leads via /leads or fallback to /reports/leads
   */
  async getRecentLeads(
    filters?: DashboardQueryFilters & { limit?: number },
  ): Promise<DashboardRecentLead[]> {
    try {
      const res = await api.get<any>(
        `/leads${buildQuery({
          limit: filters?.limit || 6,
          ownerId: filters?.userId,
          workspaceId: filters?.workspaceId,
        })}`,
      );
      const list = extractList<DashboardRecentLead>(res);
      if (list.length > 0) return list.slice(0, filters?.limit || 6);
    } catch {
      // Fallback to /reports/leads
    }

    try {
      const reportRes = await api.get<any>('/reports/leads');
      const data = unwrap<any>(reportRes);
      if (Array.isArray(data?.topLeads)) {
        return data.topLeads.slice(0, filters?.limit || 6);
      }
    } catch {
      // Ignore
    }
    return [];
  }

  /**
   * Fetch recent activities via /activities or fallback to /reports/activities
   */
  async getRecentActivities(
    filters?: DashboardQueryFilters & { limit?: number },
  ): Promise<DashboardRecentActivity[]> {
    try {
      const res = await api.get<any>(
        `/activities${buildQuery({
          limit: filters?.limit || 6,
          assignedToId: filters?.userId,
        })}`,
      );
      const list = extractList<DashboardRecentActivity>(res);
      if (list.length > 0) return list.slice(0, filters?.limit || 6);
    } catch {
      // Fallback to /reports/activities
    }

    try {
      const reportRes = await api.get<any>('/reports/activities');
      const data = unwrap<any>(reportRes);
      if (Array.isArray(data?.recentActivities)) {
        return data.recentActivities.slice(0, filters?.limit || 6);
      }
    } catch {
      // Ignore
    }
    return [];
  }

  /**
   * Fetch filter dropdown options (Teams, Users, Pipelines)
   */
  async getFilterLookups(): Promise<{
    teams: DashboardLookupOption[];
    users: DashboardLookupOption[];
    pipelines: DashboardLookupOption[];
  }> {
    const [teamsRes, usersRes, pipelinesRes] = await Promise.all([
      api.get<any>('/teams?limit=50').catch(() => []),
      api.get<any>('/users?limit=50').catch(() => []),
      api.get<any>('/pipelines').catch(() => []),
    ]);

    const teams = extractList<any>(teamsRes).map((t) => ({
      id: t.id,
      name: t.name || 'Unnamed Team',
    }));

    const users = extractList<any>(usersRes).map((u) => ({
      id: u.id,
      name: u.name || u.email || 'User',
      subtitle: u.email,
    }));

    const pipelines = extractList<any>(pipelinesRes).map((p) => ({
      id: p.id,
      name: p.name || 'Pipeline',
    }));

    return { teams, users, pipelines };
  }
}

export const dashboardService = new DashboardApiService();
export default dashboardService;

