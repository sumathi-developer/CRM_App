import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamService } from '../../services/team.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type { TeamEntity } from '../../types/team.types';
import { Navbar } from '../../components/common/Navbar';
import { TeamStatusBadge } from './TeamBadges';
import { TeamFilterBar } from './TeamFilterBar';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ShieldIcon,
  UsersIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  TrendingUpIcon,
  DollarSignIcon,
  TargetIcon,
  CheckCircleIcon,
} from '../../components/common/Icons';

export const TeamsListPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { userRoleInWorkspace } = useWorkspace();

  const [teams, setTeams] = useState<TeamEntity[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 12;

  // Delete Modal
  const [teamToDelete, setTeamToDelete] = useState<TeamEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManageTeams =
    currentUser?.role?.name === 'ADMIN' ||
    currentUser?.role?.name === 'MANAGER' ||
    userRoleInWorkspace === 'OWNER' ||
    userRoleInWorkspace === 'ADMIN';

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadTeams = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const response = await teamService.getTeams({
          page,
          limit,
          search: search.trim() || undefined,
          status: status !== 'ALL' ? status : undefined,
        });

        if (!ignore) {
          setTeams(response.data || []);
          setTotalCount(response.meta?.total || 0);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to fetch teams');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadTeams();
    return () => {
      ignore = true;
    };
  }, [page, limit, search, status, refreshTrigger]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return;
    setIsDeleting(true);
    setApiError(null);
    try {
      await teamService.deleteTeam(teamToDelete.id);
      setApiSuccess(`Team "${teamToDelete.name}" was successfully removed.`);
      setTeamToDelete(null);
      setRefreshTrigger((k) => k + 1);
    } catch (err: any) {
      setApiError(err.message || 'Failed to delete team');
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics summary
  const activeTeamsCount = teams.filter((t) => (t.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  const totalMembersEnrolled = teams.reduce((acc, t) => acc + (t._count?.members || t.members?.length || 0), 0);
  const totalCombinedTarget = teams.reduce((acc, t) => acc + (Number(t.targetRevenue) || 0), 0);
  const totalCombinedWon = teams.reduce((acc, t) => acc + (Number(t.wonRevenue) || 0), 0);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'TM';
  };

  return (
    <div className="authenticated-shell" id="teams-list-page">
      <Navbar />

      <main className="authenticated-container">
        {/* Module Header Strip */}
        <div className="module-header-strip">
          <div className="module-title-area">
            <div className="module-title-with-badge">
              <h1 className="module-main-heading">Teams</h1>
              <span className="count-pill">{totalCount} Total</span>
            </div>
            <p className="module-sub-heading">
              Organize members, align revenue targets, monitor team activities, and measure quota attainment.
            </p>
          </div>

          <div className="module-header-actions">
            {canManageTeams && (
              <Link to="/teams/create" className="auth-btn btn-primary" id="btn-create-team">
                <PlusIcon size={16} />
                <span>Create Team</span>
              </Link>
            )}
          </div>
        </div>

        {/* Global Feedback */}
        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        {/* Top KPI Metrics Strip */}
        <div className="teams-metrics-strip">
          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap primary">
              <ShieldIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{totalCount}</span>
              <span className="kpi-label">Total Teams</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap success">
              <CheckCircleIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{activeTeamsCount}</span>
              <span className="kpi-label">Active Teams</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap primary">
              <UsersIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{totalMembersEnrolled}</span>
              <span className="kpi-label">Enrolled Members</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap warning">
              <TargetIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">${totalCombinedTarget.toLocaleString()}</span>
              <span className="kpi-label">Total Quota Target</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap success">
              <DollarSignIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">${totalCombinedWon.toLocaleString()}</span>
              <span className="kpi-label">Combined Won Revenue</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <TeamFilterBar
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
          onReset={handleResetFilters}
          totalResults={totalCount}
        />

        {/* Content Section */}
        {isLoading ? (
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Loading teams directory..." />
          </div>
        ) : teams.length === 0 ? (
          <div className="empty-state-card">
            <EmptyState
              title="No teams found"
              description={
                search || status !== 'ALL'
                  ? 'No teams match your active search filters. Try adjusting your query or resetting filters.'
                  : 'Get started by creating your first sales or operational team to organize workspace members.'
              }
              action={
                canManageTeams ? (
                  <Link to="/teams/create" className="auth-btn btn-primary">
                    <PlusIcon size={16} />
                    <span>Create Team</span>
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="teams-grid" id="teams-grid-container">
            {teams.map((team) => {
              const teamColor = team.color || '#3b82f6';
              const membersCount = team._count?.members ?? team.members?.length ?? 0;
              const targetRev = Number(team.targetRevenue || 0);
              const wonRev = Number(team.wonRevenue || 0);
              const attainment = targetRev > 0 ? Math.min(100, Math.round((wonRev / targetRev) * 100)) : 0;

              const isOwnerOrAdmin =
                canManageTeams ||
                (currentUser && team.ownerId === currentUser.id);

              return (
                <div key={team.id} className="team-grid-card" id={`team-card-${team.id}`}>
                  {/* Color stripe */}
                  <div
                    className="team-card-color-stripe"
                    style={{ backgroundColor: teamColor }}
                    aria-hidden="true"
                  />

                  <div className="team-card-header">
                    <div className="team-brand-group">
                      <div
                        className="team-avatar-box"
                        style={{ backgroundColor: teamColor }}
                        aria-label={team.name}
                      >
                        {team.avatar ? (
                          <img src={team.avatar} alt={team.name} className="avatar-img-fit" />
                        ) : (
                          <span>{getInitials(team.name)}</span>
                        )}
                      </div>
                      <div>
                        <h2 className="team-name-title">
                          <Link to={`/teams/${team.id}`}>{team.name}</Link>
                        </h2>
                        {team.slug && <span className="team-slug-label">/{team.slug}</span>}
                      </div>
                    </div>
                    <TeamStatusBadge status={team.status} />
                  </div>

                  <div className="team-card-body">
                    <p className="team-card-desc">
                      {team.description || 'No description provided for this team.'}
                    </p>

                    {/* Quota Progress */}
                    <div className="team-quota-box">
                      <div className="quota-meta-row">
                        <span className="quota-label">Quota Attainment</span>
                        <span className="quota-values">
                          ${wonRev.toLocaleString()} / ${targetRev.toLocaleString()} ({attainment}%)
                        </span>
                      </div>
                      <div className="quota-bar-track">
                        <div
                          className="quota-bar-fill"
                          style={{
                            width: `${attainment}%`,
                            backgroundColor: attainment >= 100 ? '#10b981' : teamColor,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats Strip */}
                    <div className="team-stats-strip">
                      <div className="stat-item-col">
                        <span className="stat-val">{membersCount}</span>
                        <span className="stat-lbl">Members</span>
                      </div>
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
                  </div>

                  {/* Card Footer */}
                  <div className="team-card-footer">
                    <div className="team-leader-preview">
                      <div className="leader-avatar-mini" title={`Team Leader: ${team.owner?.name || 'Unassigned'}`}>
                        {getInitials(team.owner?.name || 'TL')}
                      </div>
                      <span className="leader-name-text">
                        {team.owner?.name || 'Unassigned Leader'}
                      </span>
                    </div>

                    <div className="team-actions-group">
                      <Link
                        to={`/teams/${team.id}`}
                        className="table-action-btn"
                        title="View Team Details & Overview"
                      >
                        <ShieldIcon size={14} />
                      </Link>
                      <Link
                        to={`/teams/${team.id}/members`}
                        className="table-action-btn"
                        title="Manage Team Members"
                      >
                        <UsersIcon size={14} />
                      </Link>
                      <Link
                        to={`/teams/${team.id}/performance`}
                        className="table-action-btn"
                        title="View Team Performance"
                      >
                        <TrendingUpIcon size={14} />
                      </Link>
                      {isOwnerOrAdmin && (
                        <Link
                          to={`/teams/${team.id}/edit`}
                          className="table-action-btn"
                          title="Edit Team"
                        >
                          <EditIcon size={14} />
                        </Link>
                      )}
                      {canManageTeams && (
                        <button
                          type="button"
                          className="table-action-btn btn-action-danger"
                          onClick={() => setTeamToDelete(team)}
                          title="Delete Team"
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

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(teamToDelete)}
        onClose={() => setTeamToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Team"
        message={`Are you sure you want to permanently delete the team "${teamToDelete?.name}"? Team associations on related leads, deals, and activities will be safely cleared.`}
        itemName={teamToDelete?.name}
        confirmLabel="Delete Team"
        isLoading={isDeleting}
      />
    </div>
  );
};
