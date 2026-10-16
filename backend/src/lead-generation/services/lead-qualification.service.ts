import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateQualificationRuleDto } from '../dto/create-qualification-rule.dto';
import { UpdateQualificationRuleDto } from '../dto/update-qualification-rule.dto';
import { createPaginatedResponse } from '../../common/utils/response.util';
import * as crypto from 'crypto';

export interface QualificationResult {
  isQualified: boolean;
  targetStatus: string;
  matchedRules: Array<{
    id: string;
    name: string;
    targetStatus: string;
    minScore?: number;
    autoQualify: boolean;
  }>;
  reasons: string[];
  autoQualify: boolean;
}

@Injectable()
export class LeadQualificationService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  async onModuleInit() {
    await this.seedDefaultRulesIfEmpty();
  }

  async seedDefaultRulesIfEmpty() {
    try {
      const count = await this.db.leadQualificationRule.count();
      if (count === 0) {
        const defaults = [
          {
            name: 'Enterprise SQL (Sales Qualified Lead)',
            description: 'High score (>= 50), estimated opportunity value > $5,000, and verified company phone',
            targetStatus: 'QUALIFIED',
            minScore: 50,
            conditions: [
              { field: 'estimatedValue', operator: 'GREATER_THAN', value: 5000 },
              { field: 'phone', operator: 'NOT_EMPTY', value: '' },
              { field: 'companyName', operator: 'NOT_EMPTY', value: '' },
            ],
            autoQualify: true,
            priority: 30,
          },
          {
            name: 'MQL (Marketing Qualified Lead)',
            description: 'Meets minimum score threshold of 35 points with company name and email',
            targetStatus: 'QUALIFIED',
            minScore: 35,
            conditions: [
              { field: 'companyName', operator: 'NOT_EMPTY', value: '' },
              { field: 'email', operator: 'NOT_EMPTY', value: '' },
            ],
            autoQualify: true,
            priority: 20,
          },
          {
            name: 'High-Value Referral Direct Qualification',
            description: 'Direct referrals from partners or existing clients qualify immediately',
            targetStatus: 'QUALIFIED',
            minScore: 20,
            conditions: [
              { field: 'channel', operator: 'EQUALS', value: 'REFERRAL' },
            ],
            autoQualify: true,
            priority: 25,
          },
          {
            name: 'Disqualified - Disposable or Incomplete',
            description: 'Flagged when contact details lack phone and company with negative score',
            targetStatus: 'UNQUALIFIED',
            minScore: 0,
            conditions: [
              { field: 'phone', operator: 'EQUALS', value: '' },
              { field: 'companyName', operator: 'EQUALS', value: '' },
            ],
            autoQualify: false,
            priority: 5,
          },
        ];

        for (const item of defaults) {
          await this.db.leadQualificationRule.create({
            data: {
              id: crypto.randomUUID(),
              name: item.name,
              description: item.description,
              targetStatus: item.targetStatus,
              minScore: item.minScore,
              conditions: item.conditions as any,
              autoQualify: item.autoQualify,
              priority: item.priority,
              isActive: true,
            },
          });
        }
      }
    } catch {
      // Ignore if table initializing
    }
  }

  // ==========================================
  // QUALIFICATION RULES CRUD
  // ==========================================

  async create(dto: CreateQualificationRuleDto) {
    return this.db.leadQualificationRule.create({
      data: {
        id: crypto.randomUUID(),
        name: dto.name,
        description: dto.description,
        targetStatus: dto.targetStatus || 'QUALIFIED',
        minScore: dto.minScore !== undefined ? dto.minScore : null,
        conditions: (dto.conditions || []) as any,
        autoQualify: dto.autoQualify !== undefined ? dto.autoQualify : false,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        priority: dto.priority || 0,
        workspaceId: dto.workspaceId,
      },
    });
  }

  async findAll(query: { page?: number; limit?: number; targetStatus?: string; isActive?: boolean; workspaceId?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.targetStatus) {
      where.targetStatus = query.targetStatus;
    }
    if (query.isActive !== undefined) {
      where.isActive = String(query.isActive) === 'true';
    }
    if (query.workspaceId) {
      where.workspaceId = query.workspaceId;
    }

    const [total, rules] = await Promise.all([
      this.db.leadQualificationRule.count({ where }),
      this.db.leadQualificationRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return createPaginatedResponse(rules, total, page, limit);
  }

  async findOne(id: string) {
    const rule = await this.db.leadQualificationRule.findUnique({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Lead qualification rule with ID '${id}' not found`);
    }
    return rule;
  }

  async update(id: string, dto: UpdateQualificationRuleDto) {
    await this.findOne(id);
    return this.db.leadQualificationRule.update({
      where: { id },
      data: {
        ...dto,
        conditions: dto.conditions ? (dto.conditions as any) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.db.leadQualificationRule.delete({ where: { id } });
    return { message: `Lead qualification rule with ID '${id}' successfully deleted` };
  }

  // ==========================================
  // QUALIFICATION EVALUATION ENGINE
  // ==========================================

  private checkCondition(actualVal: any, operator: string, expectedVal: any): boolean {
    if (operator === 'NOT_EMPTY') {
      return actualVal !== undefined && actualVal !== null && String(actualVal).trim().length > 0;
    }

    const strActual = actualVal !== undefined && actualVal !== null ? String(actualVal).trim().toLowerCase() : '';
    const strExpected = expectedVal !== undefined && expectedVal !== null ? String(expectedVal).trim().toLowerCase() : '';

    switch (operator) {
      case 'EQUALS':
        return strActual === strExpected;
      case 'NOT_EQUALS':
        return strActual !== strExpected;
      case 'CONTAINS':
        return strActual.includes(strExpected);
      case 'GREATER_THAN': {
        const numA = Number(actualVal);
        const numB = Number(expectedVal);
        return !isNaN(numA) && !isNaN(numB) && numA >= numB;
      }
      case 'LESS_THAN': {
        const numA = Number(actualVal);
        const numB = Number(expectedVal);
        return !isNaN(numA) && !isNaN(numB) && numA <= numB;
      }
      default:
        return false;
    }
  }

  /**
   * Evaluate a lead payload against all active qualification rules.
   */
  async evaluate(leadData: Record<string, any>, workspaceId?: string): Promise<QualificationResult> {
    const rules = await this.db.leadQualificationRule.findMany({
      where: {
        isActive: true,
        ...(workspaceId ? { workspaceId } : {}),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    const score = Number(leadData.leadScore) || 0;
    const matchedRules: any[] = [];
    const reasons: string[] = [];
    let autoQualify = false;
    let targetStatus = leadData.status || 'NEW';

    for (const rule of rules) {
      let satisfiesScore = true;
      if (rule.minScore !== null && rule.minScore !== undefined) {
        satisfiesScore = score >= rule.minScore;
      }

      if (!satisfiesScore) {
        continue;
      }

      const conditions: any[] = Array.isArray(rule.conditions) ? (rule.conditions as any[]) : [];
      let conditionsMet = true;

      for (const cond of conditions) {
        const actualVal = leadData[cond.field];
        if (!this.checkCondition(actualVal, cond.operator, cond.value)) {
          conditionsMet = false;
          break;
        }
      }

      if (conditionsMet) {
        matchedRules.push({
          id: rule.id,
          name: rule.name,
          targetStatus: rule.targetStatus,
          minScore: rule.minScore || undefined,
          autoQualify: rule.autoQualify,
        });

        reasons.push(
          `Rule '${rule.name}' matched with score ${score}${
            rule.minScore ? ` (threshold >= ${rule.minScore})` : ''
          }`,
        );

        // Pick highest priority matching rule for target status and autoQualify flag
        if (targetStatus === 'NEW' || rule.targetStatus === 'QUALIFIED') {
          targetStatus = rule.targetStatus;
          if (rule.autoQualify) {
            autoQualify = true;
          }
        }
      }
    }

    const isQualified = targetStatus === 'QUALIFIED';

    return {
      isQualified,
      targetStatus: matchedRules.length > 0 ? targetStatus : (leadData.status || 'NEW'),
      matchedRules,
      reasons,
      autoQualify,
    };
  }

  /**
   * Evaluates qualification for an existing lead in Module 06 and applies status if rule allows autoQualify.
   */
  async evaluateAndApply(leadId: string): Promise<{ lead: any; qualification: QualificationResult }> {
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

    const qualification = await this.evaluate(payload, (lead as any).workspaceId || undefined);

    let updatedLead = lead;
    if (qualification.autoQualify && qualification.targetStatus !== lead.status) {
      const notes = [
        (lead as any).qualificationNotes || '',
        `[Auto-Qualified]: Evaluated on ${new Date().toISOString()} - ${qualification.reasons.join('; ')}`,
      ]
        .filter(Boolean)
        .join('\n');

      updatedLead = await this.db.lead.update({
        where: { id: leadId },
        data: {
          status: qualification.targetStatus,
          qualificationNotes: notes,
        },
      });
    }

    return {
      lead: updatedLead,
      qualification,
    };
  }
}
