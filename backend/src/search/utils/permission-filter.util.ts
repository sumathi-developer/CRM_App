import { SearchEntityType } from '../interfaces/search-result.interface';

export interface UserSearchContext {
  userId: string;
  userRole?: string;
  organizationId?: string | null;
  activeWorkspaceId?: string | null;
  workspacePermissions?: string[];
  workspaceRole?: string;
  isSystemAdmin?: boolean;
}

export class PermissionFilter {
  /**
   * Determine whether the user is permitted to search a specific entity type.
   */
  static canAccessEntity(entityType: SearchEntityType, context: UserSearchContext): boolean {
    // 1. System administrators have global access
    if (context.isSystemAdmin || context.userRole === 'ADMIN') {
      return true;
    }

    // 2. Workspace owners have complete access in workspace
    if (context.workspaceRole === 'OWNER') {
      return true;
    }

    const perms = context.workspacePermissions || [];
    const hasWildcard = perms.includes('*');
    if (hasWildcard) return true;

    switch (entityType) {
      case 'LEADS':
        return perms.includes('leads:read');

      case 'CONTACTS':
        return perms.includes('contacts:read');

      case 'DEALS':
        return perms.includes('deals:read');

      case 'COMPANIES':
        return (
          perms.includes('workspace:read') ||
          perms.includes('organizations:read') ||
          perms.includes('members:read')
        );

      case 'ACTIVITIES':
        return (
          perms.includes('activities:read') ||
          perms.includes('contacts:read') ||
          perms.includes('leads:read') ||
          perms.includes('deals:read')
        );

      case 'DOCUMENTS':
        return (
          perms.includes('files:read') ||
          perms.includes('documents:read') ||
          perms.includes('contacts:read')
        );

      case 'NOTES':
        return (
          perms.includes('notes:read') ||
          perms.includes('contacts:read') ||
          perms.includes('leads:read') ||
          perms.includes('deals:read')
        );

      case 'USERS':
        return perms.includes('members:read') || perms.includes('users:read');

      default:
        return false;
    }
  }

  /**
   * Filter the requested entity list down to only those the user is permitted to view.
   */
  static filterAllowedEntities(
    requestedEntities: string[] | undefined,
    context: UserSearchContext,
  ): SearchEntityType[] {
    const allEntities: SearchEntityType[] = [
      'LEADS',
      'CONTACTS',
      'COMPANIES',
      'DEALS',
      'ACTIVITIES',
      'DOCUMENTS',
      'NOTES',
      'USERS',
    ];

    let targetEntities = allEntities;

    if (requestedEntities && requestedEntities.length > 0) {
      const normalizedRequested = requestedEntities.map((e) => e.toUpperCase().trim());
      targetEntities = allEntities.filter((e) => normalizedRequested.includes(e));
    }

    // Strictly retain only permitted entities
    return targetEntities.filter((entity) => this.canAccessEntity(entity, context));
  }

  /**
   * Extract standardized UserSearchContext from request and user payload.
   */
  static extractUserSearchContext(user: any, workspaceContext?: any): UserSearchContext {
    const roleName = user?.role?.name || user?.role || 'MEMBER';
    const isSystemAdmin = roleName === 'ADMIN';

    // Default permissions if not populated by workspace guard
    let workspacePermissions: string[] = workspaceContext?.permissions || user?.workspacePermissions || [];
    if (workspacePermissions.length === 0) {
      if (isSystemAdmin) {
        workspacePermissions = ['*'];
      } else {
        // Standard member defaults
        workspacePermissions = [
          'workspace:read',
          'members:read',
          'contacts:read',
          'leads:read',
          'deals:read',
          'activities:read',
          'files:read',
          'notes:read',
        ];
      }
    }

    return {
      userId: user?.id,
      userRole: roleName,
      organizationId: user?.organizationId || workspaceContext?.organizationId,
      activeWorkspaceId:
        workspaceContext?.id || user?.activeWorkspaceId || user?.workspaceId,
      workspacePermissions,
      workspaceRole: workspaceContext?.role || (isSystemAdmin ? 'OWNER' : 'MEMBER'),
      isSystemAdmin,
    };
  }
}
