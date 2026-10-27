import React from 'react';
import { AlertCircleIcon, CheckIcon } from '../common/Icons';

interface ValidationMessageProps {
  message?: string;
  type?: 'error' | 'success' | 'hint';
  className?: string;
  id?: string;
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  message,
  type = 'error',
  className = '',
  id,
}) => {
  if (!message) return null;

  return (
    <div
      className={`form-validation-msg type-${type} ${className}`}
      id={id}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      {type === 'error' && <AlertCircleIcon size={14} className="validation-icon" />}
      {type === 'success' && <CheckIcon size={14} className="validation-icon" />}
      <span className="validation-text">{message}</span>
    </div>
  );
};
