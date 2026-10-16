import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Determine target workspace ID from headers, route parameters, or query
    const workspaceId =
      request.headers['x-workspace-id'] ||
      request.params.workspaceId ||
      request.params.id ||
      request.query.workspaceId ||
      user.activeWorkspaceId;

    if (!workspaceId) {
      // If no workspace context specified in request, let route handle or check if user has active workspace
      return true;
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId);

    // Fetch workspace
    const workspaceRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM "Workspace" WHERE ${isUuid ? '"id" = $1' : '"slug" = $1'} LIMIT 1`,
      workspaceId,
    );

    if (!workspaceRows || workspaceRows.length === 0) {
      throw new NotFoundException(`Workspace '${workspaceId}' not found`);
    }

    const workspace = workspaceRows[0];
    if (workspace.status === 'ARCHIVED') {
      throw new ForbiddenException('This workspace is archived and cannot be accessed');
    }

    // Check system admin role
    const systemRole = user.role?.name || user.role;
    if (systemRole === 'ADMIN') {
      request.workspace = workspace;
      request.workspaceMember = {
        role: 'OWNER',
        status: 'ACTIVE',
        userId: user.id,
        workspaceId: workspace.id,
      };
      request.workspaceRole = 'OWNER';
      request.workspacePermissions = ['*'];
      return true;
    }

    // Check if user is workspace owner
    if (workspace.ownerId === user.id) {
      request.workspace = workspace;
      request.workspaceMember = {
        role: 'OWNER',
        status: 'ACTIVE',
        userId: user.id,
        workspaceId: workspace.id,
      };
      request.workspaceRole = 'OWNER';
      request.workspacePermissions = ['*'];
      return true;
    }

    // Query WorkspaceMember
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
      user.id,
    );

    if (!memberRows || memberRows.length === 0) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const member = memberRows[0];
    if (member.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `Your workspace membership is currently ${member.status.toLowerCase()}`,
      );
    }

    const effectiveRole = member.customRoleName || member.role || 'MEMBER';
    let permissions: string[] = [];

    if (effectiveRole === 'OWNER') {
      permissions = ['*'];
    } else if (member.customPermissions) {
      permissions = Array.isArray(member.customPermissions)
        ? member.customPermissions
        : JSON.parse(member.customPermissions || '[]');
    } else {
      // Default built-in role permissions
      switch (effectiveRole) {
        case 'ADMIN':
          permissions = [
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
          ];
          break;
        case 'MEMBER':
          permissions = [
            'workspace:read',
            'members:read',
            'contacts:read',
            'contacts:write',
            'leads:read',
            'leads:write',
            'deals:read',
            'deals:write',
            'reports:read',
          ];
          break;
        case 'VIEWER':
          permissions = [
            'workspace:read',
            'members:read',
            'contacts:read',
            'leads:read',
            'deals:read',
            'reports:read',
          ];
          break;
        default:
          permissions = ['workspace:read'];
          break;
      }
    }

    request.workspace = workspace;
    request.workspaceMember = member;
    request.workspaceRole = effectiveRole;
    request.workspacePermissions = permissions;

    return true;
  }
}
