import React from 'react';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral'
  | 'warning'
  | 'danger';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  withDot?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'secondary',
  withDot = false,
  className = '',
  children,
  ...rest
}) => {
  return (
    <span className={`crm-badge crm-badge-${variant} ${className}`.trim()} {...rest}>
      {withDot && <span className="crm-badge-dot" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};

