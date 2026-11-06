import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
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

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
