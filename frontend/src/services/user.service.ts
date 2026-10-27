import { api } from './api';
import type { User } from '../types/auth.types';
import type {
  PaginatedUsersResponse,
  UserQueryFilters,
  CreateUserPayload,
  UpdateUserPayload,
  UserStatus,
  UserRole,
  UserActivityEntity,
  UserTaskEntity,
  UserDealEntity,
} from '../types/user.types';

class UserService {
  /**
   * List users with pagination, filters, and search
   */
  async getUsers(query?: UserQueryFilters): Promise<PaginatedUsersResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.search?.trim()) params.append('search', query.search.trim());
    if (query?.status) params.append('status', query.status);
    if (query?.roleId) params.append('roleId', query.roleId);
    if (query?.organizationId) params.append('organizationId', query.organizationId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get<any>(`/users${queryString}`);

    if (response?.data && response?.meta) {
      return response as PaginatedUsersResponse;
    }
    if (Array.isArray(response)) {
      return {
        data: response,
        meta: {
          total: response.length,
          page: 1,
          limit: response.length || 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    return response?.data || response;
  }

  /**
   * Get user by ID with full role, permissions, and organization
   */
  async getUserById(id: string): Promise<User> {
    const res = await api.get<any>(`/users/${id}`);
    return res?.data || res;
  }

  /**
   * Create a new user (with temporary/initial password)
   */
  async createUser(payload: CreateUserPayload): Promise<User> {
    const res = await api.post<any>('/users', payload);
    return res?.data || res;
  }

  /**
   * Update an existing user's details
   */
  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const res = await api.patch<any>(`/users/${id}`, payload);
    return res?.data || res;
  }

  /**
   * Update user status (ACTIVE, INACTIVE, SUSPENDED)
   */
  async updateUserStatus(id: string, status: UserStatus): Promise<User> {
    const res = await api.patch<any>(`/users/${id}/status`, { status });
    return res?.data || res;
  }

  /**
   * Assign a new role to user
   */
  async updateUserRole(id: string, roleId: string): Promise<User> {
    const res = await api.patch<any>(`/users/${id}/role`, { roleId });
    return res?.data || res;
  }

  /**
   * Delete user by ID
   */
  async deleteUser(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/users/${id}`);
    return res?.data || res;
  }

  /**
   * Get all activities assigned to or created by user
   */
  async getUserActivities(id: string): Promise<UserActivityEntity[]> {
    const res = await api.get<any>(`/users/${id}/activities`);
    const data = res?.data || res;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get all tasks assigned to or created by user
   */
  async getUserTasks(id: string): Promise<UserTaskEntity[]> {
    const res = await api.get<any>(`/users/${id}/tasks`);
    const data = res?.data || res;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get all deals owned by user
   */
  async getUserDeals(id: string): Promise<UserDealEntity[]> {
    const res = await api.get<any>(`/users/${id}/deals`);
    const data = res?.data || res;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Fetch system roles for role selection dropdowns
   */
  async getRoles(): Promise<UserRole[]> {
    try {
      const res = await api.get<any>('/roles');
      const data = res?.data || res;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }
}

export const userService = new UserService();
