import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateScoringRuleDto, ScoringCategory, RuleOperator } from '../dto/create-scoring-rule.dto';
import { UpdateScoringRuleDto } from '../dto/update-scoring-rule.dto';
import { createPaginatedResponse } from '../../common/utils/response.util';
import * as crypto from 'crypto';

export interface ScoreEvaluationItem {
  ruleId?: string;
  ruleName: string;
  category: string;
  conditionField: string;
  operator?: string;
  scoreChange: number;
  matched: boolean;
  reason: string;
}

export interface ScoreCalculationResult {
  totalScore: number;
  breakdown: ScoreEvaluationItem[];
}

@Injectable()
export class LeadScoringService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  async onModuleInit() {
    await this.seedDefaultRulesIfEmpty();
  }

  async seedDefaultRulesIfEmpty() {
    try {
      const count = await this.db.leadScoringRule.count();
      if (count === 0) {
        const defaults = [
          {
            name: 'Corporate Work Email Domain',
            description: 'Lead used a corporate domain instead of common public free webmail',
            category: ScoringCategory.DEMOGRAPHIC,
            conditionField: 'email',
            operator: RuleOperator.NOT_CONTAINS,
            conditionValue: 'gmail.com,yahoo.com,hotmail.com,outlook.com,aol.com,icloud.com',
            scoreChange: 15,
            priority: 10,
          },
          {
            name: 'Executive & Decision Maker Job Title',
            description: 'Title contains senior executive designations (CEO, VP, Director, etc.)',
            category: ScoringCategory.DEMOGRAPHIC,
            conditionField: 'jobTitle',
            operator: RuleOperator.CONTAINS,
            conditionValue: 'CEO,CTO,CFO,COO,CIO,VP,Vice President,Director,Head,Founder,President',
            scoreChange: 25,
            priority: 20,
          },
          {
            name: 'Enterprise Budget (Value >= $10,000)',
            description: 'Estimated opportunity value indicates high enterprise deal size',
            category: ScoringCategory.FIRMOGRAPHIC,
            conditionField: 'estimatedValue',
            operator: RuleOperator.GREATER_THAN,
            conditionValue: '10000',
            scoreChange: 30,
            priority: 30,
          },
          {
            name: 'Mid-Market Budget (Value >= $2,500)',
            description: 'Estimated opportunity value indicates solid mid-market size',
            category: ScoringCategory.FIRMOGRAPHIC,
            conditionField: 'estimatedValue',
            operator: RuleOperator.GREATER_THAN,
            conditionValue: '2500',
            scoreChange: 15,
            priority: 25,
          },
          {
            name: 'Direct Phone Number Provided',
            description: 'Lead provided direct contact phone number',
            category: ScoringCategory.BEHAVIORAL,
            conditionField: 'phone',
            operator: RuleOperator.NOT_EMPTY,
            conditionValue: '',
            scoreChange: 10,
            priority: 5,
          },
          {
            name: 'Company / Organization Identified',
            description: 'Lead provided valid company or organization name',
            category: ScoringCategory.FIRMOGRAPHIC,
            conditionField: 'companyName',
            operator: RuleOperator.NOT_EMPTY,
            conditionValue: '',
            scoreChange: 10,
            priority: 5,
          },
          {
            name: 'High-Intent Landing Page / Demo Request',
            description: 'Inbound channel is demo request or landing page form',
            category: ScoringCategory.SOURCE,
            conditionField: 'channel',
            operator: RuleOperator.IN,
            conditionValue: 'LANDING_PAGE,WEBSITE',
            scoreChange: 15,
            priority: 15,
          },
          {
            name: 'Partner / Customer Referral Source',
            description: 'High close-rate referral source',
            category: ScoringCategory.SOURCE,
            conditionField: 'channel',
            operator: RuleOperator.EQUALS,
            conditionValue: 'REFERRAL',
            scoreChange: 25,
            priority: 15,
          },
        ];

        for (const item of defaults) {
          await this.db.leadScoringRule.create({
            data: {
              id: crypto.randomUUID(),
              name: item.name,
              description: item.description,
              category: item.category,
              conditionField: item.conditionField,
              operator: item.operator,
              conditionValue: item.conditionValue,
              scoreChange: item.scoreChange,
              priority: item.priority,
              isActive: true,
            },
          });
        }
      }
    } catch {
      // Ignore if table still initializing
    }
  }

  // ==========================================
  // SCORING RULES CRUD
  // ==========================================

  async create(dto: CreateScoringRuleDto) {
    return this.db.leadScoringRule.create({
      data: {
        id: crypto.randomUUID(),
        name: dto.name,
        description: dto.description,
        category: dto.category,
        conditionField: dto.conditionField,
        operator: dto.operator,
        conditionValue: dto.conditionValue,
        scoreChange: dto.scoreChange,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        priority: dto.priority || 0,
        workspaceId: dto.workspaceId,
      },
    });
  }

  async findAll(query: { page?: number; limit?: number; category?: string; isActive?: boolean; workspaceId?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.category) {
      where.category = query.category;
    }
    if (query.isActive !== undefined) {
      where.isActive = String(query.isActive) === 'true';
    }
    if (query.workspaceId) {
      where.workspaceId = query.workspaceId;
    }

    const [total, rules] = await Promise.all([
      this.db.leadScoringRule.count({ where }),
      this.db.leadScoringRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return createPaginatedResponse(rules, total, page, limit);
  }

  async findOne(id: string) {
    const rule = await this.db.leadScoringRule.findUnique({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Lead scoring rule with ID '${id}' not found`);
    }
    return rule;
  }

  async update(id: string, dto: UpdateScoringRuleDto) {
    await this.findOne(id);
    return this.db.leadScoringRule.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.db.leadScoringRule.delete({ where: { id } });
    return { message: `Lead scoring rule with ID '${id}' successfully deleted` };
  }

  // ==========================================
  // SCORE CALCULATION ENGINE
  // ==========================================

  /**
   * Evaluate a single condition against lead value.
   */
  evaluateCondition(actualValue: any, operator: string, expectedValue: string): boolean {
    if (operator === RuleOperator.NOT_EMPTY) {
      return actualValue !== undefined && actualValue !== null && String(actualValue).trim().length > 0;
    }

    if (actualValue === undefined || actualValue === null) {
      return false;
    }

    const strActual = String(actualValue).trim().toLowerCase();
    const strExpected = expectedValue.trim().toLowerCase();

    switch (operator) {
      case RuleOperator.EQUALS:
        return strActual === strExpected;

      case RuleOperator.NOT_EQUALS:
        return strActual !== strExpected;

      case RuleOperator.CONTAINS: {
        const parts = strExpected.split(',').map((p) => p.trim());
        return parts.some((p) => strActual.includes(p));
      }

      case RuleOperator.NOT_CONTAINS: {
        const parts = strExpected.split(',').map((p) => p.trim());
        return !parts.some((p) => strActual.includes(p));
      }

      case RuleOperator.GREATER_THAN: {
        const numActual = Number(actualValue);
        const numExpected = Number(expectedValue);
        return !isNaN(numActual) && !isNaN(numExpected) && numActual >= numExpected;
      }

      case RuleOperator.LESS_THAN: {
        const numActual = Number(actualValue);
        const numExpected = Number(expectedValue);
        return !isNaN(numActual) && !isNaN(numExpected) && numActual <= numExpected;
      }

      case RuleOperator.IN: {
        const list = strExpected.split(',').map((item) => item.trim());
        return list.includes(strActual);
      }

      case RuleOperator.REGEX: {
        try {
          const regex = new RegExp(expectedValue, 'i');
          return regex.test(String(actualValue));
        } catch {
          return false;
        }
      }

      default:
        return false;
    }
  }

  /**
   * Calculate score for any lead data dictionary based on active scoring rules.
   */
  async calculateScore(leadData: Record<string, any>, workspaceId?: string): Promise<ScoreCalculationResult> {
    const rules = await this.db.leadScoringRule.findMany({
      where: {
        isActive: true,
        ...(workspaceId ? { workspaceId } : {}),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    let totalScore = 0;
    const breakdown: ScoreEvaluationItem[] = [];

    for (const rule of rules) {
      const actualVal = leadData[rule.conditionField];
      const matched = this.evaluateCondition(actualVal, rule.operator, rule.conditionValue);

      if (matched) {
        totalScore += rule.scoreChange;
        breakdown.push({
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          conditionField: rule.conditionField,
          operator: rule.operator,
          scoreChange: rule.scoreChange,
          matched: true,
          reason: `Matched: ${rule.conditionField} satisfies ${rule.operator} '${rule.conditionValue}' (+${rule.scoreChange})`,
        });
      } else {
        breakdown.push({
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          conditionField: rule.conditionField,
          operator: rule.operator,
          scoreChange: rule.scoreChange,
          matched: false,
          reason: `Not matched for ${rule.conditionField}`,
        });
      }
    }

    // Ensure score doesn't fall below 0
    totalScore = Math.max(0, totalScore);

    return {
      totalScore,
      breakdown,
    };
  }

  /**
   * Recalculates score for an existing lead in Module 06 and persists the result.
   */
  async calculateAndApply(leadId: string): Promise<{ lead: any; scoreResult: ScoreCalculationResult }> {
    const lead = await this.db.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID '${leadId}' not found`);
    }

    const payload = {
      ...lead,
      jobTitle: (lead as any).title || '',
      channel: (lead as any).channel || lead.source,
      source: lead.source,
    };

    const scoreResult = await this.calculateScore(payload, (lead as any).workspaceId || undefined);

    const updatedLead = await this.db.lead.update({
      where: { id: leadId },
      data: {
        leadScore: scoreResult.totalScore,
        scoringBreakdown: scoreResult.breakdown as any,
      },
    });

    return {
      lead: updatedLead,
      scoreResult,
    };
  }
}
