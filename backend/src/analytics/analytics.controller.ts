import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { PerformanceQueryDto } from './dto/performance-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Executive overview dashboard (KPIs with trends, time-series, top sources, and funnel)',
  })
  @ApiResponse({ status: 200, description: 'Executive analytics overview' })
  async getOverview(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const orgId = user?.organizationId;
    const workspaceId = req.workspace?.id || user?.activeWorkspaceId;
    return this.analyticsService.getOverview(query, orgId, workspaceId);
  }

  @Get('sales')
  @ApiOperation({
    summary: 'Sales analytics (Deals won, win rate, avg deal size, sales cycle, velocity, time-series)',
  })
  @ApiResponse({ status: 200, description: 'Sales performance analytics' })
  async getSalesAnalytics(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.analyticsService.getSalesAnalytics(query, orgId);
  }

  @Get('revenue')
  @ApiOperation({
    summary: 'Revenue analytics (Closed-won revenue, weighted forecast, pipeline value, time-series)',
  })
  @ApiResponse({ status: 200, description: 'Revenue metrics and projections' })
  async getRevenueAnalytics(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.analyticsService.getRevenueAnalytics(query, orgId);
  }

  @Get('pipeline')
  @ApiOperation({
    summary: 'Pipeline analytics (Stage distribution, deal count, total value, weighted forecast)',
  })
  @ApiResponse({ status: 200, description: 'Pipeline stage breakdown and health metrics' })
  async getPipelineAnalytics(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.analyticsService.getPipelineAnalytics(query, orgId);
  }

  @Get('leads')
  @ApiOperation({
    summary: 'Lead analytics (Lead volume, status breakdown, qualification/conversion rates, time-series)',
  })
  @ApiResponse({ status: 200, description: 'Lead generation and qualification metrics' })
  async getLeadAnalytics(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const workspaceId = req.workspace?.id || user?.activeWorkspaceId;
    return this.analyticsService.getLeadAnalytics(query, workspaceId);
  }

  @Get('lead-sources')
  @ApiOperation({
    summary: 'Lead source performance (Traffic sources, conversion rates, and revenue attribution)',
  })
  @ApiResponse({ status: 200, description: 'Lead source performance and ROI metrics' })
  async getLeadSourceAnalytics(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const workspaceId = req.workspace?.id || user?.activeWorkspaceId;
    return this.analyticsService.getLeadSourceAnalytics(query, workspaceId);
  }

  @Get('conversion')
  @ApiOperation({
    summary: 'Conversion funnel analytics (Stage-by-stage conversions, drop-offs, and funnel leakage)',
  })
  @ApiResponse({ status: 200, description: 'Full-funnel conversion analysis' })
  async getConversionAnalytics(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const workspaceId = req.workspace?.id || user?.activeWorkspaceId;
    return this.analyticsService.getConversionAnalytics(query, workspaceId);
  }

  @Get('activities')
  @ApiOperation({
    summary: 'Activity analytics (Volume, completion rates, and activity type/priority breakdowns)',
  })
  @ApiResponse({ status: 200, description: 'Sales activity metrics and completion rates' })
  async getActivityAnalytics(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.analyticsService.getActivityAnalytics(query, orgId);
  }

  @Get('teams')
  @ApiOperation({
    summary: 'Team analytics (Team comparison, deal volume, win rate, and revenue by team)',
  })
  @ApiResponse({ status: 200, description: 'Team performance comparison metrics' })
  async getTeamAnalytics(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.analyticsService.getTeamAnalytics(query, orgId);
  }

  @Get('performance')
  @ApiOperation({
    summary: 'Sales representative leaderboard & performance ranking (Revenue, win rate, deals won)',
  })
  @ApiResponse({ status: 200, description: 'Paginated sales rep performance leaderboard' })
  async getRepPerformance(
    @Query() query: PerformanceQueryDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.analyticsService.getRepPerformance(query, orgId);
  }
}
