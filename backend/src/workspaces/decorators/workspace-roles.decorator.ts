import { SetMetadata } from '@nestjs/common';

export const WORKSPACE_ROLES_KEY = 'workspace_roles';
export const WorkspaceRoles = (...roles: string[]) => SetMetadata(WORKSPACE_ROLES_KEY, roles);
