import React from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  accent?: boolean;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, accent = false, disabled = false, className = '', checked, onChange, ...rest }, ref) => {
    return (
      <label
        className={`crm-switch ${accent ? 'crm-switch-accent' : ''} ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
      >
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="crm-switch-native"
          {...rest}
        />
        <span className="crm-switch-track" aria-hidden="true">
          <span className="crm-switch-thumb" />
        </span>
        {label && <span className="crm-switch-label">{label}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';

