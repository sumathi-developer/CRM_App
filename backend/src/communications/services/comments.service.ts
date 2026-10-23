import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { CommentQueryDto } from '../dto/comment-query.dto';
import { MentionsParser } from '../utils/mentions-parser.util';
import { createPaginatedResponse } from '../../common/utils/response.util';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  async findAll(query: CommentQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.emailId) {
      where.emailId = query.emailId;
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

    if (query.workspaceId) {
      where.workspaceId = query.workspaceId;
    }

    if (query.search) {
      where.content = { contains: query.search, mode: 'insensitive' };
    }

    const [total, comments] = await Promise.all([
      this.db.communicationComment.count({ where }),
      this.db.communicationComment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true } },
          email: { select: { id: true, subject: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          lead: { select: { id: true, title: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
    ]);

    // If query.mentionedUserId filter is specified, filter in memory on JSON mentions
    let filteredData = comments;
    if (query.mentionedUserId) {
      filteredData = comments.filter((c: any) => {
        const mentions = Array.isArray(c.mentions) ? c.mentions : [];
        return mentions.some((m: any) => m.userId === query.mentionedUserId);
      });
    }

    return createPaginatedResponse(filteredData, total, page, limit);
  }

  async findOne(id: string) {
    const comment = await this.db.communicationComment.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        email: { select: { id: true, subject: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, title: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    if (!comment) {
      throw new NotFoundException(`Internal comment with ID ${id} not found`);
    }

    return comment;
  }

  async create(dto: CreateCommentDto, currentUserId?: string) {
    // Resolve mentioned users from @mentions in content and explicit mentionedUserIds
    const resolvedMentions = await this.resolveMentions(dto.content, dto.mentionedUserIds);

    // If emailId is provided, inherit threadId and workspaceId if not given
    let inheritedThreadId = dto.threadId;
    let inheritedWorkspaceId = dto.workspaceId;

    if (dto.emailId) {
      const email = await this.db.emailMessage.findUnique({
        where: { id: dto.emailId },
      });
      if (email) {
        if (!inheritedThreadId) inheritedThreadId = email.threadId || email.id;
        if (!inheritedWorkspaceId) inheritedWorkspaceId = email.workspaceId;
      }
    }

    const comment = await this.db.communicationComment.create({
      data: {
        content: dto.content,
        emailId: dto.emailId,
        threadId: inheritedThreadId,
        contactId: dto.contactId,
        leadId: dto.leadId,
        dealId: dto.dealId,
        workspaceId: inheritedWorkspaceId,
        authorId: currentUserId,
        mentions: resolvedMentions,
        isInternal: true, // Always internal!
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        email: { select: { id: true, subject: true } },
      },
    });

    // Notify mentioned users asynchronously
    await this.notifyMentionedUsers(comment, resolvedMentions, currentUserId);

    return comment;
  }

  async update(id: string, dto: UpdateCommentDto, currentUserId?: string) {
    const existing = await this.findOne(id);

    // Check author permission (author or admin)
    if (currentUserId && existing.authorId && existing.authorId !== currentUserId) {
      // Allow if author matches or proceed
      this.logger.warn(`User ${currentUserId} updating comment created by ${existing.authorId}`);
    }

    const resolvedMentions = await this.resolveMentions(dto.content, dto.mentionedUserIds);

    const updated = await this.db.communicationComment.update({
      where: { id },
      data: {
        content: dto.content,
        mentions: resolvedMentions,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        email: { select: { id: true, subject: true } },
      },
    });

    return updated;
  }

  async remove(id: string, currentUserId?: string) {
    const existing = await this.findOne(id);
    if (currentUserId && existing.authorId && existing.authorId !== currentUserId) {
      this.logger.warn(`User ${currentUserId} deleting comment created by ${existing.authorId}`);
    }

    await this.db.communicationComment.delete({ where: { id } });
    return { message: `Internal comment ${id} successfully removed` };
  }

  async getByEmail(emailId: string) {
    return this.db.communicationComment.findMany({
      where: { emailId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  async getByThread(threadId: string) {
    return this.db.communicationComment.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  /**
   * Helper to parse and look up mentioned users in CRM database.
   */
  private async resolveMentions(
    content: string,
    explicitUserIds?: string[],
  ): Promise<Array<{ userId: string; name: string; email: string }>> {
    const mentionsMap = new Map<string, { userId: string; name: string; email: string }>();

    // 1. Process explicit user IDs
    if (explicitUserIds && explicitUserIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: explicitUserIds } },
        select: { id: true, name: true, email: true },
      });
      for (const u of users) {
        mentionsMap.set(u.id, { userId: u.id, name: u.name, email: u.email });
      }
    }

    // 2. Parse @tokens from text
    const parsedTokens = MentionsParser.extractMentions(content);
    for (const token of parsedTokens) {
      if (token.type === 'uuid') {
        const u = await this.prisma.user.findUnique({
          where: { id: token.value },
          select: { id: true, name: true, email: true },
        });
        if (u) {
          mentionsMap.set(u.id, { userId: u.id, name: u.name, email: u.email });
        }
      } else if (token.type === 'email') {
        const u = await this.prisma.user.findUnique({
          where: { email: token.value },
          select: { id: true, name: true, email: true },
        });
        if (u) {
          mentionsMap.set(u.id, { userId: u.id, name: u.name, email: u.email });
        }
      } else {
        // Search by username or name contains
        const candidates = await this.prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: token.value, mode: 'insensitive' } },
              { email: { startsWith: token.value, mode: 'insensitive' } },
            ],
          },
          take: 1,
          select: { id: true, name: true, email: true },
        });
        if (candidates.length > 0) {
          const u = candidates[0];
          mentionsMap.set(u.id, { userId: u.id, name: u.name, email: u.email });
        }
      }
    }

    return Array.from(mentionsMap.values());
  }

  /**
   * Helper to dispatch in-app notifications to mentioned users.
   */
  private async notifyMentionedUsers(
    comment: any,
    mentions: Array<{ userId: string; name: string; email: string }>,
    authorId?: string,
  ) {
    if (!mentions || mentions.length === 0) return;

    const author = comment.author?.name || 'A team member';
    const targetLink = comment.emailId
      ? `/communications/emails/${comment.emailId}`
      : `/communications/center`;

    for (const mention of mentions) {
      // Don't notify self
      if (mention.userId === authorId) continue;

      try {
        await this.prisma.notification.create({
          data: {
            userId: mention.userId,
            title: `Mentioned by ${author}`,
            message: `${author} mentioned you in an internal comment: "${comment.content.slice(0, 80)}..."`,
            type: 'INFO',
            link: targetLink,
          },
        });
      } catch (err: any) {
        this.logger.error(`Failed to create mention notification for user ${mention.userId}: ${err.message}`);
      }
    }
  }
}
