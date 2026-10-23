import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from './services/analytics.service';
import { SalesAnalyticsService } from './services/sales-analytics.service';
import { LeadAnalyticsService } from './services/lead-analytics.service';
import { ActivityAnalyticsService } from './services/activity-analytics.service';
import { TeamAnalyticsService } from './services/team-analytics.service';
import { DateRangeUtil } from './utils/date-range.util';
import { TrendUtil } from './utils/trend.util';

describe('Analytics Module (Module 18)', () => {
  let prismaMock: any;
  let salesAnalyticsService: SalesAnalyticsService;
  let leadAnalyticsService: LeadAnalyticsService;
  let activityAnalyticsService: ActivityAnalyticsService;
  let teamAnalyticsService: TeamAnalyticsService;
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    prismaMock = {
      deal: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      lead: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      activity: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      pipeline: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
      },
      team: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    salesAnalyticsService = new SalesAnalyticsService(prismaMock);
    leadAnalyticsService = new LeadAnalyticsService(prismaMock);
    activityAnalyticsService = new ActivityAnalyticsService(prismaMock);
    teamAnalyticsService = new TeamAnalyticsService(prismaMock);

    analyticsService = new AnalyticsService(
      salesAnalyticsService,
      leadAnalyticsService,
      activityAnalyticsService,
      teamAnalyticsService,
    );
  });

  describe('DateRangeUtil & TrendUtil', () => {
    it('should calculate dates, previous period, and daily buckets for LAST_30_DAYS', () => {
      const resolved = DateRangeUtil.resolveDateRange({ timeframe: 'LAST_30_DAYS' });

      expect(resolved.startDate).toBeInstanceOf(Date);
      expect(resolved.endDate).toBeInstanceOf(Date);
      expect(resolved.prevStartDate).toBeInstanceOf(Date);
      expect(resolved.prevEndDate).toBeInstanceOf(Date);
      expect(resolved.interval).toBe('DAILY');
      expect(resolved.buckets.length).toBeGreaterThan(25);
    });

    it('should correctly calculate trend percentage and direction', () => {
      // 100 to 150 = +50% UP
      const trendUp = TrendUtil.calculateTrend(150, 100);
      expect(trendUp.percentage).toBe(50);
      expect(trendUp.direction).toBe('UP');
      expect(trendUp.change).toBe(50);

      // 100 to 80 = -20% DOWN
      const trendDown = TrendUtil.calculateTrend(80, 100);
      expect(trendDown.percentage).toBe(-20);
      expect(trendDown.direction).toBe('DOWN');
      expect(trendDown.change).toBe(-20);

      // 100 to 100 = 0% FLAT
      const trendFlat = TrendUtil.calculateTrend(100, 100);
      expect(trendFlat.percentage).toBe(0);
      expect(trendFlat.direction).toBe('FLAT');
    });
  });

  describe('SalesAnalyticsService', () => {
    it('should calculate win rate, total won revenue, and sales cycle length', async () => {
      const mockDeals = [
        {
          id: 'deal-1',
          value: 20000,
          status: 'WON',
          createdAt: new Date('2026-10-01'),
          closedAt: new Date('2026-10-15'), // 14 days
        },
        {
          id: 'deal-2',
          value: 10000,
          status: 'LOST',
          createdAt: new Date('2026-10-02'),
          closedAt: new Date('2026-10-10'),
        },
        {
          id: 'deal-3',
          value: 30000,
          status: 'OPEN',
          createdAt: new Date('2026-10-05'),
        },
      ];

      prismaMock.deal.findMany
        .mockResolvedValueOnce(mockDeals) // current deals
        .mockResolvedValueOnce([]); // prev deals

      const result = await salesAnalyticsService.getSalesAnalytics({ timeframe: 'THIS_MONTH' as any });

      expect(result.kpis.totalDeals.current).toBe(3);
      expect(result.kpis.wonDeals.current).toBe(1);
      expect(result.kpis.totalRevenue.current).toBe(20000);
      expect(result.kpis.winRate.current).toBe(50); // 1 won out of 2 closed = 50%
      expect(result.kpis.avgSalesCycleDays).toBe(14);
      expect(result.timeSeries).toBeDefined();
    });

    it('should calculate revenue forecast and active pipeline value', async () => {
      prismaMock.deal.findMany
        .mockResolvedValueOnce([{ value: 50000, closedAt: new Date() }]) // current won
        .mockResolvedValueOnce([{ value: 30000, closedAt: new Date() }]) // prev won
        .mockResolvedValueOnce([{ value: 100000, probability: 50 }]); // open pipeline

      const res = await salesAnalyticsService.getRevenueAnalytics({ timeframe: 'LAST_30_DAYS' as any });

      expect(res.revenue.closedWonRevenue.current).toBe(50000);
      expect(res.revenue.closedWonRevenue.previous).toBe(30000);
      expect(res.revenue.activePipelineValue).toBe(100000);
      expect(res.revenue.weightedForecastRevenue).toBe(50000); // 100,000 * 50% = 50,000
    });
  });

  describe('LeadAnalyticsService', () => {
    it('should calculate lead volume, status breakdown, and conversion rates', async () => {
      const mockLeads = [
        { id: '1', status: 'NEW', source: 'WEBSITE', leadScore: 40, estimatedValue: 1000, createdAt: new Date() },
        { id: '2', status: 'QUALIFIED', source: 'WEBSITE', leadScore: 80, estimatedValue: 5000, createdAt: new Date() },
        { id: '3', status: 'CONVERTED', source: 'REFERRAL', leadScore: 90, estimatedValue: 12000, createdAt: new Date() },
      ];

      prismaMock.lead.findMany
        .mockResolvedValueOnce(mockLeads)
        .mockResolvedValueOnce([]);

      const result = await leadAnalyticsService.getLeadAnalytics({ timeframe: 'LAST_30_DAYS' as any });

      expect(result.kpis.totalLeads.current).toBe(3);
      expect(result.kpis.convertedLeads.current).toBe(1);
      expect(result.kpis.conversionRate.current).toBe(33.3); // 1 / 3 = 33.3%
      expect(result.kpis.statusBreakdown.NEW).toBe(1);
      expect(result.kpis.statusBreakdown.QUALIFIED).toBe(1);
      expect(result.kpis.statusBreakdown.CONVERTED).toBe(1);
      expect(result.kpis.avgLeadScore).toBe(70); // (40+80+90)/3
    });

    it('should aggregate lead sources performance', async () => {
      prismaMock.lead.findMany.mockResolvedValueOnce([
        { id: '1', source: 'WEBSITE', status: 'CONVERTED', leadScore: 80, estimatedValue: 5000 },
        { id: '2', source: 'WEBSITE', status: 'NEW', leadScore: 40, estimatedValue: 1000 },
        { id: '3', source: 'COLD_OUTREACH', status: 'NEW', leadScore: 30, estimatedValue: 500 },
      ]);

      const sourcesRes = await leadAnalyticsService.getLeadSourceAnalytics({ timeframe: 'LAST_30_DAYS' as any });

      expect(sourcesRes.totalLeads).toBe(3);
      expect(sourcesRes.sourcesCount).toBe(2);
      expect(sourcesRes.topPerformingSource).toBe('WEBSITE');
      const websiteSource = sourcesRes.sources.find((s) => s.source === 'WEBSITE');
      expect(websiteSource?.count).toBe(2);
      expect(websiteSource?.convertedCount).toBe(1);
      expect(websiteSource?.conversionRate).toBe(50);
    });

    it('should generate 4-stage conversion funnel', async () => {
      prismaMock.lead.findMany.mockResolvedValueOnce([
        { id: '1', status: 'NEW', estimatedValue: 1000 },
        { id: '2', status: 'QUALIFIED', estimatedValue: 3000 },
        { id: '3', status: 'CONVERTED', estimatedValue: 6000 },
      ]);

      prismaMock.deal.findMany.mockResolvedValueOnce([
        { id: 'd-1', status: 'WON', value: 6000 },
        { id: 'd-2', status: 'OPEN', value: 3000 },
      ]);

      const funnel = await leadAnalyticsService.getConversionAnalytics({ timeframe: 'LAST_30_DAYS' as any });

      expect(funnel.stages).toHaveLength(4);
      expect(funnel.stages[0].stage).toBe('LEADS');
      expect(funnel.stages[0].count).toBe(3);
      expect(funnel.stages[3].stage).toBe('WON');
      expect(funnel.stages[3].count).toBe(1);
    });
  });

  describe('ActivityAnalyticsService', () => {
    it('should calculate activity volume, completion rate, and type breakdowns', async () => {
      prismaMock.activity.findMany
        .mockResolvedValueOnce([
          { id: '1', type: 'CALL', status: 'COMPLETED', priority: 'HIGH', createdAt: new Date() },
          { id: '2', type: 'CALL', status: 'COMPLETED', priority: 'MEDIUM', createdAt: new Date() },
          { id: '3', type: 'EMAIL', status: 'PENDING', priority: 'LOW', createdAt: new Date() },
        ])
        .mockResolvedValueOnce([]);

      const actRes = await activityAnalyticsService.getActivityAnalytics({ timeframe: 'LAST_30_DAYS' as any });

      expect(actRes.kpis.totalActivities.current).toBe(3);
      expect(actRes.kpis.completedActivities.current).toBe(2);
      expect(actRes.kpis.completionRate.current).toBe(66.7);
      expect(actRes.breakdowns.byType.CALL).toBe(2);
      expect(actRes.breakdowns.byType.EMAIL).toBe(1);
      expect(actRes.breakdowns.byPriority.HIGH).toBe(1);
    });
  });

  describe('TeamAnalyticsService & Leaderboard', () => {
    it('should compare team performances and revenue generated', async () => {
      prismaMock.team.findMany.mockResolvedValueOnce([
        {
          id: 'team-1',
          name: 'Enterprise Sales',
          leader: { name: 'Sarah Leader' },
          members: [{ id: 'm-1' }, { id: 'm-2' }],
          deals: [
            { id: 'd-1', value: 80000, status: 'WON' },
            { id: 'd-2', value: 20000, status: 'LOST' },
          ],
          leads: [{ id: 'l-1' }],
          activities: [{ id: 'a-1' }],
        },
      ]);

      const teamRes = await teamAnalyticsService.getTeamAnalytics({ timeframe: 'LAST_30_DAYS' as any });

      expect(teamRes.totalTeams).toBe(1);
      expect(teamRes.teams[0].teamName).toBe('Enterprise Sales');
      expect(teamRes.teams[0].totalRevenue).toBe(80000);
      expect(teamRes.teams[0].winRate).toBe(50);
    });

    it('should rank sales reps on performance leaderboard with assigned ranks', async () => {
      prismaMock.user.findMany.mockResolvedValueOnce([
        {
          id: 'u-1',
          name: 'Bob Agent',
          email: 'bob@crm.com',
          role: { name: 'SALES_REP' },
          deals: [{ id: 'd-1', value: 30000, status: 'WON' }],
          leads: [{ id: 'l-1' }],
          activitiesAssigned: [{ id: 'a-1' }],
        },
        {
          id: 'u-2',
          name: 'Alice Star',
          email: 'alice@crm.com',
          role: { name: 'SALES_REP' },
          deals: [{ id: 'd-2', value: 120000, status: 'WON' }],
          leads: [{ id: 'l-2' }],
          activitiesAssigned: [{ id: 'a-2' }, { id: 'a-3' }],
        },
      ]);

      const repRes = await teamAnalyticsService.getRepPerformance({
        timeframe: 'LAST_30_DAYS' as any,
        sortBy: 'revenue' as any,
        sortOrder: 'desc',
      });

      expect(repRes.data).toHaveLength(2);
      expect(repRes.data[0].name).toBe('Alice Star');
      expect(repRes.data[0].totalRevenue).toBe(120000);
      expect(repRes.data[0].rank).toBe(1);

      expect(repRes.data[1].name).toBe('Bob Agent');
      expect(repRes.data[1].totalRevenue).toBe(30000);
      expect(repRes.data[1].rank).toBe(2);
    });
  });

  describe('AnalyticsService.getOverview', () => {
    it('should combine executive summary KPIs, time series, top sources, and funnel', async () => {
      prismaMock.deal.findMany.mockResolvedValue([]);
      prismaMock.lead.findMany.mockResolvedValue([]);
      prismaMock.activity.findMany.mockResolvedValue([]);

      const overview = await analyticsService.getOverview({ timeframe: 'LAST_30_DAYS' as any });

      expect(overview.kpis.totalRevenue).toBeDefined();
      expect(overview.kpis.dealsWon).toBeDefined();
      expect(overview.kpis.newLeads).toBeDefined();
      expect(overview.revenueTimeSeries).toBeDefined();
      expect(overview.leadsTimeSeries).toBeDefined();
      expect(overview.funnelSummary).toBeDefined();
    });
  });
});
