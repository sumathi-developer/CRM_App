import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { createPaginatedResponse } from '../common/utils/response.util';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ActivityQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.contactId) {
      where.contactId = query.contactId;
    }

    if (query.leadId) {
      where.leadId = query.leadId;
    }

    if (query.dealId) {
      where.dealId = query.dealId;
    }

    if (query.assignedToId) {
      where.assignedToId = query.assignedToId;
    }

    const [total, activities] = await Promise.all([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          lead: { select: { id: true, title: true, companyName: true } },
          deal: { select: { id: true, title: true, value: true } },
        },
      }),
    ]);

    return createPaginatedResponse(activities, total, page, limit);
  }

  async create(dto: CreateActivityDto, currentUserId?: string) {
    return this.prisma.activity.create({
      data: {
        type: dto.type,
        subject: dto.subject,
        description: dto.description,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(),
        status: dto.status || 'PENDING',
        priority: dto.priority || 'MEDIUM',
        contactId: dto.contactId,
        leadId: dto.leadId,
        dealId: dto.dealId,
        assignedToId: dto.assignedToId || currentUserId,
        createdById: currentUserId,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        contact: true,
        lead: true,
        deal: true,
      },
    });
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        contact: true,
        lead: true,
        deal: true,
      },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    return activity;
  }

  async update(id: string, dto: UpdateActivityDto) {
    await this.findOne(id);
    return this.prisma.activity.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.activity.delete({ where: { id } });
    return { message: `Activity with ID ${id} successfully deleted` };
  }

  async getToday(userId?: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };
    if (userId) {
      where.assignedToId = userId;
    }

    return this.prisma.activity.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        contact: true,
        lead: true,
        deal: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async getUpcoming(userId?: string) {
    const now = new Date();
    const where: any = {
      scheduledAt: { gt: now },
      status: 'PENDING',
    };
    if (userId) {
      where.assignedToId = userId;
    }

    return this.prisma.activity.findMany({
      where,
      take: 20,
      orderBy: { scheduledAt: 'asc' },
      include: {
        contact: true,
        lead: true,
        deal: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async getOverdue(userId?: string) {
    const now = new Date();
    const where: any = {
      scheduledAt: { lt: now },
      status: 'PENDING',
    };
    if (userId) {
      where.assignedToId = userId;
    }

    return this.prisma.activity.findMany({
      where,
      take: 20,
      orderBy: { scheduledAt: 'desc' },
      include: {
        contact: true,
        lead: true,
        deal: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }
}
