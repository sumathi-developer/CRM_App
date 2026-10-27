import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roleService } from '../../services/role.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type { RoleEntity, SystemPermission } from '../../types/role.types';
import { Navbar } from '../../components/common/Navbar';
import { SystemRoleBadge } from './RoleBadges';
import { PermissionsMatrix } from './PermissionsMatrix';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import { EmptyState } from '../../components/common/EmptyState';
import {
  LockIcon,
  ShieldIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  UsersIcon,
  SearchIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  XIcon,
} from '../../components/common/Icons';

export const RolesListPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { userRoleInWorkspace } = useWorkspace();

  const [roles, setRoles] = useState<RoleEntity[]>([]);
  const [permissions, setPermissions] = useState<SystemPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SYSTEM' | 'CUSTOM'>('ALL');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Catalog modal
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Delete modal
  const [roleToDelete, setRoleToDelete] = useState<RoleEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManageRoles =
    currentUser?.role?.name === 'ADMIN' ||
    userRoleInWorkspace === 'OWNER' ||
    userRoleInWorkspace === 'ADMIN';

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const [rolesData, permsData] = await Promise.all([
          roleService.getRoles(),
          roleService.getPermissions(),
        ]);

        if (!ignore) {
          setRoles(rolesData);
          setPermissions(permsData);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load roles and permissions');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    if (roleToDelete.isSystem) {
      setApiError('System roles are protected and cannot be deleted.');
      setRoleToDelete(null);
      return;
    }

    setIsDeleting(true);
    setApiError(null);
    try {
      await roleService.deleteRole(roleToDelete.id);
      setApiSuccess(`Role "${roleToDelete.name}" was successfully deleted.`);
      setRoleToDelete(null);
      setRefreshTrigger((k) => k + 1);
    } catch (err: any) {
      setApiError(err.message || 'Failed to delete role');
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const totalRoles = roles.length;
  const systemRolesCount = roles.filter((r) => r.isSystem).length;
  const customRolesCount = roles.filter((r) => !r.isSystem).length;
  const totalUsersAssigned = roles.reduce((sum, r) => sum + (r._count?.users || r.users?.length || 0), 0);

  // Filtered list
  const filteredRoles = roles.filter((r) => {
    const q = search.trim().toLowerCase();
    const nameMatch = !q || r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q));
    const typeMatch =
      typeFilter === 'ALL' ||
      (typeFilter === 'SYSTEM' && r.isSystem) ||
      (typeFilter === 'CUSTOM' && !r.isSystem);

    return nameMatch && typeMatch;
  });

  return (
    <div className="authenticated-shell" id="roles-list-page">
      <Navbar />

      <main className="authenticated-container">
        {/* Module Header Strip */}
        <div className="module-header-strip">
          <div className="module-title-area">
            <div className="module-title-with-badge">
              <h1 className="module-main-heading">Roles & Permissions</h1>
              <span className="count-pill">{totalRoles} Roles</span>
            </div>
            <p className="module-sub-heading">
              Manage role-based access control (RBAC), govern resource permissions, and audit granted capabilities across the CRM.
            </p>
          </div>

          <div className="module-header-actions">
            <button
              type="button"
              className="auth-btn btn-secondary"
              onClick={() => setIsCatalogOpen(true)}
              id="btn-inspect-catalog"
            >
              <ShieldIcon size={16} />
              <span>Permissions Catalog ({permissions.length})</span>
            </button>

            {canManageRoles && (
              <Link to="/roles/create" className="auth-btn btn-primary" id="btn-create-role">
                <PlusIcon size={16} />
                <span>Create Role</span>
              </Link>
            )}
          </div>
        </div>

        {/* Global Feedback */}
        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        {/* Top KPI Metrics Strip */}
        <div className="roles-metrics-strip">
          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap primary">
              <ShieldIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{totalRoles}</span>
              <span className="kpi-label">Configured Roles</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap warning">
              <LockIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{systemRolesCount}</span>
              <span className="kpi-label">System Protected Roles</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap success">
              <CheckCircleIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{customRolesCount}</span>
              <span className="kpi-label">Custom Roles</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap primary">
              <LockIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{permissions.length}</span>
              <span className="kpi-label">System Permissions</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap success">
              <UsersIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{totalUsersAssigned}</span>
              <span className="kpi-label">Assigned Users</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="users-filter-bar" style={{ marginBottom: '1.5rem' }}>
          <div className="filter-search-box">
            <SearchIcon size={16} className="search-box-icon" />
            <input
              type="text"
              id="role-search-input"
              placeholder="Search roles by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input-field"
              aria-label="Search roles"
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
                title="Clear search query"
              >
                ×
              </button>
            )}
          </div>

          <div className="filter-controls-group">
            <div className="filter-select-wrap">
              <select
                id="role-type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="filter-select-field"
                aria-label="Filter by role type"
              >
                <option value="ALL">All Roles ({totalRoles})</option>
                <option value="SYSTEM">System Roles Only ({systemRolesCount})</option>
                <option value="CUSTOM">Custom Roles Only ({customRolesCount})</option>
              </select>
            </div>

            {(search || typeFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('ALL');
                }}
                className="filter-reset-btn"
                title="Reset filters"
              >
                <RefreshCwIcon size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="filter-results-counter">
            <span className="results-badge">{filteredRoles.length}</span>
            <span className="results-label">
              {filteredRoles.length === 1 ? 'role matched' : 'roles matched'}
            </span>
          </div>
        </div>

        {/* Roles Cards Grid */}
        {isLoading ? (
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Loading roles and permissions matrix..." />
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="empty-state-card">
            <EmptyState
              title="No roles found"
              description={
                search || typeFilter !== 'ALL'
                  ? 'No roles match your search filters. Try adjusting your query.'
                  : 'No custom roles have been created yet. Create a custom role to grant specific access permissions.'
              }
              action={
                canManageRoles && !search ? (
                  <Link to="/roles/create" className="auth-btn btn-primary">
                    <PlusIcon size={16} />
                    <span>Create Role</span>
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="roles-grid" id="roles-grid-container">
            {filteredRoles.map((role) => {
              const permsCount = role.permissions?.length ?? role._count?.permissions ?? 0;
              const usersCount = role.users?.length ?? role._count?.users ?? 0;

              return (
                <div key={role.id} className="role-card" id={`role-card-${role.id}`}>
                  <div className="role-card-header">
                    <div className="role-brand-group">
                      <div className={`role-icon-avatar ${role.isSystem ? 'system' : 'custom'}`}>
                        {role.isSystem ? <LockIcon size={20} /> : <ShieldIcon size={20} />}
                      </div>
                      <div>
                        <h2 className="role-title-heading">
                          <Link to={`/roles/${role.id}`}>{role.name}</Link>
                        </h2>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {role.isSystem ? 'Default System RBAC' : 'Custom Configured RBAC'}
                        </span>
                      </div>
                    </div>

                    <SystemRoleBadge isSystem={role.isSystem} />
                  </div>

                  <div className="role-card-body">
                    <p className="role-desc-text">
                      {role.description || 'No description provided for this role.'}
                    </p>

                    <div className="role-meta-chips-strip">
                      <span className="role-meta-chip" title="Granted Permissions">
                        <LockIcon size={13} className="text-primary" />
                        <span>{permsCount} Permissions</span>
                      </span>

                      <span className="role-meta-chip" title="Assigned Users">
                        <UsersIcon size={13} className="text-success" />
                        <span>{usersCount} {usersCount === 1 ? 'User' : 'Users'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="role-card-footer">
                    <Link
                      to={`/roles/${role.id}`}
                      className="auth-btn btn-secondary"
                      style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
                      title="View Role Matrix & Details"
                    >
                      <span>View Matrix</span>
                    </Link>

                    <div className="team-actions-group">
                      {canManageRoles && (
                        <Link
                          to={`/roles/${role.id}/edit`}
                          className="table-action-btn"
                          title="Edit Role & Permissions"
                        >
                          <EditIcon size={14} />
                        </Link>
                      )}

                      {canManageRoles && !role.isSystem && (
                        <button
                          type="button"
                          className="table-action-btn btn-action-danger"
                          onClick={() => setRoleToDelete(role)}
                          title="Delete Custom Role"
                        >
                          <TrashIcon size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Global Permissions Catalog Modal */}
      {isCatalogOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-container" style={{ maxWidth: '850px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <div className="modal-header-icon primary">
                <ShieldIcon size={20} />
              </div>
              <div className="modal-header-text">
                <h3 className="modal-title">System Permissions Catalog</h3>
                <p className="modal-subtitle">
                  Complete registry of all {permissions.length} granular capabilities enforced in the CRM
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCatalogOpen(false)}
                aria-label="Close catalog"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', maxHeight: '65vh' }}>
              <div className="filter-search-box" style={{ marginBottom: '1rem' }}>
                <SearchIcon size={16} className="search-box-icon" />
                <input
                  type="text"
                  placeholder="Filter catalog by permission, resource, or action..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="search-input-field"
                />
              </div>

              <PermissionsMatrix
                permissions={permissions}
                selectedPermissionIds={permissions.map((p) => p.id)}
                readOnly
                search={catalogSearch}
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="auth-btn btn-primary"
                onClick={() => setIsCatalogOpen(false)}
              >
                Close Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(roleToDelete)}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Role"
        message={`Are you sure you want to permanently delete the custom role "${roleToDelete?.name}"? Users currently assigned to this role must be reassigned.`}
        itemName={roleToDelete?.name}
        confirmLabel="Delete Role"
        isLoading={isDeleting}
      />
    </div>
  );
};
