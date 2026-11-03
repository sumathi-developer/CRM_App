import React from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'gradient'
  | 'outline'
  | 'ghost'
  | 'soft'
  | 'danger';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      pill = false,
      loading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
      className = '',
      children,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const variantClass = `crm-btn-${variant}`;
    const sizeClass = `crm-btn-${size}`;
    const pillClass = pill ? 'crm-btn-pill' : '';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`crm-btn ${variantClass} ${sizeClass} ${pillClass} ${className}`.trim()}
        {...rest}
      >
        {loading && (
          <span className="auth-spinner-svg-wrap" aria-hidden="true">
            <svg
              className="auth-spinner-svg icon-spin"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle className="auth-spinner-track" cx="12" cy="12" r="10" />
              <path className="auth-spinner-head" d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </span>
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className="crm-btn-icon-left" aria-hidden="true">
            {icon}
          </span>
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === 'right' && (
          <span className="crm-btn-icon-right" aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

