import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { DateRangeUtil } from '../utils/date-range.util';
import { TrendUtil } from '../utils/trend.util';
import { AnalyticsCache } from '../utils/analytics-cache.util';
import {
  TimeSeriesPoint,
  LeadSourceMetric,
  ConversionStage,
} from '../interfaces/analytics.interface';

@Injectable()
export class LeadAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  /**
   * Lead Analytics: Volumes, status breakdown, conversion rates, and time-series.
   */
  async getLeadAnalytics(query: AnalyticsQueryDto, workspaceId?: string) {
    const cacheKey = `lead_analytics_${JSON.stringify(query)}_${workspaceId || ''}`;

    return AnalyticsCache.getOrCompute(cacheKey, async () => {
      const { startDate, endDate, prevStartDate, prevEndDate, interval, buckets } =
        DateRangeUtil.resolveDateRange(query);

      const baseWhere: any = {};
      if (workspaceId) baseWhere.workspaceId = workspaceId;
      if (query.teamId) baseWhere.teamId = query.teamId;
      if (query.userId) baseWhere.ownerId = query.userId;

      // Current period leads
      const currentWhere = {
        ...baseWhere,
        createdAt: { gte: startDate, lte: endDate },
      };

      // Previous period leads
      const prevWhere = {
        ...baseWhere,
        createdAt: { gte: prevStartDate, lte: prevEndDate },
      };

      const [currentLeads, prevLeads] = await Promise.all([
        this.db.lead.findMany({
          where: currentWhere,
          select: {
            id: true,
            status: true,
            source: true,
            leadScore: true,
            estimatedValue: true,
            createdAt: true,
          },
        }),
        this.db.lead.findMany({
          where: prevWhere,
          select: { id: true, status: true, createdAt: true },
        }),
      ]);

      const totalLeads = currentLeads.length;
      const prevTotalLeads = prevLeads.length;

      const newLeads = currentLeads.filter((l: any) => l.status === 'NEW').length;
      const contactedLeads = currentLeads.filter((l: any) => l.status === 'CONTACTED').length;
      const qualifiedLeads = currentLeads.filter((l: any) => l.status === 'QUALIFIED').length;
      const convertedLeads = currentLeads.filter((l: any) => l.status === 'CONVERTED').length;
      const unqualifiedLeads = currentLeads.filter((l: any) => l.status === 'UNQUALIFIED').length;

      const prevConverted = prevLeads.filter((l: any) => l.status === 'CONVERTED').length;

      const conversionRate = totalLeads > 0 ? TrendUtil.calculateRate(convertedLeads, totalLeads) : 0;
      const prevConversionRate =
        prevTotalLeads > 0 ? TrendUtil.calculateRate(prevConverted, prevTotalLeads) : 0;

      const qualificationRate =
        totalLeads > 0 ? TrendUtil.calculateRate(qualifiedLeads + convertedLeads, totalLeads) : 0;

      // Average lead score
      const totalScore = currentLeads.reduce((sum: number, l: any) => sum + (l.leadScore || 0), 0);
      const avgLeadScore = totalLeads > 0 ? Math.round(totalScore / totalLeads) : 0;

      // Time series buckets
      const leadsTimeSeries: TimeSeriesPoint[] = buckets.map((bucket) => {
        const matchingCreated = currentLeads.filter(
          (l: any) => new Date(l.createdAt) >= bucket.start && new Date(l.createdAt) <= bucket.end,
        );
        const matchingConverted = matchingCreated.filter((l: any) => l.status === 'CONVERTED');

        return {
          date: bucket.key,
          label: bucket.label,
          value: matchingCreated.length,
          count: matchingCreated.length,
          secondaryValue: matchingConverted.length,
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
          totalLeads: TrendUtil.calculateTrend(totalLeads, prevTotalLeads),
          convertedLeads: TrendUtil.calculateTrend(convertedLeads, prevConverted),
          conversionRate: TrendUtil.calculateTrend(conversionRate, prevConversionRate),
          qualificationRate: TrendUtil.calculateTrend(qualificationRate, 0),
          avgLeadScore,
          statusBreakdown: {
            NEW: newLeads,
            CONTACTED: contactedLeads,
            QUALIFIED: qualifiedLeads,
            CONVERTED: convertedLeads,
            UNQUALIFIED: unqualifiedLeads,
          },
        },
        timeSeries: leadsTimeSeries,
      };
    });
  }

  /**
   * Lead Source Performance: Traffic sources, conversion rates, and revenue attribution.
   */
  async getLeadSourceAnalytics(query: AnalyticsQueryDto, workspaceId?: string) {
    const cacheKey = `lead_sources_analytics_${JSON.stringify(query)}_${workspaceId || ''}`;

    return AnalyticsCache.getOrCompute(cacheKey, async () => {
      const { startDate, endDate } = DateRangeUtil.resolveDateRange(query);

      const baseWhere: any = {
        createdAt: { gte: startDate, lte: endDate },
      };
      if (workspaceId) baseWhere.workspaceId = workspaceId;
      if (query.teamId) baseWhere.teamId = query.teamId;

      const leads = await this.db.lead.findMany({
        where: baseWhere,
        select: {
          id: true,
          source: true,
          status: true,
          leadScore: true,
          estimatedValue: true,
          convertedDealId: true,
        },
      });

      const totalLeads = leads.length;

      // Group leads by source
      const sourceMap = new Map<
        string,
        {
          count: number;
          convertedCount: number;
          totalScore: number;
          estimatedRevenue: number;
        }
      >();

      for (const lead of leads) {
        const source = lead.source || 'OTHER';
        if (!sourceMap.has(source)) {
          sourceMap.set(source, {
            count: 0,
            convertedCount: 0,
            totalScore: 0,
            estimatedRevenue: 0,
          });
        }

        const entry = sourceMap.get(source)!;
        entry.count += 1;
        entry.totalScore += lead.leadScore || 0;
        entry.estimatedRevenue += lead.estimatedValue || 0;

        if (lead.status === 'CONVERTED') {
          entry.convertedCount += 1;
        }
      }

      const sourcesList: LeadSourceMetric[] = Array.from(sourceMap.entries()).map(
        ([source, data]) => {
          const conversionRate = TrendUtil.calculateRate(data.convertedCount, data.count);
          const percentageOfTotal = TrendUtil.calculateRate(data.count, totalLeads);
          const avgLeadScore = data.count > 0 ? Math.round(data.totalScore / data.count) : 0;

          return {
            source,
            count: data.count,
            convertedCount: data.convertedCount,
            conversionRate,
            revenue: Math.round(data.estimatedRevenue),
            avgLeadScore,
            percentageOfTotal,
          };
        },
      );

      // Sort by volume descending
      sourcesList.sort((a, b) => b.count - a.count);

      return {
        totalLeads,
        sourcesCount: sourcesList.length,
        topPerformingSource: sourcesList.length > 0 ? sourcesList[0].source : null,
        sources: sourcesList,
      };
    });
  }

  /**
   * Conversion Funnel Analytics: Leads -> Contacted -> Qualified -> Deals -> Won.
   */
  async getConversionAnalytics(query: AnalyticsQueryDto, workspaceId?: string) {
    const cacheKey = `conversion_analytics_${JSON.stringify(query)}_${workspaceId || ''}`;

    return AnalyticsCache.getOrCompute(cacheKey, async () => {
      const { startDate, endDate } = DateRangeUtil.resolveDateRange(query);

      const baseWhere: any = {
        createdAt: { gte: startDate, lte: endDate },
      };
      if (workspaceId) baseWhere.workspaceId = workspaceId;
      if (query.teamId) baseWhere.teamId = query.teamId;

      const [leads, deals] = await Promise.all([
        this.db.lead.findMany({
          where: baseWhere,
          select: { id: true, status: true, estimatedValue: true },
        }),
        this.db.deal.findMany({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            ...(query.teamId ? { teamId: query.teamId } : {}),
          },
          select: { id: true, status: true, value: true },
        }),
      ]);

      const totalLeadsCount = leads.length;
      const totalLeadsValue = leads.reduce((sum: number, l: any) => sum + (l.estimatedValue || 0), 0);

      const qualifiedOrBeyond = leads.filter(
        (l: any) => l.status === 'QUALIFIED' || l.status === 'CONVERTED',
      );

      const dealsCreatedCount = deals.length;
      const dealsCreatedValue = deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

      const dealsWon = deals.filter((d: any) => d.status === 'WON');
      const dealsWonCount = dealsWon.length;
      const dealsWonValue = dealsWon.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

      // Build 4 Funnel Stages
      const baseCount = totalLeadsCount > 0 ? totalLeadsCount : 1;

      const stages: ConversionStage[] = [
        {
          stage: 'LEADS',
          name: 'Total Leads Generated',
          count: totalLeadsCount,
          value: totalLeadsValue,
          conversionRate: 100,
          dropOffRate: 0,
        },
        {
          stage: 'QUALIFIED',
          name: 'Qualified Leads',
          count: qualifiedOrBeyond.length,
          value: qualifiedOrBeyond.reduce((sum: number, l: any) => sum + (l.estimatedValue || 0), 0),
          conversionRate: TrendUtil.calculateRate(qualifiedOrBeyond.length, baseCount),
          dropOffRate: TrendUtil.calculateRate(totalLeadsCount - qualifiedOrBeyond.length, baseCount),
        },
        {
          stage: 'DEALS',
          name: 'Deals Created (Opportunities)',
          count: dealsCreatedCount,
          value: dealsCreatedValue,
          conversionRate: TrendUtil.calculateRate(dealsCreatedCount, baseCount),
          dropOffRate: TrendUtil.calculateRate(
            Math.max(0, qualifiedOrBeyond.length - dealsCreatedCount),
            qualifiedOrBeyond.length || 1,
          ),
        },
        {
          stage: 'WON',
          name: 'Closed Deals Won (Customers)',
          count: dealsWonCount,
          value: dealsWonValue,
          conversionRate: TrendUtil.calculateRate(dealsWonCount, baseCount),
          dropOffRate: TrendUtil.calculateRate(
            Math.max(0, dealsCreatedCount - dealsWonCount),
            dealsCreatedCount || 1,
          ),
        },
      ];

      const overallConversionRate = TrendUtil.calculateRate(dealsWonCount, baseCount);

      return {
        totalLeads: totalLeadsCount,
        totalDealsWon: dealsWonCount,
        overallConversionRate,
        stages,
      };
    });
  }
}
