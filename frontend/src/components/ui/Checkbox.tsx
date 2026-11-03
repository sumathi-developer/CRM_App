import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, disabled = false, className = '', checked, onChange, ...rest }, ref) => {
    return (
      <div className="crm-field-group">
        <label className={`crm-checkbox-item ${disabled ? 'is-disabled' : ''} ${className}`.trim()}>
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="crm-checkbox-native"
            {...rest}
          />
          <span className="crm-checkbox-custom" aria-hidden="true">
            <svg
              className="crm-checkbox-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          {(label || description) && (
            <span className="crm-radio-text">
              {label && <span className="crm-checkbox-label">{label}</span>}
              {description && <span className="crm-checkbox-desc">{description}</span>}
            </span>
          )}
        </label>
        {error && <span className="crm-field-error">{error}</span>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

