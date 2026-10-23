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

    const [salesAnalytics, leadAnalytics, leadSources, conversionFunnel, activityAnalytics, pipelineAnalytics] =
      await Promise.all([
        this.sales.getSalesAnalytics(query, organizationId),
        this.leads.getLeadAnalytics(query, targetWorkspaceId),
        this.leads.getLeadSourceAnalytics(query, targetWorkspaceId),
        this.leads.getConversionAnalytics(query, targetWorkspaceId),
        this.activities.getActivityAnalytics(query, organizationId),
        this.sales.getPipelineAnalytics(query, organizationId),
      ]);

    return {
      period: {
        startDate: salesAnalytics.dateRange.startDate,
        endDate: salesAnalytics.dateRange.endDate,
        timeframe: query.timeframe || 'LAST_30_DAYS',
        interval: salesAnalytics.interval,
      },
      kpis: {
        totalRevenue: salesAnalytics.kpis.totalRevenue,
        dealsWon: salesAnalytics.kpis.wonDeals,
        winRate: salesAnalytics.kpis.winRate,
        avgDealSize: salesAnalytics.kpis.avgDealSize,
        newLeads: leadAnalytics.kpis.totalLeads,
        leadConversionRate: leadAnalytics.kpis.conversionRate,
        activePipelineValue: {
          current: pipelineAnalytics.totalPipelineValue,
          previous: 0,
          change: 0,
          percentage: 0,
          direction: 'FLAT',
        },
        activitiesCompleted: activityAnalytics.kpis.completedActivities,
      },
      revenueTimeSeries: salesAnalytics.timeSeries,
      leadsTimeSeries: leadAnalytics.timeSeries,
      topLeadSources: leadSources.sources.slice(0, 5),
      funnelSummary: conversionFunnel.stages,
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
