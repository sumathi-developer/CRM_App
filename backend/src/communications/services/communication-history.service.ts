import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CommunicationHistoryQueryDto,
  CommunicationChannel,
  CommunicationEntityType,
} from '../dto/communication-history-query.dto';
import { createPaginatedResponse } from '../../common/utils/response.util';

export interface UnifiedTimelineItem {
  id: string;
  type: 'EMAIL' | 'CALL' | 'MEETING' | 'WHATSAPP' | 'NOTE' | 'COMMENT' | 'FOLLOW_UP';
  channel: string;
  direction: 'INBOUND' | 'OUTBOUND' | 'INTERNAL';
  title: string;
  content: string;
  timestamp: Date;
  status?: string;
  author?: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
  entity?: {
    type: string;
    id: string;
    name?: string;
  };
  metadata?: Record<string, any>;
}

@Injectable()
export class CommunicationHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  async getTimeline(query: CommunicationHistoryQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    // Resolve target entity filter
    const contactId = query.contactId || (query.entityType === CommunicationEntityType.CONTACT ? query.entityId : undefined);
    const leadId = query.leadId || (query.entityType === CommunicationEntityType.LEAD ? query.entityId : undefined);
    const dealId = query.dealId || (query.entityType === CommunicationEntityType.DEAL ? query.entityId : undefined);
    const organizationId = query.organizationId || (query.entityType === CommunicationEntityType.ORGANIZATION ? query.entityId : undefined);
    const workspaceId = query.workspaceId;

    const channelFilter = query.channel || CommunicationChannel.ALL;
    const items: UnifiedTimelineItem[] = [];

    // Date filters
    const dateFilter: any = {};
    if (query.startDate) {
      dateFilter.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      dateFilter.lte = new Date(query.endDate);
    }

    // 1. Fetch Emails (if channel includes EMAIL)
    if (channelFilter === CommunicationChannel.ALL || channelFilter === CommunicationChannel.EMAIL) {
      const emailWhere: any = {};
      if (contactId) emailWhere.contactId = contactId;
      if (leadId) emailWhere.leadId = leadId;
      if (dealId) emailWhere.dealId = dealId;
      if (organizationId) emailWhere.organizationId = organizationId;
      if (workspaceId) emailWhere.workspaceId = workspaceId;
      if (query.direction) emailWhere.direction = query.direction;
      if (Object.keys(dateFilter).length > 0) emailWhere.createdAt = dateFilter;
      if (query.search) {
        emailWhere.OR = [
          { subject: { contains: query.search, mode: 'insensitive' } },
          { snippet: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      const emails = await this.db.emailMessage.findMany({
        where: emailWhere,
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          senderUser: { select: { id: true, name: true, email: true, avatar: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          lead: { select: { id: true, title: true } },
          deal: { select: { id: true, title: true } },
          organization: { select: { id: true, name: true } },
        },
      });

      for (const e of emails) {
        items.push({
          id: e.id,
          type: 'EMAIL',
          channel: 'EMAIL',
          direction: e.direction === 'INBOUND' ? 'INBOUND' : 'OUTBOUND',
          title: e.subject,
          content: e.snippet || e.bodyText || '',
          timestamp: e.sentAt || e.receivedAt || e.createdAt,
          status: e.status,
          author: e.senderUser
            ? { id: e.senderUser.id, name: e.senderUser.name, email: e.senderUser.email, avatar: e.senderUser.avatar }
            : { name: e.senderName || e.sender, email: e.sender },
          entity: this.resolveEntityRef(e),
          metadata: {
            messageId: e.messageId,
            threadId: e.threadId,
            isRead: e.isRead,
            openCount: e.openCount,
            folder: e.folder,
            provider: e.provider,
          },
        });
      }
    }

    // 2. Fetch CRM Activities (Calls, Meetings, WhatsApp, Follow-ups)
    const activityTypes = ['CALL', 'MEETING', 'WHATSAPP', 'FOLLOW_UP'];
    const shouldFetchActivities =
      channelFilter === CommunicationChannel.ALL ||
      activityTypes.includes(channelFilter);

    if (shouldFetchActivities) {
      const actWhere: any = {};
      if (contactId) actWhere.contactId = contactId;
      if (leadId) actWhere.leadId = leadId;
      if (dealId) actWhere.dealId = dealId;
      if (channelFilter !== CommunicationChannel.ALL) {
        actWhere.type = channelFilter;
      }
      if (Object.keys(dateFilter).length > 0) actWhere.createdAt = dateFilter;
      if (query.search) {
        actWhere.OR = [
          { subject: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      const activities = await this.prisma.activity.findMany({
        where: actWhere,
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          lead: { select: { id: true, title: true } },
          deal: { select: { id: true, title: true } },
        },
      });

      for (const a of activities) {
        items.push({
          id: a.id,
          type: (a.type as any) || 'CALL',
          channel: a.type,
          direction: 'OUTBOUND',
          title: a.subject,
          content: a.description || '',
          timestamp: a.completedAt || a.scheduledAt || a.createdAt,
          status: a.status,
          author: a.assignedTo
            ? { id: a.assignedTo.id, name: a.assignedTo.name, email: a.assignedTo.email, avatar: a.assignedTo.avatar }
            : undefined,
          entity: this.resolveEntityRef(a),
          metadata: {
            priority: a.priority,
            scheduledAt: a.scheduledAt,
            completedAt: a.completedAt,
          },
        });
      }
    }

    // 3. Fetch Internal Comments (if channel includes COMMENT)
    if (channelFilter === CommunicationChannel.ALL || channelFilter === CommunicationChannel.COMMENT) {
      const commentWhere: any = {};
      if (contactId) commentWhere.contactId = contactId;
      if (leadId) commentWhere.leadId = leadId;
      if (dealId) commentWhere.dealId = dealId;
      if (workspaceId) commentWhere.workspaceId = workspaceId;
      if (Object.keys(dateFilter).length > 0) commentWhere.createdAt = dateFilter;
      if (query.search) {
        commentWhere.content = { contains: query.search, mode: 'insensitive' };
      }

      const comments = await this.db.communicationComment.findMany({
        where: commentWhere,
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true } },
          email: { select: { id: true, subject: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          lead: { select: { id: true, title: true } },
          deal: { select: { id: true, title: true } },
        },
      });

      for (const c of comments) {
        items.push({
          id: c.id,
          type: 'COMMENT',
          channel: 'COMMENT',
          direction: 'INTERNAL',
          title: c.email ? `Comment on: ${c.email.subject}` : 'Internal Team Comment',
          content: c.content,
          timestamp: c.createdAt,
          author: c.author
            ? { id: c.author.id, name: c.author.name, email: c.author.email, avatar: c.author.avatar }
            : undefined,
          entity: this.resolveEntityRef(c),
          metadata: {
            isInternal: true,
            mentions: c.mentions,
            emailId: c.emailId,
            threadId: c.threadId,
          },
        });
      }
    }

    // 4. Fetch Notes (if channel includes NOTE)
    if (channelFilter === CommunicationChannel.ALL || channelFilter === CommunicationChannel.NOTE) {
      const noteWhere: any = {};
      if (contactId) noteWhere.contactId = contactId;
      if (leadId) noteWhere.leadId = leadId;
      if (dealId) noteWhere.dealId = dealId;
      if (Object.keys(dateFilter).length > 0) noteWhere.createdAt = dateFilter;
      if (query.search) {
        noteWhere.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { content: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      const notes = await this.prisma.note.findMany({
        where: noteWhere,
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          lead: { select: { id: true, title: true } },
          deal: { select: { id: true, title: true } },
        },
      });

      for (const n of notes) {
        items.push({
          id: n.id,
          type: 'NOTE',
          channel: 'NOTE',
          direction: 'INTERNAL',
          title: n.title || 'CRM Note',
          content: n.content,
          timestamp: n.createdAt,
          author: n.author
            ? { id: n.author.id, name: n.author.name, email: n.author.email, avatar: n.author.avatar }
            : undefined,
          entity: this.resolveEntityRef(n),
        });
      }
    }

    // Sort all aggregated timeline items chronologically descending
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const total = items.length;
    const skip = (page - 1) * limit;
    const paginatedItems = items.slice(skip, skip + limit);

    // Calculate channel breakdown stats
    const breakdown = {
      emails: items.filter((i) => i.type === 'EMAIL').length,
      calls: items.filter((i) => i.type === 'CALL').length,
      meetings: items.filter((i) => i.type === 'MEETING').length,
      whatsapp: items.filter((i) => i.type === 'WHATSAPP').length,
      notes: items.filter((i) => i.type === 'NOTE').length,
      comments: items.filter((i) => i.type === 'COMMENT').length,
    };

    const response = createPaginatedResponse(paginatedItems, total, page, limit);

    return {
      ...response,
      summary: {
        totalCommunications: total,
        channelBreakdown: breakdown,
      },
    };
  }

  private resolveEntityRef(record: any): { type: string; id: string; name?: string } | undefined {
    if (record.contact) {
      return {
        type: 'CONTACT',
        id: record.contact.id,
        name: `${record.contact.firstName || ''} ${record.contact.lastName || ''}`.trim(),
      };
    }
    if (record.lead) {
      return {
        type: 'LEAD',
        id: record.lead.id,
        name: record.lead.title,
      };
    }
    if (record.deal) {
      return {
        type: 'DEAL',
        id: record.deal.id,
        name: record.deal.title,
      };
    }
    if (record.organization) {
      return {
        type: 'ORGANIZATION',
        id: record.organization.id,
        name: record.organization.name,
      };
    }
    return undefined;
  }
}
