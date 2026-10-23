import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { DateRangeUtil } from '../utils/date-range.util';
import { TrendUtil } from '../utils/trend.util';
import { AnalyticsCache } from '../utils/analytics-cache.util';
import {
  TimeSeriesPoint,
  PipelineStageMetric,
} from '../interfaces/analytics.interface';

@Injectable()
export class SalesAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  /**
   * Sales & Deal Performance Analytics with velocity and period trends.
   */
  async getSalesAnalytics(query: AnalyticsQueryDto, organizationId?: string) {
    const cacheKey = `sales_analytics_${JSON.stringify(query)}_${organizationId || ''}`;

    return AnalyticsCache.getOrCompute(cacheKey, async () => {
      const { startDate, endDate, prevStartDate, prevEndDate, interval, buckets } =
        DateRangeUtil.resolveDateRange(query);

      const baseWhere: any = {};
      if (organizationId) baseWhere.organizationId = organizationId;
      if (query.teamId) baseWhere.teamId = query.teamId;
      if (query.userId) baseWhere.ownerId = query.userId;
      if (query.pipelineId) baseWhere.pipelineId = query.pipelineId;

      // Current period deals
      const currentWhere = {
        ...baseWhere,
        createdAt: { gte: startDate, lte: endDate },
      };

      // Previous period deals for trend calculations
      const prevWhere = {
        ...baseWhere,
        createdAt: { gte: prevStartDate, lte: prevEndDate },
      };

      const [currentDeals, prevDeals] = await Promise.all([
        this.db.deal.findMany({
          where: currentWhere,
          select: {
            id: true,
            title: true,
            value: true,
            currency: true,
            status: true,
            probability: true,
            createdAt: true,
            closedAt: true,
            stageId: true,
          },
        }),
        this.db.deal.findMany({
          where: prevWhere,
          select: {
            id: true,
            value: true,
            status: true,
            createdAt: true,
            closedAt: true,
          },
        }),
      ]);

      // Calculate Current Period Metrics
      const totalDeals = currentDeals.length;
      const wonDeals = currentDeals.filter((d: any) => d.status === 'WON');
      const lostDeals = currentDeals.filter((d: any) => d.status === 'LOST');
      const openDeals = currentDeals.filter((d: any) => d.status === 'OPEN');

      const wonCount = wonDeals.length;
      const totalWonRevenue = wonDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
      const avgDealSize = wonCount > 0 ? Math.round(totalWonRevenue / wonCount) : 0;
      const closedCount = wonCount + lostDeals.length;
      const winRate = closedCount > 0 ? TrendUtil.calculateRate(wonCount, closedCount) : 0;

      // Sales Cycle Length (average days between creation and closing for won deals)
      const salesCycleDays = wonDeals
        .filter((d: any) => d.closedAt)
        .map((d: any) => Math.max(1, Math.round((new Date(d.closedAt).getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24))));

      const avgSalesCycle =
        salesCycleDays.length > 0
          ? Math.round(salesCycleDays.reduce((a: number, b: number) => a + b, 0) / salesCycleDays.length)
          : 30;

      // Sales Velocity: (Won Deals * Win Rate % * Avg Deal Size) / Avg Sales Cycle Days
      const salesVelocity =
        avgSalesCycle > 0
          ? Math.round((wonCount * (winRate / 100) * avgDealSize) / avgSalesCycle)
          : 0;

      // Calculate Previous Period Metrics
      const prevTotal = prevDeals.length;
      const prevWon = prevDeals.filter((d: any) => d.status === 'WON');
      const prevLost = prevDeals.filter((d: any) => d.status === 'LOST');
      const prevWonCount = prevWon.length;
      const prevWonRevenue = prevWon.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
      const prevAvgDealSize = prevWonCount > 0 ? Math.round(prevWonRevenue / prevWonCount) : 0;
      const prevClosed = prevWonCount + prevLost.length;
      const prevWinRate = prevClosed > 0 ? TrendUtil.calculateRate(prevWonCount, prevClosed) : 0;

      // Generate Time Series for Sales (Deals Won and Deal Volume)
      const salesTimeSeries: TimeSeriesPoint[] = buckets.map((bucket) => {
        const matchingWon = wonDeals.filter(
          (d: any) =>
            new Date(d.closedAt || d.createdAt) >= bucket.start &&
            new Date(d.closedAt || d.createdAt) <= bucket.end,
        );
        const matchingCreated = currentDeals.filter(
          (d: any) => new Date(d.createdAt) >= bucket.start && new Date(d.createdAt) <= bucket.end,
        );

        const wonRevenue = matchingWon.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

        return {
          date: bucket.key,
          label: bucket.label,
          value: wonRevenue,
          count: matchingWon.length,
          secondaryValue: matchingCreated.length,
        };
      });

      return {
        timeframe: query.timeframe || 'LAST_30_DAYS',
        interval,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        kpis: {
          totalDeals: TrendUtil.calculateTrend(totalDeals, prevTotal),
          wonDeals: TrendUtil.calculateTrend(wonCount, prevWonCount),
          winRate: TrendUtil.calculateTrend(winRate, prevWinRate),
          totalRevenue: TrendUtil.calculateTrend(totalWonRevenue, prevWonRevenue),
          avgDealSize: TrendUtil.calculateTrend(avgDealSize, prevAvgDealSize),
          openDealsCount: openDeals.length,
          lostDealsCount: lostDeals.length,
          avgSalesCycleDays: avgSalesCycle,
          salesVelocityPerDay: salesVelocity,
        },
        timeSeries: salesTimeSeries,
      };
    });
  }

  /**
   * Revenue Analytics with projections, weighted pipeline, and time-series.
   */
  async getRevenueAnalytics(query: AnalyticsQueryDto, organizationId?: string) {
    const cacheKey = `revenue_analytics_${JSON.stringify(query)}_${organizationId || ''}`;

    return AnalyticsCache.getOrCompute(cacheKey, async () => {
      const { startDate, endDate, prevStartDate, prevEndDate, interval, buckets } =
        DateRangeUtil.resolveDateRange(query);

      const baseWhere: any = {};
      if (organizationId) baseWhere.organizationId = organizationId;
      if (query.teamId) baseWhere.teamId = query.teamId;
      if (query.userId) baseWhere.ownerId = query.userId;

      // Deals closed won in current period
      const currentWonWhere = {
        ...baseWhere,
        status: 'WON',
        closedAt: { gte: startDate, lte: endDate },
      };

      // Deals closed won in previous period
      const prevWonWhere = {
        ...baseWhere,
        status: 'WON',
        closedAt: { gte: prevStartDate, lte: prevEndDate },
      };

      // Active open deals in pipeline
      const openWhere = {
        ...baseWhere,
        status: 'OPEN',
      };

      const [currentWonDeals, prevWonDeals, openDeals] = await Promise.all([
        this.db.deal.findMany({
          where: currentWonWhere,
          select: { value: true, currency: true, closedAt: true, createdAt: true },
        }),
        this.db.deal.findMany({
          where: prevWonWhere,
          select: { value: true, closedAt: true },
        }),
        this.db.deal.findMany({
          where: openWhere,
          select: { value: true, probability: true, currency: true },
        }),
      ]);

      const totalRevenue = currentWonDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
      const prevTotalRevenue = prevWonDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

      const openPipelineValue = openDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
      // Weighted forecast revenue = value * (probability / 100)
      const weightedForecastRevenue = Math.round(
        openDeals.reduce(
          (sum: number, d: any) => sum + (d.value || 0) * ((d.probability || 20) / 100),
          0,
        ),
      );

      // Revenue Time Series
      const revenueTimeSeries: TimeSeriesPoint[] = buckets.map((bucket) => {
        const dealsInBucket = currentWonDeals.filter(
          (d: any) =>
            new Date(d.closedAt || d.createdAt) >= bucket.start &&
            new Date(d.closedAt || d.createdAt) <= bucket.end,
        );
        const bucketRevenue = dealsInBucket.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

        return {
          date: bucket.key,
          label: bucket.label,
          value: bucketRevenue,
          count: dealsInBucket.length,
        };
      });

      return {
        timeframe: query.timeframe || 'LAST_30_DAYS',
        interval,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        revenue: {
          closedWonRevenue: TrendUtil.calculateTrend(totalRevenue, prevTotalRevenue),
          activePipelineValue: openPipelineValue,
          weightedForecastRevenue,
          dealsWonCount: currentWonDeals.length,
          avgRevenuePerDeal:
            currentWonDeals.length > 0 ? Math.round(totalRevenue / currentWonDeals.length) : 0,
        },
        timeSeries: revenueTimeSeries,
      };
    });
  }

  /**
   * Pipeline Analytics: Stage distribution, stage bottlenecks, and win probabilities.
   */
  async getPipelineAnalytics(query: AnalyticsQueryDto, organizationId?: string) {
    const cacheKey = `pipeline_analytics_${JSON.stringify(query)}_${organizationId || ''}`;

    return AnalyticsCache.getOrCompute(cacheKey, async () => {
      const baseWhere: any = {};
      if (organizationId) baseWhere.organizationId = organizationId;
      if (query.teamId) baseWhere.teamId = query.teamId;
      if (query.userId) baseWhere.ownerId = query.userId;

      // Find primary pipeline or target pipeline
      const pipeline = query.pipelineId
        ? await this.db.pipeline.findUnique({
            where: { id: query.pipelineId },
            include: { stages: { orderBy: { order: 'asc' } } },
          })
        : await this.db.pipeline.findFirst({
            where: { isDefault: true },
            include: { stages: { orderBy: { order: 'asc' } } },
          }) ||
          (await this.db.pipeline.findFirst({
            include: { stages: { orderBy: { order: 'asc' } } },
          }));

      if (!pipeline) {
        return {
          pipelineId: null,
          pipelineName: 'Default Pipeline',
          totalPipelineValue: 0,
          totalDeals: 0,
          stages: [],
        };
      }

      // Fetch all deals in this pipeline
      const deals = await this.db.deal.findMany({
        where: {
          ...baseWhere,
          pipelineId: pipeline.id,
        },
        select: {
          id: true,
          value: true,
          stageId: true,
          status: true,
          probability: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      let totalPipelineValue = 0;
      let totalWeightedValue = 0;

      const stageMetrics: PipelineStageMetric[] = pipeline.stages.map((stage: any) => {
        const stageDeals = deals.filter((d: any) => d.stageId === stage.id);
        const stageValue = stageDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
        const winProb = stage.winProbability !== undefined ? stage.winProbability : 20;
        const weightedValue = Math.round(stageValue * (winProb / 100));

        totalPipelineValue += stageValue;
        totalWeightedValue += weightedValue;

        return {
          stageId: stage.id,
          stageName: stage.name,
          order: stage.order,
          color: stage.color || '#3b82f6',
          dealCount: stageDeals.length,
          totalValue: stageValue,
          weightedValue,
          winProbability: winProb,
        };
      });

      return {
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        totalPipelineValue,
        totalWeightedValue,
        totalDeals: deals.length,
        stages: stageMetrics,
      };
    });
  }
}
