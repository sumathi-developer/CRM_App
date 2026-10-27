import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { userService } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type { User } from '../../types/auth.types';
import type { UserStatus } from '../../types/user.types';
import { Navbar } from '../../components/common/Navbar';
import { UserHeader } from './UserHeader';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  ShieldIcon,
  ActivityIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  EditIcon,
  TrashIcon,
  BuildingIcon,
  SlidersIcon,
  CheckIcon,
} from '../../components/common/Icons';

export const UserDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { userRoleInWorkspace } = useWorkspace();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [dealsCount, setDealsCount] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);

  // Status & Delete modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role?.name === 'ADMIN' || userRoleInWorkspace === 'OWNER';
  const canManage = isSuperAdmin || currentUser?.role?.name === 'MANAGER' || userRoleInWorkspace === 'ADMIN';

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const fetchDetails = async () => {
      try {
        const [userData, activities, deals, tasks] = await Promise.all([
          userService.getUserById(id),
          userService.getUserActivities(id).catch(() => []),
          userService.getUserDeals(id).catch(() => []),
          userService.getUserTasks(id).catch(() => []),
        ]);

        if (!ignore) {
          setUser(userData);
          setActivitiesCount(activities.length);
          setDealsCount(deals.length);
          setTasksCount(tasks.length);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load user details');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchDetails();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!id || !canManage) return;
    setIsStatusChanging(true);
    setApiError(null);

    try {
      const updated = await userService.updateUserStatus(id, newStatus);
      setUser(updated);
      setApiSuccess(`User status successfully changed to ${newStatus}.`);
      setTimeout(() => setApiSuccess(null), 3000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to update user status');
    } finally {
      setIsStatusChanging(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!id || !canManage) return;
    setIsDeleting(true);

    try {
      await userService.deleteUser(id);
      navigate('/users');
    } catch (err: any) {
      setApiError(err.message || 'Failed to delete user');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Loading user details..." />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="empty-state-box">
            <h2>User Not Found</h2>
            <p>The requested user ID does not exist or may have been deleted.</p>
            <Link to="/users" className="auth-btn btn-primary">
              Return to Users Roster
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const permissions = (user.role as any)?.permissions || [];

  return (
    <div className="authenticated-shell" id="user-details-page">
      <Navbar />

      <main className="authenticated-container">
        {/* User Hero Header */}
        <UserHeader user={user} canEdit={canManage} />

        {/* Global Feedback */}
        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        {/* Quick Summary KPI strip */}
        <div className="user-kpi-summary-row">
          <Link to={`/users/${user.id}/activities`} className="user-kpi-box interactive">
            <div className="kpi-icon-pill primary">
              <ActivityIcon size={18} />
            </div>
            <div className="kpi-info-col">
              <span className="kpi-number">{activitiesCount}</span>
              <span className="kpi-title">Logged Activities</span>
            </div>
          </Link>

          <Link to={`/users/${user.id}/performance`} className="user-kpi-box interactive">
            <div className="kpi-icon-pill success">
              <TrendingUpIcon size={18} />
            </div>
            <div className="kpi-info-col">
              <span className="kpi-number">{dealsCount}</span>
              <span className="kpi-title">Assigned Deals</span>
            </div>
          </Link>

          <div className="user-kpi-box">
            <div className="kpi-icon-pill warning">
              <CheckCircleIcon size={18} />
            </div>
            <div className="kpi-info-col">
              <span className="kpi-number">{tasksCount}</span>
              <span className="kpi-title">CRM Tasks</span>
            </div>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="user-details-grid">
          {/* Left Column: Account Information */}
          <div className="user-details-main-col">
            {/* 1. Account & Security Card */}
            <div className="details-card">
              <div className="card-section-header">
                <div className="section-icon-badge primary">
                  <ShieldIcon size={18} />
                </div>
                <div>
                  <h3 className="section-title">Account & Security Status</h3>
                  <p className="section-desc">Lifecycle status and system access tier</p>
                </div>
              </div>

              <div className="details-key-value-grid">
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <div className="detail-status-row">
                    <span className="detail-value">{user.status}</span>
                    {canManage && (
                      <div className="status-action-pills">
                        {user.status !== 'ACTIVE' && (
                          <button
                            type="button"
                            className="btn-status-pill pill-green"
                            onClick={() => handleStatusChange('ACTIVE')}
                            disabled={isStatusChanging}
                          >
                            Activate
                          </button>
                        )}
                        {user.status !== 'INACTIVE' && (
                          <button
                            type="button"
                            className="btn-status-pill pill-yellow"
                            onClick={() => handleStatusChange('INACTIVE')}
                            disabled={isStatusChanging}
                          >
                            Deactivate
                          </button>
                        )}
                        {user.status !== 'SUSPENDED' && (
                          <button
                            type="button"
                            className="btn-status-pill pill-red"
                            onClick={() => handleStatusChange('SUSPENDED')}
                            disabled={isStatusChanging}
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">User Identifier</span>
                  <span className="detail-value font-mono">{user.id}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Assigned Role</span>
                  <span className="detail-value">
                    {user.role?.name || 'MEMBER'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Organization</span>
                  <span className="detail-value">
                    {user.organization?.name || 'Primary Workspace'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Account Created</span>
                  <span className="detail-value">
                    {new Date(user.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Last Profile Update</span>
                  <span className="detail-value">
                    {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Granular Role Permissions Card */}
            <div className="details-card">
              <div className="card-section-header">
                <div className="section-icon-badge secondary">
                  <SlidersIcon size={18} />
                </div>
                <div>
                  <h3 className="section-title">
                    Role Privileges & Permissions ({permissions.length})
                  </h3>
                  <p className="section-desc">
                    Capabilities granted via role &quot;{user.role?.name || 'Standard'}&quot;
                  </p>
                </div>
              </div>

              {permissions.length > 0 ? (
                <div className="permissions-chips-container">
                  {permissions.map((p: any) => (
                    <div key={p.id} className="permission-chip">
                      <CheckIcon size={12} className="chip-check" />
                      <span className="chip-name">
                        {p.permission?.name || p.permissionId}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-subtext-box">
                  <p>
                    Standard role permissions configured. Full workspace member privileges apply.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Quick Actions & Profile Preferences */}
          <div className="user-details-sidebar-col">
            {/* Quick Actions Card */}
            {canManage && (
              <div className="sidebar-action-card">
                <h4 className="sidebar-card-title">Manage Account</h4>
                <div className="sidebar-action-buttons">
                  <Link to={`/users/${user.id}/edit`} className="auth-btn btn-primary full-width">
                    <EditIcon size={16} />
                    <span>Edit User Information</span>
                  </Link>

                  <Link
                    to={`/users/${user.id}/activities`}
                    className="auth-btn btn-secondary full-width"
                  >
                    <ActivityIcon size={16} />
                    <span>View Activity Stream</span>
                  </Link>

                  <Link
                    to={`/users/${user.id}/performance`}
                    className="auth-btn btn-secondary full-width"
                  >
                    <TrendingUpIcon size={16} />
                    <span>Performance Analytics</span>
                  </Link>

                  {user.id !== currentUser?.id && (
                    <button
                      type="button"
                      className="auth-btn btn-danger full-width"
                      onClick={() => setIsDeleteModalOpen(true)}
                      id="btn-trigger-delete-user"
                    >
                      <TrashIcon size={16} />
                      <span>Delete User Account</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Profile Settings Card */}
            <div className="sidebar-action-card">
              <h4 className="sidebar-card-title">User Preferences</h4>
              <div className="pref-item-row">
                <span className="pref-label">Interface Theme</span>
                <span className="pref-value capitalize">
                  {user.profileSettings?.theme || 'dark'}
                </span>
              </div>
              <div className="pref-item-row">
                <span className="pref-label">Email Notifications</span>
                <span className="pref-value">
                  {user.profileSettings?.emailNotifications !== false ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="pref-item-row">
                <span className="pref-label">Push Alerts</span>
                <span className="pref-value">
                  {user.profileSettings?.pushNotifications ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Linked Organization Card */}
            {user.organization && (
              <div className="sidebar-action-card">
                <h4 className="sidebar-card-title">Organization</h4>
                <div className="org-profile-snippet">
                  <div className="org-icon-pill">
                    <BuildingIcon size={18} />
                  </div>
                  <div className="org-meta-text">
                    <strong className="org-name">{user.organization.name}</strong>
                    {user.organization.industry && (
                      <span className="org-industry">{user.organization.industry}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirm Delete Modal (Reused from components/workspace) */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Confirm User Deletion"
        message={`Are you sure you want to permanently delete user account "${user.name}" (${user.email})? This action cannot be undone.`}
        itemName={user.name}
        confirmLabel="Delete User"
        isLoading={isDeleting}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
