import React, { useState } from 'react';
import type { WorkspaceRole } from '../../types/workspace.types';
import { workspaceService } from '../../services/workspace.service';
import { FormField } from '../auth/FormField';
import { PrimaryButton } from '../auth/PrimaryButton';
import { ErrorMessage } from '../auth/ErrorMessage';
import { UserPlusIcon, XIcon, MailIcon, ShieldIcon } from '../common/Icons';

interface AddMemberModalProps {
  isOpen: boolean;
  workspaceId: string;
  roles: WorkspaceRole[];
  onClose: () => void;
  onSuccess: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  workspaceId,
  roles,
  onClose,
  onSuccess,
}) => {
  const [tab, setTab] = useState<'invite' | 'direct'>('invite');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (tab === 'invite') {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setApiError('Please provide a valid recipient email address');
        return;
      }
    } else {
      if (!email.trim() && !userId.trim()) {
        setApiError('Please provide either an existing User Email or User UUID');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (tab === 'invite') {
        await workspaceService.createInvite(workspaceId, {
          email: email.trim().toLowerCase(),
          role,
        });
      } else {
        await workspaceService.addMember(workspaceId, {
          email: email.trim().toLowerCase() || undefined,
          userId: userId.trim() || undefined,
          role,
          status,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'Failed to add member to workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-member-title">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-header-icon primary">
            <UserPlusIcon size={20} />
          </div>
          <div className="modal-header-text">
            <h3 id="add-member-title" className="modal-title">Add Workspace Member</h3>
            <p className="modal-subtitle">Grant access to team pipelines and CRM customer records</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="modal-tab-bar">
          <button
            type="button"
            className={`modal-tab-btn ${tab === 'invite' ? 'is-active' : ''}`}
            onClick={() => setTab('invite')}
          >
            Send Email Invitation
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${tab === 'direct' ? 'is-active' : ''}`}
            onClick={() => setTab('direct')}
          >
            Direct Add (Existing User)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" id="add-member-form">
          <div className="modal-body">
            <ErrorMessage
              error={apiError}
              onDismiss={() => setApiError(null)}
              title="Failed to Add Member"
            />

            <FormField
              id="member-email-input"
              name="email"
              type="email"
              label="User Email Address"
              placeholder="teammate@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<MailIcon size={18} />}
              required={tab === 'invite'}
              disabled={isSubmitting}
              helperText={
                tab === 'invite'
                  ? 'We will issue an invitation token with 7-day expiration.'
                  : 'Enter the registered account email.'
              }
            />

            {tab === 'direct' && (
              <FormField
                id="member-userid-input"
                name="userId"
                label="Or User UUID (Optional)"
                placeholder="e.g. d901a3c0-2fbb-49d3-93e6-465c774dd851"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={isSubmitting}
              />
            )}

            <div className="form-field-group">
              <label htmlFor="member-role-select" className="form-field-label">
                Assigned Role
              </label>
              <div className="form-input-wrapper has-left-icon">
                <div className="form-input-icon left">
                  <ShieldIcon size={18} />
                </div>
                <select
                  id="member-role-select"
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="MEMBER">MEMBER (Standard Access)</option>
                  <option value="ADMIN">ADMIN (Full Workspace Management)</option>
                  <option value="VIEWER">VIEWER (Read-Only)</option>
                  {roles
                    .filter((r) => !['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(r.name))
                    .map((cr) => (
                      <option key={cr.id} value={cr.name}>
                        {cr.name} (Custom Role)
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {tab === 'direct' && (
              <div className="form-field-group">
                <label htmlFor="member-status-select" className="form-field-label">
                  Initial Status
                </label>
                <select
                  id="member-status-select"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  disabled={isSubmitting}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="auth-btn btn-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <PrimaryButton
              type="submit"
              isLoading={isSubmitting}
              loadingText="Sending..."
              icon={<UserPlusIcon size={16} />}
              fullWidth={false}
              id="btn-confirm-add-member"
            >
              {tab === 'invite' ? 'Send Invitation' : 'Add to Workspace'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};
