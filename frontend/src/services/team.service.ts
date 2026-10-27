import { api } from './api';
import type {
  TeamEntity,
  TeamMemberEntity,
  TeamPerformanceEntity,
  TeamActivitiesResponse,
  PaginatedTeamsResponse,
  TeamQueryFilters,
  CreateTeamPayload,
  UpdateTeamPayload,
  AddTeamMemberPayload,
  UpdateTeamMemberPayload,
  TeamActivitiesQueryFilters,
  TeamPerformanceQueryFilters,
} from '../types/team.types';

class TeamService {
  /**
   * List all teams with pagination, search, status, and member counts
   */
  async getTeams(query?: TeamQueryFilters): Promise<PaginatedTeamsResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.search?.trim()) params.append('search', query.search.trim());
    if (query?.status) params.append('status', query.status);
    if (query?.ownerId) params.append('ownerId', query.ownerId);
    if (query?.workspaceId) params.append('workspaceId', query.workspaceId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get<any>(`/teams${queryString}`);

    if (response?.data && response?.meta) {
      return response as PaginatedTeamsResponse;
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
    return {
      data: response?.data || [],
      meta: response?.meta || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  /**
   * Get team details by ID or slug
   */
  async getTeamById(idOrSlug: string): Promise<TeamEntity> {
    const response = await api.get<any>(`/teams/${idOrSlug}`);
    return (response?.data || response) as TeamEntity;
  }

  /**
   * Create a new team
   */
  async createTeam(payload: CreateTeamPayload): Promise<TeamEntity> {
    const response = await api.post<any>('/teams', payload);
    return (response?.data || response) as TeamEntity;
  }

  /**
   * Update team metadata, owner, and targets
   */
  async updateTeam(id: string, payload: UpdateTeamPayload): Promise<TeamEntity> {
    const response = await api.patch<any>(`/teams/${id}`, payload);
    return (response?.data || response) as TeamEntity;
  }

  /**
   * Delete a team
   */
  async deleteTeam(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await api.delete<any>(`/teams/${id}`);
    return (response?.data || response) as { success: boolean; message?: string };
  }

  /**
   * List all members belonging to a team
   */
  async getTeamMembers(teamId: string): Promise<TeamMemberEntity[]> {
    const response = await api.get<any>(`/teams/${teamId}/members`);
    const data = response?.data || response;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get a specific team member
   */
  async getTeamMember(teamId: string, memberId: string): Promise<TeamMemberEntity> {
    const response = await api.get<any>(`/teams/${teamId}/members/${memberId}`);
    return (response?.data || response) as TeamMemberEntity;
  }

  /**
   * Add a user to the team
   */
  async addTeamMember(teamId: string, payload: AddTeamMemberPayload): Promise<TeamMemberEntity> {
    const response = await api.post<any>(`/teams/${teamId}/members`, payload);
    return (response?.data || response) as TeamMemberEntity;
  }

  /**
   * Update team member role (LEADER or MEMBER)
   */
  async updateTeamMemberRole(
    teamId: string,
    memberId: string,
    payload: UpdateTeamMemberPayload,
  ): Promise<TeamMemberEntity> {
    const response = await api.patch<any>(`/teams/${teamId}/members/${memberId}`, payload);
    return (response?.data || response) as TeamMemberEntity;
  }

  /**
   * Remove a member from the team
   */
  async removeTeamMember(teamId: string, memberId: string): Promise<{ success: boolean; message?: string }> {
    const response = await api.delete<any>(`/teams/${teamId}/members/${memberId}`);
    return (response?.data || response) as { success: boolean; message?: string };
  }

  /**
   * Get unified team activities with status/type breakdowns
   */
  async getTeamActivities(
    teamId: string,
    query?: TeamActivitiesQueryFilters,
  ): Promise<TeamActivitiesResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.type && query.type !== 'ALL') params.append('type', query.type);
    if (query?.status && query.status !== 'ALL') params.append('status', query.status);
    if (query?.userId && query.userId !== 'ALL') params.append('userId', query.userId);
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get<any>(`/teams/${teamId}/activities${queryString}`);
    const data = response?.data || response;

    return {
      teamId: data.teamId || teamId,
      teamName: data.teamName || 'Team Activities',
      totalActivities: Number(data.totalActivities || data.meta?.total || 0),
      breakdownByType: data.breakdownByType || {},
      breakdownByStatus: data.breakdownByStatus || {},
      data: Array.isArray(data.data) ? data.data : [],
      meta: data.meta || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  /**
   * Get comprehensive team performance metrics
   */
  async getTeamPerformance(
    teamId: string,
    query?: TeamPerformanceQueryFilters,
  ): Promise<TeamPerformanceEntity> {
    const params = new URLSearchParams();
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.pipelineId && query.pipelineId !== 'ALL') params.append('pipelineId', query.pipelineId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get<any>(`/teams/${teamId}/performance${queryString}`);
    return (response?.data || response) as TeamPerformanceEntity;
  }
}

export const teamService = new TeamService();
