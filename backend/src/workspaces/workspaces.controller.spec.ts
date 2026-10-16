import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesController', () => {
  let controller: WorkspacesController;
  let service: WorkspacesService;

  const mockWorkspacesService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findMyWorkspaces: vi.fn(),
    getCurrentWorkspace: vi.fn(),
    switchWorkspace: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getMetrics: vi.fn(),
    getMembers: vi.fn(),
    getMember: vi.fn(),
    addMember: vi.fn(),
    updateMember: vi.fn(),
    updateMemberStatus: vi.fn(),
    assignMemberRole: vi.fn(),
    removeMember: vi.fn(),
    createInvite: vi.fn(),
    getInvites: vi.fn(),
    resendInvite: vi.fn(),
    cancelInvite: vi.fn(),
    acceptInvite: vi.fn(),
    getRoles: vi.fn(),
    createRole: vi.fn(),
    getRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    updateBranding: vi.fn(),
    updateLocalization: vi.fn(),
    updatePreferences: vi.fn(),
    updateSecurity: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [
        {
          provide: WorkspacesService,
          useValue: mockWorkspacesService,
        },
      ],
    }).compile();

    controller = module.get<WorkspacesController>(WorkspacesController);
    service = module.get<WorkspacesService>(WorkspacesService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  // ==========================================
  // 1. WORKSPACE MANAGEMENT & SWITCHER
  // ==========================================
  describe('Workspace Management & Switcher', () => {
    it('should create a workspace', async () => {
      const dto = { name: 'Acme HQ' };
      const expected = { id: 'ws-1', name: 'Acme HQ', slug: 'acme-hq' };
      mockWorkspacesService.create.mockResolvedValue(expected);

      const result = await controller.create(dto, 'user-1');
      expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
      expect(result).toEqual(expected);
    });

    it('should list all workspaces', async () => {
      const query = { page: 1, limit: 10, search: 'Acme' };
      const expected = { data: [{ id: 'ws-1' }], meta: { total: 1 } };
      mockWorkspacesService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });

    it('should list user workspaces', async () => {
      const expected = [{ id: 'ws-1', name: 'Acme HQ', myRole: 'OWNER', isActive: true }];
      mockWorkspacesService.findMyWorkspaces.mockResolvedValue(expected);

      const result = await controller.findMyWorkspaces('user-1');
      expect(service.findMyWorkspaces).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expected);
    });

    it('should get current active workspace', async () => {
      const expected = { id: 'ws-1', name: 'Acme HQ' };
      mockWorkspacesService.getCurrentWorkspace.mockResolvedValue(expected);

      const result = await controller.getCurrentWorkspace('user-1');
      expect(service.getCurrentWorkspace).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expected);
    });

    it('should switch active workspace by id param', async () => {
      const expected = { message: 'Switched workspace successfully', activeWorkspaceId: 'ws-2' };
      mockWorkspacesService.switchWorkspace.mockResolvedValue(expected);

      const result = await controller.switchWorkspace('ws-2', 'user-1');
      expect(service.switchWorkspace).toHaveBeenCalledWith('ws-2', 'user-1');
      expect(result).toEqual(expected);
    });

    it('should switch active workspace by body payload', async () => {
      const expected = { message: 'Switched workspace successfully', activeWorkspaceId: 'ws-2' };
      mockWorkspacesService.switchWorkspace.mockResolvedValue(expected);

      const result = await controller.switchWorkspaceByBody({ workspaceId: 'ws-2' }, 'user-1');
      expect(service.switchWorkspace).toHaveBeenCalledWith('ws-2', 'user-1');
      expect(result).toEqual(expected);
    });

    it('should find workspace by ID or Slug', async () => {
      const expected = { id: 'ws-1', name: 'Acme HQ', slug: 'acme-hq' };
      mockWorkspacesService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('acme-hq');
      expect(service.findOne).toHaveBeenCalledWith('acme-hq');
      expect(result).toEqual(expected);
    });

    it('should update workspace details', async () => {
      const dto = { name: 'Acme Global Operations' };
      const expected = { id: 'ws-1', name: 'Acme Global Operations' };
      mockWorkspacesService.update.mockResolvedValue(expected);

      const result = await controller.update('ws-1', dto, 'user-1', 'ADMIN');
      expect(service.update).toHaveBeenCalledWith('ws-1', dto, 'user-1', 'ADMIN');
      expect(result).toEqual(expected);
    });

    it('should remove/archive workspace', async () => {
      const expected = { message: 'Workspace deleted successfully', id: 'ws-1' };
      mockWorkspacesService.remove.mockResolvedValue(expected);

      const result = await controller.remove('ws-1', 'user-1', 'ADMIN');
      expect(service.remove).toHaveBeenCalledWith('ws-1', 'user-1', 'ADMIN');
      expect(result).toEqual(expected);
    });

    it('should get workspace metrics', async () => {
      const expected = { workspaceId: 'ws-1', totalMembers: 5, totalDeals: 12 };
      mockWorkspacesService.getMetrics.mockResolvedValue(expected);

      const result = await controller.getMetrics('ws-1');
      expect(service.getMetrics).toHaveBeenCalledWith('ws-1');
      expect(result).toEqual(expected);
    });
  });

  // ==========================================
  // 2. WORKSPACE MEMBERS
  // ==========================================
  describe('Workspace Members', () => {
    it('should list all members', async () => {
      const expected = [{ id: 'm-1', role: 'OWNER' }, { id: 'm-2', role: 'MEMBER' }];
      mockWorkspacesService.getMembers.mockResolvedValue(expected);

      const result = await controller.getMembers('ws-1');
      expect(service.getMembers).toHaveBeenCalledWith('ws-1');
      expect(result).toEqual(expected);
    });

    it('should get single member', async () => {
      const expected = { id: 'm-1', role: 'OWNER' };
      mockWorkspacesService.getMember.mockResolvedValue(expected);

      const result = await controller.getMember('ws-1', 'm-1');
      expect(service.getMember).toHaveBeenCalledWith('ws-1', 'm-1');
      expect(result).toEqual(expected);
    });

    it('should add member', async () => {
      const dto = { userId: 'user-2', role: 'MEMBER' };
      const expected = { id: 'm-2', userId: 'user-2', role: 'MEMBER' };
      mockWorkspacesService.addMember.mockResolvedValue(expected);

      const result = await controller.addMember('ws-1', dto, 'user-1', 'ADMIN');
      expect(service.addMember).toHaveBeenCalledWith('ws-1', dto, 'user-1', 'ADMIN');
      expect(result).toEqual(expected);
    });

    it('should update member', async () => {
      const dto = { role: 'ADMIN' };
      const expected = { id: 'm-2', role: 'ADMIN' };
      mockWorkspacesService.updateMember.mockResolvedValue(expected);

      const result = await controller.updateMember('ws-1', 'm-2', dto, 'user-1', 'ADMIN');
      expect(service.updateMember).toHaveBeenCalledWith('ws-1', 'm-2', dto, 'user-1', 'ADMIN');
      expect(result).toEqual(expected);
    });

    it('should update member status', async () => {
      const expected = { id: 'm-2', status: 'INACTIVE' };
      mockWorkspacesService.updateMemberStatus.mockResolvedValue(expected);

      const result = await controller.updateMemberStatus('ws-1', 'm-2', { status: 'INACTIVE' }, 'user-1', 'ADMIN');
      expect(service.updateMemberStatus).toHaveBeenCalledWith('ws-1', 'm-2', 'INACTIVE', 'user-1', 'ADMIN');
      expect(result).toEqual(expected);
    });

    it('should assign member role', async () => {
      const expected = { id: 'm-2', role: 'ADMIN' };
      mockWorkspacesService.assignMemberRole.mockResolvedValue(expected);

      const result = await controller.assignMemberRole('ws-1', 'm-2', { role: 'ADMIN' }, 'user-1', 'ADMIN');
      expect(service.assignMemberRole).toHaveBeenCalledWith('ws-1', 'm-2', 'ADMIN', 'user-1', 'ADMIN');
      expect(result).toEqual(expected);
    });

    it('should remove member', async () => {
      const expected = { message: 'Member removed from workspace successfully' };
      mockWorkspacesService.removeMember.mockResolvedValue(expected);

      const result = await controller.removeMember('ws-1', 'm-2', 'user-1', 'ADMIN');
      expect(service.removeMember).toHaveBeenCalledWith('ws-1', 'm-2', 'user-1', 'ADMIN');
      expect(result).toEqual(expected);
    });
  });

  // ==========================================
  // 3. INVITATIONS
  // ==========================================
  describe('Invitations', () => {
    it('should create an invitation', async () => {
      const dto = { email: 'invitee@acme.com', role: 'MEMBER' };
      const expected = { id: 'inv-1', email: 'invitee@acme.com', status: 'PENDING' };
      mockWorkspacesService.createInvite.mockResolvedValue(expected);

      const result = await controller.createInvite('ws-1', dto, 'user-1');
      expect(service.createInvite).toHaveBeenCalledWith('ws-1', dto, 'user-1');
      expect(result).toEqual(expected);
    });

    it('should list invitations with status filter', async () => {
      const expected = [{ id: 'inv-1', email: 'invitee@acme.com', status: 'PENDING' }];
      mockWorkspacesService.getInvites.mockResolvedValue(expected);

      const result = await controller.getInvites('ws-1', 'PENDING');
      expect(service.getInvites).toHaveBeenCalledWith('ws-1', 'PENDING');
      expect(result).toEqual(expected);
    });

    it('should resend an invitation', async () => {
      const expected = { message: 'Invitation resent successfully', invitation: { id: 'inv-1', status: 'PENDING' } };
      mockWorkspacesService.resendInvite.mockResolvedValue(expected);

      const result = await controller.resendInvite('ws-1', 'inv-1', 'user-1');
      expect(service.resendInvite).toHaveBeenCalledWith('ws-1', 'inv-1', 'user-1');
      expect(result).toEqual(expected);
    });

    it('should cancel an invitation', async () => {
      const expected = { message: 'Invitation cancelled successfully', inviteId: 'inv-1' };
      mockWorkspacesService.cancelInvite.mockResolvedValue(expected);

      const result = await controller.cancelInvite('ws-1', 'inv-1');
      expect(service.cancelInvite).toHaveBeenCalledWith('ws-1', 'inv-1');
      expect(result).toEqual(expected);
    });

    it('should accept an invitation via token', async () => {
      const dto = { token: 'secret-token-123' };
      const expected = { message: 'Workspace invitation accepted successfully', workspaceId: 'ws-1' };
      mockWorkspacesService.acceptInvite.mockResolvedValue(expected);

      const result = await controller.acceptInvite(dto, 'user-2');
      expect(service.acceptInvite).toHaveBeenCalledWith(dto, 'user-2');
      expect(result).toEqual(expected);
    });
  });

  // ==========================================
  // 4. WORKSPACE ROLES
  // ==========================================
  describe('Workspace Roles', () => {
    it('should list all roles in workspace', async () => {
      const expected = [
        { id: 'r-1', name: 'OWNER', isSystem: true },
        { id: 'r-2', name: 'ADMIN', isSystem: true },
      ];
      mockWorkspacesService.getRoles.mockResolvedValue(expected);

      const result = await controller.getRoles('ws-1');
      expect(service.getRoles).toHaveBeenCalledWith('ws-1');
      expect(result).toEqual(expected);
    });

    it('should create custom workspace role', async () => {
      const dto = { name: 'Support Rep', permissions: ['tickets:read', 'tickets:write'] };
      const expected = { id: 'r-custom', ...dto, isSystem: false };
      mockWorkspacesService.createRole.mockResolvedValue(expected);

      const result = await controller.createRole('ws-1', dto);
      expect(service.createRole).toHaveBeenCalledWith('ws-1', dto);
      expect(result).toEqual(expected);
    });

    it('should get single role', async () => {
      const expected = { id: 'r-1', name: 'OWNER' };
      mockWorkspacesService.getRole.mockResolvedValue(expected);

      const result = await controller.getRole('ws-1', 'r-1');
      expect(service.getRole).toHaveBeenCalledWith('ws-1', 'r-1');
      expect(result).toEqual(expected);
    });

    it('should update role', async () => {
      const dto = { name: 'Senior Support Rep' };
      const expected = { id: 'r-custom', name: 'Senior Support Rep' };
      mockWorkspacesService.updateRole.mockResolvedValue(expected);

      const result = await controller.updateRole('ws-1', 'r-custom', dto);
      expect(service.updateRole).toHaveBeenCalledWith('ws-1', 'r-custom', dto);
      expect(result).toEqual(expected);
    });

    it('should delete custom role', async () => {
      const expected = { message: 'Role deleted successfully', roleId: 'r-custom' };
      mockWorkspacesService.deleteRole.mockResolvedValue(expected);

      const result = await controller.deleteRole('ws-1', 'r-custom');
      expect(service.deleteRole).toHaveBeenCalledWith('ws-1', 'r-custom');
      expect(result).toEqual(expected);
    });
  });

  // ==========================================
  // 5. WORKSPACE SETTINGS
  // ==========================================
  describe('Workspace Settings', () => {
    it('should get workspace settings', async () => {
      const expected = {
        general: { companyName: 'Acme Corp' },
        branding: { primaryColor: '#3b82f6' },
        localization: { timezone: 'UTC', currency: 'USD' },
        preferences: { emailNotifications: true },
        security: { enforceTwoFactor: false },
      };
      mockWorkspacesService.getSettings.mockResolvedValue(expected);

      const result = await controller.getSettings('ws-1');
      expect(service.getSettings).toHaveBeenCalledWith('ws-1');
      expect(result).toEqual(expected);
    });

    it('should update workspace settings', async () => {
      const dto = { branding: { primaryColor: '#ef4444' } };
      const expected = { branding: { primaryColor: '#ef4444' } };
      mockWorkspacesService.updateSettings.mockResolvedValue(expected);

      const result = await controller.updateSettings('ws-1', dto);
      expect(service.updateSettings).toHaveBeenCalledWith('ws-1', dto);
      expect(result).toEqual(expected);
    });

    it('should update branding settings', async () => {
      const dto = { logoUrl: 'https://acme.com/logo.png' };
      const expected = { branding: dto };
      mockWorkspacesService.updateBranding.mockResolvedValue(expected);

      const result = await controller.updateBranding('ws-1', dto);
      expect(service.updateBranding).toHaveBeenCalledWith('ws-1', dto);
      expect(result).toEqual(expected);
    });

    it('should update localization settings', async () => {
      const dto = { timezone: 'Europe/London', currency: 'GBP' };
      const expected = { localization: dto };
      mockWorkspacesService.updateLocalization.mockResolvedValue(expected);

      const result = await controller.updateLocalization('ws-1', dto);
      expect(service.updateLocalization).toHaveBeenCalledWith('ws-1', dto);
      expect(result).toEqual(expected);
    });

    it('should update preferences settings', async () => {
      const dto = { emailNotifications: false, weeklyDigest: true };
      const expected = { preferences: dto };
      mockWorkspacesService.updatePreferences.mockResolvedValue(expected);

      const result = await controller.updatePreferences('ws-1', dto);
      expect(service.updatePreferences).toHaveBeenCalledWith('ws-1', dto);
      expect(result).toEqual(expected);
    });

    it('should update security settings', async () => {
      const dto = { enforceTwoFactor: true, sessionTimeoutMinutes: 60 };
      const expected = { security: dto };
      mockWorkspacesService.updateSecurity.mockResolvedValue(expected);

      const result = await controller.updateSecurity('ws-1', dto);
      expect(service.updateSecurity).toHaveBeenCalledWith('ws-1', dto);
      expect(result).toEqual(expected);
    });
  });
});
