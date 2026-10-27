import React, { useState } from 'react';
import type { User, UserStatus } from '../../types/user.types';
import { userService } from '../../services/user.service';
import { PrimaryButton } from '../auth/PrimaryButton';
import { ErrorMessage } from '../auth/ErrorMessage';
import { XIcon, SlidersIcon, CheckCircleIcon } from '../common/Icons';

interface ChangeStatusModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>(user?.status || 'ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    try {
      const updated = await userService.updateUserStatus(user.id, selectedStatus);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'Failed to update user status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions: Array<{ value: UserStatus; label: string; desc: string; color: string }> = [
    {
      value: 'ACTIVE',
      label: 'Active',
      desc: 'User has full login access and operational rights according to their role.',
      color: '#10b981',
    },
    {
      value: 'INACTIVE',
      label: 'Inactive',
      desc: 'User account is temporarily paused. They cannot log in until reactivated.',
      color: '#f59e0b',
    },
    {
      value: 'SUSPENDED',
      label: 'Suspended',
      desc: 'User access is revoked immediately due to policy violation or security.',
      color: '#ef4444',
    },
  ];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="status-modal-title">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-header-icon primary">
            <SlidersIcon size={20} />
          </div>
          <div className="modal-header-text">
            <h3 id="status-modal-title" className="modal-title">Change Account Status</h3>
            <p className="modal-subtitle">Update operational status for {user.name}</p>
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

        <form onSubmit={handleSubmit} className="modal-form" id="change-status-form">
          <div className="modal-body">
            <ErrorMessage error={apiError} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {statusOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="settings-toggle-card"
                  style={{
                    cursor: 'pointer',
                    borderColor: selectedStatus === opt.value ? opt.color : '#334155',
                    background: selectedStatus === opt.value ? 'rgba(255, 255, 255, 0.03)' : '#1e293b',
                  }}
                >
                  <input
                    type="radio"
                    name="statusOption"
                    value={opt.value}
                    checked={selectedStatus === opt.value}
                    onChange={() => setSelectedStatus(opt.value)}
                    disabled={isSubmitting}
                    style={{ accentColor: opt.color }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, color: opt.color }}>{opt.label}</span>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="auth-btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <PrimaryButton
              type="submit"
              isLoading={isSubmitting}
              loadingText="Updating Status..."
              icon={<CheckCircleIcon size={16} />}
              fullWidth={false}
              id="btn-confirm-status-update"
            >
              Save Status
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};
