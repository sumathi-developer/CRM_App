import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '../../../components/ui';
import { TrendingUpIcon, PlusIcon, AwardIcon } from '../../../components/common/Icons';

/* ==========================================================================
   LEFT RAIL: Pipeline Health, Quota Gauges & Sliders (Matching Reference Layout)
   Fixed height: 446px to match Center 4-Row Deck
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
      {/* 1. Target Progress */}
      <div>
        <div className="crm-rail-section-title">
          <span>Target Progress</span>
          <Badge variant="secondary">Active</Badge>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.65rem' }}>
          <div className="crm-slider-item">
            <div className="crm-slider-header">
              <span>Pipeline Health</span>
              <strong>84%</strong>
            </div>
            <div className="crm-progress-track">
              <div className="crm-progress-fill-emerald" style={{ width: '84%' }} />
            </div>
          </div>

          <div className="crm-slider-item">
            <div className="crm-slider-header">
              <span>Conversion Quota</span>
              <strong>{conversionRate}</strong>
            </div>
            <div className="crm-progress-track">
              <div className="crm-progress-fill-violet" style={{ width: '68%' }} />
            </div>
          </div>

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

      {/* 2. Quick Tallies */}
      <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.12)', paddingTop: '0.75rem' }}>
        <div className="crm-rail-section-title">
          <span>Quick Tallies</span>
          <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>Live</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginTop: '0.55rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: '#475569' }}>New Leads</span>
            <Badge variant="primary">{totalLeads}</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: '#475569' }}>Deals Won</span>
            <Badge variant="secondary">{dealsWon}</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: '#475569' }}>Tasks Done</span>
            <Badge variant="accent">{activitiesCount}</Badge>
          </div>
        </div>
      </div>

      {/* 3. Conversion Efficiency Pill Metric */}
      <div
        style={{
          background: '#F4FAF6',
          border: '1px solid rgba(16, 185, 129, 0.28)',
          borderRadius: '12px',
          padding: '0.55rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#059669' }}>
          <AwardIcon size={16} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46' }}>Win Efficiency</span>
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#062E03' }}>94.2%</span>
      </div>

      {/* 4. Action Button */}
      <div>
        <Link to="/analytics/pipeline" style={{ width: '100%', display: 'block' }}>
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
   Fixed height: 446px to match Center 4-Row Deck
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
      {/* 1. Performance Visual Pulse */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(6, 46, 3, 0.9) 0%, rgba(124, 58, 237, 0.25) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.22)',
          borderRadius: '14px',
          padding: '0.5rem 0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#10b981', fontWeight: 700 }}>
              Performance Pulse
            </span>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: '0.1rem 0 0' }}>
              Q4 High Momentum
            </h4>
          </div>
          <span style={{ fontSize: '18px' }}>🏙️</span>
        </div>

        {/* Mini chart bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '19px', marginTop: '0.3rem' }}>
          {[35, 52, 44, 70, 85, 60, 92, 78, 64, 88].map((val, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: `${val}%`,
                background: idx === 6 ? '#10b981' : idx === 4 ? '#7c3aed' : 'rgba(255, 255, 255, 0.2)',
                borderRadius: '3px 3px 1px 1px',
                transition: 'height 0.3s ease',
              }}
              title={`Day ${idx + 1}: ${val}% capacity`}
            />
          ))}
        </div>
      </div>

      {/* 2. Interactive Calendar Widget */}
      <div className="crm-calendar-card" style={{ gap: '0.4rem' }}>
        <div className="crm-calendar-header" style={{ fontSize: '0.8rem' }}>
          <span>{currentMonthName} {today.getFullYear()}</span>
          <Badge variant="secondary" withDot>Live Agenda</Badge>
        </div>

        <div className="crm-calendar-grid" style={{ gap: '1px' }}>
          {dayLabels.map((lbl, idx) => (
            <div key={idx} className="crm-calendar-day-label" style={{ padding: '2px 0', fontSize: '0.65rem' }}>
              {lbl}
            </div>
          ))}

          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} style={{ height: '20px' }} />
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
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 0',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '5px',
                }}
                role="button"
                tabIndex={0}
              >
                {dayNum}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Upcoming Scheduled Agenda (2 concise items) */}
      <div>
        <div className="crm-rail-section-title" style={{ fontSize: '0.72rem' }}>
          <span>Upcoming Agenda</span>
          <span style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 700 }}>Day {selectedDay}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
          <div className="crm-agenda-item" style={{ padding: '0.35rem 0.6rem' }}>
            <span className="crm-agenda-time" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>10:30 AM</span>
            <div className="crm-agenda-title" style={{ fontSize: '0.78rem' }}>Enterprise Demo with Acme</div>
          </div>
          <div className="crm-agenda-item" style={{ padding: '0.35rem 0.6rem' }}>
            <span
              className="crm-agenda-time"
              style={{ color: '#6d28d9', background: 'rgba(124, 58, 237, 0.12)', fontSize: '0.68rem', padding: '0.15rem 0.4rem', fontWeight: 700 }}
            >
              02:00 PM
            </span>
            <div className="crm-agenda-title" style={{ fontSize: '0.78rem' }}>Pipeline Review & Forecast</div>
          </div>
        </div>
      </div>

      {/* 4. Action Button */}
      <div>
        <Link to="/activities" style={{ width: '100%', display: 'block' }}>
          <Button
            variant="gradient"
            pill
            size="sm"
            style={{ width: '100%', height: '36px', fontWeight: 700, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)' }}
            icon={<PlusIcon size={14} />}
          >
            Schedule Activity
          </Button>
        </Link>
      </div>
    </aside>
  );
};
