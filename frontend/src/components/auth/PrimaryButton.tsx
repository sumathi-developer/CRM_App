import React from 'react';
import { LoadingIndicator } from './LoadingIndicator';

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  loadingText,
  fullWidth = true,
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled,
  className = '',
  type = 'submit',
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={`auth-btn btn-${variant} btn-size-${size} ${fullWidth ? 'btn-full-width' : ''} ${isLoading ? 'is-loading' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="btn-loading-content">
          <LoadingIndicator size="small" color="currentColor" inline />
          <span>{loadingText || children}</span>
        </span>
      ) : (
        <span className="btn-content">
          {icon && iconPosition === 'left' && <span className="btn-icon left" aria-hidden="true">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="btn-icon right" aria-hidden="true">{icon}</span>}
        </span>
      )}
    </button>
  );
};
