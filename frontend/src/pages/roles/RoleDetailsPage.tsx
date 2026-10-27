import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roleService } from '../../services/role.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type { RoleEntity, SystemPermission } from '../../types/role.types';
import { Navbar } from '../../components/common/Navbar';
import { SystemRoleBadge } from './RoleBadges';
import { PermissionsMatrix } from './PermissionsMatrix';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import {
  ShieldIcon,
  LockIcon,
  UsersIcon,
  EditIcon,
  ArrowLeftIcon,
  SearchIcon,
  CalendarIcon,
  CheckCircleIcon,
} from '../../components/common/Icons';

export const RoleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { userRoleInWorkspace } = useWorkspace();

  const [role, setRole] = useState<RoleEntity | null>(null);
  const [allPermissions, setAllPermissions] = useState<SystemPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'matrix' | 'users'>('matrix');
  const [search, setSearch] = useState('');

  const canManageRoles =
    currentUser?.role?.name === 'ADMIN' ||
    userRoleInWorkspace === 'OWNER' ||
    userRoleInWorkspace === 'ADMIN';

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const loadData = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const [roleData, permsData] = await Promise.all([
          roleService.getRoleById(id),
          roleService.getPermissions(),
        ]);

        if (!ignore) {
          setRole(roleData);
          setAllPermissions(permsData);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load role details');
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
  }, [id]);

  if (isLoading) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Loading role details and permissions matrix..." />
          </div>
        </main>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="empty-state-box">
            <h2>Role Not Found</h2>
            <p>The requested role does not exist or has been removed.</p>
            <Link to="/roles" className="auth-btn btn-primary">
              Return to Roles Roster
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const rolePermissionIds = (role.permissions || []).map((rp) => rp.permissionId || rp.permission?.id).filter(Boolean);
  const assignedUsers = role.users || [];

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="authenticated-shell" id="role-details-page">
      <Navbar />

      <main className="authenticated-container">
        {/* Breadcrumb Navigation */}
        <div className="breadcrumb-nav">
          <Link to="/roles" className="breadcrumb-link">
            <ArrowLeftIcon size={14} />
            <span>Back to Roles & Permissions</span>
          </Link>
        </div>

        {/* Role Header Card */}
        <div className="team-detail-header-card" style={{ marginBottom: '1.5rem' }}>
          <div className="team-header-main-content">
            <div className="team-header-identity">
              <div className={`role-icon-avatar ${role.isSystem ? 'system' : 'custom'}`} style={{ width: '56px', height: '56px' }}>
                {role.isSystem ? <LockIcon size={26} /> : <ShieldIcon size={26} />}
              </div>

              <div className="team-header-titles">
                <h1>
                  <span>{role.name}</span>
                  <SystemRoleBadge isSystem={role.isSystem} />
                </h1>

                <p style={{ margin: '0.25rem 0 0.5rem 0', color: 'var(--text-secondary, #cbd5e1)', fontSize: '0.9rem' }}>
                  {role.description || 'No description configured for this role.'}
                </p>

                <div className="team-header-subinfo">
                  <span className="info-chip">
                    <LockIcon size={14} className="text-primary" />
                    <span>{rolePermissionIds.length} of {allPermissions.length} Permissions Granted</span>
                  </span>

                  <span className="info-chip">
                    <UsersIcon size={14} className="text-success" />
                    <span>{assignedUsers.length} {assignedUsers.length === 1 ? 'Assigned User' : 'Assigned Users'}</span>
                  </span>

                  <span className="info-chip">
                    <CalendarIcon size={14} className="text-muted" />
                    <span>Created {new Date(role.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="team-header-actions">
              {canManageRoles && (
                <Link to={`/roles/${role.id}/edit`} className="auth-btn btn-primary" id="btn-edit-role">
                  <EditIcon size={16} />
                  <span>Configure Permissions</span>
                </Link>
              )}
            </div>
          </div>

          {/* Sub-Tabs */}
          <nav className="team-nav-tabs-bar" aria-label="Role Navigation">
            <button
              type="button"
              className={`team-tab-btn ${activeTab === 'matrix' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('matrix')}
            >
              <LockIcon size={15} />
              <span>Permissions Matrix ({rolePermissionIds.length})</span>
            </button>

            <button
              type="button"
              className={`team-tab-btn ${activeTab === 'users' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <UsersIcon size={15} />
              <span>Assigned Users ({assignedUsers.length})</span>
            </button>
          </nav>
        </div>

        {/* Global Feedback */}
        {apiError && <ErrorMessage error={apiError} />}

        {/* Tab 1: Permissions Matrix */}
        {activeTab === 'matrix' && (
          <div className="form-main-card">
            <div className="card-section-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className="section-title">Enforced Authorization Capabilities</h3>
                <p className="section-desc">Audit read, write, delete, and management permissions assigned to {role.name}</p>
              </div>

              <div className="filter-search-box" style={{ maxWidth: '320px' }}>
                <SearchIcon size={14} className="search-box-icon" />
                <input
                  type="text"
                  placeholder="Filter permissions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input-field"
                />
              </div>
            </div>

            <PermissionsMatrix
              permissions={allPermissions}
              selectedPermissionIds={rolePermissionIds}
              readOnly
              search={search}
            />
          </div>
        )}

        {/* Tab 2: Assigned Users */}
        {activeTab === 'users' && (
          <div className="form-main-card">
            <div className="card-section-header">
              <div className="section-icon-badge success">
                <UsersIcon size={18} />
              </div>
              <div>
                <h3 className="section-title">Assigned Users</h3>
                <p className="section-desc">Workspace accounts governed by {role.name} access policies</p>
              </div>
            </div>

            {assignedUsers.length === 0 ? (
              <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>
                No users are currently assigned to this role. Assign this role to users via the Users roster.
              </p>
            ) : (
              <div className="assigned-users-list">
                {assignedUsers.map((user) => (
                  <div key={user.id} className="assigned-user-card" id={`assigned-user-${user.id}`}>
                    <div className="table-member-user-cell">
                      <div className="table-user-avatar">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>
                          <Link to={`/users/${user.id}`}>{user.name}</Link>
                        </strong>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="user-status-pill status-active">
                        <CheckCircleIcon size={12} />
                        <span>{user.status || 'ACTIVE'}</span>
                      </span>

                      <Link to={`/users/${user.id}`} className="table-action-btn" title="View User Profile">
                        <UsersIcon size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
