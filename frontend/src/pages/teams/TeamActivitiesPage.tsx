import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teamService } from '../../services/team.service';
import type { TeamEntity, TeamMemberEntity, TeamActivityRecord } from '../../types/team.types';
import { Navbar } from '../../components/common/Navbar';
import { TeamHeader } from './TeamHeader';
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
  DollarSignIcon,
  FilterIcon,
  RefreshCwIcon,
} from '../../components/common/Icons';

export const TeamActivitiesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [team, setTeam] = useState<TeamEntity | null>(null);
  const [members, setMembers] = useState<TeamMemberEntity[]>([]);
  const [activities, setActivities] = useState<TeamActivityRecord[]>([]);
  const [totalActivities, setTotalActivities] = useState(0);
  const [breakdownByType, setBreakdownByType] = useState<Record<string, number>>({});
  const [breakdownByStatus, setBreakdownByStatus] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [memberFilter, setMemberFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const loadActivities = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const [teamData, membersData, activitiesRes] = await Promise.all([
          teamService.getTeamById(id),
          teamService.getTeamMembers(id),
          teamService.getTeamActivities(id, {
            page,
            limit,
            type: typeFilter !== 'ALL' ? typeFilter : undefined,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            userId: memberFilter !== 'ALL' ? memberFilter : undefined,
          }),
        ]);

        if (!ignore) {
          setTeam(teamData);
          setMembers(membersData);
          setActivities(activitiesRes.data || []);
          setTotalActivities(activitiesRes.totalActivities || activitiesRes.meta?.total || 0);
          setBreakdownByType(activitiesRes.breakdownByType || {});
          setBreakdownByStatus(activitiesRes.breakdownByStatus || {});
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load team activities');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadActivities();
    return () => {
      ignore = true;
    };
  }, [id, page, limit, typeFilter, statusFilter, memberFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setMemberFilter('ALL');
    setPage(1);
  };

  const getActivityIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('CALL')) return <PhoneIcon size={16} />;
    if (t.includes('MEETING')) return <CalendarIcon size={16} />;
    if (t.includes('EMAIL')) return <MailIcon size={16} />;
    return <ActivityIcon size={16} />;
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED') {
      return (
        <span className="user-status-pill status-active">
          <CheckCircleIcon size={12} />
          <span>Completed</span>
        </span>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <span className="user-status-pill status-inactive">
          <span>Cancelled</span>
        </span>
      );
    }
    return (
      <span className="user-status-pill status-warning">
        <ClockIcon size={12} />
        <span>Pending</span>
      </span>
    );
  };

  // Local search filter on activities subject/description
  const filteredActivities = activities.filter((act) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const subjectMatch = act.subject?.toLowerCase().includes(q);
    const descMatch = act.description?.toLowerCase().includes(q);
    const memberMatch = act.assignedTo?.name?.toLowerCase().includes(q);
    const contactMatch = act.contact?.firstName?.toLowerCase().includes(q) || act.contact?.lastName?.toLowerCase().includes(q);
    return subjectMatch || descMatch || memberMatch || contactMatch;
  });

  if (isLoading && !team) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Loading team activity stream..." />
          </div>
        </main>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="empty-state-box">
            <h2>Team Not Found</h2>
            <Link to="/teams" className="auth-btn btn-primary">
              Return to Teams Directory
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="authenticated-shell" id="team-activities-page">
      <Navbar />

      <main className="authenticated-container">
        {/* Contextual Header with Tabs */}
        <TeamHeader team={team} canEdit />

        {/* Global Feedback */}
        {apiError && <ErrorMessage error={apiError} />}

        {/* Top Summary Breakdown Strip */}
        <div className="users-metrics-strip">
          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap primary">
              <ActivityIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{totalActivities}</span>
              <span className="kpi-label">Total Activities</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap success">
              <PhoneIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{breakdownByType['CALL'] || 0}</span>
              <span className="kpi-label">Calls Logged</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap warning">
              <CalendarIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{breakdownByType['MEETING'] || 0}</span>
              <span className="kpi-label">Meetings Conducted</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap primary">
              <MailIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{breakdownByType['EMAIL'] || 0}</span>
              <span className="kpi-label">Emails Sent</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap success">
              <CheckCircleIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{breakdownByStatus['COMPLETED'] || 0}</span>
              <span className="kpi-label">Completed Tasks</span>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="users-filter-bar" style={{ marginBottom: '1.5rem' }}>
          <div className="filter-search-box">
            <SearchIcon size={16} className="search-box-icon" />
            <input
              type="text"
              placeholder="Search activities by subject, notes, or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input-field"
              aria-label="Search activities"
            />
          </div>

          <div className="filter-controls-group">
            {/* Type Filter */}
            <div className="filter-select-wrap">
              <FilterIcon size={14} className="select-lead-icon" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="filter-select-field"
                aria-label="Filter by activity type"
              >
                <option value="ALL">All Types</option>
                <option value="CALL">Calls</option>
                <option value="MEETING">Meetings</option>
                <option value="EMAIL">Emails</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="FOLLOW_UP">Follow-ups</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-select-wrap">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="filter-select-field"
                aria-label="Filter by status"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Member Filter */}
            <div className="filter-select-wrap">
              <select
                value={memberFilter}
                onChange={(e) => {
                  setMemberFilter(e.target.value);
                  setPage(1);
                }}
                className="filter-select-field"
                aria-label="Filter by team member"
              >
                <option value="ALL">All Team Members</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user?.name || 'Member'}
                  </option>
                ))}
              </select>
            </div>

            {(search || typeFilter !== 'ALL' || statusFilter !== 'ALL' || memberFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="filter-reset-btn"
                title="Reset filters"
              >
                <RefreshCwIcon size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Activities Timeline Stream */}
        {filteredActivities.length === 0 ? (
          <div className="empty-state-card">
            <EmptyState
              title="No activities recorded"
              description={
                search || typeFilter !== 'ALL' || statusFilter !== 'ALL' || memberFilter !== 'ALL'
                  ? 'No activities match the selected filter criteria. Try adjusting your query.'
                  : `There are currently no logged activities for ${team.name}. Activities recorded on associated leads and deals will appear here.`
              }
            />
          </div>
        ) : (
          <div className="activities-timeline-stream">
            {filteredActivities.map((act) => (
              <div key={act.id} className="activity-timeline-card" id={`activity-card-${act.id}`}>
                <div className="activity-card-icon-badge" title={act.type}>
                  {getActivityIcon(act.type)}
                </div>

                <div className="activity-card-content">
                  <div className="activity-card-header-row">
                    <div className="activity-title-group">
                      <span className="activity-type-label">{act.type}</span>
                      <h3 className="activity-subject-text">{act.subject}</h3>
                    </div>
                    {getStatusBadge(act.status)}
                  </div>

                  {act.description && (
                    <p className="activity-desc-text">{act.description}</p>
                  )}

                  <div className="activity-entities-row">
                    {/* Assigned Member */}
                    {act.assignedTo && (
                      <span className="entity-chip-badge" title="Assigned Team Member">
                        <UserIcon size={13} />
                        <span>{act.assignedTo.name}</span>
                      </span>
                    )}

                    {/* Contact Link */}
                    {act.contact && (
                      <span className="entity-chip-badge" title="Linked Contact">
                        <UserIcon size={13} />
                        <span>
                          {act.contact.firstName} {act.contact.lastName}
                        </span>
                      </span>
                    )}

                    {/* Lead Link */}
                    {act.lead && (
                      <span className="entity-chip-badge" title="Linked Lead">
                        <BuildingIcon size={13} />
                        <span>{act.lead.title || act.lead.company}</span>
                      </span>
                    )}

                    {/* Deal Link */}
                    {act.deal && (
                      <span className="entity-chip-badge" title="Linked Deal">
                        <DollarSignIcon size={13} />
                        <span>{act.deal.title}</span>
                      </span>
                    )}

                    {/* Timestamp */}
                    <span className="activity-timestamp-label">
                      <ClockIcon size={13} />
                      <span>
                        {act.dueDate
                          ? new Date(act.dueDate).toLocaleDateString()
                          : new Date(act.createdAt).toLocaleDateString()}
                      </span>
                    </span>
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
