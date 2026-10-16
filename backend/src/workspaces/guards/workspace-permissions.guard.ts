import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WORKSPACE_PERMISSIONS_KEY } from '../decorators/workspace-permissions.decorator';

@Injectable()
export class WorkspacePermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      WORKSPACE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const permissions: string[] = request.workspacePermissions || [];

    // System administrator bypass
    const systemRole = user?.role?.name || user?.role;
    if (systemRole === 'ADMIN') {
      return true;
    }

    // Workspace owner wildcard check
    if (permissions.includes('*') || request.workspaceRole === 'OWNER') {
      return true;
    }

    const missingPermissions = requiredPermissions.filter((p) => !permissions.includes(p));
    if (missingPermissions.length > 0) {
      throw new ForbiddenException(
        `Workspace member lacks required permissions: ${missingPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
