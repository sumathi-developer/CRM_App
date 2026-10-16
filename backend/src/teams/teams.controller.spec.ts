import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamQueryDto } from './dto/team-query.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamActivitiesQueryDto } from './dto/team-activities-query.dto';
import { TeamPerformanceQueryDto } from './dto/team-performance-query.dto';

describe('TeamsController', () => {
  let controller: TeamsController;
  let service: TeamsService;

  const mockTeamsService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getMembers: vi.fn(),
    getMember: vi.fn(),
    addMember: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
    getTeamActivities: vi.fn(),
    getTeamPerformance: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
    service = module.get<TeamsService>(TeamsService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  // ==========================================
  // 1. ALL TEAMS & TEAM CRUD
  // ==========================================
  describe('Team CRUD', () => {
    it('should create a team with the current user id', async () => {
      const dto: CreateTeamDto = {
        name: 'Enterprise Sales',
        description: 'Closing Fortune 500 accounts',
      };
      const expected = {
        id: 'team-uuid-1',
        name: 'Enterprise Sales',
        slug: 'enterprise-sales',
        ownerId: 'user-uuid-1',
      };
      mockTeamsService.create.mockResolvedValue(expected);

      const result = await controller.create(dto, 'user-uuid-1');

      expect(mockTeamsService.create).toHaveBeenCalledWith(dto, 'user-uuid-1');
      expect(result).toEqual(expected);
    });

    it('should list all teams with query parameters', async () => {
      const query: TeamQueryDto = { page: 1, limit: 10, search: 'sales' };
      const expected = {
        data: [{ id: 'team-1', name: 'Sales Team' }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      mockTeamsService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(mockTeamsService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });

    it('should get team details by ID or slug', async () => {
      const expected = {
        id: 'team-1',
        name: 'Sales Team',
        slug: 'sales-team',
        members: [],
      };
      mockTeamsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('team-1');

      expect(mockTeamsService.findOne).toHaveBeenCalledWith('team-1');
      expect(result).toEqual(expected);
    });

    it('should update team details with role normalization', async () => {
      const dto: UpdateTeamDto = { name: 'Growth Team' };
      const expected = { id: 'team-1', name: 'Growth Team' };
      mockTeamsService.update.mockResolvedValue(expected);

      const result = await controller.update(
        'team-1',
        dto,
        'user-1',
        { name: 'ADMIN' },
      );

      expect(mockTeamsService.update).toHaveBeenCalledWith(
        'team-1',
        dto,
        'user-1',
        'ADMIN',
      );
      expect(result).toEqual(expected);
    });

    it('should delete a team', async () => {
      const expected = { message: 'Team deleted successfully', id: 'team-1' };
      mockTeamsService.remove.mockResolvedValue(expected);

      const result = await controller.remove('team-1', 'user-1', 'ADMIN');

      expect(mockTeamsService.remove).toHaveBeenCalledWith(
        'team-1',
        'user-1',
        'ADMIN',
      );
      expect(result).toEqual(expected);
    });
  });

  // ==========================================
  // 2. TEAM MEMBERS
  // ==========================================
  describe('Team Members', () => {
    it('should list members of a team', async () => {
      const expected = [
        { id: 'member-1', teamId: 'team-1', userId: 'user-1', role: 'LEADER' },
      ];
      mockTeamsService.getMembers.mockResolvedValue(expected);

      const result = await controller.getMembers('team-1');

      expect(mockTeamsService.getMembers).toHaveBeenCalledWith('team-1');
      expect(result).toEqual(expected);
    });

    it('should get a specific member of a team', async () => {
      const expected = {
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        role: 'LEADER',
      };
      mockTeamsService.getMember.mockResolvedValue(expected);

      const result = await controller.getMember('team-1', 'member-1');

      expect(mockTeamsService.getMember).toHaveBeenCalledWith(
        'team-1',
        'member-1',
      );
      expect(result).toEqual(expected);
    });

    it('should add a member to the team', async () => {
      const dto: AddTeamMemberDto = { userId: 'user-2', role: 'MEMBER' };
      const expected = {
        id: 'member-2',
        teamId: 'team-1',
        userId: 'user-2',
        role: 'MEMBER',
      };
      mockTeamsService.addMember.mockResolvedValue(expected);

      const result = await controller.addMember(
        'team-1',
        dto,
        'user-1',
        'ADMIN',
      );

      expect(mockTeamsService.addMember).toHaveBeenCalledWith(
        'team-1',
        dto,
        'user-1',
        'ADMIN',
      );
      expect(result).toEqual(expected);
    });

    it('should update a member role in the team', async () => {
      const dto: UpdateTeamMemberDto = { role: 'LEADER' };
      const expected = {
        id: 'member-2',
        teamId: 'team-1',
        userId: 'user-2',
        role: 'LEADER',
      };
      mockTeamsService.updateMemberRole.mockResolvedValue(expected);

      const result = await controller.updateMemberRole(
        'team-1',
        'member-2',
        dto,
        'user-1',
        'ADMIN',
      );

      expect(mockTeamsService.updateMemberRole).toHaveBeenCalledWith(
        'team-1',
        'member-2',
        dto,
        'user-1',
        'ADMIN',
      );
      expect(result).toEqual(expected);
    });

    it('should remove a member from the team', async () => {
      const expected = {
        message: 'Member removed from team successfully',
        teamId: 'team-1',
        memberId: 'member-2',
      };
      mockTeamsService.removeMember.mockResolvedValue(expected);

      const result = await controller.removeMember(
        'team-1',
        'member-2',
        'user-1',
        'ADMIN',
      );

      expect(mockTeamsService.removeMember).toHaveBeenCalledWith(
        'team-1',
        'member-2',
        'user-1',
        'ADMIN',
      );
      expect(result).toEqual(expected);
    });
  });

  // ==========================================
  // 3. TEAM ACTIVITIES
  // ==========================================
  describe('Team Activities', () => {
    it('should get unified team activities with analytics breakdown', async () => {
      const query: TeamActivitiesQueryDto = { page: 1, limit: 10, type: 'CALL' };
      const expected = {
        teamId: 'team-1',
        teamName: 'Enterprise Sales',
        totalActivities: 5,
        breakdownByType: { CALL: 5 },
        breakdownByStatus: { COMPLETED: 5 },
        data: [],
        meta: { total: 5, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      };
      mockTeamsService.getTeamActivities.mockResolvedValue(expected);

      const result = await controller.getTeamActivities('team-1', query);

      expect(mockTeamsService.getTeamActivities).toHaveBeenCalledWith(
        'team-1',
        query,
      );
      expect(result).toEqual(expected);
    });
  });

  // ==========================================
  // 4. TEAM PERFORMANCE & METRICS
  // ==========================================
  describe('Team Performance', () => {
    it('should return real-time team metrics for leads, deals, revenue, and conversion', async () => {
      const query: TeamPerformanceQueryDto = { startDate: '2026-01-01', endDate: '2026-12-31' };
      const expected = {
        teamId: 'team-1',
        teamName: 'Enterprise Sales',
        targetRevenue: 500000,
        wonRevenue: 350000,
        activePipelineValue: 120000,
        quotaAttainmentPercentage: 70,
        totalLeads: 40,
        convertedLeads: 20,
        leadConversionRate: '50.00%',
        totalDeals: 15,
        wonDealsCount: 10,
        openDealsCount: 3,
        lostDealsCount: 2,
        dealWinRate: '66.67%',
        totalActivities: 50,
        completedActivities: 45,
        pendingActivities: 5,
        topPerformers: [
          {
            userId: 'user-1',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            wonRevenue: 250000,
            wonDealsCount: 7,
            openDealsCount: 2,
            completedActivitiesCount: 30,
          },
        ],
      };
      mockTeamsService.getTeamPerformance.mockResolvedValue(expected);

      const result = await controller.getTeamPerformance('team-1', query);

      expect(mockTeamsService.getTeamPerformance).toHaveBeenCalledWith(
        'team-1',
        query,
      );
      expect(result).toEqual(expected);
    });
  });
});
