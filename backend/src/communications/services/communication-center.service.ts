import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CommunicationCenterService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  async getCenterStats(workspaceId?: string) {
    const baseWhere: any = {};
    if (workspaceId) {
      baseWhere.workspaceId = workspaceId;
    }

    const [
      totalEmails,
      inboxCount,
      inboxUnreadCount,
      sentCount,
      draftsCount,
      starredCount,
      trashCount,
      commentsCount,
      templatesCount,
      integrationsCount,
      statusCounts,
      recentEmails,
      recentComments,
    ] = await Promise.all([
      this.db.emailMessage.count({ where: baseWhere }),
      this.db.emailMessage.count({ where: { ...baseWhere, folder: 'INBOX' } }),
      this.db.emailMessage.count({ where: { ...baseWhere, folder: 'INBOX', isRead: false } }),
      this.db.emailMessage.count({ where: { ...baseWhere, folder: 'SENT' } }),
      this.db.emailMessage.count({ where: { ...baseWhere, folder: 'DRAFTS' } }),
      this.db.emailMessage.count({ where: { ...baseWhere, isStarred: true } }),
      this.db.emailMessage.count({ where: { ...baseWhere, folder: 'TRASH' } }),
      this.db.communicationComment.count({ where: baseWhere }),
      this.db.emailTemplate.count({ where: baseWhere }),
      this.db.emailIntegration.count({ where: { ...baseWhere, isActive: true } }),
      this.db.emailMessage.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { status: true },
      }),
      this.db.emailMessage.findMany({
        where: baseWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          senderUser: { select: { id: true, name: true, email: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          lead: { select: { id: true, title: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
      this.db.communicationComment.findMany({
        where: baseWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, email: true } },
          email: { select: { id: true, subject: true } },
        },
      }),
    ]);

    // Build status breakdown map
    const statusBreakdown: Record<string, number> = {
      DRAFT: 0,
      QUEUED: 0,
      SENT: 0,
      DELIVERED: 0,
      OPENED: 0,
      CLICKED: 0,
      BOUNCED: 0,
      FAILED: 0,
      RECEIVED: 0,
    };

    for (const item of statusCounts) {
      statusBreakdown[item.status] = item._count.status;
    }

    // Engagement rates
    const deliveredOrSent =
      (statusBreakdown.DELIVERED || 0) +
      (statusBreakdown.OPENED || 0) +
      (statusBreakdown.CLICKED || 0);

    const totalOutbound = sentCount > 0 ? sentCount : 1;
    const deliveryRate = sentCount > 0 ? Math.round((deliveredOrSent / totalOutbound) * 100) : 100;
    const openRate =
      deliveredOrSent > 0
        ? Math.round(((statusBreakdown.OPENED || 0) + (statusBreakdown.CLICKED || 0)) / deliveredOrSent * 100)
        : 0;

    return {
      overview: {
        totalEmails,
        inboxTotal: inboxCount,
        inboxUnread: inboxUnreadCount,
        sentTotal: sentCount,
        draftsTotal: draftsCount,
        starredTotal: starredCount,
        trashTotal: trashCount,
        commentsTotal: commentsCount,
        templatesTotal: templatesCount,
        activeIntegrationsTotal: integrationsCount,
      },
      performance: {
        deliveryRatePercentage: deliveryRate,
        openRatePercentage: openRate,
        statusBreakdown,
      },
      recentActivity: {
        emails: recentEmails,
        comments: recentComments,
      },
    };
  }

  async getStream(workspaceId?: string) {
    const baseWhere: any = {};
    if (workspaceId) {
      baseWhere.workspaceId = workspaceId;
    }

    const emails = await this.db.emailMessage.findMany({
      where: baseWhere,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        senderUser: { select: { id: true, name: true, email: true, avatar: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, title: true } },
        deal: { select: { id: true, title: true } },
        _count: { select: { comments: true } },
      },
    });

    return emails.map((e: any) => ({
      id: e.id,
      type: 'EMAIL',
      subject: e.subject,
      snippet: e.snippet,
      folder: e.folder,
      direction: e.direction,
      status: e.status,
      isRead: e.isRead,
      isStarred: e.isStarred,
      createdAt: e.createdAt,
      sender: e.senderUser || { name: e.senderName || e.sender, email: e.sender },
      relatedEntity: e.contact || e.lead || e.deal || null,
      commentsCount: e._count.comments,
    }));
  }
}
