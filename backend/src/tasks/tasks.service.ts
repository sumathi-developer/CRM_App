import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { createPaginatedResponse } from '../common/utils/response.util';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: TaskQueryDto) {
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

    if (query.priority) {
      where.priority = query.priority;
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

    const [total, tasks] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          lead: { select: { id: true, title: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
    ]);

    return createPaginatedResponse(tasks, total, page, limit);
  }

  async create(dto: CreateTaskDto, currentUserId?: string) {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
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
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        contact: true,
        lead: true,
        deal: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);
    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.task.delete({ where: { id } });
    return { message: `Task with ID ${id} successfully deleted` };
  }

  async markComplete(id: string) {
    await this.findOne(id);
    return this.prisma.task.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: { assignedTo: { select: { id: true, name: true } } },
    });
  }

  async assign(id: string, assignedToId: string) {
    await this.findOne(id);
    const user = await this.prisma.user.findUnique({ where: { id: assignedToId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${assignedToId} not found`);
    }

    return this.prisma.task.update({
      where: { id },
      data: { assignedToId },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    });
  }

  async getToday(userId?: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      dueDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };
    if (userId) {
      where.assignedToId = userId;
    }

    return this.prisma.task.findMany({
      where,
      orderBy: { dueDate: 'asc' },
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
      dueDate: { gt: now },
      status: { not: 'COMPLETED' },
    };
    if (userId) {
      where.assignedToId = userId;
    }

    return this.prisma.task.findMany({
      where,
      take: 20,
      orderBy: { dueDate: 'asc' },
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
      dueDate: { lt: now },
      status: { not: 'COMPLETED' },
    };
    if (userId) {
      where.assignedToId = userId;
    }

    return this.prisma.task.findMany({
      where,
      take: 20,
      orderBy: { dueDate: 'desc' },
      include: {
        contact: true,
        lead: true,
        deal: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }
}
