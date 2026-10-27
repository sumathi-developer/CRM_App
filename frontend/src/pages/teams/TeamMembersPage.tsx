import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teamService } from '../../services/team.service';
import { userService } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type { TeamEntity, TeamMemberEntity, TeamMemberRole } from '../../types/team.types';
import type { User } from '../../types/auth.types';
import { Navbar } from '../../components/common/Navbar';
import { TeamHeader } from './TeamHeader';
import { TeamMemberRoleBadge } from './TeamBadges';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import { EmptyState } from '../../components/common/EmptyState';
import {
  UserPlusIcon,
  SearchIcon,
  TrashIcon,
  CrownIcon,
  XIcon,
  UserIcon,
} from '../../components/common/Icons';

export const TeamMembersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { userRoleInWorkspace } = useWorkspace();

  const [team, setTeam] = useState<TeamEntity | null>(null);
  const [members, setMembers] = useState<TeamMemberEntity[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Search filter
  const [search, setSearch] = useState('');

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<TeamMemberRole>('MEMBER');
  const [isAdding, setIsAdding] = useState(false);

  // Remove Member Modal State
  const [memberToRemove, setMemberToRemove] = useState<TeamMemberEntity | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const isSuperAdmin = currentUser?.role?.name === 'ADMIN' || userRoleInWorkspace === 'OWNER';
  const isManager = currentUser?.role?.name === 'MANAGER' || userRoleInWorkspace === 'ADMIN';
  const isTeamLeader = currentUser && team?.ownerId === currentUser.id;
  const canManageMembers = Boolean(isSuperAdmin || isManager || isTeamLeader);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const loadData = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const [teamData, membersData, usersData] = await Promise.all([
          teamService.getTeamById(id),
          teamService.getTeamMembers(id),
          userService.getUsers({ limit: 100 }),
        ]);

        if (!ignore) {
          setTeam(teamData);
          setMembers(membersData);
          setWorkspaceUsers(usersData.data || []);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load team members');
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
  }, [id, refreshTrigger]);

  // Handle Role Update
  const handleRoleChange = async (member: TeamMemberEntity, newRole: TeamMemberRole) => {
    if (!id || !canManageMembers) return;
    try {
      await teamService.updateTeamMemberRole(id, member.id, { role: newRole });
      setApiSuccess(`Updated role for ${member.user?.name || 'member'} to ${newRole}`);
      setRefreshTrigger((k) => k + 1);
    } catch (err: any) {
      setApiError(err.message || 'Failed to update member role');
    }
  };

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedUserId) {
      setApiError('Please select a user to add');
      return;
    }

    setIsAdding(true);
    setApiError(null);
    try {
      await teamService.addTeamMember(id, {
        userId: selectedUserId,
        role: selectedRole,
      });

      setApiSuccess('Member added to team successfully!');
      setIsAddModalOpen(false);
      setSelectedUserId('');
      setSelectedRole('MEMBER');
      setRefreshTrigger((k) => k + 1);
    } catch (err: any) {
      setApiError(err.message || 'Failed to add member to team');
    } finally {
      setIsAdding(false);
    }
  };

  // Handle Remove Member
  const handleRemoveConfirm = async () => {
    if (!id || !memberToRemove) return;

    setIsRemoving(true);
    setApiError(null);
    try {
      await teamService.removeTeamMember(id, memberToRemove.id);
      setApiSuccess(`Removed ${memberToRemove.user?.name || 'member'} from team.`);
      setMemberToRemove(null);
      setRefreshTrigger((k) => k + 1);
    } catch (err: any) {
      setApiError(err.message || 'Failed to remove member from team');
    } finally {
      setIsRemoving(false);
    }
  };

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

  // Filter members by search
  const filteredMembers = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const nameMatch = m.user?.name?.toLowerCase().includes(q);
    const emailMatch = m.user?.email?.toLowerCase().includes(q);
    const roleMatch = m.role?.toLowerCase().includes(q);
    return nameMatch || emailMatch || roleMatch;
  });

  // Available users to enroll (excluding those already in team)
  const enrolledUserIds = new Set(members.map((m) => m.userId));
  const availableUsersToEnroll = workspaceUsers.filter((u) => !enrolledUserIds.has(u.id));

  if (isLoading) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Loading team members roster..." />
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
    <div className="authenticated-shell" id="team-members-page">
      <Navbar />

      <main className="authenticated-container">
        {/* Contextual Header with Tabs */}
        <TeamHeader team={team} canEdit={canManageMembers} />

        {/* Global Feedback */}
        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        {/* Section Action Bar */}
        <div className="members-action-bar">
          <div className="filter-search-box" style={{ maxWidth: '360px' }}>
            <SearchIcon size={16} className="search-box-icon" />
            <input
              type="text"
              placeholder="Search members by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input-field"
              aria-label="Search members"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="results-label" style={{ fontSize: '0.875rem', color: 'var(--text-muted, #94a3b8)' }}>
              {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
            </span>
            {canManageMembers && (
              <button
                type="button"
                className="auth-btn btn-primary"
                onClick={() => setIsAddModalOpen(true)}
                id="btn-open-add-member-modal"
              >
                <UserPlusIcon size={16} />
                <span>Add Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Members Roster Table / Card View */}
        {filteredMembers.length === 0 ? (
          <div className="empty-state-card">
            <EmptyState
              title="No members found"
              description={
                search
                  ? `No team members match "${search}". Try clearing your search query.`
                  : 'There are no members enrolled in this team yet. Use the Add Member button to enroll team contributors.'
              }
              action={
                canManageMembers && !search ? (
                  <button
                    type="button"
                    className="auth-btn btn-primary"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <UserPlusIcon size={16} />
                    <span>Add First Member</span>
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table" id="team-members-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Team Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  {canManageMembers && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const isLeader = (member.role || '').toUpperCase() === 'LEADER';
                  const isTeamOwner = team.ownerId === member.userId;

                  return (
                    <tr key={member.id} id={`member-row-${member.id}`}>
                      <td>
                        <div className="table-member-user-cell">
                          <div className="table-user-avatar">
                            {getInitials(member.user?.name)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>
                                {member.user?.name || 'Unnamed User'}
                              </strong>
                              {isTeamOwner && (
                                <span title="Designated Team Owner" style={{ color: '#f59e0b' }}>
                                  <CrownIcon size={14} />
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #94a3b8)' }}>
                              {member.user?.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <TeamMemberRoleBadge role={member.role} />
                      </td>

                      <td>
                        <span className="user-status-pill status-active">
                          {member.user?.status || 'ACTIVE'}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #cbd5e1)' }}>
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {canManageMembers && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* Role Switcher */}
                            <button
                              type="button"
                              className="auth-btn btn-ghost"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => handleRoleChange(member, isLeader ? 'MEMBER' : 'LEADER')}
                              title={isLeader ? 'Demote to Member' : 'Promote to Team Leader'}
                            >
                              {isLeader ? (
                                <>
                                  <UserIcon size={12} />
                                  <span>Set as Member</span>
                                </>
                              ) : (
                                <>
                                  <CrownIcon size={12} />
                                  <span>Make Leader</span>
                                </>
                              )}
                            </button>

                            {/* Remove Member */}
                            <button
                              type="button"
                              className="table-action-btn btn-action-danger"
                              onClick={() => setMemberToRemove(member)}
                              title="Remove from Team"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-header-icon primary">
                <UserPlusIcon size={20} />
              </div>
              <div className="modal-header-text">
                <h3 className="modal-title">Add Member to Team</h3>
                <p className="modal-subtitle">Enroll an existing workspace user into {team.name}</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close dialog"
              >
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMember}>
              <div className="modal-body">
                {availableUsersToEnroll.length === 0 ? (
                  <p className="text-muted" style={{ padding: '1rem 0' }}>
                    All workspace users are already enrolled in this team.
                  </p>
                ) : (
                  <div className="form-fields-stack">
                    <div className="form-group">
                      <label htmlFor="select-user-to-add" className="form-label">
                        Select Workspace User
                      </label>
                      <select
                        id="select-user-to-add"
                        className="form-select"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose User to Enroll --</option>
                        {availableUsersToEnroll.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="select-member-role" className="form-label">
                        Team Member Role
                      </label>
                      <select
                        id="select-member-role"
                        className="form-select"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as TeamMemberRole)}
                      >
                        <option value="MEMBER">Member (Contributor)</option>
                        <option value="LEADER">Team Leader (Supervisory)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="auth-btn btn-ghost"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                {availableUsersToEnroll.length > 0 && (
                  <button
                    type="submit"
                    className="auth-btn btn-primary"
                    disabled={isAdding || !selectedUserId}
                  >
                    {isAdding ? 'Adding Member...' : 'Enroll Member'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveConfirm}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${memberToRemove?.user?.name || 'this member'} from the team "${team.name}"?`}
        itemName={memberToRemove?.user?.name}
        confirmLabel="Remove Member"
        isLoading={isRemoving}
      />
    </div>
  );
};
