import React, { useState } from 'react';
import type { FormFieldProps } from './FormField';
import { EyeIcon, EyeOffIcon, LockIcon } from '../common/Icons';
import { ValidationMessage } from './ValidationMessage';

export interface PasswordFieldProps extends Omit<FormFieldProps, 'type' | 'rightAdornment'> {
  showStrength?: boolean;
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      id,
      name = 'password',
      label = 'Password',
      value = '',
      error,
      helperText,
      required = true,
      disabled,
      showStrength = false,
      containerClassName = '',
      className = '',
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [capsLockActive, setCapsLockActive] = useState(false);

    const inputId = id || `field-${name}`;
    const errorId = error ? `${inputId}-error` : undefined;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const caps = e.getModifierState && e.getModifierState('CapsLock');
      setCapsLockActive(!!caps);
      if (onKeyDown) onKeyDown(e);
    };

    // Calculate password strength
    const passwordStr = typeof value === 'string' ? value : '';
    let strengthScore = 0;
    if (passwordStr.length >= 6) strengthScore++;
    if (passwordStr.length >= 8) strengthScore++;
    if (/[A-Z]/.test(passwordStr)) strengthScore++;
    if (/[0-9]/.test(passwordStr)) strengthScore++;
    if (/[^A-Za-z0-9]/.test(passwordStr)) strengthScore++;

    let strengthLabel = 'Very Weak';
    let strengthColorClass = 'strength-very-weak';
    if (strengthScore >= 4) {
      strengthLabel = 'Strong';
      strengthColorClass = 'strength-strong';
    } else if (strengthScore >= 3) {
      strengthLabel = 'Medium';
      strengthColorClass = 'strength-medium';
    } else if (strengthScore >= 2) {
      strengthLabel = 'Fair';
      strengthColorClass = 'strength-fair';
    }

    return (
      <div className={`form-field-group ${error ? 'has-error' : ''} ${containerClassName}`}>
        {label && (
          <div className="form-field-label-row">
            <label htmlFor={inputId} className="form-field-label">
              <span>{label}</span>
              {required && <span className="required-mark" aria-hidden="true">*</span>}
            </label>
            {capsLockActive && (
              <span className="caps-lock-warning" role="status">
                CapsLock is ON
              </span>
            )}
          </div>
        )}

        <div className={`form-input-wrapper has-left-icon has-right-adornment ${disabled ? 'is-disabled' : ''}`}>
          <div className="form-input-icon left" aria-hidden="true">
            <LockIcon size={18} />
          </div>

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={showPassword ? 'text' : 'password'}
            value={value}
            required={required}
            disabled={disabled}
            onKeyDown={handleKeyDown}
            aria-invalid={!!error}
            aria-describedby={errorId}
            className={`form-input ${className}`}
            {...props}
          />

          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </div>

        {showStrength && passwordStr.length > 0 && (
          <div className="password-strength-container" aria-live="polite">
            <div className="password-strength-bars">
              <div className={`strength-bar ${strengthScore >= 1 ? strengthColorClass : ''}`} />
              <div className={`strength-bar ${strengthScore >= 2 ? strengthColorClass : ''}`} />
              <div className={`strength-bar ${strengthScore >= 3 ? strengthColorClass : ''}`} />
              <div className={`strength-bar ${strengthScore >= 4 ? strengthColorClass : ''}`} />
            </div>
            <span className={`strength-label ${strengthColorClass}`}>
              Strength: {strengthLabel}
            </span>
          </div>
        )}

        {error ? (
          <ValidationMessage message={error} type="error" id={errorId} />
        ) : helperText ? (
          <p className="form-field-helper">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';
