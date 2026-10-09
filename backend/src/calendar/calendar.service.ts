import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CalendarQueryDto, MonthViewQueryDto, DayViewQueryDto } from './dto/calendar-query.dto';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { CalendarEventEntity } from './entities/calendar-event.entity';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves unified calendar events (Activities, Tasks, and Deal Close Dates) based on filters.
   */
  async getEvents(query: CalendarQueryDto, currentUserId?: string): Promise<CalendarEventEntity[]> {
    const targetUserId = query.userId || currentUserId;

    // Determine date range filters
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (query.start) {
      startDate = new Date(query.start);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid start date format');
      }
    }

    if (query.end) {
      endDate = new Date(query.end);
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid end date format');
      }
    }

    // 1. Build Activity filter
    const activityWhere: any = {};
    if (startDate || endDate) {
      activityWhere.scheduledAt = {};
      if (startDate) activityWhere.scheduledAt.gte = startDate;
      if (endDate) activityWhere.scheduledAt.lte = endDate;
    }
    if (query.type && ['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'FOLLOW_UP'].includes(query.type)) {
      activityWhere.type = query.type;
    }
    if (query.status) {
      activityWhere.status = query.status;
    }
    if (targetUserId) {
      activityWhere.assignedToId = targetUserId;
    }
    if (query.contactId) {
      activityWhere.contactId = query.contactId;
    }
    if (query.leadId) {
      activityWhere.leadId = query.leadId;
    }
    if (query.dealId) {
      activityWhere.dealId = query.dealId;
    }

    // 2. Build Task filter
    const taskWhere: any = {};
    if (startDate || endDate) {
      taskWhere.dueDate = {};
      if (startDate) taskWhere.dueDate.gte = startDate;
      if (endDate) taskWhere.dueDate.lte = endDate;
    }
    if (query.status) {
      taskWhere.status = query.status;
    }
    if (targetUserId) {
      taskWhere.assignedToId = targetUserId;
    }
    if (query.contactId) {
      taskWhere.contactId = query.contactId;
    }
    if (query.leadId) {
      taskWhere.leadId = query.leadId;
    }
    if (query.dealId) {
      taskWhere.dealId = query.dealId;
    }

    // 3. Build Deal filter (expected close date)
    const dealWhere: any = {};
    if (startDate || endDate) {
      dealWhere.expectedCloseDate = {};
      if (startDate) dealWhere.expectedCloseDate.gte = startDate;
      if (endDate) dealWhere.expectedCloseDate.lte = endDate;
    }
    if (targetUserId) {
      dealWhere.ownerId = targetUserId;
    }

    const shouldIncludeActivities = !query.type || ['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'FOLLOW_UP'].includes(query.type);
    const shouldIncludeTasks = !query.type || query.type === 'TASK';
    const shouldIncludeDeals = !query.type || query.type === 'DEAL_CLOSING';

    const [activities, tasks, deals] = await Promise.all([
      shouldIncludeActivities
        ? this.prisma.activity.findMany({
            where: activityWhere,
            include: {
              contact: { select: { id: true, firstName: true, lastName: true, email: true } },
              lead: { select: { id: true, title: true, companyName: true } },
              deal: { select: { id: true, title: true, value: true } },
              assignedTo: { select: { id: true, name: true, email: true } },
            },
            orderBy: { scheduledAt: 'asc' },
          })
        : [],
      shouldIncludeTasks
        ? this.prisma.task.findMany({
            where: taskWhere,
            include: {
              contact: { select: { id: true, firstName: true, lastName: true, email: true } },
              lead: { select: { id: true, title: true, companyName: true } },
              deal: { select: { id: true, title: true, value: true } },
              assignedTo: { select: { id: true, name: true, email: true } },
            },
            orderBy: { dueDate: 'asc' },
          })
        : [],
      shouldIncludeDeals
        ? this.prisma.deal.findMany({
            where: dealWhere,
            include: {
              contact: { select: { id: true, firstName: true, lastName: true, email: true } },
              owner: { select: { id: true, name: true, email: true } },
            },
            orderBy: { expectedCloseDate: 'asc' },
          })
        : [],
    ]);

    const events: CalendarEventEntity[] = [];

    // Map activities
    for (const act of activities) {
      if (!act.scheduledAt) continue;
      events.push({
        id: act.id,
        title: act.subject,
        description: act.description || undefined,
        start: act.scheduledAt,
        end: act.completedAt || undefined,
        allDay: false,
        category: 'ACTIVITY',
        type: act.type,
        status: act.status,
        priority: act.priority,
        contact: act.contact ? { id: act.contact.id, firstName: act.contact.firstName, lastName: act.contact.lastName, email: act.contact.email } : undefined,
        lead: act.lead ? { id: act.lead.id, title: act.lead.title, companyName: act.lead.companyName || undefined } : undefined,
        deal: act.deal ? { id: act.deal.id, title: act.deal.title, value: act.deal.value } : undefined,
        assignedTo: act.assignedTo ? { id: act.assignedTo.id, name: act.assignedTo.name, email: act.assignedTo.email } : undefined,
      });
    }

    // Map tasks
    for (const task of tasks) {
      if (!task.dueDate) continue;
      events.push({
        id: task.id,
        title: task.title,
        description: task.description || undefined,
        start: task.dueDate,
        end: task.completedAt || undefined,
        allDay: true,
        category: 'TASK',
        type: 'TASK',
        status: task.status,
        priority: task.priority,
        contact: task.contact ? { id: task.contact.id, firstName: task.contact.firstName, lastName: task.contact.lastName, email: task.contact.email } : undefined,
        lead: task.lead ? { id: task.lead.id, title: task.lead.title, companyName: task.lead.companyName || undefined } : undefined,
        deal: task.deal ? { id: task.deal.id, title: task.deal.title, value: task.deal.value } : undefined,
        assignedTo: task.assignedTo ? { id: task.assignedTo.id, name: task.assignedTo.name, email: task.assignedTo.email } : undefined,
      });
    }

    // Map deals expected close dates
    for (const deal of deals) {
      if (!deal.expectedCloseDate) continue;
      events.push({
        id: deal.id,
        title: `Deal Closing: ${deal.title} ($${deal.value?.toLocaleString() || 0})`,
        start: deal.expectedCloseDate,
        end: deal.closedAt || undefined,
        allDay: true,
        category: 'DEAL',
        type: 'DEAL_CLOSING',
        status: deal.status,
        priority: deal.status === 'OPEN' ? 'HIGH' : 'MEDIUM',
        contact: deal.contact ? { id: deal.contact.id, firstName: deal.contact.firstName, lastName: deal.contact.lastName, email: deal.contact.email } : undefined,
        deal: { id: deal.id, title: deal.title, value: deal.value },
        assignedTo: deal.owner ? { id: deal.owner.id, name: deal.owner.name, email: deal.owner.email } : undefined,
      });
    }

    // Sort all events by ascending start time
    return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  /**
   * Returns a complete month view of calendar events and overview counts.
   */
  async getMonthView(query: MonthViewQueryDto, currentUserId?: string) {
    const now = new Date();
    const year = Number(query.year) || now.getFullYear();
    const month = Number(query.month) || now.getMonth() + 1; // 1-12

    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const events = await this.getEvents(
      {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString(),
        userId: query.userId,
      },
      currentUserId,
    );

    const nowTime = now.getTime();
    let pendingEvents = 0;
    let completedEvents = 0;
    let overdueEvents = 0;

    for (const ev of events) {
      if (ev.status === 'COMPLETED') {
        completedEvents++;
      } else if (ev.status === 'PENDING') {
        pendingEvents++;
        if (new Date(ev.start).getTime() < nowTime) {
          overdueEvents++;
        }
      }
    }

    return {
      year,
      month,
      totalEvents: events.length,
      pendingEvents,
      completedEvents,
      overdueEvents,
      events,
    };
  }

  /**
   * Returns a 7-day week view for the specified date (defaults to current week).
   */
  async getWeekView(query: DayViewQueryDto, currentUserId?: string) {
    const baseDate = query.date ? new Date(query.date) : new Date();
    if (isNaN(baseDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    // Start on Sunday of current week
    const dayOfWeek = baseDate.getDay();
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    // End on Saturday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const events = await this.getEvents(
      {
        start: startOfWeek.toISOString(),
        end: endOfWeek.toISOString(),
        userId: query.userId,
      },
      currentUserId,
    );

    return {
      weekStart: startOfWeek.toISOString(),
      weekEnd: endOfWeek.toISOString(),
      totalEvents: events.length,
      events,
    };
  }

  /**
   * Returns day timeline for the specified date.
   */
  async getDayView(query: DayViewQueryDto, currentUserId?: string) {
    const baseDate = query.date ? new Date(query.date) : new Date();
    if (isNaN(baseDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const startOfDay = new Date(baseDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(baseDate);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await this.getEvents(
      {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString(),
        userId: query.userId,
      },
      currentUserId,
    );

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalEvents: events.length,
      events,
    };
  }

  /**
   * Returns a high-level summary of upcoming calendar metrics.
   */
  async getSummary(userId?: string, currentUserId?: string) {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const [todayEvents, weekEvents, upcomingMeetings] = await Promise.all([
      this.getEvents({ start: startOfToday.toISOString(), end: endOfToday.toISOString(), userId }, currentUserId),
      this.getEvents({ start: startOfWeek.toISOString(), end: endOfWeek.toISOString(), userId }, currentUserId),
      this.getEvents({ start: now.toISOString(), type: 'MEETING', userId }, currentUserId),
    ]);

    const overdueCount = weekEvents.filter(
      (e) => e.status === 'PENDING' && new Date(e.start).getTime() < now.getTime(),
    ).length;

    return {
      todayCount: todayEvents.length,
      weekCount: weekEvents.length,
      overdueCount,
      upcomingMeetingsCount: upcomingMeetings.length,
      todayEvents,
    };
  }

  /**
   * Schedule a new activity or task via the Calendar API.
   */
  async scheduleEvent(dto: CreateCalendarEventDto, currentUserId?: string) {
    const scheduledDate = new Date(dto.startTime);
    if (isNaN(scheduledDate.getTime())) {
      throw new BadRequestException('Invalid start date/time');
    }

    if (dto.type === 'TASK') {
      return this.prisma.task.create({
        data: {
          title: dto.title,
          description: dto.description,
          dueDate: scheduledDate,
          priority: dto.priority || 'MEDIUM',
          status: 'PENDING',
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

    // Default: creates CRM Activity
    return this.prisma.activity.create({
      data: {
        type: dto.type,
        subject: dto.title,
        description: dto.description,
        scheduledAt: scheduledDate,
        priority: dto.priority || 'MEDIUM',
        status: 'PENDING',
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
}
