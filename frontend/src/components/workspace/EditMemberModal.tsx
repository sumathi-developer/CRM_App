import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { WorkspaceMember, WorkspaceRole } from '../../types/workspace.types';
import { workspaceService } from '../../services/workspace.service';
import { PrimaryButton } from '../auth/PrimaryButton';
import { ErrorMessage } from '../auth/ErrorMessage';
import { EditIcon, XIcon, ShieldIcon, CheckCircleIcon } from '../common/Icons';

interface EditMemberModalProps {
  isOpen: boolean;
  workspaceId: string;
  member: WorkspaceMember | null;
  roles: WorkspaceRole[];
  onClose: () => void;
  onSuccess: () => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  workspaceId,
  member,
  roles,
  onClose,
  onSuccess,
}) => {
  const [role, setRole] = useState(member?.role || 'MEMBER');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(member?.status || 'ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
    document.body.style.setProperty('overflow', 'hidden', 'important');
    document.documentElement.style.setProperty('scrollbar-gutter', 'auto', 'important');
    document.body.style.setProperty('scrollbar-gutter', 'auto', 'important');

    return () => {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('scrollbar-gutter');
      document.body.style.removeProperty('scrollbar-gutter');
      if (prevBodyOverflow) document.body.style.overflow = prevBodyOverflow;
      if (prevHtmlOverflow) document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    try {
      await workspaceService.updateMember(workspaceId, member.id, {
        role,
        status,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'Failed to update member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-member-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        minWidth: '100vw',
        maxWidth: '100vw',
        height: '100vh',
        minHeight: '100vh',
        maxHeight: '100vh',
        margin: 0,
        zIndex: 99999,
      }}
    >
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-header-icon primary">
            <EditIcon size={20} />
          </div>
          <div className="modal-header-text">
            <h3 id="edit-member-title" className="modal-title">Edit Member Settings</h3>
            <p className="modal-subtitle">Update role permissions or membership status</p>
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

        <form onSubmit={handleSubmit} className="modal-form" id="edit-member-form">
          <div className="modal-body">
            <ErrorMessage
              error={apiError}
              onDismiss={() => setApiError(null)}
              title="Update Error"
            />

            {/* Member Info Card */}
            <div className="member-summary-box">
              <div className="member-summary-name">{member.user?.name || 'User'}</div>
              <div className="member-summary-email">{member.user?.email}</div>
            </div>

            <div className="form-field-group">
              <label htmlFor="edit-role-select" className="form-field-label">
                Workspace Role
              </label>
              <div className="form-input-wrapper has-left-icon">
                <div className="form-input-icon left">
                  <ShieldIcon size={18} />
                </div>
                <select
                  id="edit-role-select"
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isSubmitting || member.role === 'OWNER'}
                >
                  <option value="MEMBER">MEMBER (Standard Access)</option>
                  <option value="ADMIN">ADMIN (Workspace Management)</option>
                  <option value="VIEWER">VIEWER (Read-Only)</option>
                  {member.role === 'OWNER' && <option value="OWNER">OWNER</option>}
                  {roles
                    .filter((r) => !['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(r.name))
                    .map((cr) => (
                      <option key={cr.id} value={cr.name}>
                        {cr.name} (Custom Role)
                      </option>
                    ))}
                </select>
              </div>
              {member.role === 'OWNER' && (
                <p className="form-field-helper">Workspace owner role cannot be changed directly.</p>
              )}
            </div>

            <div className="form-field-group">
              <label htmlFor="edit-status-select" className="form-field-label">
                Membership Status
              </label>
              <select
                id="edit-status-select"
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                disabled={isSubmitting || member.role === 'OWNER'}
              >
                <option value="ACTIVE">ACTIVE (Can access workspace)</option>
                <option value="INACTIVE">INACTIVE (Access suspended)</option>
              </select>
            </div>
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
              loadingText="Saving..."
              icon={<CheckCircleIcon size={16} />}
              fullWidth={false}
              id="btn-confirm-edit-member"
            >
              Save Member
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
