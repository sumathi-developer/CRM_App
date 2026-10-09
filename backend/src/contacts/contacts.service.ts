import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactQueryDto } from './dto/contact-query.dto';
import { ConvertContactDto } from './dto/convert-contact.dto';
import { createPaginatedResponse } from '../common/utils/response.util';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ContactQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }

    if (query.stage) {
      where.stage = query.stage;
    }

    if (query.organizationId) {
      where.organizationId = query.organizationId;
    }

    if (query.ownerId) {
      where.ownerId = query.ownerId;
    }

    const [total, contacts] = await Promise.all([
      this.prisma.contact.count({ where }),
      this.prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: true,
          owner: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { deals: true, activities: true, tasks: true, notes: true },
          },
        },
      }),
    ]);

    return createPaginatedResponse(contacts, total, page, limit);
  }

  async create(dto: CreateContactDto) {
    const existing = await this.prisma.contact.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Contact with this email already exists');
    }

    return this.prisma.contact.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        jobTitle: dto.jobTitle,
        department: dto.department,
        stage: dto.stage || 'LEAD',
        organizationId: dto.organizationId,
        ownerId: dto.ownerId,
      },
      include: {
        organization: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        organization: true,
        owner: { select: { id: true, name: true, email: true } },
        deals: { include: { stage: true } },
        activities: { take: 5, orderBy: { createdAt: 'desc' } },
        tasks: { take: 5, orderBy: { createdAt: 'desc' } },
        notes: { take: 5, orderBy: { createdAt: 'desc' }, include: { author: { select: { name: true } } } },
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return contact;
  }

  async update(id: string, dto: UpdateContactDto) {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.prisma.contact.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already in use by another contact');
      }
    }

    return this.prisma.contact.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ? dto.email.toLowerCase() : undefined,
        phone: dto.phone,
        jobTitle: dto.jobTitle,
        department: dto.department,
        stage: dto.stage,
        organizationId: dto.organizationId,
        ownerId: dto.ownerId,
      },
      include: {
        organization: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.contact.delete({ where: { id } });
    return { message: `Contact with ID ${id} successfully deleted` };
  }

  async getActivities(id: string) {
    await this.findOne(id);
    return this.prisma.activity.findMany({
      where: { contactId: id },
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { name: true, email: true } } },
    });
  }

  async getDeals(id: string) {
    await this.findOne(id);
    return this.prisma.deal.findMany({
      where: { contactId: id },
      orderBy: { createdAt: 'desc' },
      include: { stage: true, pipeline: true },
    });
  }

  async getNotes(id: string) {
    await this.findOne(id);
    return this.prisma.note.findMany({
      where: { contactId: id },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true, email: true } } },
    });
  }

  async getTasks(id: string) {
    await this.findOne(id);
    return this.prisma.task.findMany({
      where: { contactId: id },
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { name: true, email: true } } },
    });
  }

  async convert(id: string, dto: ConvertContactDto, currentUserId?: string) {
    const contact = await this.findOne(id);

    // Update contact stage to CUSTOMER
    const updatedContact = await this.prisma.contact.update({
      where: { id },
      data: { stage: 'CUSTOMER' },
    });

    let deal = null;
    if (dto.dealTitle) {
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
          title: dto.dealTitle,
          value: dto.dealValue || 0,
          contactId: id,
          organizationId: contact.organizationId,
          pipelineId,
          stageId,
          ownerId: contact.ownerId || currentUserId,
        },
      });
    }

    return {
      message: 'Contact converted to customer successfully',
      contact: updatedContact,
      deal,
    };
  }
}
