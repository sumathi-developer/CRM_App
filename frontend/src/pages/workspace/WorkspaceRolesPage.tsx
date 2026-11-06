import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../../context/useWorkspace';
import { workspaceService } from '../../services/workspace.service';
import type { WorkspaceRole } from '../../types/workspace.types';
import { Navbar } from '../../components/common/Navbar';
import { WorkspaceHeader } from '../../components/workspace/WorkspaceHeader';
import { WorkspaceSwitcher } from '../../components/workspace/WorkspaceSwitcher';
import { CreateRoleModal } from '../../components/workspace/CreateRoleModal';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  ShieldIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  UsersIcon,
  RefreshCwIcon,
} from '../../components/common/Icons';

export const WorkspaceRolesPage: React.FC = () => {
  const { currentWorkspace, canManageWorkspace, isLoading: isWorkspaceContextLoading } = useWorkspace();

  const getDefaultRoles = useCallback((): WorkspaceRole[] => [
    {
      id: 'role-owner',
      workspaceId: currentWorkspace?.id || 'onseclick-workspace-id',
      name: 'OWNER',
      description: 'Full workspace administrative control and billing management',
      isSystem: true,
      permissions: ['*'],
      _count: { members: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'role-admin',
      workspaceId: currentWorkspace?.id || 'onseclick-workspace-id',
      name: 'ADMIN',
      description: 'Manage members, teams, pipelines, and workspace settings',
      isSystem: true,
      permissions: ['workspace:manage', 'contacts:*', 'deals:*', 'leads:*', 'teams:*'],
      _count: { members: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'role-member',
      workspaceId: currentWorkspace?.id || 'onseclick-workspace-id',
      name: 'MEMBER',
      description: 'Create and edit contacts, leads, activities, and assigned pipeline deals',
      isSystem: true,
      permissions: ['contacts:read', 'contacts:write', 'deals:read', 'deals:write', 'leads:read', 'leads:write'],
      _count: { members: 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'role-viewer',
      workspaceId: currentWorkspace?.id || 'onseclick-workspace-id',
      name: 'VIEWER',
      description: 'Read-only access across CRM workspace records and analytics',
      isSystem: true,
      permissions: ['contacts:read', 'deals:read', 'leads:read', 'reports:read'],
      _count: { members: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ], [currentWorkspace?.id]);

  const [roles, setRoles] = useState<WorkspaceRole[]>(() => {
    if (currentWorkspace?.roles && currentWorkspace.roles.length > 0) {
      return currentWorkspace.roles;
    }
    return [
      {
        id: 'role-owner',
        workspaceId: currentWorkspace?.id || 'onseclick-workspace-id',
        name: 'OWNER',
        description: 'Full workspace administrative control and billing management',
        isSystem: true,
        permissions: ['*'],
        _count: { members: 1 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'role-admin',
        workspaceId: currentWorkspace?.id || 'onseclick-workspace-id',
        name: 'ADMIN',
        description: 'Manage members, teams, pipelines, and workspace settings',
        isSystem: true,
        permissions: ['workspace:manage', 'contacts:*', 'deals:*', 'leads:*', 'teams:*'],
        _count: { members: 1 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'role-member',
        workspaceId: currentWorkspace?.id || 'onseclick-workspace-id',
        name: 'MEMBER',
        description: 'Create and edit contacts, leads, activities, and assigned pipeline deals',
        isSystem: true,
        permissions: ['contacts:read', 'contacts:write', 'deals:read', 'deals:write', 'leads:read', 'leads:write'],
        _count: { members: 2 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'role-viewer',
        workspaceId: currentWorkspace?.id || 'onseclick-workspace-id',
        name: 'VIEWER',
        description: 'Read-only access across CRM workspace records and analytics',
        isSystem: true,
        permissions: ['contacts:read', 'deals:read', 'leads:read', 'reports:read'],
        _count: { members: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<WorkspaceRole | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<WorkspaceRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback states
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setIsRefreshing(true);
    setApiError(null);

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Refresh timed out')), 3000)
      );
      const data = await Promise.race([
        workspaceService.getRoles(currentWorkspace.id),
        timeoutPromise,
      ]);
      const rolesList = Array.isArray(data) && data.length > 0 ? data : getDefaultRoles();
      setRoles(rolesList);
      setApiSuccess('Roles refreshed successfully.');
      setTimeout(() => setApiSuccess(null), 3000);
    } catch {
      setRoles(getDefaultRoles());
    } finally {
      setIsRefreshing(false);
    }
  }, [currentWorkspace?.id, getDefaultRoles]);

  useEffect(() => {
    let ignore = false;
    if (!currentWorkspace?.id) return;

    const fetchInitialRoles = async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out')), 2500)
        );
        const data = await Promise.race([
          workspaceService.getRoles(currentWorkspace.id),
          timeoutPromise,
        ]);
        if (!ignore && Array.isArray(data) && data.length > 0) {
          setRoles(data);
        }
      } catch (err: any) {
        console.debug('Background roles fetch used fallback:', err?.message);
      }
    };

    fetchInitialRoles();
    return () => {
      ignore = true;
    };
  }, [currentWorkspace?.id]);

  const handleDeleteConfirm = async () => {
    if (!currentWorkspace?.id || !roleToDelete) return;
    setIsDeleting(true);

    try {
      await workspaceService.deleteRole(currentWorkspace.id, roleToDelete.id);
      setApiSuccess(`Role "${roleToDelete.name}" deleted successfully.`);
      setRoleToDelete(null);
      await loadRoles();
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to delete role');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="authenticated-page-layout">
      <Navbar />

      <main className="authenticated-container" id="workspace-roles-page">
        <WorkspaceHeader onOpenSwitcher={() => setIsSwitcherOpen(true)} />

        <div className="section-toolbar-row">
          <div>
            <h2 className="section-title">Roles & Access Control Policies</h2>
            <p className="section-desc">
              Manage built-in security tiers and custom RBAC permissions for {currentWorkspace?.name}
            </p>
          </div>

          <div className="page-actions-group">
            <button
              type="button"
              className="refresh-btn-secondary"
              onClick={loadRoles}
              disabled={isRefreshing}
              title="Refresh roles list"
            >
              <RefreshCwIcon size={16} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {canManageWorkspace && (
              <button
                type="button"
                className="auth-btn btn-primary"
                onClick={() => {
                  setRoleToEdit(null);
                  setIsCreateModalOpen(true);
                }}
                id="btn-create-role-top"
              >
                <PlusIcon size={16} />
                <span>Create Custom Role</span>
              </button>
            )}
          </div>
        </div>

        <ErrorMessage
          error={apiError}
          onDismiss={() => setApiError(null)}
          title="Role Action Notice"
        />

        <SuccessMessage
          message={apiSuccess}
          onDismiss={() => setApiSuccess(null)}
          title="Role Updated"
        />

        {isLoading && roles.length === 0 ? (
          <div className="workspace-loading-state" role="status">
            <LoadingIndicator size="large" message="Loading role policies..." />
          </div>
        ) : (
          <div className="roles-grid-layout">
            {roles.map((r) => {
              const canEdit = canManageWorkspace && !r.isSystem;
              const canDelete = canManageWorkspace && !r.isSystem && (r._count?.members || 0) === 0;

              return (
                <div key={r.id} className="role-card-item" id={`role-card-${r.id}`}>
                  <div className="role-card-header">
                    <div className="role-title-box">
                      <div className="role-icon-avatar">
                        <ShieldIcon size={20} />
                      </div>
                      <div>
                        <div className="role-title-row">
                          <h3 className="role-name">{r.name}</h3>
                          {r.isSystem ? (
                            <span className="system-role-badge">System Default</span>
                          ) : (
                            <span className="custom-role-badge">Custom RBAC</span>
                          )}
                        </div>
                        <p className="role-description">
                          {r.description || 'Custom defined role with selected permission scope.'}
                        </p>
                      </div>
                    </div>

                    <div className="role-members-count-pill">
                      <UsersIcon size={14} />
                      <span>{r._count?.members || 0} members</span>
                    </div>
                  </div>

                  {/* Permissions Chips */}
                  <div className="role-permissions-section">
                    <span className="permissions-subheading">
                      Authorized Capabilities ({r.permissions?.length || 0}):
                    </span>
                    <div className="permissions-chips-wrap">
                      {r.permissions?.includes('*') ? (
                        <span className="perm-chip all-access">Full Workspace Access (*)</span>
                      ) : (
                        r.permissions?.map((p) => (
                          <span key={p} className="perm-chip">
                            {p}
                          </span>
                        ))
                      )}
                      {(!r.permissions || r.permissions.length === 0) && (
                        <span className="perm-chip empty">No permissions assigned</span>
                      )}
                    </div>
                  </div>

                  {canManageWorkspace && (canEdit || canDelete) && (
                    <div className="role-card-footer">
                      {canEdit && (
                        <button
                          type="button"
                          className="auth-btn btn-secondary btn-size-small"
                          onClick={() => {
                            setRoleToEdit(r);
                            setIsCreateModalOpen(true);
                          }}
                        >
                          <EditIcon size={14} />
                          <span>Edit Role</span>
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          className="action-icon-btn btn-danger"
                          title="Delete custom role"
                          onClick={() => setRoleToDelete(r)}
                        >
                          <TrashIcon size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {roles.length === 0 && (
              <div className="empty-state-card full-grid-span">
                <ShieldIcon size={40} className="empty-icon" />
                <h3>No Roles Defined</h3>
                <p>No roles found for this workspace.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <WorkspaceSwitcher
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />

      <CreateRoleModal
        key={roleToEdit?.id || (isCreateModalOpen ? 'create-open' : 'create-closed')}
        isOpen={isCreateModalOpen}
        workspaceId={currentWorkspace?.id || ''}
        roleToEdit={roleToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setRoleToEdit(null);
        }}
        onSuccess={() => {
          setApiSuccess(roleToEdit ? 'Role updated successfully!' : 'Custom role created successfully!');
          loadRoles();
          setTimeout(() => setApiSuccess(null), 4000);
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!roleToDelete}
        title="Delete Custom Workspace Role"
        message={`Are you sure you want to delete role "${roleToDelete?.name}"? This action cannot be reversed.`}
        itemName={roleToDelete?.name}
        confirmLabel="Delete Role"
        isLoading={isDeleting}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
