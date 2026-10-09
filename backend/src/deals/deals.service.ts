import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { DealQueryDto } from './dto/deal-query.dto';
import { createPaginatedResponse } from '../common/utils/response.util';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: DealQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.title = { contains: query.search };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.stageId) {
      where.stageId = query.stageId;
    }

    if (query.pipelineId) {
      where.pipelineId = query.pipelineId;
    }

    if (query.ownerId) {
      where.ownerId = query.ownerId;
    }

    const [total, deals] = await Promise.all([
      this.prisma.deal.count({ where }),
      this.prisma.deal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          stage: true,
          pipeline: true,
          organization: true,
          contact: true,
          owner: { select: { id: true, name: true, email: true } },
          _count: {
            select: { activities: true, tasks: true, notes: true, products: true },
          },
        },
      }),
    ]);

    return createPaginatedResponse(deals, total, page, limit);
  }

  async create(dto: CreateDealDto) {
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

    return this.prisma.deal.create({
      data: {
        title: dto.title,
        value: dto.value,
        currency: dto.currency || 'USD',
        pipelineId,
        stageId,
        probability: dto.probability ?? 20,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        organizationId: dto.organizationId,
        contactId: dto.contactId,
        ownerId: dto.ownerId,
        status: 'OPEN',
      },
      include: {
        stage: true,
        pipeline: true,
        organization: true,
        contact: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        stage: true,
        pipeline: true,
        organization: true,
        contact: true,
        owner: { select: { id: true, name: true, email: true } },
        products: { include: { product: true } },
        activities: { take: 5, orderBy: { createdAt: 'desc' } },
        tasks: { take: 5, orderBy: { createdAt: 'desc' } },
        notes: { take: 5, orderBy: { createdAt: 'desc' }, include: { author: { select: { name: true } } } },
      },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return deal;
  }

  async update(id: string, dto: UpdateDealDto) {
    await this.findOne(id);
    return this.prisma.deal.update({
      where: { id },
      data: {
        ...dto,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
      },
      include: {
        stage: true,
        pipeline: true,
        organization: true,
        contact: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.deal.delete({ where: { id } });
    return { message: `Deal with ID ${id} successfully deleted` };
  }

  async updateStage(id: string, stageId: string) {
    await this.findOne(id);
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id: stageId },
    });
    if (!stage) {
      throw new NotFoundException(`Pipeline stage with ID ${stageId} not found`);
    }

    return this.prisma.deal.update({
      where: { id },
      data: {
        stageId,
        probability: stage.winProbability,
        status: stage.winProbability === 100 ? 'WON' : stage.winProbability === 0 ? 'LOST' : 'OPEN',
        closedAt: stage.winProbability === 100 || stage.winProbability === 0 ? new Date() : null,
      },
      include: { stage: true },
    });
  }

  async assign(id: string, ownerId: string) {
    await this.findOne(id);
    const user = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${ownerId} not found`);
    }

    return this.prisma.deal.update({
      where: { id },
      data: { ownerId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.deal.update({
      where: { id },
      data: {
        status,
        closedAt: status === 'WON' || status === 'LOST' ? new Date() : null,
      },
      include: { stage: true },
    });
  }

  async getActivities(id: string) {
    await this.findOne(id);
    return this.prisma.activity.findMany({
      where: { dealId: id },
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { name: true, email: true } } },
    });
  }

  async getNotes(id: string) {
    await this.findOne(id);
    return this.prisma.note.findMany({
      where: { dealId: id },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true, email: true } } },
    });
  }

  async getTasks(id: string) {
    await this.findOne(id);
    return this.prisma.task.findMany({
      where: { dealId: id },
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { name: true, email: true } } },
    });
  }

  async getTimeline(id: string) {
    const deal = await this.findOne(id);
    const [activities, tasks, notes] = await Promise.all([
      this.prisma.activity.findMany({ where: { dealId: id } }),
      this.prisma.task.findMany({ where: { dealId: id } }),
      this.prisma.note.findMany({ where: { dealId: id } }),
    ]);

    const timeline = [
      { type: 'DEAL_CREATED', title: `Deal '${deal.title}' created (${deal.value} ${deal.currency})`, date: deal.createdAt },
      ...activities.map((a) => ({ type: 'ACTIVITY', title: `${a.type}: ${a.subject}`, date: a.createdAt, data: a })),
      ...tasks.map((t) => ({ type: 'TASK', title: `Task: ${t.title} (${t.status})`, date: t.createdAt, data: t })),
      ...notes.map((n) => ({ type: 'NOTE', title: `Note added`, date: n.createdAt, data: n })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  }
}
