import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/user.service';
import type { User, UserActivity, UserDeal, UserTask } from '../../types/user.types';
import { Navbar } from '../../components/common/Navbar';
import { UserHeader } from '../../components/users/UserHeader';
import { ChangeStatusModal } from '../../components/users/ChangeStatusModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import {
  UserIcon,
  ShieldIcon,
  ActivityIcon,
  TrendingUpIcon,
  CalendarIcon,
  BriefcaseIcon,
  ExternalLinkIcon,
} from '../../components/common/Icons';

export const UserDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [deals, setDeals] = useState<UserDeal[]>([]);
  const [tasks, setTasks] = useState<UserTask[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Permission: Admin, Manager, or own profile
  const userRole = (currentUser?.role?.name || '').toUpperCase();
  const canEdit =
    userRole.includes('ADMIN') ||
    userRole.includes('MANAGE') ||
    userRole === 'OWNER' ||
    currentUser?.id === id;

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const fetchDetails = async () => {
      try {
        const [userData, activitiesData, dealsData, tasksData] = await Promise.all([
          userService.getUserById(id),
          userService.getUserActivities(id).catch(() => []),
          userService.getUserDeals(id).catch(() => []),
          userService.getUserTasks(id).catch(() => []),
        ]);

        if (!ignore) {
          setUser(userData);
          setActivities(activitiesData);
          setDeals(dealsData);
          setTasks(tasksData);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load user profile details');
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

  if (isLoading) {
    return (
      <div className="portal-authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <LoadingIndicator size="large" message="Loading user details..." />
        </main>
      </div>
    );
  }

  if (!user || apiError) {
    return (
      <div className="portal-authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <ErrorMessage error={apiError || 'User profile not found.'} />
          <div style={{ marginTop: '1rem' }}>
            <Link to="/users" className="auth-btn btn-secondary">
              Back to Users Directory
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Calculate quick summary metrics
  const wonDealsCount = deals.filter((d) => d.status === 'WON').length;
  const totalPipeline = deals
    .filter((d) => d.status === 'OPEN' || !d.status)
    .reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const completedTasksCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Extract permissions from role
  const permissionsList = (user.role?.permissions || []).map(
    (rp) => rp.permission?.name || rp.permissionId
  );

  return (
    <div className="portal-authenticated-shell">
      <Navbar />

      <main className="authenticated-container" id="user-details-page">
        <UserHeader
          user={user}
          canEdit={canEdit}
          onOpenStatusModal={() => setIsStatusModalOpen(true)}
        />

        <div className="user-details-layout">
          {/* Left Column: Identity & Account Data */}
          <div>
            <div className="user-card">
              <h3 className="user-card-title">
                <UserIcon size={18} />
                <span>Account & Identification</span>
              </h3>

              <div className="user-info-grid">
                <div className="user-info-item">
                  <span className="user-info-label">Full Name</span>
                  <span className="user-info-value">{user.name}</span>
                </div>

                <div className="user-info-item">
                  <span className="user-info-label">Corporate Email</span>
                  <span className="user-info-value font-mono">{user.email}</span>
                </div>

                <div className="user-info-item">
                  <span className="user-info-label">Telephone Contact</span>
                  <span className="user-info-value">{user.phone || 'Not provided'}</span>
                </div>

                <div className="user-info-item">
                  <span className="user-info-label">Organization / Division</span>
                  <span className="user-info-value">{user.organization?.name || 'Standard Division'}</span>
                </div>

                <div className="user-info-item">
                  <span className="user-info-label">Account Registration</span>
                  <span className="user-info-value">{formatDate(user.createdAt)}</span>
                </div>

                <div className="user-info-item">
                  <span className="user-info-label">Last Profile Update</span>
                  <span className="user-info-value">{formatDate(user.updatedAt)}</span>
                </div>

                {user.activeWorkspaceId && (
                  <div className="user-info-item full-span">
                    <span className="user-info-label">Active Workspace</span>
                    <span className="user-info-value font-mono">
                      {user.activeWorkspaceId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Overview Snapshot */}
            <div className="user-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 className="user-card-title" style={{ margin: 0 }}>
                  <TrendingUpIcon size={18} />
                  <span>Performance Snapshot</span>
                </h3>
                <Link to={`/users/${user.id}/performance`} className="detail-link" style={{ fontSize: '0.8rem' }}>
                  <span>View Full Performance</span>
                  <ExternalLinkIcon size={12} />
                </Link>
              </div>

              <div className="users-stats-row" style={{ marginBottom: 0 }}>
                <div className="user-stat-card">
                  <div className="user-stat-icon active">
                    <BriefcaseIcon size={18} />
                  </div>
                  <div className="user-stat-details">
                    <span className="user-stat-value">{wonDealsCount}</span>
                    <span className="user-stat-label">Deals Won</span>
                  </div>
                </div>

                <div className="user-stat-card">
                  <div className="user-stat-icon total">
                    <TrendingUpIcon size={18} />
                  </div>
                  <div className="user-stat-details">
                    <span className="user-stat-value">${totalPipeline.toLocaleString()}</span>
                    <span className="user-stat-label">Open Pipeline</span>
                  </div>
                </div>

                <div className="user-stat-card">
                  <div className="user-stat-icon admins">
                    <CalendarIcon size={18} />
                  </div>
                  <div className="user-stat-details">
                    <span className="user-stat-value">{completedTasksCount} / {tasks.length}</span>
                    <span className="user-stat-label">Tasks Done</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities Snapshot */}
            <div className="user-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 className="user-card-title" style={{ margin: 0 }}>
                  <ActivityIcon size={18} />
                  <span>Recent Activities ({activities.length})</span>
                </h3>
                <Link to={`/users/${user.id}/activities`} className="detail-link" style={{ fontSize: '0.8rem' }}>
                  <span>View All Activities</span>
                  <ExternalLinkIcon size={12} />
                </Link>
              </div>

              {activities.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                  No recent activities recorded for this user.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activities.slice(0, 3).map((act) => (
                    <div
                      key={act.id}
                      style={{
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
                          {act.subject}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          Type: <strong>{act.type}</strong> • Status: {act.status}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {formatDate(act.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Roles & Privileges */}
          <div>
            <div className="user-card">
              <h3 className="user-card-title">
                <ShieldIcon size={18} />
                <span>Assigned Role & Permissions</span>
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                  {user.role?.name || 'Standard User'}
                </span>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0.75rem 0' }}>
                  {user.role?.description || 'Operational permissions defined by organization governance.'}
                </p>
              </div>

              <div>
                <span className="user-info-label">Active Permissions</span>
                {permissionsList.length > 0 ? (
                  <div className="permissions-tag-cloud">
                    {permissionsList.map((perm, idx) => (
                      <span key={idx} className="permission-pill">
                        {perm}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="permissions-tag-cloud">
                    <span className="permission-pill">users:read</span>
                    <span className="permission-pill">deals:read</span>
                    <span className="permission-pill">contacts:read</span>
                    <span className="permission-pill">activities:read</span>
                  </div>
                )}
              </div>
            </div>

            <div className="user-card">
              <h4 className="user-card-title">
                <BriefcaseIcon size={16} />
                <span>Active Deals Owned ({deals.length})</span>
              </h4>

              {deals.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                  This user currently owns no active CRM deals.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {deals.slice(0, 4).map((d) => (
                    <div
                      key={d.id}
                      style={{
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        padding: '0.625rem 0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                          {d.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {d.stage?.name || 'Pipeline Stage'} • {d.probability}% Prob.
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, color: d.status === 'WON' ? '#10b981' : '#60a5fa', fontSize: '0.875rem' }}>
                        ${Number(d.value).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <ChangeStatusModal
        isOpen={isStatusModalOpen}
        user={user}
        onClose={() => setIsStatusModalOpen(false)}
        onSuccess={(updated) => setUser(updated)}
      />
    </div>
  );
};
