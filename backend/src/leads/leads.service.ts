import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { createPaginatedResponse } from '../common/utils/response.util';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: LeadQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
        { email: { contains: query.search } },
        { companyName: { contains: query.search } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.source) {
      where.source = query.source;
    }

    if (query.ownerId) {
      where.ownerId = query.ownerId;
    }

    const [total, leads] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: {
            select: { activities: true, tasks: true, notes: true },
          },
        },
      }),
    ]);

    return createPaginatedResponse(leads, total, page, limit);
  }

  async create(dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        title: dto.title,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        companyName: dto.companyName,
        status: dto.status || 'NEW',
        source: dto.source || 'WEBSITE',
        leadScore: dto.leadScore || 0,
        estimatedValue: dto.estimatedValue || 0,
        ownerId: dto.ownerId,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        activities: { take: 5, orderBy: { createdAt: 'desc' } },
        tasks: { take: 5, orderBy: { createdAt: 'desc' } },
        notes: { take: 5, orderBy: { createdAt: 'desc' }, include: { author: { select: { name: true } } } },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    await this.findOne(id);
    return this.prisma.lead.update({
      where: { id },
      data: {
        ...dto,
        email: dto.email ? dto.email.toLowerCase() : undefined,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.lead.delete({ where: { id } });
    return { message: `Lead with ID ${id} successfully deleted` };
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.lead.update({
      where: { id },
      data: { status },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
  }

  async assign(id: string, ownerId: string) {
    await this.findOne(id);
    const user = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${ownerId} not found`);
    }

    return this.prisma.lead.update({
      where: { id },
      data: { ownerId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
  }

  async convert(id: string, dto: ConvertLeadDto, currentUserId?: string) {
    const lead = await this.findOne(id);

    if (lead.status === 'CONVERTED') {
      throw new BadRequestException('Lead has already been converted');
    }

    // 1. Create or Find Organization if companyName is present
    let orgId: string | null = null;
    const compName = dto.companyName || lead.companyName;
    if (compName) {
      let org = await this.prisma.organization.findFirst({
        where: { name: { contains: compName } },
      });
      if (!org) {
        org = await this.prisma.organization.create({
          data: { name: compName, status: 'ACTIVE' },
        });
      }
      orgId = org.id;
    }

    // 2. Create Contact from Lead
    let contact = await this.prisma.contact.findUnique({
      where: { email: lead.email },
    });
    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          stage: 'OPPORTUNITY',
          organizationId: orgId,
          ownerId: lead.ownerId || currentUserId,
        },
      });
    }

    // 3. Create Deal
    let deal = null;
    const dealTitle = dto.dealTitle || `${lead.title} Deal`;
    let pipelineId = dto.pipelineId;
    let stageId = dto.stageId;

    if (!pipelineId) {
      const defaultPipeline = await this.prisma.pipeline.findFirst({
        where: { isDefault: true },
        include: { stages: { orderBy: { order: 'asc' } } },
      });
      if (defaultPipeline) {
        pipelineId = defaultPipeline.id;
        stageId = stageId || defaultPipeline.stages[0]?.id;
      }
    }

    deal = await this.prisma.deal.create({
      data: {
        title: dealTitle,
        value: dto.dealValue || lead.estimatedValue || 0,
        contactId: contact.id,
        organizationId: orgId,
        pipelineId,
        stageId,
        ownerId: lead.ownerId || currentUserId,
      },
    });

    // 4. Mark Lead as CONVERTED
    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        convertedContactId: contact.id,
        convertedDealId: deal.id,
      },
    });

    return {
      message: 'Lead converted successfully',
      lead: updatedLead,
      contact,
      deal,
    };
  }

  async getActivities(id: string) {
    await this.findOne(id);
    return this.prisma.activity.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { name: true, email: true } } },
    });
  }

  async getNotes(id: string) {
    await this.findOne(id);
    return this.prisma.note.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true, email: true } } },
    });
  }

  async getTasks(id: string) {
    await this.findOne(id);
    return this.prisma.task.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { name: true, email: true } } },
    });
  }

  async getTimeline(id: string) {
    const lead = await this.findOne(id);
    const [activities, tasks, notes] = await Promise.all([
      this.prisma.activity.findMany({ where: { leadId: id } }),
      this.prisma.task.findMany({ where: { leadId: id } }),
      this.prisma.note.findMany({ where: { leadId: id } }),
    ]);

    const timeline = [
      { type: 'LEAD_CREATED', title: `Lead '${lead.title}' created`, date: lead.createdAt },
      ...activities.map((a) => ({ type: 'ACTIVITY', title: `${a.type}: ${a.subject}`, date: a.createdAt, data: a })),
      ...tasks.map((t) => ({ type: 'TASK', title: `Task: ${t.title} (${t.status})`, date: t.createdAt, data: t })),
      ...notes.map((n) => ({ type: 'NOTE', title: `Note added`, date: n.createdAt, data: n })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  }
}
