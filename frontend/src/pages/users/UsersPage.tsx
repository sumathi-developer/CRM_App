import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/user.service';
import type { User, Role, PaginationMeta } from '../../types/user.types';
import { Navbar } from '../../components/common/Navbar';
import { UserStatusBadge } from '../../components/users/UserStatusBadge';
import { UserRoleBadge } from '../../components/users/UserRoleBadge';
import { InviteUserModal } from '../../components/users/InviteUserModal';
import { ChangeStatusModal } from '../../components/users/ChangeStatusModal';
import { DeleteUserModal } from '../../components/users/DeleteUserModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  UsersIcon,
  SearchIcon,
  UserPlusIcon,
  EditIcon,
  TrashIcon,
  SlidersIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  ShieldIcon,
  ClockIcon,
} from '../../components/common/Icons';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);

  // UI / Async states
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Modals
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [userForStatus, setUserForStatus] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Check permissions: Admin or Manager can edit/invite
  const userRole = (currentUser?.role?.name || '').toUpperCase();
  const canManageUsers = userRole.includes('ADMIN') || userRole.includes('MANAGE') || userRole === 'OWNER';
  const isAdmin = userRole.includes('ADMIN') || userRole === 'OWNER';

  // Fetch users & roles
  const loadUsersData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const [usersRes, rolesRes] = await Promise.all([
        userService.getUsers({
          page,
          limit: 10,
          search: searchTerm.trim() || undefined,
          status: selectedStatus,
          roleId: selectedRoleId,
        }),
        userService.getRoles(),
      ]);

      setUsers(usersRes.data || []);
      setPagination(
        usersRes.meta || {
          total: (usersRes.data || []).length,
          page,
          limit: 10,
          totalPages: Math.ceil(((usersRes.data || []).length || 1) / 10),
        }
      );
      setRoles(rolesRes || []);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load users directory');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, selectedStatus, selectedRoleId]);

  useEffect(() => {
    let ignore = false;

    const fetchInitial = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          userService.getUsers({
            page,
            limit: 10,
            search: searchTerm.trim() || undefined,
            status: selectedStatus,
            roleId: selectedRoleId,
          }),
          userService.getRoles(),
        ]);

        if (!ignore) {
          setUsers(usersRes.data || []);
          setPagination(
            usersRes.meta || {
              total: (usersRes.data || []).length,
              page,
              limit: 10,
              totalPages: Math.ceil(((usersRes.data || []).length || 1) / 10),
            }
          );
          setRoles(rolesRes || []);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load users directory');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchInitial();
    return () => {
      ignore = true;
    };
  }, [page, searchTerm, selectedStatus, selectedRoleId]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('ALL');
    setSelectedRoleId('ALL');
    setPage(1);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Stats calculation
  const totalUsers = pagination.total || users.length;
  const activeUsersCount = users.filter((u) => u.status === 'ACTIVE').length;
  const adminUsersCount = users.filter(
    (u) => (u.role?.name || '').toUpperCase().includes('ADMIN') || (u.role?.name || '').toUpperCase() === 'OWNER'
  ).length;
  const inactiveUsersCount = users.filter((u) => u.status !== 'ACTIVE').length;

  return (
    <div className="portal-authenticated-shell">
      <Navbar />

      <main className="authenticated-container" id="users-directory-page">
        {/* Page Top Header */}
        <div className="users-page-header">
          <div className="users-header-top">
            <div className="users-title-group">
              <h1>
                <UsersIcon size={28} />
                <span>Users & Team Directory</span>
              </h1>
              <p>Manage organizational team members, credentials, operational roles, and statuses</p>
            </div>

            <div className="users-header-actions">
              {canManageUsers && (
                <>
                  <Link
                    to="/users/invite"
                    className="auth-btn btn-secondary"
                    style={{ textDecoration: 'none' }}
                    id="btn-goto-invite-page"
                  >
                    <UserPlusIcon size={16} />
                    <span>Invite Link</span>
                  </Link>

                  <button
                    type="button"
                    className="auth-btn btn-primary"
                    onClick={() => setIsInviteOpen(true)}
                    id="btn-open-quick-invite"
                  >
                    <UserPlusIcon size={16} />
                    <span>Quick Add User</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="users-stats-row">
            <div className="user-stat-card">
              <div className="user-stat-icon total">
                <UsersIcon size={20} />
              </div>
              <div className="user-stat-details">
                <span className="user-stat-value">{totalUsers}</span>
                <span className="user-stat-label">Total Users</span>
              </div>
            </div>

            <div className="user-stat-card">
              <div className="user-stat-icon active">
                <CheckCircleIcon size={20} />
              </div>
              <div className="user-stat-details">
                <span className="user-stat-value">{activeUsersCount}</span>
                <span className="user-stat-label">Active Members</span>
              </div>
            </div>

            <div className="user-stat-card">
              <div className="user-stat-icon admins">
                <ShieldIcon size={20} />
              </div>
              <div className="user-stat-details">
                <span className="user-stat-value">{adminUsersCount}</span>
                <span className="user-stat-label">Administrators</span>
              </div>
            </div>

            <div className="user-stat-card">
              <div className="user-stat-icon inactive">
                <ClockIcon size={20} />
              </div>
              <div className="user-stat-details">
                <span className="user-stat-value">{inactiveUsersCount}</span>
                <span className="user-stat-label">Inactive / Suspended</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Feedback Banners */}
        <ErrorMessage error={apiError} onDismiss={() => setApiError(null)} />
        <SuccessMessage message={apiSuccess} onDismiss={() => setApiSuccess(null)} />

        {/* Search & Filters Bar */}
        <div className="users-filter-card">
          <div className="users-search-box">
            <SearchIcon size={16} className="users-search-icon" />
            <input
              type="text"
              className="users-search-input"
              placeholder="Search by name, email, or telephone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              id="users-search-input"
            />
          </div>

          <div className="users-filter-group">
            <select
              className="users-select-filter"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              id="filter-status-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <select
              className="users-select-filter"
              value={selectedRoleId}
              onChange={(e) => {
                setSelectedRoleId(e.target.value);
                setPage(1);
              }}
              id="filter-role-select"
            >
              <option value="ALL">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {(searchTerm || selectedStatus !== 'ALL' || selectedRoleId !== 'ALL') && (
              <button
                type="button"
                className="btn-filter-reset"
                onClick={handleResetFilters}
                id="btn-reset-user-filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="users-table-container" style={{ padding: '3.5rem 1rem' }}>
            <LoadingIndicator size="large" message="Loading users directory..." />
          </div>
        ) : users.length === 0 ? (
          <div className="users-table-container">
            <div className="empty-state-card" style={{ padding: '3.5rem 1rem' }}>
              <UsersIcon size={48} className="empty-icon" />
              <h3>No Users Found</h3>
              <p>No team members matched the current search criteria or filter parameters.</p>
              {(searchTerm || selectedStatus !== 'ALL' || selectedRoleId !== 'ALL') && (
                <button
                  type="button"
                  className="auth-btn btn-secondary"
                  onClick={handleResetFilters}
                  style={{ marginTop: '1rem' }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-data-table" id="users-roster-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Assigned Role</th>
                  <th>Account Status</th>
                  <th>Organization</th>
                  <th>Contact</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} id={`user-row-${item.id}`}>
                    <td>
                      <div className="user-identity-cell">
                        <div className="user-table-avatar">
                          {item.avatar ? (
                            <img src={item.avatar} alt={item.name} />
                          ) : (
                            <span>{getInitials(item.name)}</span>
                          )}
                          <span
                            className={`user-avatar-indicator ${item.status.toLowerCase()}`}
                            aria-hidden="true"
                          />
                        </div>

                        <div>
                          <div className="user-name-title">
                            <Link to={`/users/${item.id}`}>{item.name}</Link>
                            {item.id === currentUser?.id && (
                              <span className="permission-pill" style={{ color: '#60a5fa' }}>
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="user-email-sub">{item.email}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <UserRoleBadge roleName={item.role?.name || 'User'} />
                    </td>

                    <td>
                      <UserStatusBadge status={item.status} />
                    </td>

                    <td>
                      <span style={{ color: '#cbd5e1' }}>
                        {item.organization?.name || '—'}
                      </span>
                    </td>

                    <td>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        {item.phone || '—'}
                      </span>
                    </td>

                    <td>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        {formatDate(item.createdAt)}
                      </span>
                    </td>

                    <td>
                      <div className="user-actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <Link
                          to={`/users/${item.id}`}
                          className="btn-table-action"
                          title="View user details & performance"
                          id={`btn-view-${item.id}`}
                        >
                          <ExternalLinkIcon size={14} />
                        </Link>

                        {canManageUsers && (
                          <>
                            <Link
                              to={`/users/${item.id}/edit`}
                              className="btn-table-action"
                              title="Edit user profile"
                              id={`btn-edit-${item.id}`}
                            >
                              <EditIcon size={14} />
                            </Link>

                            <button
                              type="button"
                              className="btn-table-action"
                              title="Change account status"
                              onClick={() => setUserForStatus(item)}
                              id={`btn-status-${item.id}`}
                            >
                              <SlidersIcon size={14} />
                            </button>
                          </>
                        )}

                        {isAdmin && item.id !== currentUser?.id && (
                          <button
                            type="button"
                            className="btn-table-action action-danger"
                            title="Delete user account"
                            onClick={() => setUserToDelete(item)}
                            id={`btn-delete-${item.id}`}
                          >
                            <TrashIcon size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="users-pagination-bar">
              <div className="pagination-meta">
                Showing{' '}
                <strong>
                  {users.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
                </strong>{' '}
                to{' '}
                <strong>
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </strong>{' '}
                of <strong>{pagination.total}</strong> team members
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="btn-page-nav"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  id="btn-pagination-prev"
                >
                  Previous
                </button>

                <span className="pagination-page-indicator">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>

                <button
                  type="button"
                  className="btn-page-nav"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  id="btn-pagination-next"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <InviteUserModal
        isOpen={isInviteOpen}
        roles={roles}
        organizations={[]}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={(newUser) => {
          setApiSuccess(`Successfully created user "${newUser.name}"!`);
          loadUsersData();
          setTimeout(() => setApiSuccess(null), 4000);
        }}
      />

      <ChangeStatusModal
        isOpen={Boolean(userForStatus)}
        user={userForStatus}
        onClose={() => setUserForStatus(null)}
        onSuccess={(updated) => {
          setApiSuccess(`Status for ${updated.name} changed to ${updated.status}!`);
          loadUsersData();
          setTimeout(() => setApiSuccess(null), 4000);
        }}
      />

      <DeleteUserModal
        isOpen={Boolean(userToDelete)}
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onSuccess={(deletedId) => {
          setApiSuccess('User account successfully deleted.');
          setUsers((prev) => prev.filter((u) => u.id !== deletedId));
          loadUsersData();
          setTimeout(() => setApiSuccess(null), 4000);
        }}
      />
    </div>
  );
};
