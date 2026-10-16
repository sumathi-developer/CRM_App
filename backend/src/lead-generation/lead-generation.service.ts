import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ChannelLeadQueryDto } from './dto/channel-lead-query.dto';
import { ManualLeadCaptureDto } from './dto/manual-lead-capture.dto';
import { LeadSourcesService } from './services/lead-sources.service';
import { WebFormsService } from './services/web-forms.service';
import { LeadScoringService } from './services/lead-scoring.service';
import { LeadQualificationService } from './services/lead-qualification.service';
import { LeadRoutingService } from './services/lead-routing.service';
import { LeadGenerationAnalyticsService } from './services/lead-generation-analytics.service';
import { createPaginatedResponse } from '../common/utils/response.util';
import * as crypto from 'crypto';

@Injectable()
export class LeadGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    public readonly sources: LeadSourcesService,
    public readonly forms: WebFormsService,
    public readonly scoring: LeadScoringService,
    public readonly qualification: LeadQualificationService,
    public readonly routing: LeadRoutingService,
    public readonly analytics: LeadGenerationAnalyticsService,
  ) {}

  private get db(): any {
    return this.prisma;
  }

  // ==========================================
  // CHANNEL-SPECIFIC LEAD RETRIEVAL
  // ==========================================

  /**
   * Helper to fetch leads by specific channel criteria from the unified Lead model (Module 06).
   */
  private async getLeadsByChannelCriteria(channelCriteria: any, query: ChannelLeadQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where: any = {
      ...channelCriteria,
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { companyName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.campaign) {
      where.campaign = { contains: query.campaign, mode: 'insensitive' };
    }

    if (query.medium) {
      where.medium = { contains: query.medium, mode: 'insensitive' };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.ownerId) {
      where.ownerId = query.ownerId;
    }

    if (query.minScore !== undefined) {
      where.leadScore = { gte: Number(query.minScore) };
    }

    if (query.workspaceId) {
      where.workspaceId = query.workspaceId;
    }

    const [total, leads] = await Promise.all([
      this.db.lead.count({ where }),
      this.db.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          leadSource: { select: { id: true, name: true, code: true, type: true } },
          webForm: { select: { id: true, name: true, slug: true, formType: true } },
          _count: {
            select: { activities: true, tasks: true, notes: true, formSubmissions: true },
          },
        },
      }),
    ]);

    return createPaginatedResponse(leads, total, page, limit);
  }

  /**
   * Campaign Leads Retrieval (leads generated via marketing campaigns, UTM campaigns, or paid ads).
   */
  async getCampaignLeads(query: ChannelLeadQueryDto) {
    const channelCriteria = {
      OR: [
        { channel: 'CAMPAIGN' },
        { campaign: { not: null } },
        { source: 'ADVERTISING' },
      ],
    };
    return this.getLeadsByChannelCriteria(channelCriteria, query);
  }

  /**
   * Social Media Leads Retrieval (leads originating from LinkedIn, Facebook, Twitter/X, Instagram, etc.).
   */
  async getSocialLeads(query: ChannelLeadQueryDto) {
    const channelCriteria = {
      OR: [
        { channel: 'SOCIAL_MEDIA' },
        { medium: { in: ['social', 'paid_social', 'linkedin', 'facebook', 'twitter', 'instagram'] } },
        { leadSource: { type: 'SOCIAL_MEDIA' } },
      ],
    };
    return this.getLeadsByChannelCriteria(channelCriteria, query);
  }

  /**
   * Website Leads Retrieval (leads originating from website contact forms, live chat, or organic traffic).
   */
  async getWebsiteLeads(query: ChannelLeadQueryDto) {
    const channelCriteria = {
      OR: [
        { channel: 'WEBSITE' },
        { source: 'WEBSITE' },
        { webForm: { formType: 'WEB_FORM' } },
      ],
    };
    return this.getLeadsByChannelCriteria(channelCriteria, query);
  }

  /**
   * Landing Page Leads Retrieval (leads from dedicated conversion landing pages).
   */
  async getLandingPageLeads(query: ChannelLeadQueryDto) {
    const channelCriteria = {
      OR: [
        { channel: 'LANDING_PAGE' },
        { webForm: { formType: 'LANDING_PAGE' } },
        { leadSource: { type: 'LANDING_PAGE' } },
      ],
    };
    return this.getLeadsByChannelCriteria(channelCriteria, query);
  }

  /**
   * Email Leads Retrieval (leads from email marketing, newsletters, or direct email inquiries).
   */
  async getEmailLeads(query: ChannelLeadQueryDto) {
    const channelCriteria = {
      OR: [
        { channel: 'EMAIL' },
        { medium: 'email' },
        { source: 'COLD_OUTREACH' },
        { leadSource: { type: 'EMAIL' } },
      ],
    };
    return this.getLeadsByChannelCriteria(channelCriteria, query);
  }

  /**
   * Referral Leads Retrieval (leads from partner network, customer referrals, or affiliates).
   */
  async getReferralLeads(query: ChannelLeadQueryDto) {
    const channelCriteria = {
      OR: [
        { channel: 'REFERRAL' },
        { source: 'REFERRAL' },
        { medium: 'referral' },
        { leadSource: { type: 'REFERRAL' } },
      ],
    };
    return this.getLeadsByChannelCriteria(channelCriteria, query);
  }

  /**
   * Manual Leads Retrieval (leads entered directly by sales team).
   */
  async getManualLeads(query: ChannelLeadQueryDto) {
    const channelCriteria = {
      OR: [
        { channel: 'MANUAL' },
        { leadSource: { type: 'MANUAL' } },
      ],
    };
    return this.getLeadsByChannelCriteria(channelCriteria, query);
  }

  // ==========================================
  // MANUAL LEAD CAPTURE
  // ==========================================

  /**
   * Manual Lead Capture: Creates lead in Module 06 with source attribution, calculates score,
   * evaluates qualification, and executes routing.
   */
  async captureManualLead(dto: ManualLeadCaptureDto, currentUserId?: string) {
    const email = dto.email.trim().toLowerCase();

    // Check if source exists or map default
    let sourceId = dto.leadSourceId;
    let sourceRecord: any = null;

    if (sourceId) {
      sourceRecord = await this.db.leadSource.findUnique({ where: { id: sourceId } });
    } else {
      sourceRecord = await this.db.leadSource.findFirst({
        where: { code: 'MANUAL_ENTRY' },
      });
      sourceId = sourceRecord?.id;
    }

    const attribution = {
      capturedByUserId: currentUserId || null,
      channel: dto.channel || 'MANUAL',
      campaign: dto.campaign || null,
      medium: dto.medium || null,
      sourceName: sourceRecord?.name || 'Manual Entry',
      capturedAt: new Date().toISOString(),
      ...dto.attribution,
    };

    // 1. Create Lead in Module 06
    const lead = await this.db.lead.create({
      data: {
        id: crypto.randomUUID(),
        title: dto.title,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email,
        phone: dto.phone,
        companyName: dto.companyName,
        status: 'NEW',
        source: sourceRecord?.type || 'OTHER',
        estimatedValue: dto.estimatedValue || 0.0,
        leadSourceId: sourceId,
        campaign: dto.campaign,
        medium: dto.medium,
        channel: dto.channel || 'MANUAL',
        qualificationNotes: dto.qualificationNotes,
        attribution: attribution as any,
        ownerId: dto.ownerId || currentUserId || null,
        workspaceId: dto.workspaceId,
      },
    });

    // 2. Score Calculation
    let scoreResult: any = null;
    try {
      scoreResult = await this.scoring.calculateAndApply(lead.id);
    } catch {
      // Non-blocking
    }

    // 3. Qualification Evaluation
    let qualificationResult: any = null;
    try {
      qualificationResult = await this.qualification.evaluateAndApply(lead.id);
    } catch {
      // Non-blocking
    }

    // 4. Lead Routing / Assignment
    let routingResult: any = null;
    if (!dto.ownerId) {
      try {
        routingResult = await this.routing.routeLead(lead.id);
      } catch {
        // Non-blocking
      }
    }

    // Fetch refreshed lead with relations
    const finalLead = await this.db.lead.findUnique({
      where: { id: lead.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        leadSource: true,
      },
    });

    return {
      message: 'Manual lead captured and attributed successfully',
      lead: finalLead,
      scoring: scoreResult?.scoreResult || null,
      qualification: qualificationResult?.qualification || null,
      routing: routingResult || { assignedTo: finalLead?.owner, reason: 'Assigned to creator or specified owner' },
    };
  }
}
