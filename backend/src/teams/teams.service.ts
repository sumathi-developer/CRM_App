import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamQueryDto } from './dto/team-query.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamActivitiesQueryDto } from './dto/team-activities-query.dto';
import { TeamPerformanceQueryDto } from './dto/team-performance-query.dto';
import { createPaginatedResponse } from '../common/utils/response.util';
import {
  TeamEntity,
  TeamMemberEntity,
  TeamPerformanceEntity,
  TeamActivitiesResponse,
  TeamPerformerEntity,
} from './entities/team.entity';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Slug generation helper.
   */
  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    return base || 'team';
  }

  /**
   * Ensure slug is unique across teams.
   */
  private async ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
    let candidate = slug;
    let counter = 1;

    while (true) {
      const existing: any[] = await this.prisma.$queryRawUnsafe(
        excludeId
          ? `SELECT "id" FROM "Team" WHERE "slug" = $1 AND "id" != $2 LIMIT 1`
          : `SELECT "id" FROM "Team" WHERE "slug" = $1 LIMIT 1`,
        candidate,
        ...(excludeId ? [excludeId] : []),
      );

      if (!existing || existing.length === 0) {
        return candidate;
      }
      candidate = `${slug}-${counter++}-${crypto.randomBytes(2).toString('hex')}`;
    }
  }

  // ==========================================
  // 1. ALL TEAMS & TEAM CRUD
  // ==========================================

  /**
   * List all teams with pagination, search, status, and member counts.
   */
  async findAll(query: TeamQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (query.search) {
      conditions.push(
        `("t"."name" ILIKE $${paramIndex} OR "t"."slug" ILIKE $${paramIndex} OR "t"."description" ILIKE $${paramIndex})`,
      );
      params.push(`%${query.search}%`);
      paramIndex++;
    }

    if (query.status) {
      conditions.push(`"t"."status" = $${paramIndex}`);
      params.push(query.status);
      paramIndex++;
    }

    if (query.ownerId) {
      conditions.push(`"t"."ownerId" = $${paramIndex}`);
      params.push(query.ownerId);
      paramIndex++;
    }

    if (query.workspaceId) {
      conditions.push(`"t"."workspaceId" = $${paramIndex}`);
      params.push(query.workspaceId);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Count
    const countSql = `SELECT COUNT(*)::int AS count FROM "Team" "t" WHERE ${whereClause}`;
    const countResult: any[] = await this.prisma.$queryRawUnsafe(countSql, ...params);
    const total = countResult[0]?.count || 0;

    // Fetch
    const dataSql = `
      SELECT 
        "t"."id",
        "t"."name",
        "t"."slug",
        "t"."description",
        "t"."avatar",
        "t"."color",
        "t"."status",
        "t"."targetRevenue",
        "t"."ownerId",
        "t"."workspaceId",
        "t"."organizationId",
        "t"."createdAt",
        "t"."updatedAt",
        json_build_object(
          'id', "u"."id",
          'name', "u"."name",
          'email', "u"."email",
          'avatar', "u"."avatar"
        ) AS "owner",
        (SELECT COUNT(*)::int FROM "TeamMember" "tm" WHERE "tm"."teamId" = "t"."id") AS "memberCount",
        (SELECT COUNT(*)::int FROM "Lead" "l" WHERE "l"."teamId" = "t"."id") AS "leadCount",
        (SELECT COUNT(*)::int FROM "Deal" "d" WHERE "d"."teamId" = "t"."id") AS "dealCount",
        (SELECT COUNT(*)::int FROM "Activity" "a" WHERE "a"."teamId" = "t"."id") AS "activityCount"
      FROM "Team" "t"
      LEFT JOIN "User" "u" ON "t"."ownerId" = "u"."id"
      WHERE ${whereClause}
      ORDER BY "t"."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const rawItems: any[] = await this.prisma.$queryRawUnsafe(dataSql, ...params, limit, offset);

    const items: TeamEntity[] = rawItems.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      avatar: r.avatar,
      color: r.color,
      status: r.status,
      targetRevenue: Number(r.targetRevenue || 0),
      ownerId: r.ownerId,
      workspaceId: r.workspaceId,
      organizationId: r.organizationId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      owner: r.owner,
      _count: {
        members: Number(r.memberCount || 0),
        leads: Number(r.leadCount || 0),
        deals: Number(r.dealCount || 0),
        activities: Number(r.activityCount || 0),
      },
    }));

    return createPaginatedResponse(items, total, page, limit);
  }

  /**
   * Create a new team, assign team leader, and enroll initial members.
   */
  async create(dto: CreateTeamDto, currentUserId?: string) {
    let effectiveOwnerId = dto.ownerId || currentUserId;

    if (!effectiveOwnerId) {
      const defaultUser = await this.prisma.user.findFirst({ select: { id: true } });
      if (!defaultUser) {
        throw new BadRequestException('No user available to assign as team owner');
      }
      effectiveOwnerId = defaultUser.id;
    }

    const ownerExists = await this.prisma.user.findUnique({
      where: { id: effectiveOwnerId },
      select: { id: true, name: true, email: true, avatar: true },
    });

    if (!ownerExists) {
      throw new NotFoundException(`User '${effectiveOwnerId}' not found for team owner`);
    }

    const rawSlug = dto.slug ? dto.slug.trim().toLowerCase() : this.generateSlug(dto.name);
    const slug = await this.ensureUniqueSlug(rawSlug);

    const teamId = crypto.randomUUID();
    const now = new Date();

    const insertTeamSql = `
      INSERT INTO "Team" (
        "id", "name", "slug", "description", "avatar", "color",
        "status", "targetRevenue", "ownerId", "workspaceId", "organizationId", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *
    `;

    await this.prisma.$queryRawUnsafe(
      insertTeamSql,
      teamId,
      dto.name.trim(),
      slug,
      dto.description || null,
      dto.avatar || null,
      dto.color || '#3b82f6',
      dto.status || 'ACTIVE',
      Number(dto.targetRevenue || 0),
      effectiveOwnerId,
      dto.workspaceId || null,
      dto.organizationId || null,
      now,
      now,
    );

    // Enroll Owner as LEADER
    const ownerMemberId = crypto.randomUUID();
    await this.prisma.$queryRawUnsafe(
      `
      INSERT INTO "TeamMember" ("id", "teamId", "userId", "role", "joinedAt", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, 'LEADER', $4, $5, $6)
      ON CONFLICT ("teamId", "userId") DO NOTHING
      `,
      ownerMemberId,
      teamId,
      effectiveOwnerId,
      now,
      now,
      now,
    );

    // Enroll optional initial members
    if (dto.memberUserIds && Array.isArray(dto.memberUserIds)) {
      for (const uid of dto.memberUserIds) {
        if (uid !== effectiveOwnerId) {
          const mid = crypto.randomUUID();
          await this.prisma.$queryRawUnsafe(
            `
            INSERT INTO "TeamMember" ("id", "teamId", "userId", "role", "joinedAt", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, 'MEMBER', $4, $5, $6)
            ON CONFLICT ("teamId", "userId") DO NOTHING
            `,
            mid,
            teamId,
            uid,
            now,
            now,
            now,
          );
        }
      }
    }

    return this.findOne(teamId);
  }

  /**
   * Get team details with owner, members, and entity counts.
   */
  async findOne(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const sql = `
      SELECT 
        "t"."id",
        "t"."name",
        "t"."slug",
        "t"."description",
        "t"."avatar",
        "t"."color",
        "t"."status",
        "t"."targetRevenue",
        "t"."ownerId",
        "t"."workspaceId",
        "t"."organizationId",
        "t"."createdAt",
        "t"."updatedAt",
        json_build_object(
          'id', "u"."id",
          'name', "u"."name",
          'email', "u"."email",
          'avatar', "u"."avatar"
        ) AS "owner"
      FROM "Team" "t"
      LEFT JOIN "User" "u" ON "t"."ownerId" = "u"."id"
      WHERE ${isUuid ? '"t"."id" = $1' : '"t"."slug" = $1'}
      LIMIT 1
    `;

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, idOrSlug);
    if (!rows || rows.length === 0) {
      throw new NotFoundException(`Team '${idOrSlug}' not found`);
    }

    const team = rows[0];
    const members = await this.getMembers(team.id);

    // Entity counts
    const [leadCountResult, dealCountResult, activityCountResult, wonDeals]: any[] = await Promise.all([
      this.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "Lead" WHERE "teamId" = $1`, team.id),
      this.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "Deal" WHERE "teamId" = $1`, team.id),
      this.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "Activity" WHERE "teamId" = $1`, team.id),
      this.prisma.$queryRawUnsafe(`SELECT "value" FROM "Deal" WHERE "teamId" = $1 AND "status" = 'WON'`, team.id),
    ]);

    const leadCount = leadCountResult?.[0]?.count || 0;
    const dealCount = dealCountResult?.[0]?.count || 0;
    const activityCount = activityCountResult?.[0]?.count || 0;
    const wonRevenue = (wonDeals || []).reduce((sum: number, d: any) => sum + Number(d.value || 0), 0);

    return {
      ...team,
      targetRevenue: Number(team.targetRevenue || 0),
      wonRevenue,
      members,
      _count: {
        members: members.length,
        leads: leadCount,
        deals: dealCount,
        activities: activityCount,
      },
    };
  }

  /**
   * Edit team metadata, owner, and targets.
   */
  async update(id: string, dto: UpdateTeamDto, currentUserId?: string, userRole?: string) {
    const existing = await this.findOne(id);

    // Authorization: system ADMIN, MANAGER, or team owner
    if (
      currentUserId &&
      userRole !== 'ADMIN' &&
      userRole !== 'MANAGER' &&
      existing.ownerId !== currentUserId
    ) {
      throw new ForbiddenException('Only team leaders, managers, or administrators can edit this team');
    }

    let slug = existing.slug;
    if (dto.slug && dto.slug.trim().toLowerCase() !== existing.slug) {
      slug = await this.ensureUniqueSlug(dto.slug.trim().toLowerCase(), id);
    } else if (dto.name && !dto.slug && !existing.slug) {
      slug = await this.ensureUniqueSlug(this.generateSlug(dto.name), id);
    }

    const now = new Date();
    const updateSql = `
      UPDATE "Team"
      SET 
        "name" = COALESCE($1, "name"),
        "slug" = COALESCE($2, "slug"),
        "description" = COALESCE($3, "description"),
        "avatar" = COALESCE($4, "avatar"),
        "color" = COALESCE($5, "color"),
        "status" = COALESCE($6, "status"),
        "targetRevenue" = COALESCE($7, "targetRevenue"),
        "ownerId" = COALESCE($8, "ownerId"),
        "workspaceId" = COALESCE($9, "workspaceId"),
        "organizationId" = COALESCE($10, "organizationId"),
        "updatedAt" = $11
      WHERE "id" = $12
    `;

    await this.prisma.$queryRawUnsafe(
      updateSql,
      dto.name !== undefined ? dto.name.trim() : null,
      slug,
      dto.description !== undefined ? dto.description : null,
      dto.avatar !== undefined ? dto.avatar : null,
      dto.color !== undefined ? dto.color : null,
      dto.status !== undefined ? dto.status : null,
      dto.targetRevenue !== undefined ? Number(dto.targetRevenue) : null,
      dto.ownerId !== undefined ? dto.ownerId : null,
      dto.workspaceId !== undefined ? dto.workspaceId : null,
      dto.organizationId !== undefined ? dto.organizationId : null,
      now,
      id,
    );

    // If owner was changed, ensure new owner is a TeamMember with role LEADER
    if (dto.ownerId && dto.ownerId !== existing.ownerId) {
      const mid = crypto.randomUUID();
      await this.prisma.$queryRawUnsafe(
        `
        INSERT INTO "TeamMember" ("id", "teamId", "userId", "role", "joinedAt", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'LEADER', $4, $5, $6)
        ON CONFLICT ("teamId", "userId") DO UPDATE SET "role" = 'LEADER', "updatedAt" = $6
        `,
        mid,
        id,
        dto.ownerId,
        now,
        now,
        now,
      );
    }

    return this.findOne(id);
  }

  /**
   * Delete or archive team.
   */
  async remove(id: string, currentUserId?: string, userRole?: string) {
    const existing = await this.findOne(id);

    if (currentUserId && userRole !== 'ADMIN' && existing.ownerId !== currentUserId) {
      throw new ForbiddenException('Only the team owner or a system administrator can delete this team');
    }

    // Unset teamId on associated resources
    await Promise.all([
      this.prisma.$queryRawUnsafe(`UPDATE "Lead" SET "teamId" = NULL WHERE "teamId" = $1`, id),
      this.prisma.$queryRawUnsafe(`UPDATE "Deal" SET "teamId" = NULL WHERE "teamId" = $1`, id),
      this.prisma.$queryRawUnsafe(`UPDATE "Activity" SET "teamId" = NULL WHERE "teamId" = $1`, id),
      this.prisma.$queryRawUnsafe(`UPDATE "Task" SET "teamId" = NULL WHERE "teamId" = $1`, id),
    ]);

    // Delete Team (cascades to TeamMember)
    await this.prisma.$queryRawUnsafe(`DELETE FROM "Team" WHERE "id" = $1`, id);

    return {
      message: 'Team deleted successfully',
      id,
    };
  }

  // ==========================================
  // 2. TEAM MEMBERS
  // ==========================================

  /**
   * List all members of a team.
   */
  async getMembers(teamId: string): Promise<TeamMemberEntity[]> {
    const sql = `
      SELECT 
        "tm"."id",
        "tm"."teamId",
        "tm"."userId",
        "tm"."role",
        "tm"."joinedAt",
        "tm"."createdAt",
        "tm"."updatedAt",
        json_build_object(
          'id', "u"."id",
          'name', "u"."name",
          'email', "u"."email",
          'avatar', "u"."avatar",
          'status', "u"."status"
        ) AS "user"
      FROM "TeamMember" "tm"
      JOIN "User" "u" ON "tm"."userId" = "u"."id"
      WHERE "tm"."teamId" = $1
      ORDER BY 
        CASE "tm"."role" WHEN 'LEADER' THEN 1 ELSE 2 END,
        "tm"."joinedAt" ASC
    `;

    return this.prisma.$queryRawUnsafe(sql, teamId);
  }

  /**
   * Get single team member by ID or userId.
   */
  async getMember(teamId: string, memberIdOrUserId: string): Promise<TeamMemberEntity> {
    const sql = `
      SELECT 
        "tm"."id",
        "tm"."teamId",
        "tm"."userId",
        "tm"."role",
        "tm"."joinedAt",
        "tm"."createdAt",
        "tm"."updatedAt",
        json_build_object(
          'id', "u"."id",
          'name', "u"."name",
          'email', "u"."email",
          'avatar', "u"."avatar",
          'status', "u"."status"
        ) AS "user"
      FROM "TeamMember" "tm"
      JOIN "User" "u" ON "tm"."userId" = "u"."id"
      WHERE "tm"."teamId" = $1 AND ("tm"."id" = $2 OR "tm"."userId" = $2)
      LIMIT 1
    `;

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, teamId, memberIdOrUserId);
    if (!rows || rows.length === 0) {
      throw new NotFoundException(`Team member '${memberIdOrUserId}' not found in team`);
    }

    return rows[0];
  }

  /**
   * Add a member to a team.
   */
  async addMember(
    teamId: string,
    dto: AddTeamMemberDto,
    currentUserId?: string,
    userRole?: string,
  ) {
    const team = await this.findOne(teamId);

    if (
      currentUserId &&
      userRole !== 'ADMIN' &&
      userRole !== 'MANAGER' &&
      team.ownerId !== currentUserId
    ) {
      throw new ForbiddenException('Only team leaders, managers, or administrators can add members');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, name: true, email: true, avatar: true, status: true },
    });

    if (!user) {
      throw new NotFoundException(`User '${dto.userId}' not found`);
    }

    const existing: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "id" FROM "TeamMember" WHERE "teamId" = $1 AND "userId" = $2`,
      teamId,
      dto.userId,
    );

    if (existing && existing.length > 0) {
      throw new ConflictException('User is already a member of this team');
    }

    const id = crypto.randomUUID();
    const now = new Date();
    const role = dto.role || 'MEMBER';

    await this.prisma.$queryRawUnsafe(
      `
      INSERT INTO "TeamMember" ("id", "teamId", "userId", "role", "joinedAt", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      id,
      teamId,
      dto.userId,
      role,
      now,
      now,
      now,
    );

    return this.getMember(teamId, id);
  }

  /**
   * Update member role within team (LEADER or MEMBER).
   */
  async updateMemberRole(
    teamId: string,
    memberIdOrUserId: string,
    dto: UpdateTeamMemberDto,
    currentUserId?: string,
    userRole?: string,
  ) {
    const team = await this.findOne(teamId);
    const member = await this.getMember(teamId, memberIdOrUserId);

    if (
      currentUserId &&
      userRole !== 'ADMIN' &&
      userRole !== 'MANAGER' &&
      team.ownerId !== currentUserId
    ) {
      throw new ForbiddenException('Only team leaders, managers, or administrators can update member roles');
    }

    if (team.ownerId === member.userId && dto.role !== 'LEADER') {
      throw new BadRequestException('Cannot demote the primary owner of the team. Reassign ownership first.');
    }

    const now = new Date();
    await this.prisma.$queryRawUnsafe(
      `UPDATE "TeamMember" SET "role" = $1, "updatedAt" = $2 WHERE "id" = $3`,
      dto.role,
      now,
      member.id,
    );

    return this.getMember(teamId, member.id);
  }

  /**
   * Remove member from team.
   */
  async removeMember(
    teamId: string,
    memberIdOrUserId: string,
    currentUserId?: string,
    userRole?: string,
  ) {
    const team = await this.findOne(teamId);
    const member = await this.getMember(teamId, memberIdOrUserId);

    if (team.ownerId === member.userId) {
      throw new BadRequestException('Cannot remove the team owner from the team. Reassign ownership first.');
    }

    if (
      currentUserId &&
      userRole !== 'ADMIN' &&
      userRole !== 'MANAGER' &&
      team.ownerId !== currentUserId &&
      currentUserId !== member.userId
    ) {
      throw new ForbiddenException('Only team leaders or administrators can remove team members');
    }

    await this.prisma.$queryRawUnsafe(`DELETE FROM "TeamMember" WHERE "id" = $1`, member.id);

    return {
      message: 'Member removed from team successfully',
      teamId,
      memberId: member.id,
      userId: member.userId,
    };
  }

  // ==========================================
  // 3. TEAM ACTIVITIES
  // ==========================================

  /**
   * Fetch unified activities for a team with filtering and type/status breakdowns.
   */
  async getTeamActivities(
    teamId: string,
    query: TeamActivitiesQueryDto,
  ): Promise<TeamActivitiesResponse> {
    const team = await this.findOne(teamId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const offset = (page - 1) * limit;

    const memberRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "userId" FROM "TeamMember" WHERE "teamId" = $1`,
      teamId,
    );
    const memberIds = memberRows.map((m) => m.userId);
    if (!memberIds.includes(team.ownerId)) {
      memberIds.push(team.ownerId);
    }

    // Build Prisma query condition
    const where: any = {
      OR: [
        { teamId },
        { assignedToId: { in: memberIds } },
        { createdById: { in: memberIds } },
      ],
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.userId) {
      where.OR = [
        { assignedToId: query.userId },
        { createdById: query.userId },
      ];
    }

    if (query.startDate || query.endDate) {
      where.scheduledAt = {};
      if (query.startDate) where.scheduledAt.gte = new Date(query.startDate);
      if (query.endDate) where.scheduledAt.lte = new Date(query.endDate);
    }

    const [total, activities, allTeamActivities] = await Promise.all([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          lead: { select: { id: true, title: true, companyName: true } },
          deal: { select: { id: true, title: true, value: true } },
        },
      }),
      this.prisma.activity.findMany({
        where: {
          OR: [
            { teamId },
            { assignedToId: { in: memberIds } },
          ],
        },
        select: { type: true, status: true },
      }),
    ]);

    // Calculate breakdowns
    const breakdownByType: Record<string, number> = {};
    const breakdownByStatus: Record<string, number> = {};

    for (const act of allTeamActivities) {
      breakdownByType[act.type] = (breakdownByType[act.type] || 0) + 1;
      breakdownByStatus[act.status] = (breakdownByStatus[act.status] || 0) + 1;
    }

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      teamId: team.id,
      teamName: team.name,
      totalActivities: total,
      breakdownByType,
      breakdownByStatus,
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // ==========================================
  // 4. TEAM PERFORMANCE & METRICS
  // ==========================================

  /**
   * Calculate comprehensive team performance metrics: Leads, Deals, Won Deals,
   * Revenue, Quota Attainment, Activities, Conversion Rate, and Top Performers.
   */
  async getTeamPerformance(
    teamId: string,
    query: TeamPerformanceQueryDto,
  ): Promise<TeamPerformanceEntity> {
    const team = await this.findOne(teamId);

    const members = await this.getMembers(teamId);
    const memberIds = members.map((m) => m.userId);
    if (!memberIds.includes(team.ownerId)) {
      memberIds.push(team.ownerId);
    }

    // Filter conditions for dates/pipeline
    const dealWhere: any = {
      OR: [
        { teamId },
        { ownerId: { in: memberIds } },
      ],
    };

    const leadWhere: any = {
      OR: [
        { teamId },
        { ownerId: { in: memberIds } },
      ],
    };

    const activityWhere: any = {
      OR: [
        { teamId },
        { assignedToId: { in: memberIds } },
      ],
    };

    if (query.pipelineId) {
      dealWhere.pipelineId = query.pipelineId;
    }

    if (query.startDate || query.endDate) {
      dealWhere.createdAt = {};
      leadWhere.createdAt = {};
      activityWhere.scheduledAt = {};

      if (query.startDate) {
        const start = new Date(query.startDate);
        dealWhere.createdAt.gte = start;
        leadWhere.createdAt.gte = start;
        activityWhere.scheduledAt.gte = start;
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        dealWhere.createdAt.lte = end;
        leadWhere.createdAt.lte = end;
        activityWhere.scheduledAt.lte = end;
      }
    }

    const [allDeals, allLeads, allActivities] = await Promise.all([
      this.prisma.deal.findMany({
        where: dealWhere,
        select: { id: true, value: true, status: true, ownerId: true },
      }),
      this.prisma.lead.findMany({
        where: leadWhere,
        select: { id: true, status: true, ownerId: true },
      }),
      this.prisma.activity.findMany({
        where: activityWhere,
        select: { id: true, status: true, assignedToId: true },
      }),
    ]);

    // Deals & Revenue calculations
    const wonDeals = allDeals.filter((d) => d.status === 'WON');
    const openDeals = allDeals.filter((d) => d.status === 'OPEN');
    const lostDeals = allDeals.filter((d) => d.status === 'LOST');

    const wonRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const activePipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);

    const targetRevenue = Number(team.targetRevenue || 0);
    const quotaAttainmentPercentage =
      targetRevenue > 0 ? Number(((wonRevenue / targetRevenue) * 100).toFixed(1)) : 0;

    // Leads & Conversion calculations
    const convertedLeads = allLeads.filter((l) => l.status === 'CONVERTED');
    const leadConversionRate =
      allLeads.length > 0
        ? `${((convertedLeads.length / allLeads.length) * 100).toFixed(1)}%`
        : '0%';

    const dealWinRate =
      allDeals.length > 0
        ? `${((wonDeals.length / allDeals.length) * 100).toFixed(1)}%`
        : '0%';

    // Activities calculations
    const completedActivities = allActivities.filter((a) => a.status === 'COMPLETED').length;
    const pendingActivities = allActivities.filter((a) => a.status === 'PENDING').length;

    // Top Performers ranking per member
    const performerMap = new Map<string, TeamPerformerEntity>();

    for (const mem of members) {
      if (!mem.user) continue;
      performerMap.set(mem.userId, {
        userId: mem.userId,
        name: mem.user.name,
        email: mem.user.email,
        avatar: mem.user.avatar,
        wonRevenue: 0,
        wonDealsCount: 0,
        openDealsCount: 0,
        completedActivitiesCount: 0,
      });
    }

    for (const deal of allDeals) {
      if (deal.ownerId && performerMap.has(deal.ownerId)) {
        const perf = performerMap.get(deal.ownerId)!;
        if (deal.status === 'WON') {
          perf.wonRevenue += deal.value || 0;
          perf.wonDealsCount++;
        } else if (deal.status === 'OPEN') {
          perf.openDealsCount++;
        }
      }
    }

    for (const act of allActivities) {
      if (act.assignedToId && performerMap.has(act.assignedToId) && act.status === 'COMPLETED') {
        const perf = performerMap.get(act.assignedToId)!;
        perf.completedActivitiesCount++;
      }
    }

    const topPerformers = Array.from(performerMap.values()).sort(
      (a, b) => b.wonRevenue - a.wonRevenue || b.wonDealsCount - a.wonDealsCount,
    );

    return {
      teamId: team.id,
      teamName: team.name,
      targetRevenue,
      wonRevenue,
      activePipelineValue,
      quotaAttainmentPercentage,
      totalLeads: allLeads.length,
      convertedLeads: convertedLeads.length,
      leadConversionRate,
      totalDeals: allDeals.length,
      wonDealsCount: wonDeals.length,
      openDealsCount: openDeals.length,
      lostDealsCount: lostDeals.length,
      dealWinRate,
      totalActivities: allActivities.length,
      completedActivities,
      pendingActivities,
      topPerformers,
    };
  }
}
