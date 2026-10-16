import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAssignmentRuleDto, RoutingStrategy } from '../dto/create-assignment-rule.dto';
import { UpdateAssignmentRuleDto } from '../dto/update-assignment-rule.dto';
import { createPaginatedResponse } from '../../common/utils/response.util';
import * as crypto from 'crypto';

export interface RoutingExecutionResult {
  leadId: string;
  assignedTo: { id: string; name: string; email: string } | null;
  ruleId?: string;
  ruleName?: string;
  strategy?: string;
  reason: string;
}

@Injectable()
export class LeadRoutingService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  async onModuleInit() {
    await this.seedDefaultRulesIfEmpty();
  }

  async seedDefaultRulesIfEmpty() {
    try {
      const count = await this.db.leadAssignmentRule.count();
      if (count === 0) {
        // Fetch active users to populate candidate pool
        const users = await this.prisma.user.findMany({
          where: { status: 'ACTIVE' },
          take: 5,
          select: { id: true },
        });
        const userIds = users.map((u) => u.id);

        const defaults = [
          {
            name: 'Enterprise High-Value Load Balancing',
            description: 'Routes high-budget enterprise leads to available sales reps with lowest active pipeline workload',
            routingStrategy: RoutingStrategy.LOAD_BALANCED,
            targetUserIds: userIds,
            conditions: [{ field: 'estimatedValue', operator: 'GREATER_THAN', value: 10000 }],
            priority: 30,
          },
          {
            name: 'Inbound Website & Demo Round Robin',
            description: 'Equally distributes inbound website, demo, and landing page leads across sales team',
            routingStrategy: RoutingStrategy.ROUND_ROBIN,
            targetUserIds: userIds,
            conditions: [{ field: 'channel', operator: 'IN', value: 'WEBSITE,LANDING_PAGE' }],
            priority: 20,
          },
          {
            name: 'Default General Inbound Round Robin',
            description: 'Fallback catch-all round-robin routing rule for all other incoming leads',
            routingStrategy: RoutingStrategy.ROUND_ROBIN,
            targetUserIds: userIds,
            conditions: [],
            priority: 0,
          },
        ];

        for (const item of defaults) {
          await this.db.leadAssignmentRule.create({
            data: {
              id: crypto.randomUUID(),
              name: item.name,
              description: item.description,
              routingStrategy: item.routingStrategy,
              targetUserIds: item.targetUserIds as any,
              conditions: item.conditions as any,
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
  // ASSIGNMENT RULES CRUD
  // ==========================================

  async create(dto: CreateAssignmentRuleDto) {
    if (!dto.targetUserIds || dto.targetUserIds.length === 0) {
      throw new BadRequestException('At least one target user must be specified for assignment rule');
    }

    return this.db.leadAssignmentRule.create({
      data: {
        id: crypto.randomUUID(),
        name: dto.name,
        description: dto.description,
        routingStrategy: dto.routingStrategy,
        targetUserIds: dto.targetUserIds as any,
        conditions: (dto.conditions || []) as any,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        priority: dto.priority || 0,
        workspaceId: dto.workspaceId,
      },
    });
  }

  async findAll(query: { page?: number; limit?: number; strategy?: string; isActive?: boolean; workspaceId?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.strategy) {
      where.routingStrategy = query.strategy;
    }
    if (query.isActive !== undefined) {
      where.isActive = String(query.isActive) === 'true';
    }
    if (query.workspaceId) {
      where.workspaceId = query.workspaceId;
    }

    const [total, rules] = await Promise.all([
      this.db.leadAssignmentRule.count({ where }),
      this.db.leadAssignmentRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return createPaginatedResponse(rules, total, page, limit);
  }

  async findOne(id: string) {
    const rule = await this.db.leadAssignmentRule.findUnique({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Lead assignment rule with ID '${id}' not found`);
    }
    return rule;
  }

  async update(id: string, dto: UpdateAssignmentRuleDto) {
    await this.findOne(id);
    return this.db.leadAssignmentRule.update({
      where: { id },
      data: {
        ...dto,
        targetUserIds: dto.targetUserIds ? (dto.targetUserIds as any) : undefined,
        conditions: dto.conditions ? (dto.conditions as any) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.db.leadAssignmentRule.delete({ where: { id } });
    return { message: `Lead assignment rule with ID '${id}' successfully deleted` };
  }

  // ==========================================
  // ROUTING ENGINE & EXECUTION
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
      case 'IN': {
        const items = strExpected.split(',').map((x) => x.trim());
        return items.includes(strActual);
      }
      case 'GREATER_THAN': {
        const numA = Number(actualVal);
        const numB = Number(expectedVal);
        return !isNaN(numA) && !isNaN(numB) && numA >= numB;
      }
      default:
        return false;
    }
  }

  /**
   * Pick next assignee using Round Robin.
   */
  private async selectRoundRobinUser(rule: any): Promise<string | null> {
    const candidateIds: string[] = Array.isArray(rule.targetUserIds) ? (rule.targetUserIds as string[]) : [];
    if (candidateIds.length === 0) return null;

    let nextUserId = candidateIds[0];
    if (rule.lastAssignedUserId) {
      const idx = candidateIds.indexOf(rule.lastAssignedUserId);
      if (idx !== -1 && idx < candidateIds.length - 1) {
        nextUserId = candidateIds[idx + 1];
      } else {
        nextUserId = candidateIds[0];
      }
    }

    // Update rule state with selected user
    await this.db.leadAssignmentRule.update({
      where: { id: rule.id },
      data: { lastAssignedUserId: nextUserId },
    });

    return nextUserId;
  }

  /**
   * Pick assignee using Load Balancing (assign to user with fewest non-converted leads).
   */
  private async selectLoadBalancedUser(rule: any): Promise<string | null> {
    const candidateIds: string[] = Array.isArray(rule.targetUserIds) ? (rule.targetUserIds as string[]) : [];
    if (candidateIds.length === 0) return null;
    if (candidateIds.length === 1) return candidateIds[0];

    // Count open leads for each user
    const counts = await Promise.all(
      candidateIds.map(async (userId) => {
        const count = await this.db.lead.count({
          where: {
            ownerId: userId,
            status: { notIn: ['CONVERTED', 'UNQUALIFIED'] },
          },
        });
        return { userId, count };
      }),
    );

    counts.sort((a, b) => a.count - b.count);
    return counts[0].userId;
  }

  /**
   * Route and assign an existing lead.
   */
  async routeLead(leadId: string, ruleId?: string, overrideUserId?: string): Promise<RoutingExecutionResult> {
    const lead = await this.db.lead.findUnique({
      where: { id: leadId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID '${leadId}' not found`);
    }

    // 1. Direct override if specified
    if (overrideUserId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: overrideUserId },
        select: { id: true, name: true, email: true },
      });
      if (!targetUser) {
        throw new NotFoundException(`User with ID '${overrideUserId}' not found`);
      }

      await this.db.lead.update({
        where: { id: leadId },
        data: { ownerId: overrideUserId, routedToId: overrideUserId },
      });

      // Log assignment activity
      await this.prisma.activity.create({
        data: {
          id: crypto.randomUUID(),
          type: 'FOLLOW_UP',
          subject: `Lead manually assigned to ${targetUser.name}`,
          description: `Direct assignment by user request`,
          status: 'COMPLETED',
          leadId,
          assignedToId: overrideUserId,
        },
      });

      return {
        leadId,
        assignedTo: targetUser,
        reason: `Directly assigned to user ${targetUser.name} (${targetUser.email})`,
      };
    }

    // 2. Select rule
    let matchedRule: any = null;
    if (ruleId) {
      matchedRule = await this.findOne(ruleId);
    } else {
      const rules = await this.db.leadAssignmentRule.findMany({
        where: {
          isActive: true,
          ...((lead as any).workspaceId ? { workspaceId: (lead as any).workspaceId } : {}),
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });

      const leadPayload = {
        ...lead,
        channel: (lead as any).channel || lead.source,
      };

      for (const r of rules) {
        const conditions: any[] = Array.isArray(r.conditions) ? (r.conditions as any[]) : [];
        if (conditions.length === 0) {
          // Catch-all rule
          matchedRule = r;
          break;
        }

        let allMet = true;
        for (const cond of conditions) {
          const actual = leadPayload[cond.field];
          if (!this.checkCondition(actual, cond.operator, cond.value)) {
            allMet = false;
            break;
          }
        }

        if (allMet) {
          matchedRule = r;
          break;
        }
      }
    }

    if (!matchedRule) {
      return {
        leadId,
        assignedTo: lead.owner,
        reason: 'No matching active assignment rule found; existing owner preserved',
      };
    }

    // 3. Pick user based on routing strategy
    let chosenUserId: string | null = null;
    const candidateIds: string[] = Array.isArray(matchedRule.targetUserIds) ? (matchedRule.targetUserIds as string[]) : [];

    if (candidateIds.length === 0) {
      return {
        leadId,
        assignedTo: lead.owner,
        ruleId: matchedRule.id,
        ruleName: matchedRule.name,
        strategy: matchedRule.routingStrategy,
        reason: `Rule '${matchedRule.name}' has no target users configured; assignment skipped`,
      };
    }

    switch (matchedRule.routingStrategy) {
      case RoutingStrategy.ROUND_ROBIN:
        chosenUserId = await this.selectRoundRobinUser(matchedRule);
        break;

      case RoutingStrategy.LOAD_BALANCED:
        chosenUserId = await this.selectLoadBalancedUser(matchedRule);
        break;

      case RoutingStrategy.SPECIFIC_USER:
      case RoutingStrategy.SOURCE_BASED:
      default:
        chosenUserId = candidateIds[0];
        break;
    }

    if (!chosenUserId) {
      return {
        leadId,
        assignedTo: lead.owner,
        reason: 'Unable to select an assignee from candidate pool',
      };
    }

    const assignedUser = await this.prisma.user.findUnique({
      where: { id: chosenUserId },
      select: { id: true, name: true, email: true },
    });

    if (!assignedUser) {
      return {
        leadId,
        assignedTo: lead.owner,
        reason: `Selected user ID '${chosenUserId}' was not found in system`,
      };
    }

    // 4. Update Lead owner and routedToId
    await this.db.lead.update({
      where: { id: leadId },
      data: {
        ownerId: chosenUserId,
        routedToId: chosenUserId,
      },
    });

    // 5. Create activity record for routing audit trail
    await this.prisma.activity.create({
      data: {
        id: crypto.randomUUID(),
        type: 'FOLLOW_UP',
        subject: `Lead automatically routed to ${assignedUser.name}`,
        description: `Routed via rule '${matchedRule.name}' using strategy ${matchedRule.routingStrategy}`,
        status: 'PENDING',
        priority: 'MEDIUM',
        leadId,
        assignedToId: chosenUserId,
      },
    });

    return {
      leadId,
      assignedTo: assignedUser,
      ruleId: matchedRule.id,
      ruleName: matchedRule.name,
      strategy: matchedRule.routingStrategy,
      reason: `Assigned to ${assignedUser.name} via '${matchedRule.name}' (${matchedRule.routingStrategy})`,
    };
  }

  /**
   * Bulk assign multiple leads.
   */
  async bulkAssign(leadIds: string[], ownerId?: string, ruleId?: string) {
    const results: RoutingExecutionResult[] = [];

    for (const id of leadIds) {
      try {
        const res = await this.routeLead(id, ruleId, ownerId);
        results.push(res);
      } catch (err: any) {
        results.push({
          leadId: id,
          assignedTo: null,
          reason: `Failed to route: ${err.message}`,
        });
      }
    }

    return {
      total: leadIds.length,
      successful: results.filter((r) => r.assignedTo !== null).length,
      results,
    };
  }
}
