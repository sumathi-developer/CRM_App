import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

describe('CalendarController', () => {
  let controller: CalendarController;
  let service: CalendarService;

  const mockCalendarService = {
    getEvents: vi.fn(),
    getMonthView: vi.fn(),
    getWeekView: vi.fn(),
    getDayView: vi.fn(),
    getSummary: vi.fn(),
    scheduleEvent: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
      ],
    }).compile();

    controller = module.get<CalendarController>(CalendarController);
    service = module.get<CalendarService>(CalendarService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getEvents', () => {
    it('should return events from calendar service', async () => {
      const mockEvents = [
        {
          id: 'act-1',
          title: 'Demo Call',
          start: new Date('2026-10-10T10:00:00Z'),
          category: 'ACTIVITY',
          type: 'MEETING',
          status: 'PENDING',
          priority: 'HIGH',
        },
      ];
      mockCalendarService.getEvents.mockResolvedValue(mockEvents);

      const query = { start: '2026-10-01', end: '2026-10-31' };
      const result = await controller.getEvents(query, 'user-123');

      expect(service.getEvents).toHaveBeenCalledWith(query, 'user-123');
      expect(result).toEqual(mockEvents);
    });
  });

  describe('getMonthView', () => {
    it('should return monthly view and totals', async () => {
      const mockMonthData = {
        year: 2026,
        month: 10,
        totalEvents: 5,
        pendingEvents: 3,
        completedEvents: 2,
        overdueEvents: 1,
        events: [],
      };
      mockCalendarService.getMonthView.mockResolvedValue(mockMonthData);

      const query = { year: 2026, month: 10 };
      const result = await controller.getMonthView(query, 'user-123');

      expect(service.getMonthView).toHaveBeenCalledWith(query, 'user-123');
      expect(result).toEqual(mockMonthData);
    });
  });

  describe('getWeekView', () => {
    it('should return weekly view', async () => {
      const mockWeekData = {
        weekStart: '2026-10-04T00:00:00.000Z',
        weekEnd: '2026-10-10T23:59:59.999Z',
        totalEvents: 2,
        events: [],
      };
      mockCalendarService.getWeekView.mockResolvedValue(mockWeekData);

      const query = { date: '2026-10-09' };
      const result = await controller.getWeekView(query, 'user-123');

      expect(service.getWeekView).toHaveBeenCalledWith(query, 'user-123');
      expect(result).toEqual(mockWeekData);
    });
  });

  describe('getDayView', () => {
    it('should return daily view', async () => {
      const mockDayData = {
        date: '2026-10-09',
        totalEvents: 1,
        events: [],
      };
      mockCalendarService.getDayView.mockResolvedValue(mockDayData);

      const query = { date: '2026-10-09' };
      const result = await controller.getDayView(query, 'user-123');

      expect(service.getDayView).toHaveBeenCalledWith(query, 'user-123');
      expect(result).toEqual(mockDayData);
    });
  });

  describe('getSummary', () => {
    it('should return calendar summary metrics', async () => {
      const mockSummary = {
        todayCount: 2,
        weekCount: 8,
        overdueCount: 1,
        upcomingMeetingsCount: 4,
        todayEvents: [],
      };
      mockCalendarService.getSummary.mockResolvedValue(mockSummary);

      const result = await controller.getSummary('user-123', 'current-user-456');

      expect(service.getSummary).toHaveBeenCalledWith('user-123', 'current-user-456');
      expect(result).toEqual(mockSummary);
    });
  });

  describe('scheduleEvent', () => {
    it('should schedule and return a new calendar event', async () => {
      const dto = {
        type: 'MEETING',
        title: 'Executive Briefing',
        startTime: '2026-10-15T15:00:00.000Z',
        priority: 'HIGH',
      };
      const created = { id: 'act-new', ...dto };
      mockCalendarService.scheduleEvent.mockResolvedValue(created);

      const result = await controller.scheduleEvent(dto, 'user-123');

      expect(service.scheduleEvent).toHaveBeenCalledWith(dto, 'user-123');
      expect(result).toEqual(created);
    });
  });
});
