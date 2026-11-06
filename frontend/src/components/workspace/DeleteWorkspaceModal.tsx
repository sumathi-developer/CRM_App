import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from '../common/Icons';

interface DeleteWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  workspaceName?: string;
  isLoading?: boolean;
}

export const DeleteWorkspaceModal: React.FC<DeleteWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  workspaceName = '',
  isLoading = false,
}) => {
  const [confirmInput, setConfirmInput] = useState('');
  const [permanentlyDeleteAll, setPermanentlyDeleteAll] = useState(false);

  // Lock scroll when open
  useEffect(() => {
    if (!isOpen) {
      setConfirmInput('');
      setPermanentlyDeleteAll(false);
      return;
    }

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
    document.body.style.setProperty('overflow', 'hidden', 'important');
    document.documentElement.style.setProperty('scrollbar-gutter', 'auto', 'important');
    document.body.style.setProperty('scrollbar-gutter', 'auto', 'important');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('scrollbar-gutter');
      document.body.style.removeProperty('scrollbar-gutter');
      if (prevBodyOverflow) document.body.style.overflow = prevBodyOverflow;
      if (prevHtmlOverflow) document.documentElement.style.overflow = prevHtmlOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isMatch =
    confirmInput.trim().toLowerCase() === workspaceName.trim().toLowerCase();

  const handleDelete = () => {
    if (!isMatch || isLoading) return;
    onConfirm();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleDelete();
  };

  const modalContent = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-ws-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div className="delete-ws-modal-card">
        {/* Header */}
        <div className="delete-ws-header">
          <h3 id="delete-ws-title" className="delete-ws-title">
            Delete Workspace
          </h3>
          <button
            type="button"
            className="delete-ws-close-btn"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Description Warning */}
        <p className="delete-ws-desc">
          Are you sure you want to delete <strong>{workspaceName}</strong>? Deleting this Workspace will delete all files, tasks, and history. This action is permanent and cannot be reverted.
        </p>

        {/* Confirmation Form */}
        <form onSubmit={handleFormSubmit} className="delete-ws-form">
          <div className="delete-ws-field-group">
            <label htmlFor="delete-ws-confirm-name" className="delete-ws-label">
              Type the workspace name to confirm
            </label>
            <input
              id="delete-ws-confirm-name"
              type="text"
              className="delete-ws-input"
              placeholder={workspaceName}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              disabled={isLoading}
              autoFocus
              autoComplete="off"
            />
          </div>

          <label className="delete-ws-checkbox-row">
            <input
              type="checkbox"
              className="delete-ws-checkbox"
              checked={permanentlyDeleteAll}
              onChange={(e) => setPermanentlyDeleteAll(e.target.checked)}
              disabled={isLoading}
            />
            <span>
              Also permanently delete all third-party data and do not allow recovery of this Workspace
            </span>
          </label>

          {/* Footer Actions */}
          <div className="delete-ws-footer">
            <button
              type="button"
              className="delete-ws-cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`delete-ws-submit-btn ${isMatch ? 'is-valid' : 'is-disabled'}`}
              disabled={!isMatch || isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

