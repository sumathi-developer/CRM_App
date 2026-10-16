import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { LeadScoringService } from './lead-scoring.service';
import { PrismaService } from '../../database/prisma.service';
import { ScoringCategory, RuleOperator } from '../dto/create-scoring-rule.dto';

describe('LeadScoringService', () => {
  let service: LeadScoringService;

  const mockPrisma = {
    leadScoringRule: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    lead: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadScoringService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<LeadScoringService>(LeadScoringService);
  });

  it('should evaluate EQUALS and NOT_EQUALS conditions correctly', () => {
    expect(service.evaluateCondition('WEBSITE', RuleOperator.EQUALS, 'website')).toBe(true);
    expect(service.evaluateCondition('SOCIAL', RuleOperator.EQUALS, 'website')).toBe(false);
    expect(service.evaluateCondition('REFERRAL', RuleOperator.NOT_EQUALS, 'website')).toBe(true);
  });

  it('should evaluate CONTAINS and NOT_CONTAINS conditions with multiple keywords', () => {
    expect(service.evaluateCondition('VP of Product Engineering', RuleOperator.CONTAINS, 'CEO,VP,Director')).toBe(true);
    expect(service.evaluateCondition('Junior Intern', RuleOperator.CONTAINS, 'CEO,VP,Director')).toBe(false);
    expect(service.evaluateCondition('alex@mycompany.com', RuleOperator.NOT_CONTAINS, 'gmail.com,yahoo.com')).toBe(true);
    expect(service.evaluateCondition('alex@gmail.com', RuleOperator.NOT_CONTAINS, 'gmail.com,yahoo.com')).toBe(false);
  });

  it('should evaluate GREATER_THAN and LESS_THAN numerical conditions', () => {
    expect(service.evaluateCondition(15000, RuleOperator.GREATER_THAN, '10000')).toBe(true);
    expect(service.evaluateCondition(5000, RuleOperator.GREATER_THAN, '10000')).toBe(false);
    expect(service.evaluateCondition(500, RuleOperator.LESS_THAN, '1000')).toBe(true);
  });

  it('should evaluate NOT_EMPTY operator correctly', () => {
    expect(service.evaluateCondition('+1 555-0199', RuleOperator.NOT_EMPTY, '')).toBe(true);
    expect(service.evaluateCondition('', RuleOperator.NOT_EMPTY, '')).toBe(false);
    expect(service.evaluateCondition(null, RuleOperator.NOT_EMPTY, '')).toBe(false);
    expect(service.evaluateCondition(undefined, RuleOperator.NOT_EMPTY, '')).toBe(false);
  });

  it('should calculate total score and breakdown from active rules', async () => {
    mockPrisma.leadScoringRule.findMany.mockResolvedValue([
      {
        id: 'r1',
        name: 'Work Email',
        category: ScoringCategory.DEMOGRAPHIC,
        conditionField: 'email',
        operator: RuleOperator.NOT_CONTAINS,
        conditionValue: 'gmail.com,yahoo.com',
        scoreChange: 15,
        priority: 10,
        isActive: true,
      },
      {
        id: 'r2',
        name: 'Executive Title',
        category: ScoringCategory.DEMOGRAPHIC,
        conditionField: 'jobTitle',
        operator: RuleOperator.CONTAINS,
        conditionValue: 'VP,CEO',
        scoreChange: 25,
        priority: 20,
        isActive: true,
      },
    ]);

    const leadPayload = {
      email: 'alex@enterprise.com',
      jobTitle: 'VP of Sales',
    };

    const result = await service.calculateScore(leadPayload);
    expect(result.totalScore).toBe(40);
    expect(result.breakdown.length).toBe(2);
    expect(result.breakdown[0].matched).toBe(true);
    expect(result.breakdown[1].matched).toBe(true);
  });

  it('should calculate and persist score on lead in Module 06', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-100',
      title: 'VP of Operations',
      email: 'vp@acme.com',
      source: 'WEBSITE',
      leadScore: 0,
    });

    mockPrisma.leadScoringRule.findMany.mockResolvedValue([
      {
        id: 'r1',
        name: 'Executive Title',
        category: ScoringCategory.DEMOGRAPHIC,
        conditionField: 'jobTitle',
        operator: RuleOperator.CONTAINS,
        conditionValue: 'VP',
        scoreChange: 25,
        priority: 10,
        isActive: true,
      },
    ]);

    mockPrisma.lead.update.mockResolvedValue({
      id: 'lead-100',
      leadScore: 25,
    });

    const res = await service.calculateAndApply('lead-100');
    expect(res.scoreResult.totalScore).toBe(25);
    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-100' },
      data: expect.objectContaining({ leadScore: 25 }),
    });
  });
});
