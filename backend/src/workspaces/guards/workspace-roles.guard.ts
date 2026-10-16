import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WORKSPACE_ROLES_KEY } from '../decorators/workspace-roles.decorator';

@Injectable()
export class WorkspaceRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(WORKSPACE_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceRole = request.workspaceRole;

    // System administrator bypass
    const systemRole = user?.role?.name || user?.role;
    if (systemRole === 'ADMIN') {
      return true;
    }

    if (!workspaceRole) {
      throw new ForbiddenException('Workspace context is not established for this request');
    }

    // Owner has superuser rights in their workspace
    if (workspaceRole === 'OWNER') {
      return true;
    }

    const hasRole = requiredRoles.includes(workspaceRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Workspace role '${workspaceRole}' does not satisfy required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
