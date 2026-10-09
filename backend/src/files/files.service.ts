import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AttachFileDto } from './dto/attach-file.dto';

export interface UploadedFileMeta {
  originalname: string;
  filename?: string;
  mimetype: string;
  size: number;
  path?: string;
}

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async saveFileRecord(
    file: UploadedFileMeta,
    userId?: string,
  ) {
    return this.prisma.fileRecord.create({
      data: {
        originalName: file.originalname,
        fileName: file.filename || file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path || `uploads/${file.originalname}`,
        uploadedById: userId,
      },
    });
  }

  async findAll() {
    return this.prisma.fileRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        attachments: true,
      },
    });
  }

  async findOne(id: string) {
    const file = await this.prisma.fileRecord.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        attachments: {
          include: {
            contact: true,
            lead: true,
            deal: true,
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return file;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.fileRecord.delete({ where: { id } });
    return { message: `File with ID ${id} deleted successfully` };
  }

  async attachFile(fileId: string, dto: AttachFileDto) {
    await this.findOne(fileId);
    return this.prisma.fileAttachment.create({
      data: {
        fileId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        contactId: dto.contactId || (dto.entityType === 'CONTACT' ? dto.entityId : undefined),
        leadId: dto.leadId || (dto.entityType === 'LEAD' ? dto.entityId : undefined),
        dealId: dto.dealId || (dto.entityType === 'DEAL' ? dto.entityId : undefined),
      },
    });
  }

  async detachFile(fileId: string, attachmentId?: string) {
    await this.findOne(fileId);
    if (attachmentId) {
      await this.prisma.fileAttachment.deleteMany({
        where: { id: attachmentId, fileId },
      });
    } else {
      await this.prisma.fileAttachment.deleteMany({
        where: { fileId },
      });
    }

    return { message: `File detached successfully` };
  }
}
