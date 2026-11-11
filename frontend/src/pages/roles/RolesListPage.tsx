import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
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
  FilterIcon,
  ChevronDownIcon,
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

  useEffect(() => {
    if (!isCatalogOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
    document.body.style.setProperty('overflow', 'hidden', 'important');
    document.documentElement.style.setProperty('scrollbar-gutter', 'auto', 'important');
    document.body.style.setProperty('scrollbar-gutter', 'auto', 'important');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCatalogOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('scrollbar-gutter');
      document.body.style.removeProperty('scrollbar-gutter');
      if (prevBodyOverflow) document.body.style.overflow = prevBodyOverflow;
      if (prevHtmlOverflow) document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isCatalogOpen]);

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
        {/* Top Roles & Permissions Sub-Navigation */}
        <nav
          className="lg-subnav ld-subnav"
          aria-label="Roles and Permissions navigation"
          style={{ marginBottom: '1.5rem' }}
        >
          <div className="lg-subnav-group">
            <span className="lg-subnav-label">Roles & Permissions</span>
            <div className="lg-subnav-links">
              <NavLink to="/roles" end className={({ isActive }) => `lg-subnav-link ${isActive ? 'is-active' : ''}`}>
                All Roles
              </NavLink>
              <NavLink to="/roles/create" className={({ isActive }) => `lg-subnav-link ${isActive ? 'is-active' : ''}`}>
                Create Role
              </NavLink>
            </div>
          </div>
        </nav>

        {/* Module Header Strip */}
        <header className="lg-header module-header-strip" style={{ marginBottom: '1.5rem' }}>
          <div className="lg-header-text module-title-area">
            <h1 className="lg-title module-title-with-badge">
              <span className="lg-title-icon" aria-hidden="true">
                <ShieldIcon size={22} />
              </span>
              <span>Roles &amp; Permissions</span>
              <span className="count-pill">{totalRoles} Roles</span>
            </h1>
            <p className="lg-subtitle module-sub-heading">
              Manage role-based access control (RBAC), govern resource permissions, and audit granted capabilities across the CRM.
            </p>
          </div>

          <div className="lg-header-actions module-header-actions">
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
        </header>

        {/* Global Feedback */}
        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        {/* Top KPI Metrics Strip */}
        <div className="roles-metrics-strip">
          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap primary">
              <ShieldIcon size={18} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{totalRoles}</span>
              <span className="kpi-label" title="Configured Roles">Configured Roles</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap warning">
              <LockIcon size={18} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{systemRolesCount}</span>
              <span className="kpi-label" title="System Protected Roles">System Roles</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap success">
              <CheckCircleIcon size={18} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{customRolesCount}</span>
              <span className="kpi-label" title="Custom Workspace Roles">Custom Roles</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap primary">
              <LockIcon size={18} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{permissions.length}</span>
              <span className="kpi-label" title="System Granular Permissions">System Permissions</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap success">
              <UsersIcon size={18} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{totalUsersAssigned}</span>
              <span className="kpi-label" title="Users Assigned to Roles">Assigned Users</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <section
          className="crm-filter-bar lg-card users-filter-bar ld-roles-filter-bar"
          id="roles-filter-bar"
          aria-label="Roles search and classification filters"
          style={{ marginBottom: '1.5rem' }}
        >
          <div className="crm-filter-header">
            <div className="crm-filter-title-group">
              <div className="crm-filter-icon-badge">
                <FilterIcon size={15} />
              </div>
              <div className="crm-filter-heading">
                <span>Role Directory &amp; RBAC Filters</span>
                {(search || typeFilter !== 'ALL') && (
                  <span className="crm-badge crm-badge-secondary">
                    <span className="crm-badge-dot" />
                    Active
                  </span>
                )}
              </div>
            </div>

            <div className="crm-filter-actions">
              <span
                className="crm-badge crm-badge-neutral"
                style={{ fontSize: '11px', fontWeight: 700, padding: '0.35rem 0.75rem' }}
              >
                {filteredRoles.length} {filteredRoles.length === 1 ? 'role matched' : 'roles matched'}
              </span>

              {(search || typeFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setTypeFilter('ALL');
                  }}
                  className="auth-btn btn-secondary btn-size-small"
                  title="Reset all filters"
                >
                  <RefreshCwIcon size={13} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          <div className="crm-filter-grid ld-roles-filter-grid">
            <div className="crm-filter-control ld-roles-search-col">
              <label className="crm-filter-label" htmlFor="role-search-input">
                Search Roles
              </label>
              <div className="crm-filter-search-wrap">
                <SearchIcon size={15} className="crm-filter-search-icon" />
                <input
                  type="search"
                  id="role-search-input"
                  placeholder="Search roles by title, key, or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="crm-filter-select crm-filter-search-input"
                  aria-label="Search roles"
                />
                {search && (
                  <button
                    type="button"
                    className="crm-filter-search-clear"
                    onClick={() => setSearch('')}
                    title="Clear search query"
                    aria-label="Clear search query"
                  >
                    <XIcon size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="crm-filter-control">
              <label className="crm-filter-label" htmlFor="role-type-filter">
                Role Classification
              </label>
              <div className="crm-filter-select-wrap">
                <select
                  id="role-type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="crm-filter-select"
                  aria-label="Filter by role type"
                >
                  <option value="ALL">All Roles ({totalRoles})</option>
                  <option value="SYSTEM">System Roles Only ({systemRolesCount})</option>
                  <option value="CUSTOM">Custom Roles Only ({customRolesCount})</option>
                </select>
                <ChevronDownIcon size={14} className="crm-filter-chevron" />
              </div>
            </div>
          </div>
        </section>

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
                          <Link to={`/roles/${role.id}`} state={{ role, permissions }}>{role.name}</Link>
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
                      state={{ role, permissions }}
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
                          state={{ role, permissions }}
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
      {isCatalogOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsCatalogOpen(false);
              }
            }}
          >
            <div
              className="modal-container"
              style={{ maxWidth: '850px', maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            >
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
                <div className="crm-filter-search-wrap" style={{ marginBottom: '1.25rem', width: '100%' }}>
                  <SearchIcon size={15} className="crm-filter-search-icon" />
                  <input
                    type="search"
                    placeholder="Filter catalog by permission, resource, or action..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="crm-filter-select crm-filter-search-input"
                    aria-label="Filter catalog permissions"
                  />
                  {catalogSearch && (
                    <button
                      type="button"
                      className="crm-filter-search-clear"
                      onClick={() => setCatalogSearch('')}
                      title="Clear search query"
                      aria-label="Clear search query"
                    >
                      <XIcon size={13} />
                    </button>
                  )}
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
          </div>,
          document.body
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
