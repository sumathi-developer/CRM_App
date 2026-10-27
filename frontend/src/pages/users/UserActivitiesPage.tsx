import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/user.service';
import type { User, UserActivity } from '../../types/user.types';
import { Navbar } from '../../components/common/Navbar';
import { UserHeader } from '../../components/users/UserHeader';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import {
  ActivityIcon,
  PhoneIcon,
  MailIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  UserIcon,
} from '../../components/common/Icons';

export const UserActivitiesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Permission check
  const currentUserRole = (currentUser?.role?.name || '').toUpperCase();
  const canEdit =
    currentUserRole.includes('ADMIN') ||
    currentUserRole.includes('MANAGE') ||
    currentUserRole === 'OWNER' ||
    currentUser?.id === id;

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const fetchActivities = async () => {
      try {
        const [userData, activitiesData] = await Promise.all([
          userService.getUserById(id),
          userService.getUserActivities(id),
        ]);

        if (!ignore) {
          setUser(userData);
          setActivities(activitiesData || []);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load user activities');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchActivities();
    return () => {
      ignore = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="portal-authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <LoadingIndicator size="large" message="Loading user activities..." />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="portal-authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <ErrorMessage error={apiError || 'User profile not found.'} />
          <Link to="/users" className="auth-btn btn-secondary">
            Back to Users Directory
          </Link>
        </main>
      </div>
    );
  }

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    const actType = (act.type || '').toUpperCase();
    const matchesType = selectedType === 'ALL' || actType === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || (act.status || '').toUpperCase() === selectedStatus;
    return matchesType && matchesStatus;
  });

  const getActivityIcon = (type: string) => {
    switch ((type || '').toUpperCase()) {
      case 'CALL':
        return <PhoneIcon size={18} />;
      case 'EMAIL':
        return <MailIcon size={18} />;
      case 'MEETING':
        return <UsersIcon size={18} />;
      case 'FOLLOW_UP':
        return <ClockIcon size={18} />;
      default:
        return <ActivityIcon size={18} />;
    }
  };

  const getActivityTypeClass = (type: string) => {
    switch ((type || '').toUpperCase()) {
      case 'CALL':
        return 'call';
      case 'EMAIL':
        return 'email';
      case 'MEETING':
        return 'meeting';
      case 'FOLLOW_UP':
        return 'follow_up';
      default:
        return 'default';
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Activity counts
  const totalCalls = activities.filter((a) => (a.type || '').toUpperCase() === 'CALL').length;
  const totalEmails = activities.filter((a) => (a.type || '').toUpperCase() === 'EMAIL').length;
  const totalMeetings = activities.filter((a) => (a.type || '').toUpperCase() === 'MEETING').length;
  const totalFollowUps = activities.filter((a) => (a.type || '').toUpperCase() === 'FOLLOW_UP').length;

  return (
    <div className="portal-authenticated-shell">
      <Navbar />

      <main className="authenticated-container" id="user-activities-page">
        <UserHeader user={user} canEdit={canEdit} />

        <ErrorMessage error={apiError} onDismiss={() => setApiError(null)} />

        {/* Activity Metric Stats */}
        <div className="users-stats-row">
          <div className="user-stat-card">
            <div className="user-stat-icon total">
              <ActivityIcon size={20} />
            </div>
            <div className="user-stat-details">
              <span className="user-stat-value">{activities.length}</span>
              <span className="user-stat-label">Total Activities</span>
            </div>
          </div>

          <div className="user-stat-card">
            <div className="user-stat-icon active">
              <PhoneIcon size={20} />
            </div>
            <div className="user-stat-details">
              <span className="user-stat-value">{totalCalls}</span>
              <span className="user-stat-label">Calls Logged</span>
            </div>
          </div>

          <div className="user-stat-card">
            <div className="user-stat-icon admins">
              <MailIcon size={20} />
            </div>
            <div className="user-stat-details">
              <span className="user-stat-value">{totalEmails}</span>
              <span className="user-stat-label">Emails Dispatched</span>
            </div>
          </div>

          <div className="user-stat-card">
            <div className="user-stat-icon inactive">
              <UsersIcon size={20} />
            </div>
            <div className="user-stat-details">
              <span className="user-stat-value">{totalMeetings + totalFollowUps}</span>
              <span className="user-stat-label">Meetings & Follow-ups</span>
            </div>
          </div>
        </div>

        {/* Activity Filter Chips */}
        <div className="users-filter-card" style={{ marginBottom: '1.25rem' }}>
          <div className="activity-filters-row" style={{ margin: 0, padding: 0 }}>
            {[
              { key: 'ALL', label: `All (${activities.length})` },
              { key: 'CALL', label: `Calls (${totalCalls})` },
              { key: 'EMAIL', label: `Emails (${totalEmails})` },
              { key: 'MEETING', label: `Meetings (${totalMeetings})` },
              { key: 'FOLLOW_UP', label: `Follow-ups (${totalFollowUps})` },
            ].map((chip) => (
              <button
                key={chip.key}
                type="button"
                className={`activity-filter-chip ${selectedType === chip.key ? 'is-active' : ''}`}
                onClick={() => setSelectedType(chip.key)}
                id={`filter-type-${chip.key.toLowerCase()}`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div>
            <select
              className="users-select-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              id="filter-activity-status"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Activities Timeline List */}
        {filteredActivities.length === 0 ? (
          <div className="user-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <ActivityIcon size={44} className="empty-icon" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>No Activities Found</h3>
            <p style={{ color: '#94a3b8', margin: 0 }}>
              No activities match the current filter selection ({selectedType} / {selectedStatus}).
            </p>
          </div>
        ) : (
          <div className="activity-timeline-list">
            {filteredActivities.map((act) => (
              <div key={act.id} className="activity-item-card" id={`activity-${act.id}`}>
                <div className={`activity-type-icon ${getActivityTypeClass(act.type)}`}>
                  {getActivityIcon(act.type)}
                </div>

                <div className="activity-content">
                  <div className="activity-content-top">
                    <span className="activity-subject">{act.subject}</span>
                    <span className="activity-time">
                      {act.scheduledAt ? formatDate(act.scheduledAt) : formatDate(act.createdAt)}
                    </span>
                  </div>

                  {act.description && (
                    <p className="activity-desc">{act.description}</p>
                  )}

                  <div className="activity-tags-row">
                    <span
                      className="permission-pill"
                      style={{
                        background:
                          act.status === 'COMPLETED'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                        color: act.status === 'COMPLETED' ? '#34d399' : '#60a5fa',
                        borderColor:
                          act.status === 'COMPLETED'
                            ? 'rgba(16, 185, 129, 0.3)'
                            : 'rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      {act.status}
                    </span>

                    <span
                      className="permission-pill"
                      style={{
                        background:
                          act.priority === 'URGENT' || act.priority === 'HIGH'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(148, 163, 184, 0.15)',
                        color:
                          act.priority === 'URGENT' || act.priority === 'HIGH'
                            ? '#f87171'
                            : '#94a3b8',
                      }}
                    >
                      {act.priority || 'MEDIUM'} Priority
                    </span>

                    {act.contact && (
                      <span className="activity-entity-tag">
                        <UserIcon size={12} />
                        <span>
                          {act.contact.firstName} {act.contact.lastName || ''}
                        </span>
                      </span>
                    )}

                    {act.lead && (
                      <span className="activity-entity-tag">
                        <CheckCircleIcon size={12} />
                        <span>Lead: {act.lead.name || act.lead.company}</span>
                      </span>
                    )}

                    {act.deal && (
                      <span className="activity-entity-tag">
                        <BriefcaseIcon size={12} />
                        <span>
                          Deal: {act.deal.title} (${Number(act.deal.value).toLocaleString()})
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
