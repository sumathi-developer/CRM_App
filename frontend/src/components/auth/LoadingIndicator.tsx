import React from 'react';

interface LoadingIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
  inline?: boolean;
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'medium',
  color,
  message,
  inline = false,
  className = '',
}) => {
  const pixelSize = size === 'small' ? 16 : size === 'large' ? 36 : 24;

  const spinner = (
    <div
      className={`auth-spinner-svg-wrap size-${size} ${className}`}
      role="status"
      aria-label={message || 'Loading'}
    >
      <svg
        className="auth-spinner-svg"
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: color || undefined }}
      >
        <circle
          className="auth-spinner-track"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="auth-spinner-head"
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );

  if (inline && !message) {
    return spinner;
  }

  return (
    <div className={`auth-loading-container ${inline ? 'is-inline' : 'is-centered'}`}>
      {spinner}
      {message && <span className="auth-loading-msg">{message}</span>}
    </div>
  );
};
