import React from 'react';
import { TrashIcon, XIcon, AlertCircleIcon } from '../common/Icons';
import { PrimaryButton } from '../auth/PrimaryButton';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  itemName?: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmLabel = 'Delete',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container modal-danger">
        <div className="modal-header">
          <div className="modal-header-icon danger">
            <AlertCircleIcon size={22} />
          </div>
          <div className="modal-header-text">
            <h3 id="modal-title" className="modal-title">{title}</h3>
            <p className="modal-subtitle">This action cannot be undone.</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-message">{message}</p>
          {itemName && (
            <div className="danger-highlight-box">
              <strong>Target:</strong> {itemName}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="auth-btn btn-ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <PrimaryButton
            type="button"
            variant="danger"
            isLoading={isLoading}
            loadingText="Processing..."
            onClick={onConfirm}
            fullWidth={false}
            icon={<TrashIcon size={16} />}
          >
            {confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
