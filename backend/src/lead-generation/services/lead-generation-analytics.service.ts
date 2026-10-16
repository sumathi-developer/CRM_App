import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LeadGenerationAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  /**
   * Comprehensive Lead Generation Overview & KPI Analytics.
   */
  async getOverview(workspaceId?: string) {
    const leadWhere: any = {};
    const formWhere: any = {};
    const subWhere: any = {};

    if (workspaceId) {
      leadWhere.workspaceId = workspaceId;
      formWhere.workspaceId = workspaceId;
      subWhere.workspaceId = workspaceId;
    }

    const [
      totalLeads,
      newLeads,
      qualifiedLeads,
      convertedLeads,
      unqualifiedLeads,
      totalForms,
      activeForms,
      totalSubmissions,
      spamSubmissions,
      leadsList,
      formsList,
      sourcesList,
    ] = await Promise.all([
      this.db.lead.count({ where: leadWhere }),
      this.db.lead.count({ where: { ...leadWhere, status: 'NEW' } }),
      this.db.lead.count({ where: { ...leadWhere, status: 'QUALIFIED' } }),
      this.db.lead.count({ where: { ...leadWhere, status: 'CONVERTED' } }),
      this.db.lead.count({ where: { ...leadWhere, status: 'UNQUALIFIED' } }),
      this.db.webForm.count({ where: formWhere }),
      this.db.webForm.count({ where: { ...formWhere, status: 'PUBLISHED' } }),
      this.db.formSubmission.count({ where: subWhere }),
      this.db.formSubmission.count({ where: { ...subWhere, isSpam: true } }),
      this.db.lead.findMany({
        where: leadWhere,
        select: {
          id: true,
          status: true,
          source: true,
          channel: true,
          leadScore: true,
          estimatedValue: true,
          createdAt: true,
        },
      }),
      this.db.webForm.findMany({
        where: formWhere,
        select: {
          id: true,
          name: true,
          viewsCount: true,
          submissionsCount: true,
          conversionRate: true,
        },
      }),
      this.db.leadSource.findMany({
        where: workspaceId ? { workspaceId } : {},
        select: {
          id: true,
          name: true,
          type: true,
          code: true,
          cost: true,
          _count: { select: { leads: true } },
        },
      }),
    ]);

    // Channel breakdown
    const channelCounts: Record<string, number> = {};
    let totalScoreSum = 0;
    let totalPipelineValue = 0;

    for (const lead of leadsList) {
      const ch = (lead as any).channel || lead.source || 'OTHER';
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;
      totalScoreSum += lead.leadScore || 0;
      totalPipelineValue += lead.estimatedValue || 0;
    }

    const averageLeadScore = totalLeads > 0 ? Math.round(totalScoreSum / totalLeads) : 0;
    const qualificationRate = totalLeads > 0 ? Number((((qualifiedLeads + convertedLeads) / totalLeads) * 100).toFixed(1)) : 0;
    const conversionRate = totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

    // Form performance totals
    const totalViews = formsList.reduce((acc, f) => acc + f.viewsCount, 0);
    const totalFormSubmissions = formsList.reduce((acc, f) => acc + f.submissionsCount, 0);
    const overallFormConversionRate = totalViews > 0 ? Number(((totalFormSubmissions / totalViews) * 100).toFixed(2)) : 0.0;

    // Last 30 days daily lead generation time-series
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyMap: Record<string, number> = {};

    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }

    for (const lead of leadsList) {
      const leadDate = new Date(lead.createdAt).toISOString().split('T')[0];
      if (dailyMap[leadDate] !== undefined) {
        dailyMap[leadDate]++;
      }
    }

    const timeSeries = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

    // Top lead sources
    const topSources = sourcesList
      .map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        leadsCount: s._count.leads,
      }))
      .sort((a, b) => b.leadsCount - a.leadsCount)
      .slice(0, 5);

    return {
      kpis: {
        totalLeadsGenerated: totalLeads,
        totalPipelineValue,
        averageLeadScore,
        qualificationRate,
        conversionRate,
        newLeads,
        qualifiedLeads,
        convertedLeads,
        unqualifiedLeads,
      },
      forms: {
        totalForms,
        activeForms,
        totalViews,
        totalSubmissions: totalFormSubmissions,
        overallConversionRate: overallFormConversionRate,
        rawSubmissions: totalSubmissions,
        spamBlocked: spamSubmissions,
      },
      channelDistribution: channelCounts,
      timeSeries,
      topSources,
    };
  }

  /**
   * Deep-dive Lead Source Analytics with CAC, CPL, ROI, and conversion funnel.
   */
  async getSourcesAnalytics(workspaceId?: string) {
    const where: any = {};
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const sources = await this.db.leadSource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        leads: {
          select: {
            id: true,
            status: true,
            estimatedValue: true,
            leadScore: true,
          },
        },
      },
    });

    const sourceAnalytics = sources.map((source) => {
      const leads = source.leads;
      const totalLeads = leads.length;
      const qualified = leads.filter((l) => l.status === 'QUALIFIED' || l.status === 'CONVERTED').length;
      const converted = leads.filter((l) => l.status === 'CONVERTED').length;
      const pipelineValue = leads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
      const avgScore = totalLeads > 0 ? Math.round(leads.reduce((acc, l) => acc + l.leadScore, 0) / totalLeads) : 0;

      const cost = source.cost || 0.0;
      const costPerLead = totalLeads > 0 && cost > 0 ? Number((cost / totalLeads).toFixed(2)) : 0.0;
      const cac = converted > 0 && cost > 0 ? Number((cost / converted).toFixed(2)) : 0.0;
      const roiMultiplier = cost > 0 && pipelineValue > 0 ? Number((pipelineValue / cost).toFixed(2)) : null;

      return {
        id: source.id,
        name: source.name,
        code: source.code,
        type: source.type,
        status: source.status,
        cost,
        leadsCount: totalLeads,
        qualifiedCount: qualified,
        convertedCount: converted,
        qualificationRate: totalLeads > 0 ? Number(((qualified / totalLeads) * 100).toFixed(1)) : 0.0,
        conversionRate: totalLeads > 0 ? Number(((converted / totalLeads) * 100).toFixed(1)) : 0.0,
        pipelineValue,
        averageScore: avgScore,
        costPerLead,
        cac,
        roiMultiplier,
      };
    });

    // Totals across all sources
    const totalCost = sourceAnalytics.reduce((acc, s) => acc + s.cost, 0);
    const totalLeads = sourceAnalytics.reduce((acc, s) => acc + s.leadsCount, 0);
    const totalConverted = sourceAnalytics.reduce((acc, s) => acc + s.convertedCount, 0);
    const totalValue = sourceAnalytics.reduce((acc, s) => acc + s.pipelineValue, 0);

    return {
      summary: {
        totalCost,
        totalLeads,
        totalConverted,
        totalValue,
        overallCPL: totalLeads > 0 && totalCost > 0 ? Number((totalCost / totalLeads).toFixed(2)) : 0.0,
        overallCAC: totalConverted > 0 && totalCost > 0 ? Number((totalCost / totalConverted).toFixed(2)) : 0.0,
      },
      sources: sourceAnalytics,
    };
  }

  /**
   * Analytics breakdown for all web forms and capture pages.
   */
  async getFormsAnalytics(workspaceId?: string) {
    const where: any = {};
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const forms = await this.db.webForm.findMany({
      where,
      orderBy: { submissionsCount: 'desc' },
      include: {
        defaultSource: { select: { id: true, name: true, type: true } },
      },
    });

    return forms.map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      formType: f.formType,
      status: f.status,
      viewsCount: f.viewsCount,
      submissionsCount: f.submissionsCount,
      conversionRate: f.conversionRate,
      dropoffRate: f.viewsCount > 0 ? Number((100 - f.conversionRate).toFixed(2)) : 0.0,
      isPublished: f.isPublished,
      defaultSource: f.defaultSource,
    }));
  }
}
