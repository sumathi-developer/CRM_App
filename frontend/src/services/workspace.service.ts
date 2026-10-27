import { api } from './api';
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceSettings,
  WorkspaceMetrics,
  WorkspaceInvite,
  SwitchWorkspaceResponse,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  AddMemberDto,
  UpdateMemberDto,
  InviteMemberDto,
  CreateWorkspaceRoleDto,
  UpdateWorkspaceRoleDto,
} from '../types/workspace.types';

export const workspaceService = {
  // 1. Workspaces & Switching
  async getMyWorkspaces(): Promise<Workspace[]> {
    return api.get<Workspace[]>('/workspaces/my-workspaces');
  },

  async getCurrentWorkspace(): Promise<Workspace> {
    return api.get<Workspace>('/workspaces/current');
  },

  async switchWorkspace(workspaceId: string): Promise<SwitchWorkspaceResponse> {
    return api.post<SwitchWorkspaceResponse>(`/workspaces/${workspaceId}/switch`);
  },

  async createWorkspace(data: CreateWorkspaceDto): Promise<Workspace> {
    return api.post<Workspace>('/workspaces', data);
  },

  async getWorkspace(id: string): Promise<Workspace> {
    return api.get<Workspace>(`/workspaces/${id}`);
  },

  async updateWorkspace(id: string, data: UpdateWorkspaceDto): Promise<Workspace> {
    return api.patch<Workspace>(`/workspaces/${id}`, data);
  },

  async deleteWorkspace(id: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/workspaces/${id}`);
  },

  async getMetrics(id: string): Promise<WorkspaceMetrics> {
    return api.get<WorkspaceMetrics>(`/workspaces/${id}/metrics`);
  },

  // 2. Members
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
  },

  async addMember(workspaceId: string, data: AddMemberDto): Promise<WorkspaceMember> {
    return api.post<WorkspaceMember>(`/workspaces/${workspaceId}/members`, data);
  },

  async updateMember(workspaceId: string, memberId: string, data: UpdateMemberDto): Promise<WorkspaceMember> {
    return api.patch<WorkspaceMember>(`/workspaces/${workspaceId}/members/${memberId}`, data);
  },

  async removeMember(workspaceId: string, memberId: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/workspaces/${workspaceId}/members/${memberId}`);
  },

  // 3. Invitations
  async getInvites(workspaceId: string, status?: string): Promise<WorkspaceInvite[]> {
    const query = status ? `?status=${status}` : '';
    return api.get<WorkspaceInvite[]>(`/workspaces/${workspaceId}/invitations${query}`);
  },

  async createInvite(workspaceId: string, data: InviteMemberDto): Promise<WorkspaceInvite> {
    return api.post<WorkspaceInvite>(`/workspaces/${workspaceId}/invitations`, data);
  },

  async resendInvite(workspaceId: string, inviteId: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/workspaces/${workspaceId}/invitations/${inviteId}/resend`);
  },

  async cancelInvite(workspaceId: string, inviteId: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/workspaces/${workspaceId}/invitations/${inviteId}`);
  },

  // 4. Roles
  async getRoles(workspaceId: string): Promise<WorkspaceRole[]> {
    return api.get<WorkspaceRole[]>(`/workspaces/${workspaceId}/roles`);
  },

  async createRole(workspaceId: string, data: CreateWorkspaceRoleDto): Promise<WorkspaceRole> {
    return api.post<WorkspaceRole>(`/workspaces/${workspaceId}/roles`, data);
  },

  async updateRole(workspaceId: string, roleId: string, data: UpdateWorkspaceRoleDto): Promise<WorkspaceRole> {
    return api.patch<WorkspaceRole>(`/workspaces/${workspaceId}/roles/${roleId}`, data);
  },

  async deleteRole(workspaceId: string, roleId: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/workspaces/${workspaceId}/roles/${roleId}`);
  },

  // 5. Settings
  async getSettings(workspaceId: string): Promise<WorkspaceSettings> {
    return api.get<WorkspaceSettings>(`/workspaces/${workspaceId}/settings`);
  },

  async updateSettings(workspaceId: string, data: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
    return api.patch<WorkspaceSettings>(`/workspaces/${workspaceId}/settings`, data);
  },

  async updateBranding(workspaceId: string, data: any): Promise<WorkspaceSettings> {
    return api.patch<WorkspaceSettings>(`/workspaces/${workspaceId}/settings/branding`, data);
  },

  async updateLocalization(workspaceId: string, data: any): Promise<WorkspaceSettings> {
    return api.patch<WorkspaceSettings>(`/workspaces/${workspaceId}/settings/localization`, data);
  },

  async updatePreferences(workspaceId: string, data: any): Promise<WorkspaceSettings> {
    return api.patch<WorkspaceSettings>(`/workspaces/${workspaceId}/settings/preferences`, data);
  },

  async updateSecurity(workspaceId: string, data: any): Promise<WorkspaceSettings> {
    return api.patch<WorkspaceSettings>(`/workspaces/${workspaceId}/settings/security`, data);
  },
};
