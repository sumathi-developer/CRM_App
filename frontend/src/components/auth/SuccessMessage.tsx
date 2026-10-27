import React from 'react';
import { CheckCircleIcon, XIcon } from '../common/Icons';

interface SuccessMessageProps {
  message?: string | null;
  title?: string;
  onDismiss?: () => void;
  className?: string;
  id?: string;
  children?: React.ReactNode;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  title,
  onDismiss,
  className = '',
  id = 'auth-success-banner',
  children,
}) => {
  if (!message && !children) return null;

  return (
    <div
      id={id}
      className={`auth-alert-banner alert-success ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="alert-icon-wrap" aria-hidden="true">
        <CheckCircleIcon size={20} />
      </div>

      <div className="alert-body">
        {title && <h4 className="alert-title">{title}</h4>}
        {message && <p className="alert-text">{message}</p>}
        {children}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="alert-dismiss-btn"
          aria-label="Dismiss success notification"
        >
          <XIcon size={16} />
        </button>
      )}
    </div>
  );
};
