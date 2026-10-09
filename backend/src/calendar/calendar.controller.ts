import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { CalendarQueryDto, MonthViewQueryDto, DayViewQueryDto } from './dto/calendar-query.dto';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Calendar')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  @ApiOperation({ summary: 'Get unified calendar events within a date range (activities, tasks, deals)' })
  @ApiResponse({ status: 200, description: 'Chronologically sorted calendar events' })
  async getEvents(
    @Query() query: CalendarQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.calendarService.getEvents(query, userId);
  }

  @Get('month')
  @ApiOperation({ summary: 'Get complete month view and event statistics' })
  @ApiResponse({ status: 200, description: 'Monthly calendar events and summary counts' })
  async getMonthView(
    @Query() query: MonthViewQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.calendarService.getMonthView(query, userId);
  }

  @Get('week')
  @ApiOperation({ summary: 'Get 7-day week view for the specified date' })
  @ApiResponse({ status: 200, description: 'Weekly calendar schedule' })
  async getWeekView(
    @Query() query: DayViewQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.calendarService.getWeekView(query, userId);
  }

  @Get('day')
  @ApiOperation({ summary: 'Get daily schedule and timeline for a specific date' })
  @ApiResponse({ status: 200, description: 'Daily agenda' })
  async getDayView(
    @Query() query: DayViewQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.calendarService.getDayView(query, userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get high-level calendar KPI summary (today, week, overdue, meetings)' })
  @ApiResponse({ status: 200, description: 'Calendar KPI summary' })
  async getSummary(
    @Query('userId') targetUserId?: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.calendarService.getSummary(targetUserId, currentUserId);
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule a new calendar activity or task' })
  @ApiResponse({ status: 201, description: 'Scheduled event created successfully' })
  async scheduleEvent(
    @Body() dto: CreateCalendarEventDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.calendarService.scheduleEvent(dto, userId);
  }
}
