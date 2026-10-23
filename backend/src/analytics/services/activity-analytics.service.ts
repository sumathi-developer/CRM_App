import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { DateRangeUtil } from '../utils/date-range.util';
import { TrendUtil } from '../utils/trend.util';
import { AnalyticsCache } from '../utils/analytics-cache.util';
import { TimeSeriesPoint } from '../interfaces/analytics.interface';

@Injectable()
export class ActivityAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  /**
   * Activity Analytics: Completion rates, type distributions, priorities, and velocity.
   */
  async getActivityAnalytics(query: AnalyticsQueryDto, organizationId?: string) {
    const cacheKey = `activity_analytics_${JSON.stringify(query)}_${organizationId || ''}`;

    return AnalyticsCache.getOrCompute(cacheKey, async () => {
      const { startDate, endDate, prevStartDate, prevEndDate, interval, buckets } =
        DateRangeUtil.resolveDateRange(query);

      const baseWhere: any = {};
      if (query.teamId) baseWhere.teamId = query.teamId;
      if (query.userId) baseWhere.assignedToId = query.userId;

      // Current period activities
      const currentWhere = {
        ...baseWhere,
        createdAt: { gte: startDate, lte: endDate },
      };

      // Previous period activities
      const prevWhere = {
        ...baseWhere,
        createdAt: { gte: prevStartDate, lte: prevEndDate },
      };

      const [currentActivities, prevActivities] = await Promise.all([
        this.db.activity.findMany({
          where: currentWhere,
          select: {
            id: true,
            type: true,
            status: true,
            priority: true,
            scheduledAt: true,
            completedAt: true,
            createdAt: true,
          },
        }),
        this.db.activity.findMany({
          where: prevWhere,
          select: { id: true, status: true },
        }),
      ]);

      const totalActivities = currentActivities.length;
      const prevTotal = prevActivities.length;

      const completed = currentActivities.filter((a: any) => a.status === 'COMPLETED').length;
      const pending = currentActivities.filter((a: any) => a.status === 'PENDING').length;
      const cancelled = currentActivities.filter((a: any) => a.status === 'CANCELLED').length;

      const prevCompleted = prevActivities.filter((a: any) => a.status === 'COMPLETED').length;

      const completionRate =
        totalActivities > 0 ? TrendUtil.calculateRate(completed, totalActivities) : 0;
      const prevCompletionRate =
        prevTotal > 0 ? TrendUtil.calculateRate(prevCompleted, prevTotal) : 0;

      // Group by Activity Type
      const typeBreakdown: Record<string, number> = {
        CALL: 0,
        EMAIL: 0,
        MEETING: 0,
        WHATSAPP: 0,
        FOLLOW_UP: 0,
      };

      for (const a of currentActivities) {
        const type = (a.type || 'CALL').toUpperCase();
        typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
      }

      // Group by Priority
      const priorityBreakdown: Record<string, number> = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        URGENT: 0,
      };

      for (const a of currentActivities) {
        const priority = (a.priority || 'MEDIUM').toUpperCase();
        priorityBreakdown[priority] = (priorityBreakdown[priority] || 0) + 1;
      }

      // Activity Time Series
      const activityTimeSeries: TimeSeriesPoint[] = buckets.map((bucket) => {
        const matching = currentActivities.filter(
          (a: any) => new Date(a.createdAt) >= bucket.start && new Date(a.createdAt) <= bucket.end,
        );
        const matchingCompleted = matching.filter((a: any) => a.status === 'COMPLETED');

        return {
          date: bucket.key,
          label: bucket.label,
          value: matching.length,
          count: matching.length,
          secondaryValue: matchingCompleted.length,
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
          totalActivities: TrendUtil.calculateTrend(totalActivities, prevTotal),
          completedActivities: TrendUtil.calculateTrend(completed, prevCompleted),
          completionRate: TrendUtil.calculateTrend(completionRate, prevCompletionRate),
          pendingCount: pending,
          cancelledCount: cancelled,
        },
        breakdowns: {
          byType: typeBreakdown,
          byPriority: priorityBreakdown,
        },
        timeSeries: activityTimeSeries,
      };
    });
  }
}
