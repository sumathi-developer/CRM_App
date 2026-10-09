import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Dashboard & Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get complete aggregated CRM dashboard payload' })
  @ApiResponse({ status: 200, description: 'Aggregated dashboard metrics' })
  async getDashboard() {
    return this.reportsService.getDashboardOverview();
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get core CRM KPI metrics (Won Revenue, Pipeline Value, Conversion Rates)' })
  @ApiResponse({ status: 200, description: 'Core KPI stats' })
  async getStats() {
    return this.reportsService.getStats();
  }

  @Get('dashboard/revenue')
  @ApiOperation({ summary: 'Get revenue totals and average deal size' })
  @ApiResponse({ status: 200, description: 'Revenue metrics' })
  async getRevenue() {
    return this.reportsService.getRevenueAnalytics();
  }

  @Get('dashboard/leads')
  @ApiOperation({ summary: 'Get lead distribution breakdown by status and acquisition source' })
  @ApiResponse({ status: 200, description: 'Leads breakdown' })
  async getLeads() {
    return this.reportsService.getLeadsBreakdown();
  }

  @Get('dashboard/deals')
  @ApiOperation({ summary: 'Get deal counts and amounts grouped by pipeline stage' })
  @ApiResponse({ status: 200, description: 'Deals breakdown' })
  async getDeals() {
    return this.reportsService.getDealsBreakdown();
  }

  @Get('dashboard/activities')
  @ApiOperation({ summary: 'Get activities breakdown by type (call, meeting, email) and status' })
  @ApiResponse({ status: 200, description: 'Activities breakdown' })
  async getActivities() {
    return this.reportsService.getActivitiesOverview();
  }

  @Get('reports/sales')
  @ApiOperation({ summary: 'Generate detailed sales revenue report' })
  @ApiResponse({ status: 200, description: 'Sales report' })
  async getSalesReport() {
    return this.reportsService.getSalesReport();
  }

  @Get('reports/leads')
  @ApiOperation({ summary: 'Generate high scoring leads intelligence report' })
  @ApiResponse({ status: 200, description: 'Leads report' })
  async getLeadsReport() {
    return this.reportsService.getLeadsReport();
  }

  @Get('reports/activities')
  @ApiOperation({ summary: 'Generate team activity productivity report' })
  @ApiResponse({ status: 200, description: 'Activities report' })
  async getActivitiesReport() {
    return this.reportsService.getActivitiesReport();
  }

  @Get('reports/performance')
  @ApiOperation({ summary: 'Generate sales representative performance comparison report' })
  @ApiResponse({ status: 200, description: 'Performance report' })
  async getPerformanceReport() {
    return this.reportsService.getPerformanceReport();
  }
}
