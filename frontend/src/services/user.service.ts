import { api } from './api';
import type {
  User,
  Role,
  Organization,
  UserQuery,
  PaginatedUsersResponse,
  CreateUserPayload,
  UpdateUserPayload,
  UserStatus,
  UserActivity,
  UserTask,
  UserDeal,
  UserPerformanceMetrics,
} from '../types/user.types';

export const userService = {
  /**
   * List all users with pagination, filters, and search
   */
  async getUsers(query?: UserQuery): Promise<PaginatedUsersResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.search) params.append('search', query.search);
    if (query?.status && query.status !== 'ALL') params.append('status', query.status);
    if (query?.roleId && query.roleId !== 'ALL') params.append('roleId', query.roleId);
    if (query?.organizationId) params.append('organizationId', query.organizationId);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get<PaginatedUsersResponse>(`/users${qs}`);
  },

  /**
   * Get user details by ID
   */
  async getUserById(id: string): Promise<User> {
    return api.get<User>(`/users/${id}`);
  },

  /**
   * Create a new user account
   */
  async createUser(payload: CreateUserPayload): Promise<User> {
    return api.post<User>('/users', payload);
  },

  /**
   * Update user information (name, email, phone, avatar, role, status)
   */
  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    return api.patch<User>(`/users/${id}`, payload);
  },

  /**
   * Update user status (ACTIVE, INACTIVE, SUSPENDED)
   */
  async updateUserStatus(id: string, status: UserStatus): Promise<User> {
    return api.patch<User>(`/users/${id}/status`, { status });
  },

  /**
   * Update user role
   */
  async updateUserRole(id: string, roleId: string): Promise<User> {
    return api.patch<User>(`/users/${id}/role`, { roleId });
  },

  /**
   * Delete user by ID (Admin only)
   */
  async deleteUser(id: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/users/${id}`);
  },

  /**
   * Get all activities assigned to or created by user
   */
  async getUserActivities(id: string): Promise<UserActivity[]> {
    return api.get<UserActivity[]>(`/users/${id}/activities`);
  },

  /**
   * Get all tasks assigned to or created by user
   */
  async getUserTasks(id: string): Promise<UserTask[]> {
    return api.get<UserTask[]>(`/users/${id}/tasks`);
  },

  /**
   * Get all deals owned by user
   */
  async getUserDeals(id: string): Promise<UserDeal[]> {
    return api.get<UserDeal[]>(`/users/${id}/deals`);
  },

  /**
   * Get all system and custom roles
   */
  async getRoles(): Promise<Role[]> {
    try {
      return await api.get<Role[]>('/roles');
    } catch {
      return [];
    }
  },

  /**
   * Get all organizations for selection
   */
  async getOrganizations(): Promise<Organization[]> {
    try {
      const res = await api.get<{ data?: Organization[] } | Organization[]>('/organizations');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Compute aggregated CRM performance metrics from deals, tasks, and activities
   */
  calculatePerformance(
    deals: UserDeal[] = [],
    tasks: UserTask[] = [],
    activities: UserActivity[] = []
  ): UserPerformanceMetrics {
    const totalDeals = deals.length;
    const wonDeals = deals.filter((d) => d.status === 'WON').length;
    const lostDeals = deals.filter((d) => d.status === 'LOST').length;
    const openDeals = deals.filter((d) => d.status === 'OPEN' || !d.status).length;

    const wonRevenue = deals
      .filter((d) => d.status === 'WON')
      .reduce((sum, d) => sum + (Number(d.value) || 0), 0);

    const totalPipelineValue = deals
      .filter((d) => d.status === 'OPEN' || !d.status)
      .reduce((sum, d) => sum + (Number(d.value) || 0), 0);

    const closedDeals = wonDeals + lostDeals;
    const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;
    const avgDealSize = totalDeals > 0
      ? Math.round(deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0) / totalDeals)
      : 0;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED').length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalActivities = activities.length;
    const activityBreakdown = {
      calls: activities.filter((a) => (a.type || '').toUpperCase() === 'CALL').length,
      emails: activities.filter((a) => (a.type || '').toUpperCase() === 'EMAIL').length,
      meetings: activities.filter((a) => (a.type || '').toUpperCase() === 'MEETING').length,
      followUps: activities.filter((a) => (a.type || '').toUpperCase() === 'FOLLOW_UP').length,
      others: activities.filter(
        (a) => !['CALL', 'EMAIL', 'MEETING', 'FOLLOW_UP'].includes((a.type || '').toUpperCase())
      ).length,
    };

    return {
      totalDeals,
      openDeals,
      wonDeals,
      lostDeals,
      totalPipelineValue,
      wonRevenue,
      winRate,
      avgDealSize,
      totalTasks,
      completedTasks,
      pendingTasks,
      taskCompletionRate,
      totalActivities,
      activityBreakdown,
    };
  },
};
