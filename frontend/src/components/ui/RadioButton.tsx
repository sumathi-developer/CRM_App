import React, { createContext, useContext } from 'react';

// Context for RadioGroup
interface RadioGroupContextType {
  name?: string;
  value?: string | number;
  onChange?: (value: string) => void;
  disabled?: boolean;
  accent?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextType | undefined>(undefined);

// RadioGroup Props
export interface RadioGroupProps {
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  accent?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  label,
  error,
  orientation = 'vertical',
  disabled = false,
  accent = false,
  className = '',
  children,
}) => {
  return (
    <RadioGroupContext.Provider value={{ name, value, onChange, disabled, accent }}>
      <div className={`crm-field-group ${className}`.trim()} role="radiogroup" aria-label={label}>
        {label && <span className="crm-field-label">{label}</span>}
        <div className={`crm-radio-group ${orientation === 'horizontal' ? 'is-horizontal' : ''}`}>
          {children}
        </div>
        {error && <span className="crm-field-error">{error}</span>}
      </div>
    </RadioGroupContext.Provider>
  );
};

// RadioButton Props
export interface RadioButtonProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string;
  label?: React.ReactNode;
  description?: string;
  accent?: boolean;
}

export const RadioButton = React.forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ value, label, description, disabled = false, accent: customAccent, className = '', onChange, ...rest }, ref) => {
    const group = useContext(RadioGroupContext);

    const isChecked = group?.value !== undefined ? String(group.value) === String(value) : rest.checked;
    const isDisabled = group?.disabled || disabled;
    const isAccent = customAccent ?? group?.accent ?? false;
    const groupName = group?.name || rest.name;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) onChange(e);
      if (group?.onChange) group.onChange(value);
    };

    return (
      <label
        className={`crm-radio-item ${isAccent ? 'crm-radio-accent' : ''} ${isDisabled ? 'is-disabled' : ''} ${className}`.trim()}
      >
        <input
          ref={ref}
          type="radio"
          name={groupName}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          onChange={handleChange}
          className="crm-radio-native"
          {...rest}
        />
        <span className="crm-radio-custom" aria-hidden="true">
          <span className="crm-radio-dot" />
        </span>
        {(label || description) && (
          <span className="crm-radio-text">
            {label && <span className="crm-radio-label">{label}</span>}
            {description && <span className="crm-radio-description">{description}</span>}
          </span>
        )}
      </label>
    );
  }
);

RadioButton.displayName = 'RadioButton';

