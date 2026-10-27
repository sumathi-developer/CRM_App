export interface SystemPermission {
  id: string;
  name: string;
  action: string;
  resource: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolePermissionRel {
  id: string;
  roleId: string;
  permissionId: string;
  permission: SystemPermission;
}

export interface RoleAssignedUser {
  id: string;
  name: string;
  email: string;
  status: string;
  avatar?: string | null;
}

export interface RoleEntity {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: RolePermissionRel[];
  users?: RoleAssignedUser[];
  _count?: {
    users?: number;
    permissions?: number;
  };
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
}

export interface UpdateRolePermissionsPayload {
  permissionIds: string[];
}

export interface ResourcePermissionGroup {
  resource: string;
  displayName: string;
  permissions: SystemPermission[];
}
