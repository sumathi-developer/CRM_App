import { api } from './api';
import type {
  RoleEntity,
  SystemPermission,
  CreateRolePayload,
  UpdateRolePayload,
  UpdateRolePermissionsPayload,
} from '../types/role.types';

class RoleService {
  private permissionsCache: SystemPermission[] | null = null;
  private rolesCache = new Map<string, { role: RoleEntity; timestamp: number }>();
  private readonly CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

  /**
   * Get cached permissions from memory or sessionStorage
   */
  getCachedPermissions(): SystemPermission[] | null {
    if (this.permissionsCache && this.permissionsCache.length > 0) {
      return this.permissionsCache;
    }
    try {
      const stored = sessionStorage.getItem('crm_cached_permissions');
      if (stored) {
        this.permissionsCache = JSON.parse(stored);
        return this.permissionsCache;
      }
    } catch {}
    return null;
  }

  /**
   * Cache permissions in memory and sessionStorage
   */
  setCachedPermissions(perms: SystemPermission[]) {
    if (Array.isArray(perms) && perms.length > 0) {
      this.permissionsCache = perms;
      try {
        sessionStorage.setItem('crm_cached_permissions', JSON.stringify(perms));
      } catch {}
    }
  }

  /**
   * Get cached role by ID if fresh
   */
  getCachedRole(id?: string): RoleEntity | null {
    if (!id) return null;
    const entry = this.rolesCache.get(id);
    if (entry && Date.now() - entry.timestamp < this.CACHE_TTL_MS) {
      return entry.role;
    }
    return null;
  }

  /**
   * Store role in cache
   */
  setCachedRole(role: RoleEntity) {
    if (role && role.id) {
      this.rolesCache.set(role.id, { role, timestamp: Date.now() });
    }
  }

  /**
   * Clear role cache
   */
  clearCache() {
    this.rolesCache.clear();
    this.permissionsCache = null;
    try {
      sessionStorage.removeItem('crm_cached_permissions');
    } catch {}
  }

  /**
   * List all user roles with permission and user counts
   */
  async getRoles(): Promise<RoleEntity[]> {
    const response = await api.get<any>('/roles');
    const data = response?.data || response;
    const roles = Array.isArray(data) ? data : [];
    for (const r of roles) {
      this.setCachedRole(r);
    }
    return roles;
  }

  /**
   * Get role details, assigned permissions, and enrolled users
   */
  async getRoleById(id: string, allowCache = true): Promise<RoleEntity> {
    if (allowCache) {
      const cached = this.getCachedRole(id);
      if (cached && cached.permissions && cached.permissions.length > 0) {
        return cached;
      }
    }
    const response = await api.get<any>(`/roles/${id}`);
    const role = (response?.data || response) as RoleEntity;
    this.setCachedRole(role);
    return role;
  }

  /**
   * Create a new role with initial permissions
   */
  async createRole(payload: CreateRolePayload): Promise<RoleEntity> {
    const response = await api.post<any>('/roles', payload);
    const role = (response?.data || response) as RoleEntity;
    this.setCachedRole(role);
    return role;
  }

  /**
   * Update role metadata (name, description)
   */
  async updateRole(id: string, payload: UpdateRolePayload): Promise<RoleEntity> {
    const response = await api.patch<any>(`/roles/${id}`, payload);
    const role = (response?.data || response) as RoleEntity;
    this.setCachedRole(role);
    return role;
  }

  /**
   * Delete a custom role (system roles cannot be deleted)
   */
  async deleteRole(id: string): Promise<{ message: string }> {
    const response = await api.delete<any>(`/roles/${id}`);
    this.rolesCache.delete(id);
    return (response?.data || response) as { message: string };
  }

  /**
   * List all available system permissions ordered by resource & action
   */
  async getPermissions(allowCache = true): Promise<SystemPermission[]> {
    if (allowCache) {
      const cached = this.getCachedPermissions();
      if (cached && cached.length > 0) {
        return cached;
      }
    }
    const response = await api.get<any>('/permissions');
    const data = response?.data || response;
    const perms = Array.isArray(data) ? data : [];
    this.setCachedPermissions(perms);
    return perms;
  }

  /**
   * Get permissions granted to a specific role
   */
  async getRolePermissions(roleId: string): Promise<SystemPermission[]> {
    const response = await api.get<any>(`/roles/${roleId}/permissions`);
    const data = response?.data || response;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Replace all permissions assigned to a role
   */
  async updateRolePermissions(
    roleId: string,
    payload: UpdateRolePermissionsPayload,
  ): Promise<SystemPermission[]> {
    const response = await api.put<any>(`/roles/${roleId}/permissions`, payload);
    const data = response?.data || response;
    this.rolesCache.delete(roleId);
    return Array.isArray(data) ? data : [];
  }
}

export const roleService = new RoleService();
