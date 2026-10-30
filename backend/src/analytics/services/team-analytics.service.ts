import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { PerformanceQueryDto, PerformanceSortByEnum } from '../dto/performance-query.dto';
import { DateRangeUtil } from '../utils/date-range.util';
import { TrendUtil } from '../utils/trend.util';
import { AnalyticsCache } from '../utils/analytics-cache.util';
import { TeamMetric, RepPerformanceMetric } from '../interfaces/analytics.interface';
import { createPaginatedResponse } from '../../common/utils/response.util';

@Injectable()
export class TeamAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  /**
   * Team Analytics: Team performance comparison, deal closures, and revenue by team.
   */
  async getTeamAnalytics(query: AnalyticsQueryDto, organizationId?: string) {
    const cacheKey = `team_analytics_${JSON.stringify(query)}_${organizationId || ''}`;

    return AnalyticsCache.getOrCompute(cacheKey, async () => {
      const { startDate, endDate } = DateRangeUtil.resolveDateRange(query);

      const teamWhere: any = {};
      if (organizationId) teamWhere.organizationId = organizationId;
      if (query.teamId) teamWhere.id = query.teamId;

      const teams = await this.db.team.findMany({
        where: teamWhere,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: { select: { id: true, userId: true } },
          deals: {
            where: { createdAt: { gte: startDate, lte: endDate } },
            select: { id: true, value: true, status: true },
          },
          leads: {
            where: { createdAt: { gte: startDate, lte: endDate } },
            select: { id: true },
          },
          activities: {
            where: { createdAt: { gte: startDate, lte: endDate } },
            select: { id: true },
          },
        },
      });

      const teamMetrics: TeamMetric[] = teams.map((team: any) => {
        const deals = team.deals || [];
        const wonDeals = deals.filter((d: any) => d.status === 'WON');
        const closedDeals = deals.filter((d: any) => d.status === 'WON' || d.status === 'LOST');

        const totalRevenue = wonDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
        const winRate =
          closedDeals.length > 0 ? TrendUtil.calculateRate(wonDeals.length, closedDeals.length) : 0;

        return {
          teamId: team.id,
          teamName: team.name,
          leaderName: team.owner?.name,
          memberCount:
            (team.members?.length || 0) +
            (!team.members?.some((m: any) => m.userId === team.ownerId) && team.ownerId ? 1 : 0),
          leadsCount: team.leads?.length || 0,
          dealsCount: deals.length,
          dealsWon: wonDeals.length,
          winRate,
          totalRevenue,
          activitiesCount: team.activities?.length || 0,
        };
      });

      // Sort by total revenue descending
      teamMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue);

      return {
        totalTeams: teamMetrics.length,
        teams: teamMetrics,
      };
    });
  }

  /**
   * User / Representative Performance Analytics with Leaderboard ranking.
   */
  async getRepPerformance(query: PerformanceQueryDto, organizationId?: string) {
    const cacheKey = `rep_performance_${JSON.stringify(query)}_${organizationId || ''}`;

    return AnalyticsCache.getOrCompute(cacheKey, async () => {
      const { startDate, endDate } = DateRangeUtil.resolveDateRange({
        timeframe: query.timeframe,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      });

      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;

      const userWhere: any = { status: 'ACTIVE' };
      if (organizationId) userWhere.organizationId = organizationId;

      // If team filter is applied, only users in that team
      if (query.teamId) {
        userWhere.teamMemberships = { some: { teamId: query.teamId } };
      }

      const users = await this.db.user.findMany({
        where: userWhere,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: { select: { name: true } },
          deals: {
            where: { createdAt: { gte: startDate, lte: endDate } },
            select: { id: true, value: true, status: true },
          },
          leads: {
            where: { createdAt: { gte: startDate, lte: endDate } },
            select: { id: true },
          },
          activitiesAssigned: {
            where: {
              createdAt: { gte: startDate, lte: endDate },
              status: 'COMPLETED',
            },
            select: { id: true },
          },
        },
      });

      const metrics: RepPerformanceMetric[] = users.map((u: any) => {
        const deals = u.deals || [];
        const wonDeals = deals.filter((d: any) => d.status === 'WON');
        const closedDeals = deals.filter((d: any) => d.status === 'WON' || d.status === 'LOST');

        const totalRevenue = wonDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
        const winRate =
          closedDeals.length > 0 ? TrendUtil.calculateRate(wonDeals.length, closedDeals.length) : 0;
        const avgDealSize = wonDeals.length > 0 ? Math.round(totalRevenue / wonDeals.length) : 0;

        return {
          userId: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          role: u.role?.name,
          leadsAssigned: u.leads?.length || 0,
          dealsCreated: deals.length,
          dealsWon: wonDeals.length,
          winRate,
          totalRevenue,
          avgDealSize,
          activitiesCompleted: u.activitiesAssigned?.length || 0,
          rank: 0,
        };
      });

      // Sorting
      const sortBy = query.sortBy || PerformanceSortByEnum.REVENUE;
      const isAsc = query.sortOrder === 'asc';

      metrics.sort((a, b) => {
        let diff = 0;
        switch (sortBy) {
          case PerformanceSortByEnum.REVENUE:
            diff = b.totalRevenue - a.totalRevenue;
            break;
          case PerformanceSortByEnum.DEALS_WON:
            diff = b.dealsWon - a.dealsWon;
            break;
          case PerformanceSortByEnum.WIN_RATE:
            diff = b.winRate - a.winRate;
            break;
          case PerformanceSortByEnum.ACTIVITIES:
            diff = b.activitiesCompleted - a.activitiesCompleted;
            break;
          case PerformanceSortByEnum.DEALS_CREATED:
            diff = b.dealsCreated - a.dealsCreated;
            break;
          default:
            diff = b.totalRevenue - a.totalRevenue;
        }
        return isAsc ? -diff : diff;
      });

      // Assign ranks based on sorted order
      metrics.forEach((m, idx) => {
        m.rank = idx + 1;
      });

      const total = metrics.length;
      const skip = (page - 1) * limit;
      const paginatedMetrics = metrics.slice(skip, skip + limit);

      return createPaginatedResponse(paginatedMetrics, total, page, limit);
    });
  }
}
