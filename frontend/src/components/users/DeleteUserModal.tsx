import React, { useState } from 'react';
import type { User } from '../../types/user.types';
import { userService } from '../../services/user.service';
import { ErrorMessage } from '../auth/ErrorMessage';
import { TrashIcon, XIcon } from '../common/Icons';

interface DeleteUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: (deletedUserId: string) => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
}) => {
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isMatch = confirmName.trim().toLowerCase() === user.name.trim().toLowerCase();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) return;

    setIsDeleting(true);
    setApiError(null);

    try {
      await userService.deleteUser(user.id);
      onSuccess(user.id);
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'Failed to delete user account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-header-icon danger">
            <TrashIcon size={20} />
          </div>
          <div className="modal-header-text">
            <h3 id="delete-user-title" className="modal-title text-danger">Permanently Delete User</h3>
            <p className="modal-subtitle">This action is irreversible and permanent</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close modal"
          >
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleDelete} className="modal-form" id="delete-user-form">
          <div className="modal-body">
            <ErrorMessage error={apiError} />

            <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
              Are you sure you want to delete <strong>{user.name}</strong> ({user.email})? All assigned tasks,
              deal ownerships, and access records for this user will be dissociated.
            </p>

            <div className="form-field-group">
              <label htmlFor="confirm-user-name" className="form-field-label">
                Type <strong>{user.name}</strong> to confirm:
              </label>
              <input
                id="confirm-user-name"
                type="text"
                className="form-input"
                placeholder={user.name}
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                disabled={isDeleting}
                autoFocus
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="auth-btn btn-secondary"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="auth-btn btn-danger"
              disabled={!isMatch || isDeleting}
              id="btn-confirm-user-deletion"
            >
              <TrashIcon size={16} />
              <span>{isDeleting ? 'Deleting User...' : 'Delete User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
