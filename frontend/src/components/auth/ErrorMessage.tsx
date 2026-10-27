import React from 'react';
import { AlertCircleIcon, XIcon } from '../common/Icons';

interface ErrorMessageProps {
  error?: string | string[] | null;
  title?: string;
  onDismiss?: () => void;
  className?: string;
  id?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  title,
  onDismiss,
  className = '',
  id = 'auth-error-banner',
}) => {
  if (!error) return null;

  const errorList = Array.isArray(error) ? error : [error];

  return (
    <div
      id={id}
      className={`auth-alert-banner alert-error ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="alert-icon-wrap" aria-hidden="true">
        <AlertCircleIcon size={20} />
      </div>

      <div className="alert-body">
        {title && <h4 className="alert-title">{title}</h4>}
        {errorList.length === 1 ? (
          <p className="alert-text">{errorList[0]}</p>
        ) : (
          <ul className="alert-list">
            {errorList.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="alert-dismiss-btn"
          aria-label="Dismiss error notification"
        >
          <XIcon size={16} />
        </button>
      )}
    </div>
  );
};
