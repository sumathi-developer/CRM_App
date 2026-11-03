import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  pill?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      pill = false,
      className = '',
      id,
      children,
      ...rest
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="crm-field-group">
        {label && (
          <label htmlFor={selectId} className="crm-field-label">
            <span>{label}</span>
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`crm-select ${pill ? 'crm-select-pill' : ''} ${className}`.trim()}
          {...rest}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
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

Select.displayName = 'Select';

