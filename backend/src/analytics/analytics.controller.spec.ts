import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsTimeframeEnum } from './dto/analytics-query.dto';
import { PerformanceSortByEnum, PerformanceQueryDto } from './dto/performance-query.dto';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsServiceMock: Partial<AnalyticsService>;

  beforeEach(() => {
    analyticsServiceMock = {
      getOverview: vi.fn().mockResolvedValue({
        period: {
          startDate: '2026-09-23T00:00:00.000Z',
          endDate: '2026-10-23T23:59:59.999Z',
          timeframe: 'LAST_30_DAYS',
          interval: 'DAILY',
        },
        kpis: {
          totalRevenue: { current: 100000, previous: 80000, change: 20000, percentage: 25, direction: 'UP' },
          dealsWon: { current: 10, previous: 8, change: 2, percentage: 25, direction: 'UP' },
          winRate: { current: 50, previous: 40, change: 10, percentage: 25, direction: 'UP' },
          avgDealSize: { current: 10000, previous: 10000, change: 0, percentage: 0, direction: 'FLAT' },
          newLeads: { current: 50, previous: 40, change: 10, percentage: 25, direction: 'UP' },
          leadConversionRate: { current: 20, previous: 20, change: 0, percentage: 0, direction: 'FLAT' },
          activePipelineValue: { current: 250000, previous: 0, change: 0, percentage: 0, direction: 'FLAT' },
          activitiesCompleted: { current: 120, previous: 100, change: 20, percentage: 20, direction: 'UP' },
        },
        revenueTimeSeries: [],
        leadsTimeSeries: [],
        topLeadSources: [],
        funnelSummary: [],
      }),
      getSalesAnalytics: vi.fn().mockResolvedValue({
        timeframe: 'THIS_QUARTER',
        interval: 'MONTHLY',
        dateRange: { startDate: '2026-10-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.999Z' },
        kpis: {
          totalDeals: { current: 20, previous: 16, change: 4, percentage: 25, direction: 'UP' },
          wonDeals: { current: 10, previous: 8, change: 2, percentage: 25, direction: 'UP' },
          winRate: { current: 50, previous: 40, change: 10, percentage: 25, direction: 'UP' },
          totalRevenue: { current: 100000, previous: 80000, change: 20000, percentage: 25, direction: 'UP' },
          avgDealSize: { current: 10000, previous: 10000, change: 0, percentage: 0, direction: 'FLAT' },
          openDealsCount: 8,
          lostDealsCount: 2,
          avgSalesCycleDays: 15,
          salesVelocityPerDay: 15000,
        },
        timeSeries: [],
      }),
      getRevenueAnalytics: vi.fn().mockResolvedValue({
        timeframe: 'THIS_YEAR',
        interval: 'MONTHLY',
        dateRange: { startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.999Z' },
        revenue: {
          closedWonRevenue: { current: 100000, previous: 80000, change: 20000, percentage: 25, direction: 'UP' },
          activePipelineValue: 250000,
          weightedForecastRevenue: 135000,
          dealsWonCount: 10,
          avgRevenuePerDeal: 10000,
        },
        timeSeries: [],
      }),
      getPipelineAnalytics: vi.fn().mockResolvedValue({
        totalDeals: 25,
        totalPipelineValue: 250000,
        weightedForecastValue: 135000,
        stages: [],
      }),
      getLeadAnalytics: vi.fn().mockResolvedValue({
        timeframe: 'LAST_30_DAYS',
        interval: 'DAILY',
        dateRange: { startDate: '2026-09-23T00:00:00.000Z', endDate: '2026-10-23T23:59:59.999Z' },
        kpis: {
          totalLeads: { current: 50, previous: 40, change: 10, percentage: 25, direction: 'UP' },
          convertedLeads: { current: 10, previous: 8, change: 2, percentage: 25, direction: 'UP' },
          conversionRate: { current: 20, previous: 20, change: 0, percentage: 0, direction: 'FLAT' },
          qualificationRate: { current: 60, previous: 50, change: 10, percentage: 20, direction: 'UP' },
          avgLeadScore: 65,
          statusBreakdown: { NEW: 20, CONTACTED: 10, QUALIFIED: 10, CONVERTED: 10, UNQUALIFIED: 0 },
        },
        timeSeries: [],
      }),
      getLeadSourceAnalytics: vi.fn().mockResolvedValue({
        sources: [
          {
            source: 'WEBSITE',
            count: 30,
            convertedCount: 6,
            conversionRate: 20,
            revenue: 60000,
            avgLeadScore: 70,
            percentageOfTotal: 60,
          },
        ],
      }),
      getConversionAnalytics: vi.fn().mockResolvedValue({
        totalLeads: 50,
        totalDealsWon: 10,
        overallConversionRate: 20,
        stages: [],
      }),
      getActivityAnalytics: vi.fn().mockResolvedValue({
        timeframe: 'LAST_7_DAYS',
        interval: 'DAILY',
        dateRange: { startDate: '2026-10-16T00:00:00.000Z', endDate: '2026-10-23T23:59:59.999Z' },
        kpis: {
          totalActivities: { current: 150, previous: 120, change: 30, percentage: 25, direction: 'UP' },
          completedActivities: { current: 120, previous: 100, change: 20, percentage: 20, direction: 'UP' },
          completionRate: { current: 80, previous: 83.33, change: -3.33, percentage: -4, direction: 'DOWN' },
          pendingCount: 25,
          cancelledCount: 5,
        },
        breakdowns: { byType: [], byPriority: [] },
        timeSeries: [],
      }),
      getTeamAnalytics: vi.fn().mockResolvedValue({
        teams: [],
      }),
      getRepPerformance: vi.fn().mockResolvedValue({
        leaderboard: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      }),
    };

    controller = new AnalyticsController(analyticsServiceMock as AnalyticsService);
  });

  it('should call getOverview with query, orgId, and workspaceId', async () => {
    const query = { timeframe: AnalyticsTimeframeEnum.THIS_MONTH };
    const user = { organizationId: 'org-123', activeWorkspaceId: 'ws-456' };
    const req = { workspace: { id: 'ws-override' } };

    const result = await controller.getOverview(query, user, req);

    expect(result).toBeDefined();
    expect(result.kpis.totalRevenue.current).toBe(100000);
    expect(analyticsServiceMock.getOverview).toHaveBeenCalledWith(query, 'org-123', 'ws-override');
  });

  it('should fallback to activeWorkspaceId if req.workspace is undefined in getOverview', async () => {
    const query = { timeframe: AnalyticsTimeframeEnum.LAST_30_DAYS };
    const user = { organizationId: 'org-123', activeWorkspaceId: 'ws-456' };
    const req = {};

    await controller.getOverview(query, user, req);

    expect(analyticsServiceMock.getOverview).toHaveBeenCalledWith(query, 'org-123', 'ws-456');
  });

  it('should call getSalesAnalytics with query and orgId', async () => {
    const query = { timeframe: AnalyticsTimeframeEnum.THIS_QUARTER };
    const result = await controller.getSalesAnalytics(query, 'org-123');

    expect(result).toBeDefined();
    expect(result.kpis.winRate.current).toBe(50);
    expect(analyticsServiceMock.getSalesAnalytics).toHaveBeenCalledWith(query, 'org-123');
  });

  it('should call getRevenueAnalytics with query and orgId', async () => {
    const query = { timeframe: AnalyticsTimeframeEnum.THIS_YEAR };
    const result = await controller.getRevenueAnalytics(query, 'org-123');

    expect(result).toBeDefined();
    expect(result.revenue.activePipelineValue).toBe(250000);
    expect(analyticsServiceMock.getRevenueAnalytics).toHaveBeenCalledWith(query, 'org-123');
  });

  it('should call getPipelineAnalytics with query and orgId', async () => {
    const query = { timeframe: AnalyticsTimeframeEnum.LAST_7_DAYS };
    const result = await controller.getPipelineAnalytics(query, 'org-123');

    expect(result).toBeDefined();
    expect(result.totalDeals).toBe(25);
    expect(analyticsServiceMock.getPipelineAnalytics).toHaveBeenCalledWith(query, 'org-123');
  });

  it('should call getLeadAnalytics with query and workspaceId', async () => {
    const query = { timeframe: AnalyticsTimeframeEnum.LAST_30_DAYS };
    const user = { activeWorkspaceId: 'ws-default' };
    const req = { workspace: { id: 'ws-123' } };

    const result = await controller.getLeadAnalytics(query, user, req);

    expect(result).toBeDefined();
    expect(result.kpis.totalLeads.current).toBe(50);
    expect(analyticsServiceMock.getLeadAnalytics).toHaveBeenCalledWith(query, 'ws-123');
  });

  it('should call getLeadSourceAnalytics with query and workspaceId', async () => {
    const query = { timeframe: AnalyticsTimeframeEnum.THIS_MONTH };
    const user = { activeWorkspaceId: 'ws-default' };
    const req = {};

    const result = await controller.getLeadSourceAnalytics(query, user, req);

    expect(result).toBeDefined();
    expect(result.sources).toHaveLength(1);
    expect(analyticsServiceMock.getLeadSourceAnalytics).toHaveBeenCalledWith(query, 'ws-default');
  });

  it('should call getConversionAnalytics with query and workspaceId', async () => {
    const query = { timeframe: AnalyticsTimeframeEnum.THIS_MONTH };
    const user = { activeWorkspaceId: 'ws-default' };
    const req = { workspace: { id: 'ws-custom' } };

    const result = await controller.getConversionAnalytics(query, user, req);

    expect(result).toBeDefined();
    expect(result.overallConversionRate).toBe(20);
    expect(analyticsServiceMock.getConversionAnalytics).toHaveBeenCalledWith(query, 'ws-custom');
  });

  it('should call getActivityAnalytics with query and orgId', async () => {
    const query = { timeframe: AnalyticsTimeframeEnum.LAST_7_DAYS };
    const result = await controller.getActivityAnalytics(query, 'org-123');

    expect(result).toBeDefined();
    expect(result.kpis.completedActivities.current).toBe(120);
    expect(analyticsServiceMock.getActivityAnalytics).toHaveBeenCalledWith(query, 'org-123');
  });

  it('should call getTeamAnalytics with query and orgId', async () => {
    const query = { timeframe: AnalyticsTimeframeEnum.THIS_MONTH };
    const result = await controller.getTeamAnalytics(query, 'org-123');

    expect(result).toBeDefined();
    expect(analyticsServiceMock.getTeamAnalytics).toHaveBeenCalledWith(query, 'org-123');
  });

  it('should call getRepPerformance with performance query and orgId', async () => {
    const query: PerformanceQueryDto = {
      page: 1,
      limit: 10,
      sortBy: PerformanceSortByEnum.REVENUE,
      sortOrder: 'desc',
    };
    const result = await controller.getRepPerformance(query, 'org-123');

    expect(result).toBeDefined();
    expect(result.meta.page).toBe(1);
    expect(analyticsServiceMock.getRepPerformance).toHaveBeenCalledWith(query, 'org-123');
  });
});
