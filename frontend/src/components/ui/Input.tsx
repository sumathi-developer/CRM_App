import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  pill?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      iconLeft,
      iconRight,
      pill = false,
      className = '',
      id,
      ...rest
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="crm-field-group">
        {label && (
          <label htmlFor={inputId} className="crm-field-label">
            <span>{label}</span>
          </label>
        )}
        <div className="crm-input-wrapper">
          {iconLeft && <span className="crm-input-icon-lead">{iconLeft}</span>}
          <input
            ref={ref}
            id={inputId}
            className={`crm-input ${iconLeft ? 'has-lead-icon' : ''} ${pill ? 'crm-input-pill' : ''} ${className}`.trim()}
            {...rest}
          />
          {iconRight && <span className="crm-input-icon-trail">{iconRight}</span>}
        </div>
        {error ? (
          <span className="crm-field-error">{error}</span>
        ) : helperText ? (
          <span className="crm-field-helper" style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

