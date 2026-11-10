import { Injectable } from '@nestjs/common';
import { SalesAnalyticsService } from './sales-analytics.service';
import { LeadAnalyticsService } from './lead-analytics.service';
import { ActivityAnalyticsService } from './activity-analytics.service';
import { TeamAnalyticsService } from './team-analytics.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { PerformanceQueryDto } from '../dto/performance-query.dto';
import { AnalyticsOverview } from '../interfaces/analytics.interface';

@Injectable()
export class AnalyticsService {
  constructor(
    public readonly sales: SalesAnalyticsService,
    public readonly leads: LeadAnalyticsService,
    public readonly activities: ActivityAnalyticsService,
    public readonly teams: TeamAnalyticsService,
  ) {}

  /**
   * Executive Overview & Primary KPI Dashboard.
   */
  async getOverview(
    query: AnalyticsQueryDto,
    organizationId?: string,
    workspaceId?: string,
  ): Promise<AnalyticsOverview> {
    const targetWorkspaceId = query.workspaceId || workspaceId;

    const [
      salesRes,
      leadRes,
      sourcesRes,
      funnelRes,
      activityRes,
      pipelineRes,
    ] = await Promise.allSettled([
      this.sales.getSalesAnalytics(query, organizationId),
      this.leads.getLeadAnalytics(query, targetWorkspaceId),
      this.leads.getLeadSourceAnalytics(query, targetWorkspaceId),
      this.leads.getConversionAnalytics(query, targetWorkspaceId),
      this.activities.getActivityAnalytics(query, organizationId),
      this.sales.getPipelineAnalytics(query, organizationId),
    ]);

    const salesAnalytics = salesRes.status === 'fulfilled' ? salesRes.value : null;
    const leadAnalytics = leadRes.status === 'fulfilled' ? leadRes.value : null;
    const leadSources = sourcesRes.status === 'fulfilled' ? sourcesRes.value : null;
    const conversionFunnel = funnelRes.status === 'fulfilled' ? funnelRes.value : null;
    const activityAnalytics = activityRes.status === 'fulfilled' ? activityRes.value : null;
    const pipelineAnalytics = pipelineRes.status === 'fulfilled' ? pipelineRes.value : null;

    const zeroMetric = {
      current: 0,
      previous: 0,
      change: 0,
      percentage: 0,
      direction: 'FLAT' as const,
    };

    return {
      period: {
        startDate: salesAnalytics?.dateRange?.startDate || new Date(Date.now() - 30 * 86400000).toISOString(),
        endDate: salesAnalytics?.dateRange?.endDate || new Date().toISOString(),
        timeframe: query.timeframe || 'LAST_30_DAYS',
        interval: salesAnalytics?.interval || 'DAILY',
      },
      kpis: {
        totalRevenue: salesAnalytics?.kpis?.totalRevenue || zeroMetric,
        dealsWon: salesAnalytics?.kpis?.wonDeals || zeroMetric,
        winRate: salesAnalytics?.kpis?.winRate || zeroMetric,
        avgDealSize: salesAnalytics?.kpis?.avgDealSize || zeroMetric,
        newLeads: leadAnalytics?.kpis?.totalLeads || zeroMetric,
        leadConversionRate: leadAnalytics?.kpis?.conversionRate || zeroMetric,
        activePipelineValue: {
          current: pipelineAnalytics?.totalPipelineValue || 0,
          previous: 0,
          change: 0,
          percentage: 0,
          direction: 'FLAT',
        },
        activitiesCompleted: activityAnalytics?.kpis?.completedActivities || zeroMetric,
      },
      revenueTimeSeries: salesAnalytics?.timeSeries || [],
      leadsTimeSeries: leadAnalytics?.timeSeries || [],
      topLeadSources: (leadSources?.sources || []).slice(0, 5),
      funnelSummary: conversionFunnel?.stages || [],
    };
  }

  // Sales
  async getSalesAnalytics(query: AnalyticsQueryDto, organizationId?: string) {
    return this.sales.getSalesAnalytics(query, organizationId);
  }

  // Revenue
  async getRevenueAnalytics(query: AnalyticsQueryDto, organizationId?: string) {
    return this.sales.getRevenueAnalytics(query, organizationId);
  }

  // Pipeline
  async getPipelineAnalytics(query: AnalyticsQueryDto, organizationId?: string) {
    return this.sales.getPipelineAnalytics(query, organizationId);
  }

  // Leads
  async getLeadAnalytics(query: AnalyticsQueryDto, workspaceId?: string) {
    return this.leads.getLeadAnalytics(query, workspaceId);
  }

  // Lead Sources
  async getLeadSourceAnalytics(query: AnalyticsQueryDto, workspaceId?: string) {
    return this.leads.getLeadSourceAnalytics(query, workspaceId);
  }

  // Conversion Funnel
  async getConversionAnalytics(query: AnalyticsQueryDto, workspaceId?: string) {
    return this.leads.getConversionAnalytics(query, workspaceId);
  }

  // Activities
  async getActivityAnalytics(query: AnalyticsQueryDto, organizationId?: string) {
    return this.activities.getActivityAnalytics(query, organizationId);
  }

  // Teams
  async getTeamAnalytics(query: AnalyticsQueryDto, organizationId?: string) {
    return this.teams.getTeamAnalytics(query, organizationId);
  }

  // Sales Rep Performance Leaderboard
  async getRepPerformance(query: PerformanceQueryDto, organizationId?: string) {
    return this.teams.getRepPerformance(query, organizationId);
  }
}
