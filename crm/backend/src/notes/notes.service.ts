import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteQueryDto } from './dto/note-query.dto';
import { createPaginatedResponse } from '../common/utils/response.util';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: NoteQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { content: { contains: query.search } },
      ];
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

    const [total, notes] = await Promise.all([
      this.prisma.note.count({ where }),
      this.prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, email: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          lead: { select: { id: true, title: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
    ]);

    return createPaginatedResponse(notes, total, page, limit);
  }

  async create(dto: CreateNoteDto, currentUserId?: string) {
    return this.prisma.note.create({
      data: {
        title: dto.title,
        content: dto.content,
        contactId: dto.contactId,
        leadId: dto.leadId,
        dealId: dto.dealId,
        authorId: currentUserId,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findOne(id: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        contact: true,
        lead: true,
        deal: true,
      },
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    return note;
  }

  async update(id: string, dto: UpdateNoteDto) {
    await this.findOne(id);
    return this.prisma.note.update({
      where: { id },
      data: dto,
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.note.delete({ where: { id } });
    return { message: `Note with ID ${id} successfully deleted` };
  }

  async findByContact(contactId: string) {
    return this.prisma.note.findMany({
      where: { contactId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
