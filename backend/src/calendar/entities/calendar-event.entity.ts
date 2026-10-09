import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalendarEventContact {
  @ApiProperty({ example: 'contact-uuid' })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  email?: string;
}

export class CalendarEventUser {
  @ApiProperty({ example: 'user-uuid' })
  id: string;

  @ApiProperty({ example: 'Sarah Rep' })
  name: string;

  @ApiProperty({ example: 'sarah.rep@crm.com' })
  email: string;
}

export class CalendarEventEntity {
  @ApiProperty({ example: 'event-uuid' })
  id: string;

  @ApiProperty({ example: 'Client Demo & Architecture Walkthrough' })
  title: string;

  @ApiPropertyOptional({ example: 'Detailed demonstration of product features' })
  description?: string;

  @ApiProperty({ example: '2026-10-10T14:00:00.000Z' })
  start: Date;

  @ApiPropertyOptional({ example: '2026-10-10T15:00:00.000Z' })
  end?: Date;

  @ApiProperty({ example: false })
  allDay: boolean;

  @ApiProperty({ example: 'ACTIVITY', enum: ['ACTIVITY', 'TASK', 'DEAL'] })
  category: 'ACTIVITY' | 'TASK' | 'DEAL';

  @ApiProperty({ example: 'MEETING' })
  type: string;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: 'HIGH' })
  priority: string;

  @ApiPropertyOptional({ type: () => CalendarEventContact })
  contact?: CalendarEventContact;

  @ApiPropertyOptional()
  lead?: { id: string; title: string; companyName?: string };

  @ApiPropertyOptional()
  deal?: { id: string; title: string; value?: number };

  @ApiPropertyOptional({ type: () => CalendarEventUser })
  assignedTo?: CalendarEventUser;
}

export class CalendarMonthViewResponse {
  @ApiProperty({ example: 2026 })
  year: number;

  @ApiProperty({ example: 10 })
  month: number;

  @ApiProperty({ example: 42 })
  totalEvents: number;

  @ApiProperty({ example: 28 })
  pendingEvents: number;

  @ApiProperty({ example: 12 })
  completedEvents: number;

  @ApiProperty({ example: 2 })
  overdueEvents: number;

  @ApiProperty({ type: () => [CalendarEventEntity] })
  events: CalendarEventEntity[];
}

export class CalendarSummaryResponse {
  @ApiProperty({ example: 5 })
  todayCount: number;

  @ApiProperty({ example: 18 })
  weekCount: number;

  @ApiProperty({ example: 3 })
  overdueCount: number;

  @ApiProperty({ example: 8 })
  upcomingMeetingsCount: number;

  @ApiProperty({ type: () => [CalendarEventEntity] })
  todayEvents: CalendarEventEntity[];
}
