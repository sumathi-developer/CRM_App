import React from 'react';
import { ValidationMessage } from './ValidationMessage';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  containerClassName?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      id,
      name,
      label,
      type = 'text',
      error,
      helperText,
      icon,
      rightAdornment,
      required,
      disabled,
      className = '',
      containerClassName = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || (name ? `field-${name}` : undefined);
    const errorId = error && inputId ? `${inputId}-error` : undefined;

    return (
      <div className={`form-field-group ${error ? 'has-error' : ''} ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="form-field-label">
            <span>{label}</span>
            {required && <span className="required-mark" aria-hidden="true">*</span>}
          </label>
        )}

        <div className={`form-input-wrapper ${disabled ? 'is-disabled' : ''} ${icon ? 'has-left-icon' : ''} ${rightAdornment ? 'has-right-adornment' : ''}`}>
          {icon && <div className="form-input-icon left" aria-hidden="true">{icon}</div>}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            required={required}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={errorId}
            className={`form-input ${className}`}
            {...props}
          />

          {rightAdornment && <div className="form-input-adornment right">{rightAdornment}</div>}
        </div>

        {error ? (
          <ValidationMessage message={error} type="error" id={errorId} />
        ) : helperText ? (
          <p className="form-field-helper">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
