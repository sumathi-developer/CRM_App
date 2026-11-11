import React from 'react';
import { STAGE_COLOR_PRESETS } from '../pipelineConstants';

interface StageColorSelectorProps {
  id?: string;
  value: string;
  onChange: (color: string) => void;
}

export const StageColorSelector: React.FC<StageColorSelectorProps> = ({
  id,
  value,
  onChange,
}) => {
  const currentColor = value || '#3b82f6';
  const currentPreset = STAGE_COLOR_PRESETS.find(
    (c) => c.value.toLowerCase() === currentColor.toLowerCase(),
  );

  return (
    <div className="ld-color-picker-composite">
      <div className="ld-color-select-bar">
        <span
          className="ld-color-current-swatch"
          style={{ backgroundColor: currentColor }}
          aria-hidden="true"
          title={`Active color: ${currentColor}`}
        />
        <select
          id={id}
          className="lg-select ld-color-select-input"
          value={currentColor}
          onChange={(e) => onChange(e.target.value)}
        >
          {STAGE_COLOR_PRESETS.map((c) => (
            <option key={c.value} value={c.value}>
              ● {c.label}
            </option>
          ))}
        </select>
        <div
          className="ld-color-preview-pill"
          style={{
            borderColor: currentColor,
          }}
          title={`Selected: ${currentPreset?.label || currentColor}`}
        >
          <span
            className="ld-color-preview-circle"
            style={{ backgroundColor: currentColor }}
          />
          <span className="ld-color-preview-code">{currentColor}</span>
        </div>
      </div>

      <div className="ld-color-palette-strip" aria-label="Preset stage colors">
        <span className="ld-color-palette-label">Preset Colors:</span>
        <div className="ld-color-swatches-list">
          {STAGE_COLOR_PRESETS.map((c) => {
            const isSelected = currentColor.toLowerCase() === c.value.toLowerCase();
            return (
              <button
                key={c.value}
                type="button"
                className={`ld-color-swatch-chip ${isSelected ? 'is-selected' : ''}`}
                style={{ backgroundColor: c.value }}
                onClick={() => onChange(c.value)}
                title={c.label}
                aria-label={`Select ${c.label}`}
              >
                {isSelected && <span className="ld-swatch-check">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

