import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userService } from '../../services/user.service';
import type { User } from '../../types/auth.types';
import type { UserActivityEntity } from '../../types/user.types';
import { Navbar } from '../../components/common/Navbar';
import { UserHeader } from './UserHeader';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ActivityIcon,
  PhoneIcon,
  CalendarIcon,
  MailIcon,
  CheckCircleIcon,
  ClockIcon,
  SearchIcon,
  BuildingIcon,
  UserIcon,
} from '../../components/common/Icons';

export const UserActivitiesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<UserActivityEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const loadData = async () => {
      try {
        const [userData, activitiesData] = await Promise.all([
          userService.getUserById(id),
          userService.getUserActivities(id),
        ]);

        if (!ignore) {
          setUser(userData);
          setActivities(activitiesData);
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

    loadData();
    return () => {
      ignore = true;
    };
  }, [id]);

  // Derived metrics
  const totalCount = activities.length;
  const callsCount = activities.filter((a) => a.type?.toUpperCase() === 'CALL').length;
  const meetingsCount = activities.filter((a) => a.type?.toUpperCase() === 'MEETING').length;
  const emailsCount = activities.filter((a) => a.type?.toUpperCase() === 'EMAIL').length;
  const tasksCount = activities.filter((a) => a.type?.toUpperCase() === 'TASK').length;

  // Filtered list
  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      !search ||
      act.subject.toLowerCase().includes(search.toLowerCase()) ||
      act.description?.toLowerCase().includes(search.toLowerCase()) ||
      act.contact?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      act.contact?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      act.lead?.company?.toLowerCase().includes(search.toLowerCase()) ||
      act.deal?.title?.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'ALL' || act.type?.toUpperCase() === typeFilter;

    return matchesSearch && matchesType;
  });

  const getActivityIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'CALL':
        return <PhoneIcon size={16} />;
      case 'MEETING':
        return <CalendarIcon size={16} />;
      case 'EMAIL':
        return <MailIcon size={16} />;
      case 'TASK':
        return <CheckCircleIcon size={16} />;
      default:
        return <ActivityIcon size={16} />;
    }
  };

  const getActivityBadgeClass = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'CALL':
        return 'act-type-call';
      case 'MEETING':
        return 'act-type-meeting';
      case 'EMAIL':
        return 'act-type-email';
      case 'TASK':
        return 'act-type-task';
      default:
        return 'act-type-default';
    }
  };

  if (isLoading) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Loading user activities..." />
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
            <Link to="/users" className="auth-btn btn-primary">
              Return to Users
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="authenticated-shell" id="user-activities-page">
      <Navbar />

      <main className="authenticated-container">
        {/* User Navigation Header */}
        <UserHeader user={user} />

        {apiError && <ErrorMessage error={apiError} />}

        {/* Activity Summary Counters */}
        <div className="activity-summary-grid">
          <div className="act-summary-card">
            <div className="act-summary-icon total">
              <ActivityIcon size={18} />
            </div>
            <div className="act-summary-text">
              <span className="act-count">{totalCount}</span>
              <span className="act-label">Total Activities</span>
            </div>
          </div>

          <div className="act-summary-card">
            <div className="act-summary-icon call">
              <PhoneIcon size={18} />
            </div>
            <div className="act-summary-text">
              <span className="act-count">{callsCount}</span>
              <span className="act-label">Phone Calls</span>
            </div>
          </div>

          <div className="act-summary-card">
            <div className="act-summary-icon meeting">
              <CalendarIcon size={18} />
            </div>
            <div className="act-summary-text">
              <span className="act-count">{meetingsCount}</span>
              <span className="act-label">Meetings</span>
            </div>
          </div>

          <div className="act-summary-card">
            <div className="act-summary-icon email">
              <MailIcon size={18} />
            </div>
            <div className="act-summary-text">
              <span className="act-count">{emailsCount}</span>
              <span className="act-label">Client Emails</span>
            </div>
          </div>

          <div className="act-summary-card">
            <div className="act-summary-icon task">
              <CheckCircleIcon size={18} />
            </div>
            <div className="act-summary-text">
              <span className="act-count">{tasksCount}</span>
              <span className="act-label">Completed Tasks</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="activities-filter-row">
          <div className="act-search-box">
            <SearchIcon size={16} className="search-icon-adornment" />
            <input
              type="text"
              placeholder="Search activities by subject, contact, deal, or lead..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="user-search-input"
            />
          </div>

          <div className="act-type-buttons">
            {['ALL', 'CALL', 'MEETING', 'EMAIL', 'TASK'].map((t) => (
              <button
                key={t}
                type="button"
                className={`btn-act-filter ${typeFilter === t ? 'is-active' : ''}`}
                onClick={() => setTypeFilter(t)}
              >
                {t === 'ALL' ? 'All Types' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Activities List */}
        {filteredActivities.length === 0 ? (
          <EmptyState
            title="No Activities Logged"
            description={
              search || typeFilter !== 'ALL'
                ? 'No activities match your current filter parameters.'
                : `${user.name} has not logged or been assigned any CRM activities yet.`
            }
          />
        ) : (
          <div className="activities-timeline-card">
            <div className="timeline-items-list">
              {filteredActivities.map((act) => (
                <div key={act.id} className="timeline-item">
                  <div className={`timeline-marker ${getActivityBadgeClass(act.type)}`}>
                    {getActivityIcon(act.type)}
                  </div>

                  <div className="timeline-content">
                    <div className="timeline-header-line">
                      <div className="timeline-subject-wrap">
                        <span className={`act-type-tag ${getActivityBadgeClass(act.type)}`}>
                          {act.type || 'ACTIVITY'}
                        </span>
                        <h4 className="timeline-subject">{act.subject}</h4>
                      </div>

                      <div className="timeline-time-col">
                        <ClockIcon size={14} />
                        <span>{new Date(act.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {act.description && (
                      <p className="timeline-desc">{act.description}</p>
                    )}

                    {/* Associated Records */}
                    <div className="timeline-associations">
                      {act.contact && (
                        <div className="association-badge">
                          <UserIcon size={13} />
                          <span>
                            Contact: {act.contact.firstName} {act.contact.lastName}
                          </span>
                        </div>
                      )}

                      {act.lead && (
                        <div className="association-badge">
                          <BuildingIcon size={13} />
                          <span>Lead: {act.lead.company || act.lead.title}</span>
                        </div>
                      )}

                      {act.deal && (
                        <div className="association-badge">
                          <ActivityIcon size={13} />
                          <span>
                            Deal: {act.deal.title}{' '}
                            {act.deal.value !== undefined ? `($${act.deal.value.toLocaleString()})` : ''}
                          </span>
                        </div>
                      )}

                      {act.status && (
                        <span className="act-status-pill">{act.status}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
