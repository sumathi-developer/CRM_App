import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ComposeEmailDto } from '../dto/compose-email.dto';
import { EmailQueryDto, EmailFolder, EmailDirection, EmailStatus } from '../dto/email-query.dto';
import { UpdateEmailDto } from '../dto/update-email.dto';
import { BatchEmailsDto, BatchEmailAction } from '../dto/batch-emails.dto';
import { ReplyEmailDto, ForwardEmailDto } from '../dto/reply-forward.dto';
import { EmailIntegrationsService } from './email-integrations.service';
import { TemplatesService } from './templates.service';
import { EmailProviderFactory } from '../providers/email-provider.factory';
import { createPaginatedResponse } from '../../common/utils/response.util';
import * as crypto from 'crypto';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailIntegrationsService: EmailIntegrationsService,
    private readonly templatesService: TemplatesService,
    private readonly providerFactory: EmailProviderFactory,
  ) {}

  private get db(): any {
    return this.prisma;
  }

  /**
   * List emails with flexible filtering and folder segregation.
   */
  async findAll(query: EmailQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.folder && query.folder !== EmailFolder.ALL) {
      where.folder = query.folder;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.direction) {
      where.direction = query.direction;
    }

    if (query.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    if (query.isStarred !== undefined) {
      where.isStarred = query.isStarred;
    }

    if (query.threadId) {
      where.threadId = query.threadId;
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

    if (query.organizationId) {
      where.organizationId = query.organizationId;
    }

    if (query.workspaceId) {
      where.workspaceId = query.workspaceId;
    }

    if (query.senderUserId) {
      where.senderUserId = query.senderUserId;
    }

    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { body: { contains: query.search, mode: 'insensitive' } },
        { snippet: { contains: query.search, mode: 'insensitive' } },
        { sender: { contains: query.search, mode: 'insensitive' } },
        { senderName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder || 'desc';

    const [total, emails] = await Promise.all([
      this.db.emailMessage.count({ where }),
      this.db.emailMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortDirection },
        include: {
          senderUser: { select: { id: true, name: true, email: true, avatar: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          lead: { select: { id: true, title: true, email: true } },
          deal: { select: { id: true, title: true } },
          organization: { select: { id: true, name: true } },
          attachments: { select: { id: true, filename: true, contentType: true, size: true, url: true } },
          _count: { select: { comments: true } },
        },
      }),
    ]);

    return createPaginatedResponse(emails, total, page, limit);
  }

  /**
   * Shortcut for Inbox emails.
   */
  async getInbox(query: EmailQueryDto) {
    return this.findAll({
      ...query,
      folder: EmailFolder.INBOX,
    });
  }

  /**
   * Shortcut for Sent emails.
   */
  async getSent(query: EmailQueryDto) {
    return this.findAll({
      ...query,
      folder: EmailFolder.SENT,
      direction: EmailDirection.OUTBOUND,
    });
  }

  /**
   * Shortcut for Draft emails.
   */
  async getDrafts(query: EmailQueryDto) {
    return this.findAll({
      ...query,
      folder: EmailFolder.DRAFTS,
    });
  }

  /**
   * Shortcut for Trash emails.
   */
  async getTrash(query: EmailQueryDto) {
    return this.findAll({
      ...query,
      folder: EmailFolder.TRASH,
    });
  }

  /**
   * Shortcut for Starred emails.
   */
  async getStarred(query: EmailQueryDto) {
    return this.findAll({
      ...query,
      isStarred: true,
    });
  }

  /**
   * Get single email with thread messages, internal comments, and attachments.
   */
  async findOne(id: string, autoMarkRead: boolean = true) {
    const email = await this.db.emailMessage.findUnique({
      where: { id },
      include: {
        senderUser: { select: { id: true, name: true, email: true, avatar: true } },
        contact: true,
        lead: true,
        deal: true,
        organization: true,
        attachments: true,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    if (!email) {
      throw new NotFoundException(`Email with ID ${id} not found`);
    }

    // Automatically mark read if unread
    if (autoMarkRead && !email.isRead) {
      await this.db.emailMessage.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      email.isRead = true;
      email.readAt = new Date();
    }

    // If part of a thread, fetch all thread messages in chronological order
    let threadMessages: any[] = [];
    if (email.threadId) {
      threadMessages = await this.db.emailMessage.findMany({
        where: { threadId: email.threadId },
        orderBy: { createdAt: 'asc' },
        include: {
          senderUser: { select: { id: true, name: true, email: true, avatar: true } },
          attachments: true,
          comments: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: { select: { id: true, name: true, email: true, avatar: true } },
            },
          },
        },
      });
    } else {
      threadMessages = [email];
    }

    return {
      ...email,
      threadMessages,
      threadCount: threadMessages.length,
    };
  }

  /**
   * Compose and send (or draft) an email.
   */
  async compose(dto: ComposeEmailDto, currentUser?: any) {
    if (!dto.recipients || dto.recipients.length === 0) {
      throw new BadRequestException('At least one recipient is required');
    }

    // 1. Template variable interpolation if template is specified
    let finalSubject = dto.subject;
    let finalBody = dto.body;
    let finalBodyText = dto.bodyText;

    if (dto.templateId) {
      const rendered = await this.templatesService.render(
        dto.templateId,
        {
          contactId: dto.contactId,
          leadId: dto.leadId,
          dealId: dto.dealId,
          organizationId: dto.organizationId,
          variables: dto.templateVariables,
        },
        currentUser,
      );
      finalSubject = rendered.subject || dto.subject;
      finalBody = rendered.bodyHtml || dto.body;
      finalBodyText = rendered.bodyText || dto.bodyText;
    }

    // 2. Generate threadId if not existing
    const generatedThreadId = dto.threadId || crypto.randomUUID();
    const isDraft = Boolean(dto.isDraft);
    const folder = isDraft ? EmailFolder.DRAFTS : EmailFolder.SENT;
    const status = isDraft ? EmailStatus.DRAFT : EmailStatus.SENT;

    // Sender details
    const senderEmail = dto.fromEmail || currentUser?.email || 'noreply@crm.com';
    const senderName = dto.fromName || currentUser?.name || 'CRM Team';
    const snippet = this.generateSnippet(finalBodyText || finalBody);

    // 3. Resolve email integration provider if sending immediately
    let providerName = 'SYSTEM';
    let providerMessageId: string | null = null;
    let providerMetadata: any = {};
    let errorMessage: string | null = null;

    if (!isDraft) {
      const integration = await this.emailIntegrationsService.resolveActiveIntegration(
        dto.integrationId,
        dto.workspaceId,
      );

      const provider = this.providerFactory.createProvider(integration);
      providerName = provider.name;

      try {
        const sendResult = await provider.send({
          from: senderEmail,
          fromName: senderName,
          to: dto.recipients,
          cc: dto.cc,
          bcc: dto.bcc,
          replyTo: dto.replyTo,
          subject: finalSubject,
          html: finalBody,
          text: finalBodyText,
          threadId: generatedThreadId,
          attachments: dto.attachments?.map((a) => ({
            filename: a.filename,
            contentType: a.contentType,
            size: a.size,
            path: a.path,
            url: a.url,
          })),
        });

        if (sendResult.success) {
          providerMessageId = sendResult.messageId || null;
          providerMetadata = sendResult.providerResponse || {};
        } else {
          errorMessage = sendResult.error || 'Failed to dispatch via provider';
        }
      } catch (sendErr: any) {
        this.logger.error(`Failed to send email: ${sendErr.message}`);
        errorMessage = sendErr.message;
      }
    }

    const messageId = providerMessageId || `<${crypto.randomUUID()}@crm.local>`;

    // 4. Create EmailMessage record in PostgreSQL
    const email = await this.db.emailMessage.create({
      data: {
        messageId,
        threadId: generatedThreadId,
        inReplyToId: dto.inReplyToId,
        folder,
        direction: EmailDirection.OUTBOUND,
        status: errorMessage ? EmailStatus.FAILED : status,
        sender: senderEmail,
        senderName,
        senderUserId: currentUser?.id,
        recipients: dto.recipients,
        cc: dto.cc || [],
        bcc: dto.bcc || [],
        replyTo: dto.replyTo,
        subject: finalSubject,
        body: finalBody,
        bodyText: finalBodyText,
        snippet,
        isRead: true, // Sender has read own email
        readAt: new Date(),
        isStarred: false,
        isArchived: false,
        isDraft,
        sentAt: isDraft ? null : new Date(),
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        provider: providerName,
        providerMessageId,
        providerMetadata,
        errorMessage,
        contactId: dto.contactId,
        leadId: dto.leadId,
        dealId: dto.dealId,
        organizationId: dto.organizationId,
        workspaceId: dto.workspaceId,
        attachments: dto.attachments && dto.attachments.length > 0
          ? {
              create: dto.attachments.map((a) => ({
                filename: a.filename,
                contentType: a.contentType || 'application/octet-stream',
                size: a.size || 0,
                path: a.path,
                url: a.url,
                fileRecordId: a.fileRecordId,
              })),
            }
          : undefined,
      },
      include: {
        senderUser: { select: { id: true, name: true, email: true, avatar: true } },
        attachments: true,
        contact: true,
        lead: true,
        deal: true,
      },
    });

    // 5. Automatically record an Activity in CRM if sent
    if (!isDraft) {
      await this.logEmailActivity({
        emailId: email.id,
        subject: finalSubject,
        bodyText: snippet,
        contactId: dto.contactId,
        leadId: dto.leadId,
        dealId: dto.dealId,
        userId: currentUser?.id,
      });
    }

    return email;
  }

  /**
   * Quick reply to an existing email thread.
   */
  async reply(id: string, dto: ReplyEmailDto, currentUser?: any) {
    const original = await this.findOne(id, false);

    // Determine recipients
    const to = [original.sender];
    const cc = dto.replyAll
      ? [...(Array.isArray(original.cc) ? original.cc : []), ...(dto.cc || [])]
      : dto.cc || [];

    const replySubject = original.subject.startsWith('Re:')
      ? original.subject
      : `Re: ${original.subject}`;

    const quotedBody = `
      <p>${dto.body}</p>
      <br>
      <hr>
      <p><strong>On ${new Date(original.createdAt).toLocaleString()}, ${original.sender} wrote:</strong></p>
      <blockquote>${original.body}</blockquote>
    `;

    return this.compose(
      {
        recipients: to,
        cc,
        bcc: dto.bcc,
        subject: replySubject,
        body: quotedBody,
        threadId: original.threadId || original.id,
        inReplyToId: original.id,
        contactId: original.contactId,
        leadId: original.leadId,
        dealId: original.dealId,
        organizationId: original.organizationId,
        workspaceId: original.workspaceId,
        attachments: dto.attachments,
        isDraft: false,
      },
      currentUser,
    );
  }

  /**
   * Quick forward an existing email.
   */
  async forward(id: string, dto: ForwardEmailDto, currentUser?: any) {
    const original = await this.findOne(id, false);

    const fwdSubject = original.subject.startsWith('Fwd:')
      ? original.subject
      : `Fwd: ${original.subject}`;

    const intro = dto.message ? `<p>${dto.message}</p><br>` : '';
    const forwardedBody = `
      ${intro}
      <hr>
      <p><strong>---------- Forwarded message ---------</strong><br>
      <strong>From:</strong> ${original.sender}<br>
      <strong>Date:</strong> ${new Date(original.createdAt).toLocaleString()}<br>
      <strong>Subject:</strong> ${original.subject}<br>
      <strong>To:</strong> ${JSON.stringify(original.recipients)}</p>
      <br>
      ${original.body}
    `;

    // Inherit attachments from original if not overridden
    const inheritedAttachments = original.attachments?.map((a: any) => ({
      filename: a.filename,
      contentType: a.contentType,
      size: a.size,
      path: a.path,
      url: a.url,
      fileRecordId: a.fileRecordId,
    })) || [];

    return this.compose(
      {
        recipients: dto.recipients,
        cc: dto.cc,
        bcc: dto.bcc,
        subject: fwdSubject,
        body: forwardedBody,
        threadId: original.threadId || original.id,
        contactId: original.contactId,
        leadId: original.leadId,
        dealId: original.dealId,
        organizationId: original.organizationId,
        workspaceId: original.workspaceId,
        attachments: [...inheritedAttachments, ...(dto.attachments || [])],
        isDraft: false,
      },
      currentUser,
    );
  }

  /**
   * Update an email (toggle read, star, move folder, edit draft).
   */
  async update(id: string, dto: UpdateEmailDto) {
    await this.findOne(id, false);

    const data: any = { ...dto };

    if (dto.isRead !== undefined) {
      data.readAt = dto.isRead ? new Date() : null;
    }

    if (dto.folder) {
      data.folder = dto.folder;
    }

    if (dto.isArchived !== undefined) {
      data.isArchived = dto.isArchived;
      if (dto.isArchived) {
        data.folder = EmailFolder.ARCHIVE;
      }
    }

    if (dto.body) {
      data.snippet = this.generateSnippet(dto.bodyText || dto.body);
    }

    return this.db.emailMessage.update({
      where: { id },
      data,
      include: {
        senderUser: { select: { id: true, name: true, email: true, avatar: true } },
        attachments: true,
      },
    });
  }

  /**
   * Batch perform actions on multiple emails.
   */
  async batchAction(dto: BatchEmailsDto) {
    if (!dto.emailIds || dto.emailIds.length === 0) {
      throw new BadRequestException('No email IDs provided');
    }

    const { emailIds, action } = dto;

    switch (action) {
      case BatchEmailAction.MARK_READ:
        await this.db.emailMessage.updateMany({
          where: { id: { in: emailIds } },
          data: { isRead: true, readAt: new Date() },
        });
        return { success: true, count: emailIds.length, action: 'MARK_READ' };

      case BatchEmailAction.MARK_UNREAD:
        await this.db.emailMessage.updateMany({
          where: { id: { in: emailIds } },
          data: { isRead: false, readAt: null },
        });
        return { success: true, count: emailIds.length, action: 'MARK_UNREAD' };

      case BatchEmailAction.STAR:
        await this.db.emailMessage.updateMany({
          where: { id: { in: emailIds } },
          data: { isStarred: true },
        });
        return { success: true, count: emailIds.length, action: 'STAR' };

      case BatchEmailAction.UNSTAR:
        await this.db.emailMessage.updateMany({
          where: { id: { in: emailIds } },
          data: { isStarred: false },
        });
        return { success: true, count: emailIds.length, action: 'UNSTAR' };

      case BatchEmailAction.ARCHIVE:
        await this.db.emailMessage.updateMany({
          where: { id: { in: emailIds } },
          data: { isArchived: true, folder: EmailFolder.ARCHIVE },
        });
        return { success: true, count: emailIds.length, action: 'ARCHIVE' };

      case BatchEmailAction.UNARCHIVE:
        await this.db.emailMessage.updateMany({
          where: { id: { in: emailIds } },
          data: { isArchived: false, folder: EmailFolder.INBOX },
        });
        return { success: true, count: emailIds.length, action: 'UNARCHIVE' };

      case BatchEmailAction.MOVE_TO_FOLDER:
        if (!dto.targetFolder) {
          throw new BadRequestException('Target folder is required for MOVE_TO_FOLDER');
        }
        await this.db.emailMessage.updateMany({
          where: { id: { in: emailIds } },
          data: { folder: dto.targetFolder },
        });
        return { success: true, count: emailIds.length, action: 'MOVE_TO_FOLDER', target: dto.targetFolder };

      case BatchEmailAction.DELETE:
        // Move to TRASH
        await this.db.emailMessage.updateMany({
          where: { id: { in: emailIds } },
          data: { folder: EmailFolder.TRASH },
        });
        return { success: true, count: emailIds.length, action: 'DELETE' };

      default:
        throw new BadRequestException(`Unsupported action: ${action}`);
    }
  }

  /**
   * Delete an email (soft delete to TRASH, or permanent delete if already in TRASH).
   */
  async remove(id: string) {
    const email = await this.findOne(id, false);

    if (email.folder === EmailFolder.TRASH) {
      // Permanently remove from database
      await this.db.emailMessage.delete({ where: { id } });
      return { message: `Email ${id} permanently deleted` };
    } else {
      // Move to TRASH
      await this.db.emailMessage.update({
        where: { id },
        data: { folder: EmailFolder.TRASH },
      });
      return { message: `Email ${id} moved to Trash` };
    }
  }

  /**
   * Helper to strip HTML tags and generate a preview snippet.
   */
  private generateSnippet(textOrHtml: string, length: number = 150): string {
    if (!textOrHtml) return '';
    const clean = textOrHtml
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return clean.length > length ? clean.substring(0, length) + '...' : clean;
  }

  /**
   * Helper to create an Activity record in CRM for sent emails.
   */
  private async logEmailActivity(params: {
    emailId: string;
    subject: string;
    bodyText: string;
    contactId?: string;
    leadId?: string;
    dealId?: string;
    userId?: string;
  }) {
    try {
      if (params.contactId || params.leadId || params.dealId) {
        await this.prisma.activity.create({
          data: {
            type: 'EMAIL',
            subject: params.subject,
            description: params.bodyText,
            completedAt: new Date(),
            scheduledAt: new Date(),
            status: 'COMPLETED',
            priority: 'MEDIUM',
            contactId: params.contactId,
            leadId: params.leadId,
            dealId: params.dealId,
            assignedToId: params.userId,
            createdById: params.userId,
          },
        });
      }
    } catch (err: any) {
      this.logger.warn(`Could not automatically log Activity for email: ${err.message}`);
    }
  }
}
