import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardOverview() {
    const [stats, revenue, leads, deals] = await Promise.all([
      this.getStats(),
      this.getRevenueAnalytics(),
      this.getLeadsBreakdown(),
      this.getDealsBreakdown(),
    ]);

    return {
      stats,
      revenue,
      leads,
      deals,
    };
  }

  async getStats() {
    const [
      totalUsers,
      totalContacts,
      totalLeads,
      totalDeals,
      wonDeals,
      openDeals,
      pendingTasks,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.contact.count(),
      this.prisma.lead.count(),
      this.prisma.deal.count(),
      this.prisma.deal.findMany({ where: { status: 'WON' } }),
      this.prisma.deal.findMany({ where: { status: 'OPEN' } }),
      this.prisma.task.count({ where: { status: { not: 'COMPLETED' } } }),
    ]);

    const totalWonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const activePipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);

    const convertedLeads = await this.prisma.lead.count({ where: { status: 'CONVERTED' } });
    const leadConversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) + '%' : '0%';

    return {
      totalWonRevenue,
      activePipelineValue,
      totalContacts,
      totalLeads,
      leadConversionRate,
      totalDeals,
      openDealsCount: openDeals.length,
      wonDealsCount: wonDeals.length,
      pendingTasksCount: pendingTasks,
      totalUsers,
    };
  }

  async getRevenueAnalytics() {
    const deals = await this.prisma.deal.findMany({
      where: { status: 'WON' },
      select: { value: true, closedAt: true, currency: true },
    });

    const totalWon = deals.reduce((sum, d) => sum + d.value, 0);
    const avgDealSize = deals.length > 0 ? Math.round(totalWon / deals.length) : 0;

    return {
      totalWon,
      avgDealSize,
      totalDealsWon: deals.length,
      currency: 'USD',
    };
  }

  async getLeadsBreakdown() {
    const leads = await this.prisma.lead.findMany({
      select: { status: true, source: true },
    });

    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const lead of leads) {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
    }

    return {
      totalLeads: leads.length,
      byStatus,
      bySource,
    };
  }

  async getDealsBreakdown() {
    const deals = await this.prisma.deal.findMany({
      include: { stage: true },
    });

    const byStage: Record<string, { count: number; totalValue: number }> = {};
    const byStatus: Record<string, number> = {};

    for (const deal of deals) {
      const stageName = deal.stage?.name || 'Unassigned';
      if (!byStage[stageName]) {
        byStage[stageName] = { count: 0, totalValue: 0 };
      }
      byStage[stageName].count += 1;
      byStage[stageName].totalValue += deal.value;

      byStatus[deal.status] = (byStatus[deal.status] || 0) + 1;
    }

    return {
      totalDeals: deals.length,
      byStage,
      byStatus,
    };
  }

  async getActivitiesOverview() {
    const activities = await this.prisma.activity.findMany({
      select: { type: true, status: true, priority: true },
    });

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const a of activities) {
      byType[a.type] = (byType[a.type] || 0) + 1;
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    }

    return {
      totalActivities: activities.length,
      byType,
      byStatus,
    };
  }

  async getSalesReport() {
    const wonDeals = await this.prisma.deal.findMany({
      where: { status: 'WON' },
      include: {
        owner: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { value: 'desc' },
      take: 20,
    });

    return {
      report: 'Sales Revenue Report',
      totalRevenue: wonDeals.reduce((sum, d) => sum + d.value, 0),
      topDeals: wonDeals,
    };
  }

  async getLeadsReport() {
    const leads = await this.prisma.lead.findMany({
      include: {
        owner: { select: { id: true, name: true } },
      },
      orderBy: { leadScore: 'desc' },
      take: 20,
    });

    return {
      report: 'High Potential Leads Report',
      topLeads: leads,
    };
  }

  async getActivitiesReport() {
    const recentActivities = await this.prisma.activity.findMany({
      take: 30,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { name: true } },
        contact: { select: { firstName: true, lastName: true } },
      },
    });

    return {
      report: 'Team Activity Report',
      recentActivities,
    };
  }

  async getPerformanceReport() {
    const users = await this.prisma.user.findMany({
      include: {
        deals: { where: { status: 'WON' } },
        _count: {
          select: {
            leads: true,
            activitiesAssigned: true,
            tasksAssigned: true,
          },
        },
      },
    });

    const repPerformance = users.map((u) => {
      const revenueWon = u.deals.reduce((sum, d) => sum + d.value, 0);
      return {
        userId: u.id,
        name: u.name,
        dealsWonCount: u.deals.length,
        revenueWon,
        leadsCount: u._count.leads,
        activitiesCount: u._count.activitiesAssigned,
        tasksCount: u._count.tasksAssigned,
      };
    });

    return {
      report: 'Sales Rep Performance Scorecard',
      data: repPerformance,
    };
  }
}
