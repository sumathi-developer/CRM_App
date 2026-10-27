import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type { User } from '../../types/auth.types';
import type { UserRole, UserStatus } from '../../types/user.types';
import { Navbar } from '../../components/common/Navbar';
import { UserStatusBadge, UserRoleBadge } from './UserBadges';
import { UserFilterBar } from './UserFilterBar';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import { EmptyState } from '../../components/common/EmptyState';
import {
  UsersIcon,
  UserPlusIcon,
  EditIcon,
  TrashIcon,
  ActivityIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ShieldIcon,
  ClockIcon,
} from '../../components/common/Icons';

export const UsersListPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { userRoleInWorkspace } = useWorkspace();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [roleId, setRoleId] = useState('');

  // Modals & Feedback
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Permissions check
  const isSuperAdmin = currentUser?.role?.name === 'ADMIN' || userRoleInWorkspace === 'OWNER';
  const canManage = isSuperAdmin || currentUser?.role?.name === 'MANAGER' || userRoleInWorkspace === 'ADMIN';

  // Metrics counters computed from users
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const inactiveCount = users.filter((u) => u.status === 'INACTIVE').length;
  const suspendedCount = users.filter((u) => u.status === 'SUSPENDED').length;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        userService.getUsers({
          page,
          limit,
          search: search || undefined,
          status: status || undefined,
          roleId: roleId || undefined,
        }),
        userService.getRoles(),
      ]);

      setUsers(usersResponse.data || []);
      setTotalCount(usersResponse.meta?.total ?? usersResponse.data?.length ?? 0);
      setTotalPages(usersResponse.meta?.totalPages ?? 1);
      setRoles(rolesResponse);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load user records');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, status, roleId]);

  useEffect(() => {
    let ignore = false;

    const fetchInitial = async () => {
      try {
        const [usersResponse, rolesResponse] = await Promise.all([
          userService.getUsers({
            page,
            limit,
            search: search || undefined,
            status: status || undefined,
            roleId: roleId || undefined,
          }),
          userService.getRoles(),
        ]);

        if (!ignore) {
          setUsers(usersResponse.data || []);
          setTotalCount(usersResponse.meta?.total ?? usersResponse.data?.length ?? 0);
          setTotalPages(usersResponse.meta?.totalPages ?? 1);
          setRoles(rolesResponse);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load user records');
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
  }, [page, limit, search, status, roleId]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setRoleId('');
    setPage(1);
  };

  const handleQuickStatusToggle = async (targetUser: User) => {
    if (!canManage) return;
    const nextStatus: UserStatus = targetUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      await userService.updateUserStatus(targetUser.id, nextStatus);
      setApiSuccess(`User ${targetUser.name} status updated to ${nextStatus}.`);
      loadData();
      setTimeout(() => setApiSuccess(null), 3000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to update user status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);

    try {
      await userService.deleteUser(userToDelete.id);
      setApiSuccess(`User ${userToDelete.name} was successfully deleted.`);
      setUserToDelete(null);
      loadData();
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="authenticated-shell" id="users-module-page">
      <Navbar />

      <main className="authenticated-container">
        {/* Module Header */}
        <div className="module-title-bar">
          <div className="title-section">
            <div className="module-icon-badge" aria-hidden="true">
              <UsersIcon size={24} />
            </div>
            <div>
              <h1 className="module-page-title">Users & Team Management</h1>
              <p className="module-page-desc">
                View, onboard, manage permissions, and inspect activities for all team members
              </p>
            </div>
          </div>

          <div className="title-action-buttons">
            {canManage && (
              <Link
                to="/users/invite"
                className="auth-btn btn-primary"
                id="btn-invite-user"
              >
                <UserPlusIcon size={16} />
                <span>Invite User</span>
              </Link>
            )}
          </div>
        </div>

        {/* Global Notifications */}
        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        {/* Top KPI Metrics Row */}
        <div className="users-metrics-strip">
          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap primary">
              <UsersIcon size={18} />
            </div>
            <div className="kpi-text-block">
              <span className="kpi-label">Total Users</span>
              <span className="kpi-value">{totalCount}</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap success">
              <CheckCircleIcon size={18} />
            </div>
            <div className="kpi-text-block">
              <span className="kpi-label">Active Users</span>
              <span className="kpi-value">{activeCount}</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap warning">
              <ClockIcon size={18} />
            </div>
            <div className="kpi-text-block">
              <span className="kpi-label">Inactive Staged</span>
              <span className="kpi-value">{inactiveCount}</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap danger">
              <AlertCircleIcon size={18} />
            </div>
            <div className="kpi-text-block">
              <span className="kpi-label">Suspended</span>
              <span className="kpi-value">{suspendedCount}</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <UserFilterBar
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          status={status}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          roleId={roleId}
          onRoleChange={(val) => {
            setRoleId(val);
            setPage(1);
          }}
          roles={roles}
          onReset={handleResetFilters}
          totalUsers={totalCount}
        />

        {/* User Content Area */}
        {isLoading ? (
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Loading team members..." />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No Users Found"
            description={
              search || status || roleId
                ? 'No users match your active filter criteria. Try clearing search filters.'
                : 'No users have been registered in the CRM yet.'
            }
            action={
              canManage ? (
                <Link to="/users/invite" className="auth-btn btn-primary">
                  Invite First User
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="user-table-card">
            <div className="table-responsive-container">
              <table className="user-roster-table" id="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Organization</th>
                    <th>Joined</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id} className="user-table-row">
                      {/* Name & Email */}
                      <td>
                        <div className="user-cell-meta">
                          {item.avatar ? (
                            <img src={item.avatar} alt={item.name} className="user-table-avatar" />
                          ) : (
                            <div className="user-table-avatar-fallback">
                              {getInitials(item.name)}
                            </div>
                          )}
                          <div className="user-name-stack">
                            <Link to={`/users/${item.id}`} className="user-table-name-link">
                              {item.name}
                            </Link>
                            <span className="user-table-email">{item.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td>
                        <UserRoleBadge roleName={item.role?.name} />
                      </td>

                      {/* Status */}
                      <td>
                        <div className="status-cell-wrap">
                          <UserStatusBadge status={item.status} />
                          {canManage && item.id !== currentUser?.id && (
                            <button
                              type="button"
                              className="btn-status-quick-toggle"
                              onClick={() => handleQuickStatusToggle(item)}
                              title={`Switch status to ${item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}`}
                            >
                              Toggle
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Organization */}
                      <td>
                        <span className="org-label">
                          {item.organization?.name || 'Primary Workspace'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td>
                        <span className="joined-date">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Action Links */}
                      <td>
                        <div className="table-actions-cluster text-right">
                          <Link
                            to={`/users/${item.id}`}
                            className="btn-action-icon"
                            title="View Full User Details"
                          >
                            <ShieldIcon size={15} />
                          </Link>

                          <Link
                            to={`/users/${item.id}/activities`}
                            className="btn-action-icon"
                            title="View Activities"
                          >
                            <ActivityIcon size={15} />
                          </Link>

                          <Link
                            to={`/users/${item.id}/performance`}
                            className="btn-action-icon"
                            title="View Performance Analytics"
                          >
                            <TrendingUpIcon size={15} />
                          </Link>

                          {canManage && (
                            <Link
                              to={`/users/${item.id}/edit`}
                              className="btn-action-icon"
                              title="Edit User"
                            >
                              <EditIcon size={15} />
                            </Link>
                          )}

                          {canManage && item.id !== currentUser?.id && (
                            <button
                              type="button"
                              className="btn-action-icon text-danger"
                              onClick={() => setUserToDelete(item)}
                              title="Delete User"
                              aria-label={`Delete ${item.name}`}
                            >
                              <TrashIcon size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="table-pagination-bar">
                <span className="pagination-info">
                  Showing page {page} of {totalPages} ({totalCount} total)
                </span>
                <div className="pagination-buttons">
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="page-number-pill">{page}</span>
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirm Delete Modal (Reused from components/workspace) */}
      <ConfirmDeleteModal
        isOpen={!!userToDelete}
        title="Confirm User Deletion"
        message={`Are you sure you want to permanently delete user account "${userToDelete?.name}" (${userToDelete?.email})? This action cannot be undone.`}
        itemName={userToDelete?.name}
        confirmLabel="Delete User"
        isLoading={isDeleting}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
