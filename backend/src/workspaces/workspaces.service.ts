import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceQueryDto } from './dto/workspace-query.dto';
import { AddWorkspaceMemberDto } from './dto/add-member.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-member.dto';
import { InviteWorkspaceMemberDto } from './dto/invite-workspace-member.dto';
import { AcceptWorkspaceInviteDto } from './dto/accept-invite.dto';
import { CreateWorkspaceRoleDto } from './dto/create-workspace-role.dto';
import { UpdateWorkspaceRoleDto } from './dto/update-workspace-role.dto';
import { UpdateWorkspaceSettingsDto } from './dto/update-workspace-settings.dto';
import { UpdateBrandingSettingsDto } from './dto/update-branding-settings.dto';
import { UpdateLocalizationSettingsDto } from './dto/update-localization-settings.dto';
import { UpdatePreferencesSettingsDto } from './dto/update-preferences-settings.dto';
import { UpdateSecuritySettingsDto } from './dto/update-security-settings.dto';
import { createPaginatedResponse } from '../common/utils/response.util';
export interface WorkspaceEntity {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  avatar?: string | null;
  website?: string | null;
  timezone: string;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE' | string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  _count?: {
    members?: number;
    invites?: number;
    roles?: number;
  };
}

export interface WorkspaceMemberEntity {
  id: string;
  workspaceId: string;
  userId: string;
  roleId?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | string;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    status: string;
  };
  workspaceRole?: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
}

export interface WorkspaceInviteEntity {
  id: string;
  workspaceId: string;
  email: string;
  roleId?: string | null;
  role: string;
  token: string;
  invitedById?: string | null;
  expiresAt: Date;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED' | string;
  createdAt: Date;
  updatedAt: Date;
  invitedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface WorkspaceRoleEntity {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    members?: number;
  };
}

export interface WorkspaceGeneralSettings {
  companyName?: string;
  defaultLanguage?: string;
  industry?: string;
  supportEmail?: string;
}

export interface WorkspaceBrandingSettings {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string;
  accentColor?: string;
  companyPortalUrl?: string | null;
}

export interface WorkspaceLocalizationSettings {
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
}

export interface WorkspacePreferencesSettings {
  emailNotifications: boolean;
  autoAssignLeads: boolean;
  defaultPipelineId?: string | null;
  weeklyDigest: boolean;
}

export interface WorkspaceSecuritySettings {
  enforceTwoFactor: boolean;
  sessionTimeoutMinutes: number;
  allowedEmailDomains: string[];
  ipAllowlist: string[];
}

export interface WorkspaceSettingEntity {
  id: string;
  workspaceId: string;
  general: WorkspaceGeneralSettings;
  branding: WorkspaceBrandingSettings;
  localization: WorkspaceLocalizationSettings;
  preferences: WorkspacePreferencesSettings;
  security: WorkspaceSecuritySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMetricsEntity {
  workspaceId: string;
  workspaceName: string;
  totalMembers: number;
  totalContacts: number;
  totalDeals: number;
  totalWonRevenue: number;
  openPipelineValue: number;
  pendingTasksCount: number;
  activeLeadsCount: number;
  recentActivities: Array<{
    id: string;
    type: string;
    subject: string;
    status: string;
    priority: string;
    scheduledAt?: Date | null;
  }>;
}

export interface WorkspaceContext {
  workspace: WorkspaceEntity;
  member: WorkspaceMemberEntity;
  roleName: string;
  permissions: string[];
}

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to format a name into a clean, URL-safe slug.
   */
  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    return baseSlug || 'workspace';
  }

  /**
   * Safely parse permissions array from string, array, or object.
   */
  private parsePermissions(permissions: any): string[] {
    if (Array.isArray(permissions)) return permissions;
    if (typeof permissions === 'string') {
      try {
        const parsed = JSON.parse(permissions);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Ensure slug is globally unique.
   */
  private async ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
    let candidate = slug;
    let counter = 1;

    while (true) {
      const existing = (excludeId
        ? await this.prisma.$queryRawUnsafe(
            `SELECT "id" FROM "Workspace" WHERE "slug" = $1 AND "id" != $2 LIMIT 1`,
            candidate,
            excludeId,
          )
        : await this.prisma.$queryRawUnsafe(
            `SELECT "id" FROM "Workspace" WHERE "slug" = $1 LIMIT 1`,
            candidate,
          )) as any[];

      if (!existing || existing.length === 0) {
        return candidate;
      }
      candidate = `${slug}-${counter++}-${crypto.randomBytes(2).toString('hex')}`;
    }
  }

  /**
   * Helper to fetch activeWorkspaceId from User.
   */
  private async getUserActiveWorkspaceId(userId: string): Promise<string | null> {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "activeWorkspaceId" FROM "User" WHERE "id" = $1 LIMIT 1`,
      userId,
    );
    return rows[0]?.activeWorkspaceId || null;
  }

  /**
   * Helper to set activeWorkspaceId on User.
   */
  private async setUserActiveWorkspaceId(userId: string, workspaceId: string | null): Promise<void> {
    await this.prisma.$queryRawUnsafe(
      `UPDATE "User" SET "activeWorkspaceId" = $1 WHERE "id" = $2`,
      workspaceId,
      userId,
    );
  }

  /**
   * Helper to clear activeWorkspaceId across users.
   */
  private async clearActiveWorkspaceId(workspaceId: string): Promise<void> {
    await this.prisma.$queryRawUnsafe(
      `UPDATE "User" SET "activeWorkspaceId" = NULL WHERE "activeWorkspaceId" = $1`,
      workspaceId,
    );
  }

  // ==========================================
  // 1. WORKSPACE MANAGEMENT & SWITCHER
  // ==========================================

  /**
   * List all workspaces with pagination, filters, and search.
   */
  async findAll(query: WorkspaceQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (query.search) {
      conditions.push(
        `("w"."name" ILIKE $${paramIndex} OR "w"."slug" ILIKE $${paramIndex} OR "w"."description" ILIKE $${paramIndex})`,
      );
      params.push(`%${query.search}%`);
      paramIndex++;
    }

    if (query.status) {
      conditions.push(`"w"."status" = $${paramIndex}`);
      params.push(query.status);
      paramIndex++;
    }

    if (query.plan) {
      conditions.push(`"w"."plan" = $${paramIndex}`);
      params.push(query.plan);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Total count
    const countSql = `SELECT COUNT(*)::int AS count FROM "Workspace" "w" WHERE ${whereClause}`;
    const countResult: any[] = await this.prisma.$queryRawUnsafe(countSql, ...params);
    const total = countResult[0]?.count || 0;

    // Fetch workspaces
    const dataSql = `
      SELECT 
        "w"."id",
        "w"."name",
        "w"."slug",
        "w"."description",
        "w"."avatar",
        "w"."website",
        "w"."timezone",
        "w"."currency",
        "w"."status",
        "w"."plan",
        "w"."ownerId",
        "w"."createdAt",
        "w"."updatedAt",
        json_build_object(
          'id', "u"."id",
          'name', "u"."name",
          'email', "u"."email",
          'avatar', "u"."avatar"
        ) AS "owner",
        (SELECT COUNT(*)::int FROM "WorkspaceMember" "wm" WHERE "wm"."workspaceId" = "w"."id") AS "memberCount",
        (SELECT COUNT(*)::int FROM "WorkspaceInvite" "wi" WHERE "wi"."workspaceId" = "w"."id" AND "wi"."status" = 'PENDING') AS "inviteCount",
        (SELECT COUNT(*)::int FROM "WorkspaceRole" "wr" WHERE "wr"."workspaceId" = "w"."id") AS "roleCount"
      FROM "Workspace" "w"
      LEFT JOIN "User" "u" ON "w"."ownerId" = "u"."id"
      WHERE ${whereClause}
      ORDER BY "w"."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const rawItems: any[] = await this.prisma.$queryRawUnsafe(dataSql, ...params, limit, offset);

    const items: WorkspaceEntity[] = rawItems.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      avatar: row.avatar,
      website: row.website,
      timezone: row.timezone,
      currency: row.currency,
      status: row.status,
      plan: row.plan,
      ownerId: row.ownerId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      owner: row.owner,
      _count: {
        members: Number(row.memberCount || 0),
        invites: Number(row.inviteCount || 0),
        roles: Number(row.roleCount || 0),
      },
    }));

    return createPaginatedResponse(items, total, page, limit);
  }

  /**
   * Get all workspaces the currently authenticated user belongs to with active indicator.
   */
  async findMyWorkspaces(userId: string) {
    const activeWorkspaceId = await this.getUserActiveWorkspaceId(userId);

    const sql = `
      SELECT 
        "w"."id",
        "w"."name",
        "w"."slug",
        "w"."description",
        "w"."avatar",
        "w"."website",
        "w"."timezone",
        "w"."currency",
        "w"."status",
        "w"."plan",
        "w"."ownerId",
        "w"."createdAt",
        "w"."updatedAt",
        COALESCE("wm"."role", CASE WHEN "w"."ownerId" = $1 THEN 'OWNER' ELSE 'MEMBER' END) AS "myRole",
        "wm"."status" AS "memberStatus",
        (SELECT COUNT(*)::int FROM "WorkspaceMember" "m" WHERE "m"."workspaceId" = "w"."id") AS "memberCount",
        json_build_object(
          'id', "u"."id",
          'name', "u"."name",
          'email', "u"."email",
          'avatar', "u"."avatar"
        ) AS "owner"
      FROM "Workspace" "w"
      LEFT JOIN "User" "u" ON "w"."ownerId" = "u"."id"
      LEFT JOIN "WorkspaceMember" "wm" ON "w"."id" = "wm"."workspaceId" AND "wm"."userId" = $1
      WHERE "w"."ownerId" = $1 OR "wm"."userId" = $1
      ORDER BY "w"."updatedAt" DESC
    `;

    const workspaces: any[] = await this.prisma.$queryRawUnsafe(sql, userId);

    return workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      description: w.description,
      avatar: w.avatar,
      website: w.website,
      timezone: w.timezone,
      currency: w.currency,
      status: w.status,
      plan: w.plan,
      ownerId: w.ownerId,
      myRole: w.myRole,
      memberStatus: w.memberStatus || 'ACTIVE',
      isActive: activeWorkspaceId === w.id,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      owner: w.owner,
      _count: {
        members: Number(w.memberCount || 0),
      },
    }));
  }

  /**
   * Switch the current user's active workspace.
   */
  async switchWorkspace(workspaceId: string, userId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId);

    const workspaceRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM "Workspace" WHERE ${isUuid ? '"id" = $1' : '"slug" = $1'} LIMIT 1`,
      workspaceId,
    );

    if (!workspaceRows || workspaceRows.length === 0) {
      throw new NotFoundException(`Workspace '${workspaceId}' not found`);
    }

    const workspace = workspaceRows[0];
    if (workspace.status === 'ARCHIVED') {
      throw new ForbiddenException('Cannot switch to an archived workspace');
    }

    // Verify membership unless user is system admin or workspace owner
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const isSystemAdmin = user?.role?.name === 'ADMIN';
    const isOwner = workspace.ownerId === userId;

    let memberRole = 'MEMBER';
    let permissions: string[] = [];

    if (!isSystemAdmin && !isOwner) {
      const memberRows: any[] = await this.prisma.$queryRawUnsafe(
        `
        SELECT 
          "wm".*,
          "wr"."name" AS "customRoleName",
          "wr"."permissions" AS "customPermissions"
        FROM "WorkspaceMember" "wm"
        LEFT JOIN "WorkspaceRole" "wr" ON "wm"."roleId" = "wr"."id"
        WHERE "wm"."workspaceId" = $1 AND "wm"."userId" = $2
        LIMIT 1
        `,
        workspace.id,
        userId,
      );

      if (!memberRows || memberRows.length === 0) {
        throw new ForbiddenException('You are not a member of this workspace');
      }

      const member = memberRows[0];
      if (member.status !== 'ACTIVE') {
        throw new ForbiddenException(`Your membership in this workspace is ${member.status.toLowerCase()}`);
      }

      memberRole = member.customRoleName || member.role || 'MEMBER';
      permissions = member.customPermissions
        ? Array.isArray(member.customPermissions)
          ? member.customPermissions
          : JSON.parse(member.customPermissions || '[]')
        : ['workspace:read', 'contacts:read', 'deals:read'];
    } else {
      memberRole = 'OWNER';
      permissions = ['*'];
    }

    // Update activeWorkspaceId in User
    await this.setUserActiveWorkspaceId(userId, workspace.id);

    return {
      message: 'Switched workspace successfully',
      activeWorkspaceId: workspace.id,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        avatar: workspace.avatar,
        plan: workspace.plan,
        currency: workspace.currency,
        timezone: workspace.timezone,
      },
      memberRole,
      permissions,
    };
  }

  /**
   * Get currently active workspace for the user.
   */
  async getCurrentWorkspace(userId: string) {
    let targetWorkspaceId: string | null = await this.getUserActiveWorkspaceId(userId);

    if (!targetWorkspaceId) {
      const myWorkspaces = await this.findMyWorkspaces(userId);
      if (myWorkspaces.length === 0) {
        return null;
      }
      targetWorkspaceId = myWorkspaces[0].id;
      // Auto-set first workspace as active
      await this.setUserActiveWorkspaceId(userId, targetWorkspaceId);
    }

    return this.findOne(targetWorkspaceId);
  }

  /**
   * Create a new workspace, initialize default roles and settings, and register creator as OWNER.
   */
  async create(dto: CreateWorkspaceDto, currentUserId?: string) {
    let effectiveOwnerId = currentUserId;

    if (!effectiveOwnerId) {
      const defaultUser: any = await this.prisma.user.findFirst();
      if (!defaultUser) {
        throw new BadRequestException('No user available to assign as workspace owner');
      }
      effectiveOwnerId = defaultUser.id;
    }

    const ownerExists = await this.prisma.user.findUnique({
      where: { id: effectiveOwnerId },
      select: { id: true, name: true, email: true, avatar: true },
    });

    if (!ownerExists) {
      throw new NotFoundException(`User with ID ${effectiveOwnerId} not found`);
    }

    const rawSlug = dto.slug ? dto.slug.trim().toLowerCase() : this.generateSlug(dto.name);
    const slug = await this.ensureUniqueSlug(rawSlug);

    const workspaceId = crypto.randomUUID();
    const now = new Date();

    // 1. Insert Workspace
    const insertWorkspaceSql = `
      INSERT INTO "Workspace" (
        "id", "name", "slug", "description", "avatar", "website",
        "timezone", "currency", "status", "plan", "ownerId", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *
    `;

    await this.prisma.$queryRawUnsafe(
      insertWorkspaceSql,
      workspaceId,
      dto.name,
      slug,
      dto.description || null,
      dto.avatar || null,
      dto.website || null,
      dto.timezone || 'UTC',
      dto.currency || 'USD',
      dto.status || 'ACTIVE',
      dto.plan || 'FREE',
      effectiveOwnerId,
      now,
      now,
    );

    // 2. Initialize Built-in Workspace Roles
    const ownerRoleId = crypto.randomUUID();
    const adminRoleId = crypto.randomUUID();
    const memberRoleId = crypto.randomUUID();
    const viewerRoleId = crypto.randomUUID();

    const insertRoleSql = `
      INSERT INTO "WorkspaceRole" ("id", "workspaceId", "name", "description", "isSystem", "permissions", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
      ON CONFLICT ("workspaceId", "name") DO NOTHING
    `;

    await Promise.all([
      this.prisma.$queryRawUnsafe(
        insertRoleSql,
        ownerRoleId,
        workspaceId,
        'OWNER',
        'Workspace Owner with full system and administrative authority',
        true,
        JSON.stringify(['*']),
        now,
        now,
      ),
      this.prisma.$queryRawUnsafe(
        insertRoleSql,
        adminRoleId,
        workspaceId,
        'ADMIN',
        'Administrator with permission to manage members, roles, settings and CRM entities',
        true,
        JSON.stringify([
          'workspace:read',
          'workspace:update',
          'members:read',
          'members:invite',
          'members:update',
          'members:remove',
          'roles:read',
          'roles:manage',
          'settings:read',
          'settings:update',
          'contacts:read',
          'contacts:write',
          'contacts:delete',
          'leads:read',
          'leads:write',
          'deals:read',
          'deals:write',
          'reports:read',
        ]),
        now,
        now,
      ),
      this.prisma.$queryRawUnsafe(
        insertRoleSql,
        memberRoleId,
        workspaceId,
        'MEMBER',
        'Standard team member with day-to-day CRM access',
        true,
        JSON.stringify([
          'workspace:read',
          'members:read',
          'contacts:read',
          'contacts:write',
          'leads:read',
          'leads:write',
          'deals:read',
          'deals:write',
          'reports:read',
        ]),
        now,
        now,
      ),
      this.prisma.$queryRawUnsafe(
        insertRoleSql,
        viewerRoleId,
        workspaceId,
        'VIEWER',
        'Read-only observer with access to view records and reports',
        true,
        JSON.stringify([
          'workspace:read',
          'members:read',
          'contacts:read',
          'leads:read',
          'deals:read',
          'reports:read',
        ]),
        now,
        now,
      ),
    ]);

    // 3. Initialize Workspace Settings
    const settingId = crypto.randomUUID();
    const insertSettingSql = `
      INSERT INTO "WorkspaceSetting" (
        "id", "workspaceId", "general", "branding", "localization", "preferences", "security", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9
      )
      ON CONFLICT ("workspaceId") DO NOTHING
    `;

    await this.prisma.$queryRawUnsafe(
      insertSettingSql,
      settingId,
      workspaceId,
      JSON.stringify({ companyName: dto.name, supportEmail: ownerExists.email }),
      JSON.stringify({
        logoUrl: dto.avatar || null,
        faviconUrl: null,
        primaryColor: '#3b82f6',
        accentColor: '#10b981',
      }),
      JSON.stringify({
        timezone: dto.timezone || 'UTC',
        currency: dto.currency || 'USD',
        language: 'en',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
      }),
      JSON.stringify({ emailNotifications: true, autoAssignLeads: false, weeklyDigest: true }),
      JSON.stringify({
        enforceTwoFactor: false,
        sessionTimeoutMinutes: 1440,
        allowedEmailDomains: [],
        ipAllowlist: [],
      }),
      now,
      now,
    );

    // 4. Add Creator as WorkspaceMember with OWNER role
    const memberId = crypto.randomUUID();
    const insertMemberSql = `
      INSERT INTO "WorkspaceMember" (
        "id", "workspaceId", "userId", "roleId", "role", "status", "joinedAt", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, 'OWNER', 'ACTIVE', $5, $6, $7
      )
      ON CONFLICT ("workspaceId", "userId") DO NOTHING
    `;

    await this.prisma.$queryRawUnsafe(
      insertMemberSql,
      memberId,
      workspaceId,
      effectiveOwnerId,
      ownerRoleId,
      now,
      now,
      now,
    );

    // 5. Update user's activeWorkspaceId if empty
    await this.setUserActiveWorkspaceId(effectiveOwnerId, workspaceId);

    return this.findOne(workspaceId);
  }

  /**
   * Find single workspace by ID or Slug with relations.
   */
  async findOne(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const sql = `
      SELECT 
        "w"."id",
        "w"."name",
        "w"."slug",
        "w"."description",
        "w"."avatar",
        "w"."website",
        "w"."timezone",
        "w"."currency",
        "w"."status",
        "w"."plan",
        "w"."ownerId",
        "w"."createdAt",
        "w"."updatedAt",
        json_build_object(
          'id', "u"."id",
          'name', "u"."name",
          'email', "u"."email",
          'avatar', "u"."avatar"
        ) AS "owner"
      FROM "Workspace" "w"
      LEFT JOIN "User" "u" ON "w"."ownerId" = "u"."id"
      WHERE ${isUuid ? '"w"."id" = $1' : '"w"."slug" = $1'}
      LIMIT 1
    `;

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, idOrSlug);
    if (!rows || rows.length === 0) {
      throw new NotFoundException(`Workspace '${idOrSlug}' not found`);
    }

    const workspace = rows[0];

    const [members, invites, roles, settings] = await Promise.all([
      this.getMembers(workspace.id),
      this.getInvites(workspace.id),
      this.getRoles(workspace.id),
      this.getSettings(workspace.id),
    ]);

    return {
      ...workspace,
      members,
      invites,
      roles,
      settings,
      _count: {
        members: members.length,
        invites: invites.filter((i) => i.status === 'PENDING').length,
        roles: roles.length,
      },
    };
  }

  /**
   * Update workspace metadata.
   */
  async update(id: string, dto: UpdateWorkspaceDto, currentUserId?: string, userRole?: string) {
    const existing: any = await this.findOne(id);

    if (currentUserId && userRole !== 'ADMIN' && existing.ownerId !== currentUserId) {
      const isWorkspaceAdmin: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT "id" FROM "WorkspaceMember" WHERE "workspaceId" = $1 AND "userId" = $2 AND "role" IN ('OWNER', 'ADMIN')`,
        id,
        currentUserId,
      );
      if (!isWorkspaceAdmin || isWorkspaceAdmin.length === 0) {
        throw new ForbiddenException('Only workspace owners or administrators can update this workspace');
      }
    }

    let slug = existing.slug;
    if (dto.slug && dto.slug.trim().toLowerCase() !== existing.slug) {
      slug = await this.ensureUniqueSlug(dto.slug.trim().toLowerCase(), id);
    } else if (dto.name && !dto.slug && !existing.slug) {
      slug = await this.ensureUniqueSlug(this.generateSlug(dto.name), id);
    }

    const now = new Date();
    const updateSql = `
      UPDATE "Workspace"
      SET 
        "name" = COALESCE($1, "name"),
        "slug" = COALESCE($2, "slug"),
        "description" = COALESCE($3, "description"),
        "avatar" = COALESCE($4, "avatar"),
        "website" = COALESCE($5, "website"),
        "timezone" = COALESCE($6, "timezone"),
        "currency" = COALESCE($7, "currency"),
        "status" = COALESCE($8, "status"),
        "plan" = COALESCE($9, "plan"),
        "updatedAt" = $10
      WHERE "id" = $11
      RETURNING *
    `;

    await this.prisma.$queryRawUnsafe(
      updateSql,
      dto.name !== undefined ? dto.name : null,
      slug,
      dto.description !== undefined ? dto.description : null,
      dto.avatar !== undefined ? dto.avatar : null,
      dto.website !== undefined ? dto.website : null,
      dto.timezone !== undefined ? dto.timezone : null,
      dto.currency !== undefined ? dto.currency : null,
      dto.status !== undefined ? dto.status : null,
      dto.plan !== undefined ? dto.plan : null,
      now,
      id,
    );

    return this.findOne(id);
  }

  /**
   * Delete or archive workspace.
   */
  async remove(id: string, currentUserId?: string, userRole?: string) {
    const existing: any = await this.findOne(id);

    if (currentUserId && userRole !== 'ADMIN' && existing.ownerId !== currentUserId) {
      throw new ForbiddenException('Only the workspace owner or system administrator can delete this workspace');
    }

    // Unset activeWorkspaceId on users who have this active workspace
    await this.clearActiveWorkspaceId(id);

    // Delete workspace record (cascades to members, invites, roles, settings)
    await this.prisma.$queryRawUnsafe(`DELETE FROM "Workspace" WHERE "id" = $1`, id);

    return {
      message: 'Workspace deleted successfully',
      id,
    };
  }

  /**
   * Get workspace analytics.
   */
  async getMetrics(id: string): Promise<WorkspaceMetricsEntity> {
    const workspace: any = await this.findOne(id);

    const memberRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "userId" FROM "WorkspaceMember" WHERE "workspaceId" = $1 AND "status" = 'ACTIVE'`,
      id,
    );
    const memberIds = memberRows.map((m) => m.userId);
    if (!memberIds.includes(workspace.ownerId)) {
      memberIds.push(workspace.ownerId);
    }

    const [
      totalMembers,
      totalContacts,
      deals,
      pendingTasksCount,
      activeLeadsCount,
      recentActivities,
    ] = await Promise.all([
      Promise.resolve(memberIds.length),
      this.prisma.contact.count({
        where: {
          ownerId: { in: memberIds },
        },
      }),
      this.prisma.deal.findMany({
        where: {
          OR: [{ team: { workspaceId: id } }, { ownerId: { in: memberIds } }],
        },
        select: { id: true, value: true, status: true },
      }),
      this.prisma.task.count({
        where: {
          status: { not: 'COMPLETED' },
          OR: [{ assignedToId: { in: memberIds } }, { createdById: { in: memberIds } }],
        },
      }),
      this.prisma.lead.count({
        where: {
          status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] },
          OR: [{ team: { workspaceId: id } }, { ownerId: { in: memberIds } }],
        },
      }),
      this.prisma.activity.findMany({
        where: {
          OR: [{ team: { workspaceId: id } }, { assignedToId: { in: memberIds } }],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          subject: true,
          status: true,
          priority: true,
          scheduledAt: true,
        },
      }),
    ]);

    const totalWonRevenue = deals
      .filter((d) => d.status === 'WON')
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const openPipelineValue = deals
      .filter((d) => d.status === 'OPEN')
      .reduce((sum, d) => sum + (d.value || 0), 0);

    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      totalMembers,
      totalContacts,
      totalDeals: deals.length,
      totalWonRevenue,
      openPipelineValue,
      pendingTasksCount,
      activeLeadsCount,
      recentActivities: recentActivities.map((act) => ({
        id: act.id,
        type: act.type,
        subject: act.subject,
        status: act.status,
        priority: act.priority,
        scheduledAt: act.scheduledAt,
      })),
    };
  }

  // ==========================================
  // 2. WORKSPACE MEMBERS
  // ==========================================

  /**
   * List all members of a workspace.
   */
  async getMembers(workspaceId: string): Promise<WorkspaceMemberEntity[]> {
    const sql = `
      SELECT 
        "wm"."id",
        "wm"."workspaceId",
        "wm"."userId",
        "wm"."roleId",
        COALESCE("wr"."name", "wm"."role") AS "role",
        "wm"."status",
        "wm"."joinedAt",
        "wm"."createdAt",
        "wm"."updatedAt",
        json_build_object(
          'id', "u"."id",
          'name', "u"."name",
          'email', "u"."email",
          'avatar', "u"."avatar",
          'status', "u"."status"
        ) AS "user",
        CASE 
          WHEN "wr"."id" IS NOT NULL THEN json_build_object(
            'id', "wr"."id",
            'name', "wr"."name",
            'permissions', "wr"."permissions"
          )
          ELSE NULL
        END AS "workspaceRole"
      FROM "WorkspaceMember" "wm"
      JOIN "User" "u" ON "wm"."userId" = "u"."id"
      LEFT JOIN "WorkspaceRole" "wr" ON "wm"."roleId" = "wr"."id"
      WHERE "wm"."workspaceId" = $1
      ORDER BY 
        CASE "wm"."role" 
          WHEN 'OWNER' THEN 1
          WHEN 'ADMIN' THEN 2
          WHEN 'MEMBER' THEN 3
          ELSE 4 
        END,
        "wm"."joinedAt" ASC
    `;

    return this.prisma.$queryRawUnsafe(sql, workspaceId);
  }

  /**
   * Get a single workspace member by ID or userId.
   */
  async getMember(workspaceId: string, memberIdOrUserId: string): Promise<WorkspaceMemberEntity> {
    const sql = `
      SELECT 
        "wm"."id",
        "wm"."workspaceId",
        "wm"."userId",
        "wm"."roleId",
        COALESCE("wr"."name", "wm"."role") AS "role",
        "wm"."status",
        "wm"."joinedAt",
        "wm"."createdAt",
        "wm"."updatedAt",
        json_build_object(
          'id', "u"."id",
          'name', "u"."name",
          'email', "u"."email",
          'avatar', "u"."avatar",
          'status', "u"."status"
        ) AS "user",
        CASE 
          WHEN "wr"."id" IS NOT NULL THEN json_build_object(
            'id', "wr"."id",
            'name', "wr"."name",
            'permissions', "wr"."permissions"
          )
          ELSE NULL
        END AS "workspaceRole"
      FROM "WorkspaceMember" "wm"
      JOIN "User" "u" ON "wm"."userId" = "u"."id"
      LEFT JOIN "WorkspaceRole" "wr" ON "wm"."roleId" = "wr"."id"
      WHERE "wm"."workspaceId" = $1 AND ("wm"."id" = $2 OR "wm"."userId" = $2)
      LIMIT 1
    `;

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, workspaceId, memberIdOrUserId);
    if (!rows || rows.length === 0) {
      throw new NotFoundException(`Workspace member '${memberIdOrUserId}' not found`);
    }

    return rows[0];
  }

  /**
   * Add a member directly to the workspace.
   */
  async addMember(
    workspaceId: string,
    dto: AddWorkspaceMemberDto,
    currentUserId?: string,
    userRole?: string,
  ) {
    const workspace: any = await this.findOne(workspaceId);

    if (currentUserId && userRole !== 'ADMIN' && workspace.ownerId !== currentUserId) {
      const isWorkspaceAdmin: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT "id" FROM "WorkspaceMember" WHERE "workspaceId" = $1 AND "userId" = $2 AND "role" IN ('OWNER', 'ADMIN')`,
        workspaceId,
        currentUserId,
      );
      if (!isWorkspaceAdmin || isWorkspaceAdmin.length === 0) {
        throw new ForbiddenException('Only workspace owners or administrators can add members');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, name: true, email: true, avatar: true, status: true, activeWorkspaceId: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    const existing: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "id" FROM "WorkspaceMember" WHERE "workspaceId" = $1 AND "userId" = $2`,
      workspaceId,
      dto.userId,
    );

    if (existing && existing.length > 0) {
      throw new ConflictException('User is already a member of this workspace');
    }

    // Resolve role ID if matching role exists
    const roleName = dto.role || 'MEMBER';
    const roleRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "id" FROM "WorkspaceRole" WHERE "workspaceId" = $1 AND "name" = $2 LIMIT 1`,
      workspaceId,
      roleName,
    );
    const roleId = roleRows[0]?.id || null;

    const id = crypto.randomUUID();
    const now = new Date();

    const insertSql = `
      INSERT INTO "WorkspaceMember" (
        "id", "workspaceId", "userId", "roleId", "role", "status", "joinedAt", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, 'ACTIVE', $6, $7, $8
      ) RETURNING *
    `;

    await this.prisma.$queryRawUnsafe(
      insertSql,
      id,
      workspaceId,
      dto.userId,
      roleId,
      roleName,
      now,
      now,
      now,
    );

    // If user has no active workspace, set this one
    const currentActive = await this.getUserActiveWorkspaceId(dto.userId);
    if (!currentActive) {
      await this.setUserActiveWorkspaceId(dto.userId, workspaceId);
    }

    return this.getMember(workspaceId, id);
  }

  /**
   * Update member role or status.
   */
  async updateMember(
    workspaceId: string,
    memberIdOrUserId: string,
    dto: UpdateWorkspaceMemberDto,
    currentUserId?: string,
    userRole?: string,
  ) {
    const workspace: any = await this.findOne(workspaceId);
    const member = await this.getMember(workspaceId, memberIdOrUserId);

    if (currentUserId && userRole !== 'ADMIN' && workspace.ownerId !== currentUserId) {
      const isWorkspaceAdmin: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT "id" FROM "WorkspaceMember" WHERE "workspaceId" = $1 AND "userId" = $2 AND "role" IN ('OWNER', 'ADMIN')`,
        workspaceId,
        currentUserId,
      );
      if (!isWorkspaceAdmin || isWorkspaceAdmin.length === 0) {
        throw new ForbiddenException('Only workspace owners or administrators can modify members');
      }
    }

    if (workspace.ownerId === member.userId && dto.role && dto.role !== 'OWNER') {
      throw new BadRequestException('Cannot demote the primary owner of the workspace');
    }

    let roleId = dto.roleId;
    let role = dto.role;

    if (dto.roleId && !dto.role) {
      const roleRow: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT "name" FROM "WorkspaceRole" WHERE "id" = $1 AND "workspaceId" = $2 LIMIT 1`,
        dto.roleId,
        workspaceId,
      );
      if (roleRow.length > 0) {
        role = roleRow[0].name;
      }
    } else if (dto.role && !dto.roleId) {
      const roleRow: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT "id" FROM "WorkspaceRole" WHERE "name" = $1 AND "workspaceId" = $2 LIMIT 1`,
        dto.role,
        workspaceId,
      );
      if (roleRow.length > 0) {
        roleId = roleRow[0].id;
      }
    }

    const now = new Date();
    const updateSql = `
      UPDATE "WorkspaceMember"
      SET 
        "role" = COALESCE($1, "role"),
        "roleId" = COALESCE($2, "roleId"),
        "status" = COALESCE($3, "status"),
        "updatedAt" = $4
      WHERE "id" = $5
    `;

    await this.prisma.$queryRawUnsafe(
      updateSql,
      role || null,
      roleId || null,
      dto.status || null,
      now,
      member.id,
    );

    return this.getMember(workspaceId, member.id);
  }

  /**
   * Activate or deactivate a workspace member.
   */
  async updateMemberStatus(
    workspaceId: string,
    memberIdOrUserId: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    currentUserId?: string,
    userRole?: string,
  ) {
    return this.updateMember(workspaceId, memberIdOrUserId, { status }, currentUserId, userRole);
  }

  /**
   * Assign a specific workspace role to a member.
   */
  async assignMemberRole(
    workspaceId: string,
    memberIdOrUserId: string,
    roleOrRoleId: string,
    currentUserId?: string,
    userRole?: string,
  ) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roleOrRoleId);

    let roleName = roleOrRoleId;
    let roleId: string | undefined = isUuid ? roleOrRoleId : undefined;

    if (isUuid) {
      const roleRow: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT "name" FROM "WorkspaceRole" WHERE "id" = $1 AND "workspaceId" = $2 LIMIT 1`,
        roleOrRoleId,
        workspaceId,
      );
      if (roleRow.length === 0) {
        throw new NotFoundException(`Role with ID '${roleOrRoleId}' not found in workspace`);
      }
      roleName = roleRow[0].name;
    } else {
      const roleRow: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT "id" FROM "WorkspaceRole" WHERE "name" = $1 AND "workspaceId" = $2 LIMIT 1`,
        roleOrRoleId,
        workspaceId,
      );
      if (roleRow.length > 0) {
        roleId = roleRow[0].id;
      }
    }

    return this.updateMember(
      workspaceId,
      memberIdOrUserId,
      { role: roleName, roleId },
      currentUserId,
      userRole,
    );
  }

  /**
   * Remove a member from the workspace.
   */
  async removeMember(
    workspaceId: string,
    memberIdOrUserId: string,
    currentUserId?: string,
    userRole?: string,
  ) {
    const workspace: any = await this.findOne(workspaceId);
    const member = await this.getMember(workspaceId, memberIdOrUserId);

    if (workspace.ownerId === member.userId) {
      throw new BadRequestException('Cannot remove the workspace owner from the workspace');
    }

    if (
      currentUserId &&
      userRole !== 'ADMIN' &&
      workspace.ownerId !== currentUserId &&
      currentUserId !== member.userId
    ) {
      const isWorkspaceAdmin: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT "id" FROM "WorkspaceMember" WHERE "workspaceId" = $1 AND "userId" = $2 AND "role" IN ('OWNER', 'ADMIN')`,
        workspaceId,
        currentUserId,
      );
      if (!isWorkspaceAdmin || isWorkspaceAdmin.length === 0) {
        throw new ForbiddenException('Only workspace administrators can remove members');
      }
    }

    await this.prisma.$queryRawUnsafe(
      `DELETE FROM "WorkspaceMember" WHERE "id" = $1`,
      member.id,
    );

    // If activeWorkspaceId was this workspace, reset it
    const activeWs = await this.getUserActiveWorkspaceId(member.userId);
    if (activeWs === workspaceId) {
      await this.setUserActiveWorkspaceId(member.userId, null);
    }

    return {
      message: 'Member removed from workspace successfully',
      workspaceId,
      memberId: member.id,
      userId: member.userId,
    };
  }

  // ==========================================
  // 3. INVITATIONS
  // ==========================================

  /**
   * Create an email invitation. Prevents duplicate active invitations.
   */
  async createInvite(
    workspaceId: string,
    dto: InviteWorkspaceMemberDto,
    currentUserId?: string,
  ): Promise<WorkspaceInviteEntity> {
    await this.findOne(workspaceId);

    const email = dto.email.trim().toLowerCase();

    // Check if user is already an active member
    const existingMember: any[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT "wm"."id" FROM "WorkspaceMember" "wm"
      JOIN "User" "u" ON "wm"."userId" = "u"."id"
      WHERE "wm"."workspaceId" = $1 AND LOWER("u"."email") = $2
      LIMIT 1
      `,
      workspaceId,
      email,
    );

    if (existingMember && existingMember.length > 0) {
      throw new ConflictException(`User with email '${email}' is already a member of this workspace`);
    }

    // Check for duplicate pending invite
    const pendingInvite: any[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT "id", "expiresAt" FROM "WorkspaceInvite"
      WHERE "workspaceId" = $1 AND LOWER("email") = $2 AND "status" = 'PENDING'
      LIMIT 1
      `,
      workspaceId,
      email,
    );

    if (pendingInvite && pendingInvite.length > 0) {
      const existing = pendingInvite[0];
      if (new Date(existing.expiresAt).getTime() > Date.now()) {
        throw new ConflictException(
          `An active invitation is already pending for '${email}'. You may resend or cancel it.`,
        );
      }
    }

    // Resolve roleId
    let roleId = dto.roleId;
    const role = dto.role || 'MEMBER';
    if (!roleId) {
      const roleRow: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT "id" FROM "WorkspaceRole" WHERE "workspaceId" = $1 AND "name" = $2 LIMIT 1`,
        workspaceId,
        role,
      );
      roleId = roleRow[0]?.id || null;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
    const id = crypto.randomUUID();
    const now = new Date();

    const insertSql = `
      INSERT INTO "WorkspaceInvite" (
        "id", "workspaceId", "email", "roleId", "role", "token", "invitedById", "expiresAt", "status", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, $10
      )
      RETURNING *
    `;

    const rows: any[] = await this.prisma.$queryRawUnsafe(
      insertSql,
      id,
      workspaceId,
      email,
      roleId,
      role,
      token,
      currentUserId || null,
      expiresAt,
      now,
      now,
    );

    return rows[0];
  }

  /**
   * List workspace invitations with optional status filter.
   */
  async getInvites(workspaceId: string, status?: string): Promise<WorkspaceInviteEntity[]> {
    const conditions = ['"wi"."workspaceId" = $1'];
    const params: any[] = [workspaceId];

    if (status) {
      conditions.push('"wi"."status" = $2');
      params.push(status.toUpperCase());
    }

    const sql = `
      SELECT 
        "wi"."id",
        "wi"."workspaceId",
        "wi"."email",
        "wi"."roleId",
        "wi"."role",
        "wi"."token",
        "wi"."invitedById",
        "wi"."expiresAt",
        "wi"."status",
        "wi"."createdAt",
        "wi"."updatedAt",
        CASE
          WHEN "u"."id" IS NOT NULL THEN json_build_object(
            'id', "u"."id",
            'name', "u"."name",
            'email', "u"."email"
          )
          ELSE NULL
        END AS "invitedBy"
      FROM "WorkspaceInvite" "wi"
      LEFT JOIN "User" "u" ON "wi"."invitedById" = "u"."id"
      WHERE ${conditions.join(' AND ')}
      ORDER BY "wi"."createdAt" DESC
    `;

    return this.prisma.$queryRawUnsafe(sql, ...params);
  }

  /**
   * Resend an invitation: refreshes token & resets expiry date.
   */
  async resendInvite(workspaceId: string, inviteId: string, currentUserId?: string) {
    const inviteRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM "WorkspaceInvite" WHERE "id" = $1 AND "workspaceId" = $2 LIMIT 1`,
      inviteId,
      workspaceId,
    );

    if (!inviteRows || inviteRows.length === 0) {
      throw new NotFoundException(`Invitation '${inviteId}' not found in workspace`);
    }

    const invite = inviteRows[0];
    if (invite.status === 'ACCEPTED') {
      throw new BadRequestException('This invitation has already been accepted');
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);
    const now = new Date();

    const updateSql = `
      UPDATE "WorkspaceInvite"
      SET 
        "token" = $1,
        "expiresAt" = $2,
        "status" = 'PENDING',
        "invitedById" = COALESCE($3, "invitedById"),
        "updatedAt" = $4
      WHERE "id" = $5
      RETURNING *
    `;

    const updatedRows: any[] = await this.prisma.$queryRawUnsafe(
      updateSql,
      newToken,
      newExpiresAt,
      currentUserId || null,
      now,
      inviteId,
    );

    return {
      message: 'Invitation resent successfully with updated security token and expiry date',
      invitation: updatedRows[0],
    };
  }

  /**
   * Cancel / revoke an invitation.
   */
  async cancelInvite(workspaceId: string, inviteId: string) {
    const inviteRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "id", "status" FROM "WorkspaceInvite" WHERE "id" = $1 AND "workspaceId" = $2 LIMIT 1`,
      inviteId,
      workspaceId,
    );

    if (!inviteRows || inviteRows.length === 0) {
      throw new NotFoundException(`Invitation '${inviteId}' not found`);
    }

    const now = new Date();
    await this.prisma.$queryRawUnsafe(
      `UPDATE "WorkspaceInvite" SET "status" = 'CANCELLED', "updatedAt" = $1 WHERE "id" = $2`,
      now,
      inviteId,
    );

    return {
      message: 'Invitation cancelled successfully',
      inviteId,
      status: 'CANCELLED',
    };
  }

  /**
   * Accept an invitation using the invite token.
   */
  async acceptInvite(dto: AcceptWorkspaceInviteDto, currentUserId: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM "WorkspaceInvite" WHERE "token" = $1 LIMIT 1`,
      dto.token,
    );

    if (!rows || rows.length === 0) {
      throw new BadRequestException('Invalid invitation token');
    }

    const invite = rows[0];
    if (invite.status === 'ACCEPTED') {
      throw new BadRequestException('This invitation has already been accepted');
    }
    if (invite.status === 'CANCELLED') {
      throw new BadRequestException('This invitation has been cancelled by the workspace administrator');
    }
    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      await this.prisma.$queryRawUnsafe(
        `UPDATE "WorkspaceInvite" SET "status" = 'EXPIRED' WHERE "id" = $1`,
        invite.id,
      );
      throw new BadRequestException('This invitation has expired');
    }

    const memberId = crypto.randomUUID();
    const now = new Date();

    // Insert or update member
    await this.prisma.$queryRawUnsafe(
      `
      INSERT INTO "WorkspaceMember" (
        "id", "workspaceId", "userId", "roleId", "role", "status", "joinedAt", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, 'ACTIVE', $6, $7, $8
      )
      ON CONFLICT ("workspaceId", "userId") 
      DO UPDATE SET "status" = 'ACTIVE', "roleId" = $4, "role" = $5, "updatedAt" = $8
      `,
      memberId,
      invite.workspaceId,
      currentUserId,
      invite.roleId,
      invite.role,
      now,
      now,
      now,
    );

    // Mark invite as ACCEPTED
    await this.prisma.$queryRawUnsafe(
      `UPDATE "WorkspaceInvite" SET "status" = 'ACCEPTED', "updatedAt" = $1 WHERE "id" = $2`,
      now,
      invite.id,
    );

    // Set active workspace for user if currently unset
    const currentActive = await this.getUserActiveWorkspaceId(currentUserId);
    if (!currentActive) {
      await this.setUserActiveWorkspaceId(currentUserId, invite.workspaceId);
    }

    return {
      message: 'Workspace invitation accepted successfully',
      workspaceId: invite.workspaceId,
      role: invite.role,
    };
  }

  // ==========================================
  // 4. WORKSPACE ROLES & PERMISSIONS
  // ==========================================

  /**
   * List all roles in the workspace with permissions and assigned member counts.
   */
  async getRoles(workspaceId: string): Promise<WorkspaceRoleEntity[]> {
    const sql = `
      SELECT 
        "wr"."id",
        "wr"."workspaceId",
        "wr"."name",
        "wr"."description",
        "wr"."isSystem",
        "wr"."permissions",
        "wr"."createdAt",
        "wr"."updatedAt",
        (SELECT COUNT(*)::int FROM "WorkspaceMember" "wm" WHERE "wm"."roleId" = "wr"."id") AS "memberCount"
      FROM "WorkspaceRole" "wr"
      WHERE "wr"."workspaceId" = $1
      ORDER BY "wr"."isSystem" DESC, "wr"."name" ASC
    `;

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, workspaceId);

    return rows.map((r) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      name: r.name,
      description: r.description,
      isSystem: Boolean(r.isSystem),
      permissions: this.parsePermissions(r.permissions),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      _count: {
        members: Number(r.memberCount || 0),
      },
    }));
  }

  /**
   * Get a single workspace role by ID or Name.
   */
  async getRole(workspaceId: string, roleIdOrName: string): Promise<WorkspaceRoleEntity> {
    const sql = `
      SELECT 
        "wr"."id",
        "wr"."workspaceId",
        "wr"."name",
        "wr"."description",
        "wr"."isSystem",
        "wr"."permissions",
        "wr"."createdAt",
        "wr"."updatedAt",
        (SELECT COUNT(*)::int FROM "WorkspaceMember" "wm" WHERE "wm"."roleId" = "wr"."id") AS "memberCount"
      FROM "WorkspaceRole" "wr"
      WHERE "wr"."workspaceId" = $1 AND ("wr"."id" = $2 OR "wr"."name" = $2)
      LIMIT 1
    `;

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, workspaceId, roleIdOrName);
    if (!rows || rows.length === 0) {
      throw new NotFoundException(`Role '${roleIdOrName}' not found in workspace`);
    }

    const r = rows[0];
    return {
      id: r.id,
      workspaceId: r.workspaceId,
      name: r.name,
      description: r.description,
      isSystem: Boolean(r.isSystem),
      permissions: this.parsePermissions(r.permissions),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      _count: {
        members: Number(r.memberCount || 0),
      },
    };
  }

  /**
   * Create a new custom role within a workspace.
   */
  async createRole(workspaceId: string, dto: CreateWorkspaceRoleDto): Promise<WorkspaceRoleEntity> {
    await this.findOne(workspaceId);

    const name = dto.name.trim();

    // Check duplicate
    const existing: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "id" FROM "WorkspaceRole" WHERE "workspaceId" = $1 AND LOWER("name") = LOWER($2) LIMIT 1`,
      workspaceId,
      name,
    );

    if (existing && existing.length > 0) {
      throw new ConflictException(`Role with name '${name}' already exists in this workspace`);
    }

    const id = crypto.randomUUID();
    const now = new Date();

    const insertSql = `
      INSERT INTO "WorkspaceRole" (
        "id", "workspaceId", "name", "description", "isSystem", "permissions", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, false, $5::jsonb, $6, $7
      ) RETURNING *
    `;

    const rows: any[] = await this.prisma.$queryRawUnsafe(
      insertSql,
      id,
      workspaceId,
      name,
      dto.description || null,
      JSON.stringify(dto.permissions || []),
      now,
      now,
    );

    const r = rows[0];
    return {
      id: r.id,
      workspaceId: r.workspaceId,
      name: r.name,
      description: r.description,
      isSystem: false,
      permissions: this.parsePermissions(r.permissions),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      _count: { members: 0 },
    };
  }

  /**
   * Update a workspace role. Prevents renaming built-in system roles.
   */
  async updateRole(
    workspaceId: string,
    roleId: string,
    dto: UpdateWorkspaceRoleDto,
  ): Promise<WorkspaceRoleEntity> {
    const existing = await this.getRole(workspaceId, roleId);

    if (existing.isSystem && dto.name && dto.name !== existing.name) {
      throw new BadRequestException('Built-in system roles cannot be renamed');
    }

    if (dto.name && dto.name !== existing.name) {
      const duplicate: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT "id" FROM "WorkspaceRole" WHERE "workspaceId" = $1 AND LOWER("name") = LOWER($2) AND "id" != $3 LIMIT 1`,
        workspaceId,
        dto.name.trim(),
        existing.id,
      );
      if (duplicate.length > 0) {
        throw new ConflictException(`Role name '${dto.name}' is already in use`);
      }
    }

    const now = new Date();
    const updateSql = `
      UPDATE "WorkspaceRole"
      SET 
        "name" = COALESCE($1, "name"),
        "description" = COALESCE($2, "description"),
        "permissions" = CASE WHEN $3::text IS NOT NULL THEN $3::jsonb ELSE "permissions" END,
        "updatedAt" = $4
      WHERE "id" = $5 AND "workspaceId" = $6
    `;

    await this.prisma.$queryRawUnsafe(
      updateSql,
      dto.name ? dto.name.trim() : null,
      dto.description !== undefined ? dto.description : null,
      dto.permissions ? JSON.stringify(dto.permissions) : null,
      now,
      existing.id,
      workspaceId,
    );

    return this.getRole(workspaceId, existing.id);
  }

  /**
   * Delete a workspace role. System roles and roles with active members are protected.
   */
  async deleteRole(workspaceId: string, roleId: string) {
    const role = await this.getRole(workspaceId, roleId);

    if (role.isSystem) {
      throw new BadRequestException('Built-in system roles (OWNER, ADMIN, MEMBER, VIEWER) cannot be deleted');
    }

    if (role._count?.members && role._count.members > 0) {
      throw new ConflictException(
        `Cannot delete role '${role.name}' because ${role._count.members} member(s) are currently assigned to it. Reassign them first.`,
      );
    }

    await this.prisma.$queryRawUnsafe(
      `DELETE FROM "WorkspaceRole" WHERE "id" = $1 AND "workspaceId" = $2`,
      role.id,
      workspaceId,
    );

    return {
      message: `Role '${role.name}' deleted successfully`,
      roleId: role.id,
    };
  }

  // ==========================================
  // 5. WORKSPACE SETTINGS
  // ==========================================

  /**
   * Get all workspace settings (general, branding, localization, preferences, security).
   */
  async getSettings(workspaceId: string): Promise<WorkspaceSettingEntity> {
    const sql = `SELECT * FROM "WorkspaceSetting" WHERE "workspaceId" = $1 LIMIT 1`;
    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, workspaceId);

    if (rows && rows.length > 0) {
      const s = rows[0];
      return {
        id: s.id,
        workspaceId: s.workspaceId,
        general: typeof s.general === 'string' ? JSON.parse(s.general) : s.general || {},
        branding: typeof s.branding === 'string' ? JSON.parse(s.branding) : s.branding || {},
        localization:
          typeof s.localization === 'string' ? JSON.parse(s.localization) : s.localization || {},
        preferences:
          typeof s.preferences === 'string' ? JSON.parse(s.preferences) : s.preferences || {},
        security: typeof s.security === 'string' ? JSON.parse(s.security) : s.security || {},
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    }

    // Auto-initialize if not found
    const id = crypto.randomUUID();
    const now = new Date();
    const workspace: any = await this.findOne(workspaceId);

    const insertSql = `
      INSERT INTO "WorkspaceSetting" (
        "id", "workspaceId", "general", "branding", "localization", "preferences", "security", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9
      ) RETURNING *
    `;

    const inserted: any[] = await this.prisma.$queryRawUnsafe(
      insertSql,
      id,
      workspaceId,
      JSON.stringify({ companyName: workspace.name }),
      JSON.stringify({
        logoUrl: workspace.avatar || null,
        faviconUrl: null,
        primaryColor: '#3b82f6',
        accentColor: '#10b981',
      }),
      JSON.stringify({
        timezone: workspace.timezone || 'UTC',
        currency: workspace.currency || 'USD',
        language: 'en',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
      }),
      JSON.stringify({ emailNotifications: true, autoAssignLeads: false, weeklyDigest: true }),
      JSON.stringify({
        enforceTwoFactor: false,
        sessionTimeoutMinutes: 1440,
        allowedEmailDomains: [],
        ipAllowlist: [],
      }),
      now,
      now,
    );

    const s = inserted[0];
    return {
      id: s.id,
      workspaceId: s.workspaceId,
      general: typeof s.general === 'string' ? JSON.parse(s.general) : s.general,
      branding: typeof s.branding === 'string' ? JSON.parse(s.branding) : s.branding,
      localization: typeof s.localization === 'string' ? JSON.parse(s.localization) : s.localization,
      preferences: typeof s.preferences === 'string' ? JSON.parse(s.preferences) : s.preferences,
      security: typeof s.security === 'string' ? JSON.parse(s.security) : s.security,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  /**
   * Update full or partial workspace settings.
   */
  async updateSettings(
    workspaceId: string,
    dto: UpdateWorkspaceSettingsDto,
  ): Promise<WorkspaceSettingEntity> {
    const current = await this.getSettings(workspaceId);

    const updatedGeneral = { ...current.general, ...dto.general };
    const updatedBranding = { ...current.branding, ...dto.branding };
    const updatedLocalization = { ...current.localization, ...dto.localization };
    const updatedPreferences = { ...current.preferences, ...dto.preferences };
    const updatedSecurity = { ...current.security, ...dto.security };
    const now = new Date();

    const sql = `
      UPDATE "WorkspaceSetting"
      SET 
        "general" = $1::jsonb,
        "branding" = $2::jsonb,
        "localization" = $3::jsonb,
        "preferences" = $4::jsonb,
        "security" = $5::jsonb,
        "updatedAt" = $6
      WHERE "workspaceId" = $7
    `;

    await this.prisma.$queryRawUnsafe(
      sql,
      JSON.stringify(updatedGeneral),
      JSON.stringify(updatedBranding),
      JSON.stringify(updatedLocalization),
      JSON.stringify(updatedPreferences),
      JSON.stringify(updatedSecurity),
      now,
      workspaceId,
    );

    return this.getSettings(workspaceId);
  }

  /**
   * Update workspace branding settings specifically.
   */
  async updateBranding(workspaceId: string, dto: UpdateBrandingSettingsDto) {
    return this.updateSettings(workspaceId, { branding: dto });
  }

  /**
   * Update workspace localization settings specifically.
   */
  async updateLocalization(workspaceId: string, dto: UpdateLocalizationSettingsDto) {
    return this.updateSettings(workspaceId, { localization: dto });
  }

  /**
   * Update workspace preferences settings specifically.
   */
  async updatePreferences(workspaceId: string, dto: UpdatePreferencesSettingsDto) {
    return this.updateSettings(workspaceId, { preferences: dto });
  }

  /**
   * Update workspace security settings specifically.
   */
  async updateSecurity(workspaceId: string, dto: UpdateSecuritySettingsDto) {
    return this.updateSettings(workspaceId, { security: dto });
  }
}
