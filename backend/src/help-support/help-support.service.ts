import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateHelpCategoryDto } from './dto/create-help-category.dto';
import { UpdateHelpCategoryDto } from './dto/update-help-category.dto';
import { CreateHelpArticleDto } from './dto/create-help-article.dto';
import { UpdateHelpArticleDto } from './dto/update-help-article.dto';
import { HelpQueryDto } from './dto/help-query.dto';
import { CreateDocCategoryDto } from './dto/create-doc-category.dto';
import { UpdateDocCategoryDto } from './dto/update-doc-category.dto';
import { CreateDocPageDto } from './dto/create-doc-page.dto';
import { UpdateDocPageDto } from './dto/update-doc-page.dto';
import { DocQueryDto } from './dto/doc-query.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { FaqQueryDto } from './dto/faq-query.dto';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FeedbackQueryDto } from './dto/feedback-query.dto';
import { TicketStatus } from './enums/ticket-status.enum';
import { AuditAction } from '../audit-logs/enums/audit-action.enum';
import { AuditEntityType } from '../audit-logs/enums/audit-entity-type.enum';

@Injectable()
export class HelpSupportService {
  private readonly logger = new Logger(HelpSupportService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditLogs?: AuditLogsService,
  ) {}

  /**
   * Helper to check if a user is an administrator or support agent
   */
  isSupportOrAdmin(user: any): boolean {
    if (!user) return false;
    const role = (user.role?.name || user.role || '').toUpperCase();
    return ['ADMIN', 'SUPERADMIN', 'SUPPORT', 'MANAGER'].includes(role);
  }

  /**
   * Helper to slugify a title or name
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // ==========================================
  // 1. HELP CENTER (Categories & Articles)
  // ==========================================

  async createHelpCategory(dto: CreateHelpCategoryDto, currentUser?: any) {
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);
    const workspaceId = dto.workspaceId ?? currentUser?.activeWorkspaceId ?? null;

    return this.prisma.helpCategory.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        icon: dto.icon ?? 'help-circle',
        order: dto.order ?? 0,
        isPublished: dto.isPublished ?? true,
        workspaceId,
      },
    });
  }

  async findAllHelpCategories(workspaceId?: string, isPublished?: boolean) {
    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (isPublished !== undefined) where.isPublished = isPublished;

    return this.prisma.helpCategory.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });
  }

  async updateHelpCategory(id: string, dto: UpdateHelpCategoryDto) {
    const existing = await this.prisma.helpCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Help category ${id} not found`);

    const data: any = { ...dto };
    if (dto.name && !dto.slug) {
      data.slug = this.slugify(dto.name);
    } else if (dto.slug) {
      data.slug = this.slugify(dto.slug);
    }

    return this.prisma.helpCategory.update({
      where: { id },
      data,
    });
  }

  async deleteHelpCategory(id: string) {
    const existing = await this.prisma.helpCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Help category ${id} not found`);

    await this.prisma.helpCategory.delete({ where: { id } });
    return { message: 'Help category deleted successfully', deletedId: id };
  }

  async createHelpArticle(dto: CreateHelpArticleDto, currentUser?: any) {
    const category = await this.prisma.helpCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException(`Category ${dto.categoryId} not found`);

    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);
    const workspaceId = dto.workspaceId ?? category.workspaceId ?? currentUser?.activeWorkspaceId ?? null;

    return this.prisma.helpArticle.create({
      data: {
        categoryId: dto.categoryId,
        title: dto.title,
        slug,
        summary: dto.summary,
        content: dto.content,
        isPublished: dto.isPublished ?? true,
        tags: dto.tags ?? [],
        relatedArticleIds: dto.relatedArticleIds ?? [],
        order: dto.order ?? 0,
        authorId: currentUser?.id ?? null,
        workspaceId,
      },
    });
  }

  async findAllHelpArticles(query: HelpQueryDto, currentUser?: any) {
    const {
      search,
      categoryId,
      tag,
      isPublished,
      workspaceId,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (categoryId) where.categoryId = categoryId;

    // Normal users can only view published articles
    if (!this.isSupportOrAdmin(currentUser)) {
      where.isPublished = true;
    } else if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    if (search) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { summary: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      this.prisma.helpArticle.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
        },
      }),
      this.prisma.helpArticle.count({ where }),
    ]);

    // In-memory tag filter if requested
    let filtered = articles;
    if (tag) {
      const lowerTag = tag.toLowerCase().trim();
      filtered = articles.filter((a) => {
        const tags = (a.tags as string[]) || [];
        return tags.some((t) => t.toLowerCase() === lowerTag);
      });
    }

    return {
      data: filtered,
      meta: {
        total: tag ? filtered.length : total,
        page,
        limit,
        totalPages: Math.ceil((tag ? filtered.length : total) / limit) || 1,
      },
    };
  }

  async findHelpArticleById(id: string, currentUser?: any) {
    const article = await this.prisma.helpArticle.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!article) throw new NotFoundException(`Help article ${id} not found`);

    if (!article.isPublished && !this.isSupportOrAdmin(currentUser)) {
      throw new NotFoundException(`Help article ${id} not found`);
    }

    // Increment views count asynchronously
    await this.prisma.helpArticle.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    // Resolve related articles
    let relatedArticles: any[] = [];
    const relatedIds = (article.relatedArticleIds as string[]) || [];

    if (relatedIds.length > 0) {
      relatedArticles = await this.prisma.helpArticle.findMany({
        where: {
          id: { in: relatedIds },
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          viewsCount: true,
        },
      });
    }

    if (relatedArticles.length === 0) {
      // Find up to 4 other articles in the same category
      relatedArticles = await this.prisma.helpArticle.findMany({
        where: {
          categoryId: article.categoryId,
          id: { not: id },
          isPublished: true,
        },
        take: 4,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          viewsCount: true,
        },
      });
    }

    return {
      ...article,
      viewsCount: article.viewsCount + 1,
      relatedArticles,
    };
  }

  async updateHelpArticle(id: string, dto: UpdateHelpArticleDto) {
    const existing = await this.prisma.helpArticle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Help article ${id} not found`);

    const data: any = { ...dto };
    if (dto.title && !dto.slug) {
      data.slug = this.slugify(dto.title);
    } else if (dto.slug) {
      data.slug = this.slugify(dto.slug);
    }

    return this.prisma.helpArticle.update({
      where: { id },
      data,
    });
  }

  async deleteHelpArticle(id: string) {
    const existing = await this.prisma.helpArticle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Help article ${id} not found`);

    await this.prisma.helpArticle.delete({ where: { id } });
    return { message: 'Help article deleted successfully', deletedId: id };
  }

  async voteHelpArticle(id: string, isHelpful: boolean) {
    const existing = await this.prisma.helpArticle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Help article ${id} not found`);

    const updated = await this.prisma.helpArticle.update({
      where: { id },
      data: isHelpful
        ? { helpfulCount: { increment: 1 } }
        : { notHelpfulCount: { increment: 1 } },
      select: { id: true, helpfulCount: true, notHelpfulCount: true },
    });

    return {
      message: 'Feedback recorded successfully',
      ...updated,
    };
  }

  // ==========================================
  // 2. DOCUMENTATION (Categories & Pages)
  // ==========================================

  async createDocCategory(dto: CreateDocCategoryDto, currentUser?: any) {
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);
    const workspaceId = dto.workspaceId ?? currentUser?.activeWorkspaceId ?? null;

    return this.prisma.docCategory.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        version: dto.version ?? '1.0.0',
        status: dto.status ?? 'PUBLISHED',
        order: dto.order ?? 0,
        workspaceId,
      },
    });
  }

  async findAllDocCategories(workspaceId?: string, version?: string, status?: string) {
    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (version) where.version = version;
    if (status) where.status = status;

    return this.prisma.docCategory.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { pages: true },
        },
      },
    });
  }

  async updateDocCategory(id: string, dto: UpdateDocCategoryDto) {
    const existing = await this.prisma.docCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Doc category ${id} not found`);

    const data: any = { ...dto };
    if (dto.name && !dto.slug) {
      data.slug = this.slugify(dto.name);
    } else if (dto.slug) {
      data.slug = this.slugify(dto.slug);
    }

    return this.prisma.docCategory.update({
      where: { id },
      data,
    });
  }

  async deleteDocCategory(id: string) {
    const existing = await this.prisma.docCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Doc category ${id} not found`);

    await this.prisma.docCategory.delete({ where: { id } });
    return { message: 'Doc category deleted successfully', deletedId: id };
  }

  async createDocPage(dto: CreateDocPageDto, currentUser?: any) {
    const category = await this.prisma.docCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException(`Category ${dto.categoryId} not found`);

    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);
    const workspaceId = dto.workspaceId ?? category.workspaceId ?? currentUser?.activeWorkspaceId ?? null;

    return this.prisma.docPage.create({
      data: {
        categoryId: dto.categoryId,
        title: dto.title,
        slug,
        content: dto.content,
        version: dto.version ?? category.version ?? '1.0.0',
        status: dto.status ?? 'PUBLISHED',
        order: dto.order ?? 0,
        authorId: currentUser?.id ?? null,
        workspaceId,
      },
    });
  }

  async findAllDocPages(query: DocQueryDto, currentUser?: any) {
    const {
      search,
      categoryId,
      version,
      status,
      workspaceId,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (categoryId) where.categoryId = categoryId;
    if (version) where.version = version;

    if (!this.isSupportOrAdmin(currentUser)) {
      where.status = 'PUBLISHED';
    } else if (status) {
      where.status = status;
    }

    if (search) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [pages, total] = await Promise.all([
      this.prisma.docPage.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        include: {
          category: {
            select: { id: true, name: true, slug: true, version: true },
          },
        },
      }),
      this.prisma.docPage.count({ where }),
    ]);

    return {
      data: pages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findDocPageById(id: string, currentUser?: any) {
    const page = await this.prisma.docPage.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!page) throw new NotFoundException(`Doc page ${id} not found`);

    if (page.status !== 'PUBLISHED' && !this.isSupportOrAdmin(currentUser)) {
      throw new NotFoundException(`Doc page ${id} not found`);
    }

    return page;
  }

  async updateDocPage(id: string, dto: UpdateDocPageDto) {
    const existing = await this.prisma.docPage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Doc page ${id} not found`);

    const data: any = { ...dto };
    if (dto.title && !dto.slug) {
      data.slug = this.slugify(dto.title);
    } else if (dto.slug) {
      data.slug = this.slugify(dto.slug);
    }

    return this.prisma.docPage.update({
      where: { id },
      data,
    });
  }

  async deleteDocPage(id: string) {
    const existing = await this.prisma.docPage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Doc page ${id} not found`);

    await this.prisma.docPage.delete({ where: { id } });
    return { message: 'Doc page deleted successfully', deletedId: id };
  }

  // ==========================================
  // 3. FAQS (CRUD, Search, Publish)
  // ==========================================

  async createFaq(dto: CreateFaqDto, currentUser?: any) {
    const workspaceId = dto.workspaceId ?? currentUser?.activeWorkspaceId ?? null;

    return this.prisma.faqItem.create({
      data: {
        question: dto.question,
        answer: dto.answer,
        category: (dto.category || 'GENERAL').toUpperCase(),
        order: dto.order ?? 0,
        isPublished: dto.isPublished ?? true,
        workspaceId,
      },
    });
  }

  async findAllFaqs(query: FaqQueryDto, currentUser?: any) {
    const {
      search,
      category,
      isPublished,
      workspaceId,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (category) where.category = category.toUpperCase().trim();

    if (!this.isSupportOrAdmin(currentUser)) {
      where.isPublished = true;
    } else if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    if (search) {
      const term = search.trim();
      where.OR = [
        { question: { contains: term, mode: 'insensitive' } },
        { answer: { contains: term, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [faqs, total] = await Promise.all([
      this.prisma.faqItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.faqItem.count({ where }),
    ]);

    return {
      data: faqs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findFaqById(id: string) {
    const faq = await this.prisma.faqItem.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException(`FAQ ${id} not found`);

    await this.prisma.faqItem.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    return {
      ...faq,
      viewsCount: faq.viewsCount + 1,
    };
  }

  async updateFaq(id: string, dto: UpdateFaqDto) {
    const existing = await this.prisma.faqItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`FAQ ${id} not found`);

    const data: any = { ...dto };
    if (dto.category) data.category = dto.category.toUpperCase().trim();

    return this.prisma.faqItem.update({
      where: { id },
      data,
    });
  }

  async deleteFaq(id: string) {
    const existing = await this.prisma.faqItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`FAQ ${id} not found`);

    await this.prisma.faqItem.delete({ where: { id } });
    return { message: 'FAQ deleted successfully', deletedId: id };
  }

  // ==========================================
  // 4. CONTACT SUPPORT & SUPPORT TICKETS
  // ==========================================

  private generateTicketNumber(): string {
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `TIK-${Date.now().toString().slice(-4)}${rand}`;
  }

  async createSupportTicket(dto: CreateSupportTicketDto, currentUser: any) {
    if (!currentUser) throw new ForbiddenException('User must be authenticated to create a ticket');

    const ticketNumber = this.generateTicketNumber();
    const workspaceId = dto.workspaceId ?? currentUser.activeWorkspaceId ?? null;

    const userName = currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User';

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        subject: dto.subject,
        description: dto.description,
        category: dto.category ?? 'TECHNICAL',
        priority: dto.priority ?? 'MEDIUM',
        status: TicketStatus.OPEN,
        attachments: dto.attachments ?? [],
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName,
        workspaceId,
        history: {
          create: {
            changedById: currentUser.id,
            changedByName: userName,
            action: 'CREATED',
            details: { priority: dto.priority ?? 'MEDIUM', category: dto.category ?? 'TECHNICAL' },
            isInternal: false,
          },
        },
      },
      include: {
        history: true,
      },
    });

    this.logger.log(`Created support ticket ${ticket.ticketNumber} for ${currentUser.email}`);

    // Audit log
    if (this.auditLogs) {
      await this.auditLogs.create(
        {
          action: AuditAction.CREATE,
          entityType: AuditEntityType.SYSTEM,
          entityId: ticket.id,
          entityName: `${ticket.ticketNumber}: ${ticket.subject}`,
          details: { ticketNumber: ticket.ticketNumber, priority: ticket.priority },
        },
        currentUser,
      );
    }

    return ticket;
  }

  async findAllTickets(query: TicketQueryDto, currentUser: any) {
    const {
      search,
      status,
      priority,
      category,
      assignedToId,
      userId,
      workspaceId,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assignedToId) where.assignedToId = assignedToId;

    // Security: Normal CRM users only see their own tickets
    if (!this.isSupportOrAdmin(currentUser)) {
      where.userId = currentUser.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (search) {
      const term = search.trim();
      where.OR = [
        { ticketNumber: { contains: term, mode: 'insensitive' } },
        { subject: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { messages: true },
          },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data: tickets.map((t) => ({
        ...t,
        messagesCount: t._count.messages,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findTicketById(id: string, currentUser: any) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);

    const isStaff = this.isSupportOrAdmin(currentUser);

    // Normal users can only view their own ticket
    if (!isStaff && ticket.userId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to view this support ticket');
    }

    // Do NOT expose internal support/admin notes or internal history to normal CRM users
    let sanitizedMessages = ticket.messages;
    let sanitizedHistory = ticket.history;

    if (!isStaff) {
      sanitizedMessages = ticket.messages.filter((m) => !m.isInternalNote);
      sanitizedHistory = ticket.history.filter((h) => !h.isInternal);
    }

    return {
      ...ticket,
      messages: sanitizedMessages,
      history: sanitizedHistory,
    };
  }

  async updateTicketStatus(id: string, dto: UpdateTicketStatusDto, currentUser: any) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);

    const isStaff = this.isSupportOrAdmin(currentUser);

    // Normal users can only close their own tickets
    if (!isStaff) {
      if (ticket.userId !== currentUser.id) {
        throw new ForbiddenException('You do not have permission to update this ticket');
      }
      if (dto.status !== TicketStatus.CLOSED && dto.status !== TicketStatus.RESOLVED) {
        throw new ForbiddenException('Clients can only resolve or close their own tickets');
      }
    }

    const data: any = { status: dto.status };
    if (dto.status === TicketStatus.RESOLVED) {
      data.resolvedAt = new Date();
    } else if (dto.status === TicketStatus.CLOSED) {
      data.closedAt = new Date();
    }

    const userName = currentUser.name || currentUser.email || 'User';

    const [updated] = await this.prisma.$transaction([
      this.prisma.supportTicket.update({
        where: { id },
        data,
      }),
      this.prisma.supportTicketHistory.create({
        data: {
          ticketId: id,
          changedById: currentUser.id,
          changedByName: userName,
          action: 'STATUS_CHANGED',
          details: { oldStatus: ticket.status, newStatus: dto.status, reason: dto.reason },
          isInternal: false,
        },
      }),
    ]);

    this.logger.log(`Ticket ${ticket.ticketNumber} status changed from ${ticket.status} to ${dto.status}`);

    if (this.auditLogs) {
      await this.auditLogs.create(
        {
          action: AuditAction.STATUS_CHANGE,
          entityType: AuditEntityType.SYSTEM,
          entityId: ticket.id,
          entityName: `${ticket.ticketNumber}: status changed to ${dto.status}`,
          details: { oldStatus: ticket.status, newStatus: dto.status },
        },
        currentUser,
      );
    }

    return updated;
  }

  async assignTicket(id: string, dto: AssignTicketDto, currentUser: any) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);

    if (!this.isSupportOrAdmin(currentUser)) {
      throw new ForbiddenException('Only support/admin staff can assign tickets');
    }

    const assignee = await this.prisma.user.findUnique({
      where: { id: dto.assignedToId },
      select: { id: true, name: true, email: true },
    });
    if (!assignee) throw new NotFoundException(`User ${dto.assignedToId} not found`);

    const userName = currentUser.name || currentUser.email || 'Admin';

    const [updated] = await this.prisma.$transaction([
      this.prisma.supportTicket.update({
        where: { id },
        data: {
          assignedToId: dto.assignedToId,
          status: ticket.status === TicketStatus.OPEN ? TicketStatus.IN_PROGRESS : ticket.status,
        },
      }),
      this.prisma.supportTicketHistory.create({
        data: {
          ticketId: id,
          changedById: currentUser.id,
          changedByName: userName,
          action: 'ASSIGNED',
          details: {
            assignedToId: assignee.id,
            assignedToName: assignee.name || assignee.email,
          },
          isInternal: true, // internal staff assignment note
        },
      }),
    ]);

    this.logger.log(`Ticket ${ticket.ticketNumber} assigned to ${assignee.email}`);

    if (this.auditLogs) {
      await this.auditLogs.create(
        {
          action: AuditAction.ASSIGN,
          entityType: AuditEntityType.SYSTEM,
          entityId: ticket.id,
          entityName: `${ticket.ticketNumber} assigned to ${assignee.name || assignee.email}`,
          details: { assignedToId: assignee.id },
        },
        currentUser,
      );
    }

    return updated;
  }

  async addTicketMessage(id: string, dto: AddTicketMessageDto, currentUser: any) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);

    const isStaff = this.isSupportOrAdmin(currentUser);

    // Normal users can only reply to their own tickets
    if (!isStaff && ticket.userId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to reply to this ticket');
    }

    // Only staff can add internal notes
    if (dto.isInternalNote && !isStaff) {
      throw new ForbiddenException('Only support/admin staff can add internal notes');
    }

    const senderRole = isStaff ? 'SUPPORT' : 'USER';
    const senderName = currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email;

    const message = await this.prisma.supportTicketMessage.create({
      data: {
        ticketId: id,
        senderId: currentUser.id,
        senderName,
        senderRole,
        message: dto.message,
        attachments: dto.attachments ?? [],
        isInternalNote: dto.isInternalNote ?? false,
      },
    });

    // Update ticket status automatically based on who replied
    let nextStatus = ticket.status;
    if (!dto.isInternalNote) {
      if (isStaff && ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED) {
        nextStatus = TicketStatus.WAITING_FOR_USER;
      } else if (!isStaff && (ticket.status === TicketStatus.WAITING_FOR_USER || ticket.status === TicketStatus.OPEN)) {
        nextStatus = TicketStatus.IN_PROGRESS;
      }

      if (nextStatus !== ticket.status) {
        await this.prisma.supportTicket.update({
          where: { id },
          data: { status: nextStatus },
        });
      }
    }

    // Add history record
    await this.prisma.supportTicketHistory.create({
      data: {
        ticketId: id,
        changedById: currentUser.id,
        changedByName: senderName,
        action: dto.isInternalNote ? 'NOTE_ADDED' : 'MESSAGE_ADDED',
        details: { messageId: message.id },
        isInternal: dto.isInternalNote ?? false,
      },
    });

    return message;
  }

  // ==========================================
  // 5. FEEDBACK
  // ==========================================

  async submitFeedback(dto: SubmitFeedbackDto, currentUser?: any) {
    const workspaceId = dto.workspaceId ?? currentUser?.activeWorkspaceId ?? null;
    const userName = currentUser
      ? currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email
      : null;

    const feedback = await this.prisma.userFeedback.create({
      data: {
        type: dto.type ?? 'GENERAL',
        rating: dto.rating,
        description: dto.description,
        module: dto.module,
        pageUrl: dto.pageUrl,
        userId: currentUser?.id ?? null,
        userEmail: currentUser?.email ?? null,
        userName,
        workspaceId,
      },
    });

    this.logger.log(`Received user feedback (${feedback.type}) from ${currentUser?.email || 'Anonymous'}`);

    if (this.auditLogs && currentUser) {
      await this.auditLogs.create(
        {
          action: AuditAction.CREATE,
          entityType: AuditEntityType.SYSTEM,
          entityId: feedback.id,
          entityName: `Feedback (${feedback.type}): ${feedback.module || 'General'}`,
          details: { rating: feedback.rating, type: feedback.type },
        },
        currentUser,
      );
    }

    return feedback;
  }

  async findAllFeedback(query: FeedbackQueryDto, currentUser: any) {
    const {
      search,
      type,
      status,
      module,
      workspaceId,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (module) where.module = { equals: module, mode: 'insensitive' };

    const isStaff = this.isSupportOrAdmin(currentUser);

    // Normal users only see their own feedback
    if (!isStaff) {
      where.userId = currentUser.id;
    }

    if (search) {
      const term = search.trim();
      where.OR = [
        { description: { contains: term, mode: 'insensitive' } },
        { module: { contains: term, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [feedbacks, total] = await Promise.all([
      this.prisma.userFeedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userFeedback.count({ where }),
    ]);

    // Strip internal admin notes for regular users
    const sanitized = feedbacks.map((f) => {
      if (!isStaff) {
        const { adminNotes: _notes, ...rest } = f;
        return rest;
      }
      return f;
    });

    return {
      data: sanitized,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findFeedbackById(id: string, currentUser: any) {
    const feedback = await this.prisma.userFeedback.findUnique({ where: { id } });
    if (!feedback) throw new NotFoundException(`Feedback ${id} not found`);

    const isStaff = this.isSupportOrAdmin(currentUser);

    if (!isStaff && feedback.userId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to view this feedback');
    }

    if (!isStaff) {
      const { adminNotes: _notes, ...rest } = feedback;
      return rest;
    }

    return feedback;
  }

  async updateFeedback(id: string, dto: UpdateFeedbackDto, currentUser: any) {
    const feedback = await this.prisma.userFeedback.findUnique({ where: { id } });
    if (!feedback) throw new NotFoundException(`Feedback ${id} not found`);

    if (!this.isSupportOrAdmin(currentUser)) {
      throw new ForbiddenException('Only support/admin staff can update feedback status or notes');
    }

    return this.prisma.userFeedback.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.adminNotes !== undefined ? { adminNotes: dto.adminNotes } : {}),
      },
    });
  }
}
