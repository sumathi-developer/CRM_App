import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLeadSourceDto, LeadSourceType } from '../dto/create-lead-source.dto';
import { UpdateLeadSourceDto } from '../dto/update-lead-source.dto';
import { LeadSourceQueryDto } from '../dto/lead-source-query.dto';
import { createPaginatedResponse } from '../../common/utils/response.util';
import * as crypto from 'crypto';

@Injectable()
export class LeadSourcesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  async onModuleInit() {
    await this.seedDefaultSourcesIfEmpty();
  }

  private generateCode(name: string): string {
    return name
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/(^_|_$)+/g, '');
  }

  /**
   * Seed default system lead sources if none exist yet.
   */
  async seedDefaultSourcesIfEmpty() {
    try {
      const count = await this.db.leadSource.count();
      if (count === 0) {
        const defaults = [
          {
            name: 'Website Organic',
            code: 'WEBSITE_ORGANIC',
            type: LeadSourceType.WEBSITE,
            description: 'Organic search visits and direct website visitors',
            utmSource: 'organic',
            utmMedium: 'search',
            isSystem: true,
          },
          {
            name: 'Main Contact Form',
            code: 'WEBSITE_CONTACT_FORM',
            type: LeadSourceType.WEBSITE,
            description: 'Inbound requests via contact us form',
            utmSource: 'website',
            utmMedium: 'contact_form',
            isSystem: true,
          },
          {
            name: 'Landing Page - Demo',
            code: 'LANDING_PAGE_DEMO',
            type: LeadSourceType.LANDING_PAGE,
            description: 'High-conversion product demo request landing pages',
            utmSource: 'landing_page',
            utmMedium: 'demo_request',
            isSystem: true,
          },
          {
            name: 'Google Ads PPC',
            code: 'CAMPAIGN_GOOGLE_ADS',
            type: LeadSourceType.PAID_SEARCH,
            description: 'Paid Google search and display advertising campaigns',
            cost: 2500.0,
            utmSource: 'google',
            utmMedium: 'cpc',
            isSystem: true,
          },
          {
            name: 'LinkedIn Ads',
            code: 'SOCIAL_LINKEDIN_ADS',
            type: LeadSourceType.SOCIAL_MEDIA,
            description: 'B2B sponsored content and InMail lead generation',
            cost: 1500.0,
            utmSource: 'linkedin',
            utmMedium: 'paid_social',
            isSystem: true,
          },
          {
            name: 'Email Newsletter',
            code: 'EMAIL_NEWSLETTER',
            type: LeadSourceType.EMAIL,
            description: 'Leads generated from weekly newsletter and marketing blasts',
            utmSource: 'newsletter',
            utmMedium: 'email',
            isSystem: true,
          },
          {
            name: 'Partner Referral Network',
            code: 'REFERRAL_PARTNER',
            type: LeadSourceType.REFERRAL,
            description: 'Referrals from certified integration and reseller partners',
            utmSource: 'partner',
            utmMedium: 'referral',
            isSystem: true,
          },
          {
            name: 'Manual / Direct Entry',
            code: 'MANUAL_ENTRY',
            type: LeadSourceType.MANUAL,
            description: 'Leads entered manually by sales development representatives',
            utmSource: 'sales_rep',
            utmMedium: 'outbound_call',
            isSystem: true,
          },
        ];

        for (const item of defaults) {
          await this.db.leadSource.create({
            data: {
              id: crypto.randomUUID(),
              name: item.name,
              code: item.code,
              type: item.type,
              description: item.description,
              cost: item.cost || 0.0,
              utmSource: item.utmSource,
              utmMedium: item.utmMedium,
              isSystem: item.isSystem,
              status: 'ACTIVE',
              metadata: {},
            },
          });
        }
      }
    } catch {
      // Ignore if database is still starting or table initialized concurrently
    }
  }

  async create(dto: CreateLeadSourceDto) {
    const code = dto.code ? dto.code.toUpperCase().trim() : this.generateCode(dto.name);

    const existing = await this.db.leadSource.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(`Lead source with code '${code}' already exists`);
    }

    return this.db.leadSource.create({
      data: {
        id: crypto.randomUUID(),
        name: dto.name,
        code,
        type: dto.type,
        description: dto.description,
        status: dto.status || 'ACTIVE',
        cost: dto.cost || 0.0,
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        utmCampaign: dto.utmCampaign,
        workspaceId: dto.workspaceId,
        metadata: dto.metadata || {},
      },
    });
  }

  async findAll(query: LeadSourceQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.workspaceId) {
      where.workspaceId = query.workspaceId;
    }

    const [total, sources] = await Promise.all([
      this.db.leadSource.count({ where }),
      this.db.leadSource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { leads: true, submissions: true, webForms: true },
          },
        },
      }),
    ]);

    return createPaginatedResponse(sources, total, page, limit);
  }

  async findOne(id: string) {
    const source = await this.db.leadSource.findUnique({
      where: { id },
      include: {
        _count: {
          select: { leads: true, submissions: true, webForms: true },
        },
        leads: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            leadScore: true,
            estimatedValue: true,
            createdAt: true,
          },
        },
      },
    });

    if (!source) {
      throw new NotFoundException(`Lead source with ID '${id}' not found`);
    }

    // Calculate aggregated metrics for this source
    const leads = await this.db.lead.findMany({
      where: { leadSourceId: id },
      select: {
        status: true,
        estimatedValue: true,
        leadScore: true,
      },
    });

    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter((l) => l.status === 'QUALIFIED' || l.status === 'CONVERTED').length;
    const convertedLeads = leads.filter((l) => l.status === 'CONVERTED').length;
    const totalPipelineValue = leads.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
    const avgScore = totalLeads > 0 ? Math.round(leads.reduce((acc, curr) => acc + curr.leadScore, 0) / totalLeads) : 0;
    const cost = source.cost || 0.0;
    const costPerLead = totalLeads > 0 && cost > 0 ? Number((cost / totalLeads).toFixed(2)) : 0.0;
    const costPerConversion = convertedLeads > 0 && cost > 0 ? Number((cost / convertedLeads).toFixed(2)) : 0.0;

    return {
      ...source,
      metrics: {
        totalLeads,
        qualifiedLeads,
        convertedLeads,
        qualificationRate: totalLeads > 0 ? Number(((qualifiedLeads / totalLeads) * 100).toFixed(1)) : 0.0,
        conversionRate: totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0.0,
        totalPipelineValue,
        avgScore,
        costPerLead,
        costPerConversion,
        roiMultiplier: cost > 0 && totalPipelineValue > 0 ? Number((totalPipelineValue / cost).toFixed(2)) : null,
      },
    };
  }

  async update(id: string, dto: UpdateLeadSourceDto) {
    await this.findOne(id);

    if (dto.code) {
      const formattedCode = dto.code.toUpperCase().trim();
      const existing = await this.db.leadSource.findFirst({
        where: { code: formattedCode, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Lead source with code '${formattedCode}' already exists`);
      }
      dto.code = formattedCode;
    }

    return this.db.leadSource.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async remove(id: string) {
    const source = await this.findOne(id);
    if (source.isSystem) {
      // Don't hard-delete system sources; set to INACTIVE
      await this.db.leadSource.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      return { message: `System lead source '${source.name}' has been marked as INACTIVE` };
    }

    await this.db.leadSource.delete({ where: { id } });
    return { message: `Lead source with ID '${id}' successfully deleted` };
  }
}
