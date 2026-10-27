import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../../context/useWorkspace';
import { workspaceService } from '../../services/workspace.service';
import type { WorkspaceMember, WorkspaceInvite, WorkspaceRole } from '../../types/workspace.types';
import { Navbar } from '../../components/common/Navbar';
import { WorkspaceHeader } from '../../components/workspace/WorkspaceHeader';
import { WorkspaceSwitcher } from '../../components/workspace/WorkspaceSwitcher';
import { AddMemberModal } from '../../components/workspace/AddMemberModal';
import { EditMemberModal } from '../../components/workspace/EditMemberModal';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  UsersIcon,
  UserPlusIcon,
  SearchIcon,
  ShieldIcon,
  EditIcon,
  TrashIcon,
  MailIcon,
  RefreshCwIcon,
  ClockIcon,
  XIcon,
} from '../../components/common/Icons';

export const WorkspaceMembersPage: React.FC = () => {
  const { currentWorkspace, canManageWorkspace } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvite[]>([]);
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<WorkspaceMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<WorkspaceMember | null>(null);
  const [inviteToCancel, setInviteToCancel] = useState<WorkspaceInvite | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notifications
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setIsLoading(true);
    setApiError(null);

    try {
      const [membersData, invitesData, rolesData] = await Promise.all([
        workspaceService.getMembers(currentWorkspace.id),
        workspaceService.getInvites(currentWorkspace.id),
        workspaceService.getRoles(currentWorkspace.id),
      ]);

      setMembers(membersData);
      setInvitations(invitesData);
      setRoles(rolesData);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load workspace members data');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    let ignore = false;
    if (!currentWorkspace?.id) return;

    const fetchInitialData = async () => {
      try {
        const [membersData, invitesData, rolesData] = await Promise.all([
          workspaceService.getMembers(currentWorkspace.id),
          workspaceService.getInvites(currentWorkspace.id),
          workspaceService.getRoles(currentWorkspace.id),
        ]);
        if (!ignore) {
          setMembers(membersData);
          setInvitations(invitesData);
          setRoles(rolesData);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load workspace members data');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchInitialData();
    return () => {
      ignore = true;
    };
  }, [currentWorkspace]);

  // Member removal handler
  const handleConfirmRemoveMember = async () => {
    if (!currentWorkspace?.id || !memberToDelete) return;
    setIsDeleting(true);

    try {
      await workspaceService.removeMember(currentWorkspace.id, memberToDelete.id);
      setApiSuccess(`Removed ${memberToDelete.user?.name || 'member'} from workspace.`);
      setMemberToDelete(null);
      await loadData();
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to remove member');
    } finally {
      setIsDeleting(false);
    }
  };

  // Invitation cancel handler
  const handleConfirmCancelInvite = async () => {
    if (!currentWorkspace?.id || !inviteToCancel) return;
    setIsDeleting(true);

    try {
      await workspaceService.cancelInvite(currentWorkspace.id, inviteToCancel.id);
      setApiSuccess(`Cancelled invitation for ${inviteToCancel.email}.`);
      setInviteToCancel(null);
      await loadData();
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to cancel invitation');
    } finally {
      setIsDeleting(false);
    }
  };

  // Resend invitation handler
  const handleResendInvite = async (invite: WorkspaceInvite) => {
    if (!currentWorkspace?.id) return;
    try {
      await workspaceService.resendInvite(currentWorkspace.id, invite.id);
      setApiSuccess(`Resent invitation to ${invite.email}`);
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to resend invitation');
    }
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      (m.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filtered invitations list
  const filteredInvites = invitations.filter((inv) =>
    inv.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="authenticated-page-layout">
      <Navbar />

      <main className="authenticated-container" id="workspace-members-page">
        <WorkspaceHeader onOpenSwitcher={() => setIsSwitcherOpen(true)} />

        <div className="section-toolbar-row">
          {/* Member / Invites View Tabs */}
          <div className="pill-tabs-group">
            <button
              type="button"
              className={`pill-tab-btn ${activeTab === 'members' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('members')}
              id="tab-view-members"
            >
              <UsersIcon size={16} />
              <span>Active Members ({members.length})</span>
            </button>

            <button
              type="button"
              className={`pill-tab-btn ${activeTab === 'invitations' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('invitations')}
              id="tab-view-invites"
            >
              <MailIcon size={16} />
              <span>Pending Invitations ({invitations.filter((i) => i.status === 'PENDING').length})</span>
            </button>
          </div>

          <div className="page-actions-group">
            <button
              type="button"
              className="refresh-btn-secondary"
              onClick={loadData}
              title="Refresh member roster"
            >
              <RefreshCwIcon size={16} />
              <span>Refresh</span>
            </button>

            {canManageWorkspace && (
              <button
                type="button"
                className="auth-btn btn-primary"
                onClick={() => setIsAddOpen(true)}
                id="btn-add-member-top"
              >
                <UserPlusIcon size={16} />
                <span>Add / Invite Member</span>
              </button>
            )}
          </div>
        </div>

        <ErrorMessage
          error={apiError}
          onDismiss={() => setApiError(null)}
          title="Member Action Error"
        />

        <SuccessMessage
          message={apiSuccess}
          onDismiss={() => setApiSuccess(null)}
          title="Member Roster Updated"
        />

        {/* Search & Filters */}
        <div className="filters-bar-card">
          <div className="search-input-box">
            <SearchIcon size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={
                activeTab === 'members'
                  ? 'Search members by name, email or role...'
                  : 'Search invitations by email...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                <XIcon size={16} />
              </button>
            )}
          </div>

          {activeTab === 'members' && (
            <div className="filter-selects-row">
              <div className="filter-select-wrap">
                <label htmlFor="filter-role" className="filter-label">Role:</label>
                <select
                  id="filter-role"
                  className="filter-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="ALL">All Roles</option>
                  <option value="OWNER">OWNER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MEMBER">MEMBER</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>

              <div className="filter-select-wrap">
                <label htmlFor="filter-status" className="filter-label">Status:</label>
                <select
                  id="filter-status"
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content Table / List */}
        {isLoading ? (
          <div className="workspace-loading-state" role="status">
            <LoadingIndicator size="large" message="Loading member roster..." />
          </div>
        ) : activeTab === 'members' ? (
          <div className="table-responsive-container">
            <table className="enterprise-data-table" id="members-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Workspace Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  {canManageWorkspace && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const isOwner = member.role === 'OWNER';

                  return (
                    <tr key={member.id} id={`member-row-${member.id}`}>
                      <td>
                        <div className="member-cell-info">
                          <div className="member-cell-avatar">
                            {getInitials(member.user?.name)}
                          </div>
                          <div className="member-cell-details">
                            <span className="member-cell-name">
                              {member.user?.name || 'Workspace User'}
                            </span>
                            <span className="member-cell-email">
                              {member.user?.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`role-badge role-${member.role.toLowerCase()}`}>
                          <ShieldIcon size={12} />
                          <span>{member.role}</span>
                        </span>
                      </td>

                      <td>
                        <span className={`status-pill pill-${member.status.toLowerCase()}`}>
                          <span className="status-indicator-dot" />
                          <span>{member.status}</span>
                        </span>
                      </td>

                      <td>
                        <span className="date-text">
                          {formatDate(member.joinedAt || member.createdAt)}
                        </span>
                      </td>

                      {canManageWorkspace && (
                        <td className="text-right">
                          <div className="table-action-btns">
                            <button
                              type="button"
                              className="action-icon-btn"
                              title="Edit role or status"
                              onClick={() => setMemberToEdit(member)}
                              disabled={isOwner}
                            >
                              <EditIcon size={16} />
                            </button>

                            <button
                              type="button"
                              className="action-icon-btn btn-danger"
                              title="Remove from workspace"
                              onClick={() => setMemberToDelete(member)}
                              disabled={isOwner}
                            >
                              <TrashIcon size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredMembers.length === 0 && (
              <div className="table-empty-row">
                <UsersIcon size={32} />
                <p>No workspace members match your search filter.</p>
              </div>
            )}
          </div>
        ) : (
          /* Pending Invitations View */
          <div className="table-responsive-container">
            <table className="enterprise-data-table" id="invitations-table">
              <thead>
                <tr>
                  <th>Invited Recipient</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th>Expires Date</th>
                  {canManageWorkspace && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredInvites.map((invite) => (
                  <tr key={invite.id} id={`invite-row-${invite.id}`}>
                    <td>
                      <div className="member-cell-info">
                        <div className="member-cell-avatar invite">
                          <MailIcon size={16} />
                        </div>
                        <div className="member-cell-details">
                          <span className="member-cell-name">{invite.email}</span>
                          <span className="member-cell-email">Pending email verification</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="role-badge role-member">
                        <ShieldIcon size={12} />
                        <span>{invite.role}</span>
                      </span>
                    </td>

                    <td>
                      <span className={`status-pill pill-${invite.status.toLowerCase()}`}>
                        <span>{invite.status}</span>
                      </span>
                    </td>

                    <td>
                      <span className="date-text">
                        <ClockIcon size={12} />
                        <span>{formatDate(invite.expiresAt)}</span>
                      </span>
                    </td>

                    {canManageWorkspace && (
                      <td className="text-right">
                        <div className="table-action-btns">
                          {invite.status === 'PENDING' && (
                            <button
                              type="button"
                              className="action-text-btn"
                              onClick={() => handleResendInvite(invite)}
                              title="Resend invitation email"
                            >
                              <RefreshCwIcon size={14} />
                              <span>Resend</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="action-icon-btn btn-danger"
                            title="Cancel invitation"
                            onClick={() => setInviteToCancel(invite)}
                          >
                            <XIcon size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredInvites.length === 0 && (
              <div className="table-empty-row">
                <MailIcon size={32} />
                <p>No invitations found.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <WorkspaceSwitcher
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />

      <AddMemberModal
        isOpen={isAddOpen}
        workspaceId={currentWorkspace?.id || ''}
        roles={roles}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          setApiSuccess('Member added / invited successfully!');
          loadData();
          setTimeout(() => setApiSuccess(null), 4000);
        }}
      />

      <EditMemberModal
        key={memberToEdit?.id || 'none'}
        isOpen={!!memberToEdit}
        workspaceId={currentWorkspace?.id || ''}
        member={memberToEdit}
        roles={roles}
        onClose={() => setMemberToEdit(null)}
        onSuccess={() => {
          setApiSuccess('Member updated successfully!');
          loadData();
          setTimeout(() => setApiSuccess(null), 4000);
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!memberToDelete}
        title="Remove Member from Workspace"
        message={`Are you sure you want to remove ${memberToDelete?.user?.name || memberToDelete?.user?.email} from ${currentWorkspace?.name}? They will immediately lose access to all CRM records and activities in this workspace.`}
        itemName={memberToDelete?.user?.name || memberToDelete?.user?.email}
        confirmLabel="Remove Member"
        isLoading={isDeleting}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleConfirmRemoveMember}
      />

      <ConfirmDeleteModal
        isOpen={!!inviteToCancel}
        title="Revoke Workspace Invitation"
        message={`Are you sure you want to cancel the invitation sent to ${inviteToCancel?.email}? The invitation token will be invalidated.`}
        itemName={inviteToCancel?.email}
        confirmLabel="Revoke Invitation"
        isLoading={isDeleting}
        onClose={() => setInviteToCancel(null)}
        onConfirm={handleConfirmCancelInvite}
      />
    </div>
  );
};
