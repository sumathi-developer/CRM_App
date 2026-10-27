import { api } from './api';
import type {
  RoleEntity,
  SystemPermission,
  CreateRolePayload,
  UpdateRolePayload,
  UpdateRolePermissionsPayload,
} from '../types/role.types';

class RoleService {
  /**
   * List all user roles with permission and user counts
   */
  async getRoles(): Promise<RoleEntity[]> {
    const response = await api.get<any>('/roles');
    const data = response?.data || response;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get role details, assigned permissions, and enrolled users
   */
  async getRoleById(id: string): Promise<RoleEntity> {
    const response = await api.get<any>(`/roles/${id}`);
    return (response?.data || response) as RoleEntity;
  }

  /**
   * Create a new role with initial permissions
   */
  async createRole(payload: CreateRolePayload): Promise<RoleEntity> {
    const response = await api.post<any>('/roles', payload);
    return (response?.data || response) as RoleEntity;
  }

  /**
   * Update role metadata (name, description)
   */
  async updateRole(id: string, payload: UpdateRolePayload): Promise<RoleEntity> {
    const response = await api.patch<any>(`/roles/${id}`, payload);
    return (response?.data || response) as RoleEntity;
  }

  /**
   * Delete a custom role (system roles cannot be deleted)
   */
  async deleteRole(id: string): Promise<{ message: string }> {
    const response = await api.delete<any>(`/roles/${id}`);
    return (response?.data || response) as { message: string };
  }

  /**
   * List all available system permissions ordered by resource & action
   */
  async getPermissions(): Promise<SystemPermission[]> {
    const response = await api.get<any>('/permissions');
    const data = response?.data || response;
    return Array.isArray(data) ? data : [];
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
    return Array.isArray(data) ? data : [];
  }
}

export const roleService = new RoleService();
