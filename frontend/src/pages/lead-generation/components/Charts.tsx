import React from 'react';

/* ==========================================================================
   Lightweight SVG / CSS charts (no chart dependency required)
   ========================================================================== */

export interface BarDatum {
  label: string;
  value: number;
  hint?: string;
}

interface BarListProps {
  data: BarDatum[];
  formatValue?: (n: number) => string;
  emptyText?: string;
}

/** Horizontal bar list: label, proportional bar, value. */
export const BarList: React.FC<BarListProps> = ({ data, formatValue, emptyText = 'No data available.' }) => {
  if (data.length === 0) return <p className="lg-chart-empty">{emptyText}</p>;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="lg-bar-list">
      {data.map((d) => (
        <li key={d.label} className="lg-bar-row">
          <div className="lg-bar-head">
            <span className="lg-bar-label">{d.label}</span>
            <span className="lg-bar-value">{formatValue ? formatValue(d.value) : d.value}</span>
          </div>
          <div className="lg-bar-track" title={d.hint}>
            <div className="lg-bar-fill" style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

interface LineChartProps {
  points: Array<{ label: string; value: number }>;
  height?: number;
  emptyText?: string;
}

/** Area/line chart for time series. */
export const LineChart: React.FC<LineChartProps> = ({ points, height = 180, emptyText = 'No data available.' }) => {
  const total = points.reduce((a, p) => a + p.value, 0);
  if (points.length < 2 || total === 0) return <p className="lg-chart-empty">{emptyText}</p>;

  const width = 600;
  const pad = { top: 12, right: 12, bottom: 24, left: 28 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...points.map((p) => p.value), 1);

  const coords = points.map((p, i) => ({
    x: pad.left + (i / (points.length - 1)) * innerW,
    y: pad.top + innerH - (p.value / max) * innerH,
  }));

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${pad.top + innerH} L${coords[0].x.toFixed(1)},${pad.top + innerH} Z`;
  const ticks = [0, 0.5, 1].map((t) => ({ y: pad.top + innerH - t * innerH, v: Math.round(t * max) }));
  const labelIdx = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <div className="lg-line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Time series chart">
        <defs>
          <linearGradient id="lg-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t.y}>
            <line x1={pad.left} x2={width - pad.right} y1={t.y} y2={t.y} className="lg-chart-grid" />
            <text x={pad.left - 6} y={t.y + 3} textAnchor="end" className="lg-chart-tick">
              {t.v}
            </text>
          </g>
        ))}
        <path d={area} fill="url(#lg-area-grad)" />
        <path d={line} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {labelIdx.map((i) => (
          <text
            key={i}
            x={coords[i].x}
            y={height - 6}
            textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
            className="lg-chart-tick"
          >
            {points[i].label}
          </text>
        ))}
      </svg>
    </div>
  );
};

export interface DonutDatum {
  label: string;
  value: number;
}

const DONUT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#64748b'];

interface DonutChartProps {
  data: DonutDatum[];
  centerLabel?: string;
  emptyText?: string;
}

/** Donut chart with legend. */
export const DonutChart: React.FC<DonutChartProps> = ({ data, centerLabel = 'Total', emptyText = 'No data available.' }) => {
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) return <p className="lg-chart-empty">{emptyText}</p>;

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="lg-donut">
      <svg viewBox="0 0 140 140" className="lg-donut-svg" role="img" aria-label="Distribution chart">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" />
        {data
          .filter((d) => d.value > 0)
          .map((d, i) => {
            const length = (d.value / total) * circumference;
            const circle = (
              <circle
                key={d.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth="18"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
              />
            );
            offset += length;
            return circle;
          })}
        <text x="70" y="68" textAnchor="middle" className="lg-donut-total">
          {total}
        </text>
        <text x="70" y="84" textAnchor="middle" className="lg-donut-caption">
          {centerLabel}
        </text>
      </svg>

      <ul className="lg-donut-legend">
        {data
          .filter((d) => d.value > 0)
          .map((d, i) => (
            <li key={d.label}>
              <span className="lg-legend-dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
              <span className="lg-legend-label">{d.label}</span>
              <span className="lg-legend-value">
                {d.value} <em>({Math.round((d.value / total) * 100)}%)</em>
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
};

interface FunnelProps {
  steps: Array<{ label: string; value: number }>;
}

/** Simple conversion funnel. */
export const Funnel: React.FC<FunnelProps> = ({ steps }) => {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="lg-funnel">
      {steps.map((s, i) => (
        <div key={s.label} className="lg-funnel-step">
          <div className="lg-funnel-bar" style={{ width: `${Math.max((s.value / max) * 100, 8)}%`, opacity: 1 - i * 0.12 }}>
            <span>{s.value}</span>
          </div>
          <span className="lg-funnel-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
};
