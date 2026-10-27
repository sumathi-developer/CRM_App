import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teamService } from '../../services/team.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type { TeamEntity, TeamMemberEntity } from '../../types/team.types';
import { Navbar } from '../../components/common/Navbar';
import { TeamHeader } from './TeamHeader';
import { TeamMemberRoleBadge } from './TeamBadges';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import {
  UsersIcon,
  TargetIcon,
  DollarSignIcon,
  TrendingUpIcon,
  ActivityIcon,
  CrownIcon,
  ArrowRightIcon,
  CalendarIcon,
} from '../../components/common/Icons';

export const TeamDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { userRoleInWorkspace } = useWorkspace();

  const [team, setTeam] = useState<TeamEntity | null>(null);
  const [members, setMembers] = useState<TeamMemberEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const canManageTeams = Boolean(
    currentUser?.role?.name === 'ADMIN' ||
    currentUser?.role?.name === 'MANAGER' ||
    userRoleInWorkspace === 'OWNER' ||
    userRoleInWorkspace === 'ADMIN' ||
    (currentUser && team?.ownerId === currentUser.id)
  );

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const loadData = async () => {
      try {
        const [teamData, membersData] = await Promise.all([
          teamService.getTeamById(id),
          teamService.getTeamMembers(id),
        ]);

        if (!ignore) {
          setTeam(teamData);
          setMembers(membersData);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load team details');
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
            <LoadingIndicator size="large" message="Loading team details..." />
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
            <p>The requested team does not exist or has been removed.</p>
            <Link to="/teams" className="auth-btn btn-primary">
              Return to Teams Directory
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const targetRev = Number(team.targetRevenue || 0);
  const wonRev = Number(team.wonRevenue || 0);
  const attainment = targetRev > 0 ? Math.min(100, Math.round((wonRev / targetRev) * 100)) : 0;
  const teamColor = team.color || '#3b82f6';

  const getInitials = (name?: string) => {
    if (!name) return 'TM';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="authenticated-shell" id="team-details-page">
      <Navbar />

      <main className="authenticated-container">
        {/* Contextual Header with Tabs */}
        <TeamHeader team={team} canEdit={canManageTeams} />

        {/* Global Error */}
        {apiError && <ErrorMessage error={apiError} />}

        {/* 2-Column Overview Grid */}
        <div className="user-details-grid">
          {/* Main Info Column */}
          <div className="details-main-column">
            {/* Financial Quota Card */}
            <div className="profile-section-card">
              <div className="section-card-header">
                <div className="section-icon-badge warning">
                  <TargetIcon size={18} />
                </div>
                <div>
                  <h3 className="section-title">Revenue Target & Quota Attainment</h3>
                  <p className="section-desc">Real-time financial performance toward quarterly milestone</p>
                </div>
              </div>

              <div className="quota-detailed-metrics" style={{ marginTop: '1.25rem' }}>
                <div className="users-metrics-strip" style={{ marginBottom: '1rem' }}>
                  <div className="kpi-mini-card">
                    <div className="kpi-icon-wrap warning">
                      <TargetIcon size={20} />
                    </div>
                    <div className="kpi-details">
                      <span className="kpi-value">${targetRev.toLocaleString()}</span>
                      <span className="kpi-label">Target Revenue</span>
                    </div>
                  </div>

                  <div className="kpi-mini-card">
                    <div className="kpi-icon-wrap success">
                      <DollarSignIcon size={20} />
                    </div>
                    <div className="kpi-details">
                      <span className="kpi-value">${wonRev.toLocaleString()}</span>
                      <span className="kpi-label">Won Revenue</span>
                    </div>
                  </div>

                  <div className="kpi-mini-card">
                    <div className="kpi-icon-wrap primary">
                      <TrendingUpIcon size={20} />
                    </div>
                    <div className="kpi-details">
                      <span className="kpi-value">{attainment}%</span>
                      <span className="kpi-label">Attainment Rate</span>
                    </div>
                  </div>
                </div>

                <div className="team-quota-box">
                  <div className="quota-meta-row">
                    <span className="quota-label">Quota Progress</span>
                    <span className="quota-values">
                      ${wonRev.toLocaleString()} closed of ${targetRev.toLocaleString()} target
                    </span>
                  </div>
                  <div className="quota-bar-track" style={{ height: '10px' }}>
                    <div
                      className="quota-bar-fill"
                      style={{
                        width: `${attainment}%`,
                        backgroundColor: attainment >= 100 ? '#10b981' : teamColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members Preview */}
            <div className="profile-section-card">
              <div className="section-card-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="section-icon-badge primary">
                    <UsersIcon size={18} />
                  </div>
                  <div>
                    <h3 className="section-title">Team Roster Preview</h3>
                    <p className="section-desc">{members.length} enrolled members collaborating in this team</p>
                  </div>
                </div>
                <Link to={`/teams/${team.id}/members`} className="auth-btn btn-ghost" style={{ fontSize: '0.8125rem' }}>
                  <span>View All Members</span>
                  <ArrowRightIcon size={14} />
                </Link>
              </div>

              <div className="members-preview-list" style={{ marginTop: '1rem' }}>
                {members.slice(0, 5).map((member) => (
                  <div key={member.id} className="user-table-row-card" style={{ padding: '0.875rem 1rem', marginBottom: '0.625rem' }}>
                    <div className="table-member-user-cell">
                      <div className="table-user-avatar">
                        {getInitials(member.user?.name)}
                      </div>
                      <div>
                        <strong>{member.user?.name || 'Unnamed Member'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {member.user?.email}
                        </div>
                      </div>
                    </div>
                    <TeamMemberRoleBadge role={member.role} />
                  </div>
                ))}

                {members.length === 0 && (
                  <p className="text-muted" style={{ padding: '1rem 0' }}>
                    No members enrolled yet. Use the Members tab to add team contributors.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="details-sidebar-column">
            {/* Team Leader Profile */}
            <div className="profile-section-card">
              <div className="section-card-header">
                <div className="section-icon-badge warning">
                  <CrownIcon size={18} />
                </div>
                <div>
                  <h3 className="section-title">Team Leader</h3>
                  <p className="section-desc">Supervisory and management lead</p>
                </div>
              </div>

              <div className="team-leader-detail-card" style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                <div
                  className="table-user-avatar"
                  style={{ width: '56px', height: '56px', margin: '0 auto 0.75rem auto', fontSize: '1.25rem' }}
                >
                  {getInitials(team.owner?.name)}
                </div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary, #f8fafc)' }}>
                  {team.owner?.name || 'Unassigned'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted, #94a3b8)' }}>
                  {team.owner?.email || 'No email registered'}
                </p>
                <div style={{ marginTop: '0.75rem' }}>
                  <TeamMemberRoleBadge role="LEADER" />
                </div>
              </div>
            </div>

            {/* Quick Metrics & Resource Counts */}
            <div className="profile-section-card">
              <div className="section-card-header">
                <div className="section-icon-badge success">
                  <ActivityIcon size={18} />
                </div>
                <div>
                  <h3 className="section-title">Associated Records</h3>
                  <p className="section-desc">CRM entities linked to this team</p>
                </div>
              </div>

              <div className="team-stats-strip" style={{ marginTop: '1rem', border: 'none' }}>
                <div className="stat-item-col">
                  <span className="stat-val">{team._count?.leads ?? 0}</span>
                  <span className="stat-lbl">Leads</span>
                </div>
                <div className="stat-item-col">
                  <span className="stat-val">{team._count?.deals ?? 0}</span>
                  <span className="stat-lbl">Deals</span>
                </div>
                <div className="stat-item-col">
                  <span className="stat-val">{team._count?.activities ?? 0}</span>
                  <span className="stat-lbl">Activities</span>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link to={`/teams/${team.id}/activities`} className="auth-btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  <ActivityIcon size={16} />
                  <span>View Activity Stream</span>
                </Link>
                <Link to={`/teams/${team.id}/performance`} className="auth-btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <TrendingUpIcon size={16} />
                  <span>Analyze Performance</span>
                </Link>
              </div>
            </div>

            {/* Meta Information */}
            <div className="profile-section-card">
              <div className="section-card-header">
                <div className="section-icon-badge primary">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <h3 className="section-title">Metadata</h3>
                </div>
              </div>

              <div className="profile-info-grid" style={{ gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: '1rem' }}>
                <div className="info-item">
                  <span className="info-label">Created At</span>
                  <span className="info-value">
                    {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Updated</span>
                  <span className="info-value">
                    {team.updatedAt ? new Date(team.updatedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
