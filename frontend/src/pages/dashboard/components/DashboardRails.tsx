import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '../../../components/ui';
import { TrendingUpIcon, PlusIcon } from '../../../components/common/Icons';

/* ==========================================================================
   LEFT RAIL: Pipeline Health, Quota Gauges & Sliders (Matching Reference Layout)
   ========================================================================== */

interface DashboardLeftRailProps {
  totalLeads?: number;
  dealsWon?: number;
  conversionRate?: string;
  activitiesCount?: number;
}

export const DashboardLeftRail: React.FC<DashboardLeftRailProps> = ({
  totalLeads = 0,
  dealsWon = 0,
  conversionRate = '0%',
  activitiesCount = 0,
}) => {
  return (
    <aside className="crm-left-rail" aria-label="Performance Indicators">
      <div>
        <div className="crm-rail-section-title">
          <span>Target Progress</span>
          <Badge variant="secondary">Active</Badge>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {/* Slider 1: Pipeline Health */}
          <div className="crm-slider-item">
            <div className="crm-slider-header">
              <span>Pipeline Health</span>
              <strong>84%</strong>
            </div>
            <div className="crm-progress-track">
              <div className="crm-progress-fill-emerald" style={{ width: '84%' }} />
            </div>
          </div>

          {/* Slider 2: Conversion Quota */}
          <div className="crm-slider-item">
            <div className="crm-slider-header">
              <span>Conversion Quota</span>
              <strong>{conversionRate}</strong>
            </div>
            <div className="crm-progress-track">
              <div className="crm-progress-fill-violet" style={{ width: '68%' }} />
            </div>
          </div>

          {/* Slider 3: Deal Velocity */}
          <div className="crm-slider-item">
            <div className="crm-slider-header">
              <span>Deal Velocity</span>
              <strong>92%</strong>
            </div>
            <div className="crm-progress-track">
              <div className="crm-progress-fill-warm" style={{ width: '92%' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.12)', paddingTop: '1.25rem' }}>
        <div className="crm-rail-section-title">
          <span>Quick Tallies</span>
          <span style={{ fontSize: '0.72rem', color: '#10b981' }}>Live</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #94a3b8)' }}>New Leads</span>
            <Badge variant="primary">{totalLeads}</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #94a3b8)' }}>Deals Won</span>
            <Badge variant="secondary">{dealsWon}</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #94a3b8)' }}>Tasks Done</span>
            <Badge variant="accent">{activitiesCount}</Badge>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.12)', paddingTop: '1.25rem' }}>
        <Link to="/analytics/pipeline" style={{ width: '100%' }}>
          <Button variant="outline" pill size="sm" style={{ width: '100%' }} icon={<TrendingUpIcon size={14} />}>
            Full Pipeline Audit
          </Button>
        </Link>
      </div>
    </aside>
  );
};

/* ==========================================================================
   RIGHT RAIL: Performance Graph, Interactive Calendar & Upcoming Schedule
   (Directly matching the tall card on the right in the Reference Image)
   ========================================================================== */

export const DashboardRightRail: React.FC = () => {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthName = monthNames[today.getMonth()];

  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <aside className="crm-right-rail" aria-label="Schedule and Performance Rail">
      {/* Cityscape / Performance Visual Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(6, 46, 3, 0.9) 0%, rgba(124, 58, 237, 0.3) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '20px',
          padding: '1.25rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#10b981', fontWeight: 700 }}>
              Performance Pulse
            </span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: '0.2rem 0 0' }}>
              Q4 High Momentum
            </h4>
          </div>
          <span style={{ fontSize: '20px' }}>🏙️</span>
        </div>

        {/* Mini SVG Chart Bars simulating cityscape graphic in reference image */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '54px', marginTop: '1rem' }}>
          {[35, 52, 44, 70, 85, 60, 92, 78, 64, 88].map((val, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: `${val}%`,
                background: idx === 6 ? '#10b981' : idx === 4 ? '#7c3aed' : 'rgba(255, 255, 255, 0.2)',
                borderRadius: '4px 4px 1px 1px',
                transition: 'height 0.3s ease',
              }}
              title={`Day ${idx + 1}: ${val}% capacity`}
            />
          ))}
        </div>
      </div>

      {/* Interactive Calendar Widget matching Reference Image */}
      <div className="crm-calendar-card">
        <div className="crm-calendar-header">
          <span>{currentMonthName} {today.getFullYear()}</span>
          <Badge variant="secondary" withDot>Live Agenda</Badge>
        </div>

        <div className="crm-calendar-grid">
          {dayLabels.map((lbl, idx) => (
            <div key={idx} className="crm-calendar-day-label">
              {lbl}
            </div>
          ))}

          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const isToday = dayNum === today.getDate();
            const isSelected = dayNum === selectedDay;
            const hasEvent = [4, 9, 14, 18, 22, 27].includes(dayNum);

            return (
              <div
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                className={`crm-calendar-cell ${isToday ? 'is-today' : ''} ${
                  isSelected && !isToday ? 'is-active-day' : ''
                } ${hasEvent ? 'has-event' : ''}`}
                role="button"
                tabIndex={0}
              >
                {dayNum}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Scheduled Agenda */}
      <div>
        <div className="crm-rail-section-title">
          <span>Upcoming Agenda</span>
          <span style={{ fontSize: '0.72rem', color: '#a78bfa' }}>Day {selectedDay}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.85rem' }}>
          <div className="crm-agenda-item">
            <span className="crm-agenda-time">10:30 AM</span>
            <div className="crm-agenda-title">Enterprise Demo with Acme Corp</div>
          </div>
          <div className="crm-agenda-item">
            <span className="crm-agenda-time" style={{ color: '#c4b5fd', background: 'rgba(124, 58, 237, 0.15)' }}>
              02:00 PM
            </span>
            <div className="crm-agenda-title">Pipeline Review & Forecast</div>
          </div>
          <div className="crm-agenda-item">
            <span className="crm-agenda-time">04:15 PM</span>
            <div className="crm-agenda-title">Contract Negotiation Call</div>
          </div>
        </div>
      </div>

      {/* Prominent Action Pill Button matching bottom orange pill in Reference Image */}
      <Link to="/activities" style={{ width: '100%' }}>
        <Button
          variant="gradient"
          pill
          size="md"
          style={{ width: '100%', fontWeight: 700 }}
          icon={<PlusIcon size={16} />}
        >
          Schedule Activity
        </Button>
      </Link>
    </aside>
  );
};

