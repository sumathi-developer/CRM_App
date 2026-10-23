import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { TemplateQueryDto } from '../dto/template-query.dto';
import { RenderTemplateDto } from '../dto/render-template.dto';
import { TemplateParser } from '../utils/template-parser.util';
import { createPaginatedResponse } from '../../common/utils/response.util';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  async findAll(query: TemplateQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.category) {
      where.category = query.category;
    }

    if (query.workspaceId) {
      where.workspaceId = query.workspaceId;
    }

    if (query.isShared !== undefined) {
      where.isShared = query.isShared;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
        { bodyHtml: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, templates] = await Promise.all([
      this.db.emailTemplate.count({ where }),
      this.db.emailTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return createPaginatedResponse(templates, total, page, limit);
  }

  async findOne(id: string) {
    const template = await this.db.emailTemplate.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!template) {
      throw new NotFoundException(`Email template with ID ${id} not found`);
    }

    return template;
  }

  async create(dto: CreateTemplateDto, currentUserId?: string) {
    // Auto-detect template tokens if not supplied
    let detectedVariables = dto.variables || [];
    if (!detectedVariables || detectedVariables.length === 0) {
      const subjectTokens = TemplateParser.extractVariables(dto.subject);
      const bodyTokens = TemplateParser.extractVariables(dto.bodyHtml);
      detectedVariables = Array.from(new Set([...subjectTokens, ...bodyTokens]));
    }

    return this.db.emailTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category || 'GENERAL',
        subject: dto.subject,
        bodyHtml: dto.bodyHtml,
        bodyText: dto.bodyText,
        variables: detectedVariables,
        isShared: dto.isShared ?? true,
        createdById: currentUserId,
        workspaceId: dto.workspaceId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.subject || dto.bodyHtml) {
      if (!dto.variables) {
        const existing = await this.findOne(id);
        const subject = dto.subject || existing.subject;
        const body = dto.bodyHtml || existing.bodyHtml;
        data.variables = Array.from(
          new Set([
            ...TemplateParser.extractVariables(subject),
            ...TemplateParser.extractVariables(body),
          ]),
        );
      }
    }

    return this.db.emailTemplate.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.db.emailTemplate.delete({ where: { id } });
    return { message: `Email template ${id} successfully deleted` };
  }

  async clone(id: string, currentUserId?: string) {
    const template = await this.findOne(id);

    return this.db.emailTemplate.create({
      data: {
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText,
        variables: template.variables,
        isShared: template.isShared,
        createdById: currentUserId,
        workspaceId: template.workspaceId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Preview/Render a template with real CRM entity data.
   */
  async render(id: string, dto: RenderTemplateDto, currentUser?: any) {
    const template = await this.findOne(id);

    let contact: any = null;
    let lead: any = null;
    let deal: any = null;
    let organization: any = null;

    if (dto.contactId) {
      contact = await this.prisma.contact.findUnique({
        where: { id: dto.contactId },
        include: { organization: true },
      });
      if (contact?.organization) {
        organization = contact.organization;
      }
    }

    if (dto.leadId) {
      lead = await this.prisma.lead.findUnique({
        where: { id: dto.leadId },
      });
    }

    if (dto.dealId) {
      deal = await this.prisma.deal.findUnique({
        where: { id: dto.dealId },
        include: { organization: true, contact: true },
      });
      if (!organization && deal?.organization) {
        organization = deal.organization;
      }
      if (!contact && deal?.contact) {
        contact = deal.contact;
      }
    }

    if (dto.organizationId && !organization) {
      organization = await this.prisma.organization.findUnique({
        where: { id: dto.organizationId },
      });
    }

    const context = TemplateParser.buildContext({
      contact,
      lead,
      deal,
      organization,
      user: currentUser,
      customVariables: dto.variables,
    });

    const renderedSubject = TemplateParser.interpolate(template.subject, context);
    const renderedBodyHtml = TemplateParser.interpolate(template.bodyHtml, context);
    const renderedBodyText = template.bodyText
      ? TemplateParser.interpolate(template.bodyText, context)
      : undefined;

    return {
      templateId: template.id,
      templateName: template.name,
      subject: renderedSubject,
      bodyHtml: renderedBodyHtml,
      bodyText: renderedBodyText,
      resolvedVariables: context,
    };
  }

  getAvailableVariablesCatalog() {
    return TemplateParser.getAvailableVariablesCatalog();
  }
}
