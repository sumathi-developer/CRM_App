import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '../../../components/ui';
import { TrendingUpIcon, PlusIcon, AwardIcon } from '../../../components/common/Icons';

/* ==========================================================================
   LEFT RAIL: Pipeline Health, Quota Gauges & Sliders (Matching Reference Layout)
   Fixed height: 446px to match Center 4-Row Deck
   ========================================================================== */

export interface DashboardLeftRailProps {
  totalLeads?: number;
  dealsWon?: number;
  conversionRate?: string;
  activitiesCount?: number;
  progressTitle?: string;
  progress1Label?: string;
  progress1Value?: string;
  progress1Width?: string;
  progress2Label?: string;
  progress2Value?: string;
  progress2Width?: string;
  progress3Label?: string;
  progress3Value?: string;
  progress3Width?: string;
  talliesTitle?: string;
  tally1Label?: string;
  tally1Value?: React.ReactNode;
  tally2Label?: string;
  tally2Value?: React.ReactNode;
  tally3Label?: string;
  tally3Value?: React.ReactNode;
  efficiencyLabel?: string;
  efficiencyValue?: string;
  auditLabel?: string;
  auditLink?: string;
}

export const DashboardLeftRail: React.FC<DashboardLeftRailProps> = ({
  totalLeads = 0,
  dealsWon = 0,
  conversionRate = '0%',
  activitiesCount = 0,
  progressTitle = 'Target Progress',
  progress1Label = 'Pipeline Health',
  progress1Value = '84%',
  progress1Width = '84%',
  progress2Label = 'Conversion Quota',
  progress2Value = conversionRate,
  progress2Width = '68%',
  progress3Label = 'Deal Velocity',
  progress3Value = '92%',
  progress3Width = '92%',
  talliesTitle = 'Quick Tallies',
  tally1Label = 'New Leads',
  tally1Value = totalLeads,
  tally2Label = 'Deals Won',
  tally2Value = dealsWon,
  tally3Label = 'Tasks Done',
  tally3Value = activitiesCount,
  efficiencyLabel = 'Win Efficiency',
  efficiencyValue = '94.2%',
  auditLabel = 'Full Pipeline Audit',
  auditLink = '/analytics/pipeline',
}) => {
  return (
    <aside className="crm-left-rail" aria-label="Performance Indicators">
      {/* 1. Target Progress */}
      <div>
        <div className="crm-rail-section-title">
          <span>{progressTitle}</span>
          <Badge variant="secondary">Active</Badge>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.65rem' }}>
          <div className="crm-slider-item">
            <div className="crm-slider-header">
              <span>{progress1Label}</span>
              <strong>{progress1Value}</strong>
            </div>
            <div className="crm-progress-track">
              <div className="crm-progress-fill-emerald" style={{ width: progress1Width }} />
            </div>
          </div>

          <div className="crm-slider-item">
            <div className="crm-slider-header">
              <span>{progress2Label}</span>
              <strong>{progress2Value}</strong>
            </div>
            <div className="crm-progress-track">
              <div className="crm-progress-fill-emerald" style={{ width: progress2Width }} />
            </div>
          </div>

          <div className="crm-slider-item">
            <div className="crm-slider-header">
              <span>{progress3Label}</span>
              <strong>{progress3Value}</strong>
            </div>
            <div className="crm-progress-track">
              <div className="crm-progress-fill-warm" style={{ width: progress3Width }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Tallies */}
      <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.12)', paddingTop: '0.75rem' }}>
        <div className="crm-rail-section-title">
          <span>{talliesTitle}</span>
          <span style={{ fontSize: '0.72rem', color: 'inherit', fontWeight: 700 }}>Live</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginTop: '0.55rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'inherit', fontWeight: 600 }}>{tally1Label}</span>
            <Badge variant="secondary" style={{ minWidth: '26px', textAlign: 'center', justifyContent: 'center' }}>{tally1Value}</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'inherit', fontWeight: 600 }}>{tally2Label}</span>
            <Badge variant="secondary" style={{ minWidth: '26px', textAlign: 'center', justifyContent: 'center' }}>{tally2Value}</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'inherit', fontWeight: 600 }}>{tally3Label}</span>
            <Badge variant="secondary" style={{ minWidth: '26px', textAlign: 'center', justifyContent: 'center' }}>{tally3Value}</Badge>
          </div>
        </div>
      </div>

      {/* 3. Conversion Efficiency Pill Metric */}
      <div
        style={{
          background: 'var(--bg-card-soft, rgba(16, 185, 129, 0.08))',
          border: '1px solid rgba(16, 185, 129, 0.28)',
          borderRadius: '12px',
          padding: '0.55rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#10b981', flexShrink: 0 }}>
          <AwardIcon size={16} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'inherit' }}>{efficiencyLabel}</span>
        </div>
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 800,
            color: 'inherit',
            textAlign: 'right',
            maxWidth: '60%',
            overflowWrap: 'break-word',
          }}
          title={efficiencyValue}
        >
          {efficiencyValue}
        </span>
      </div>

      {/* 4. Action Button */}
      <div>
        <Link to={auditLink} style={{ width: '100%', display: 'block' }}>
          <Button variant="outline" pill size="sm" style={{ width: '100%' }} icon={<TrendingUpIcon size={14} />}>
            {auditLabel}
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

export interface DashboardRightRailProps {
  pulseTitle?: string;
  pulseSubtitle?: string;
  actionLabel?: string;
  actionLink?: string;
}

export const DashboardRightRail: React.FC<DashboardRightRailProps> = ({
  pulseTitle = 'Performance Pulse',
  pulseSubtitle = 'Q4 High Momentum',
  actionLabel = 'Schedule Activity',
  actionLink = '/activities',
}) => {
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
          background: 'var(--bg-card-soft, rgba(16, 185, 129, 0.08))',
          border: '1px solid rgba(16, 185, 129, 0.22)',
          borderRadius: '14px',
          padding: '0.5rem 0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'inherit', fontWeight: 700 }}>
              {pulseTitle}
            </span>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'inherit', margin: '0.1rem 0 0' }}>
              {pulseSubtitle}
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
                background: idx === 6 ? '#10b981' : idx === 4 ? '#059669' : '#CBD5E1',
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
          <span style={{ fontSize: '0.68rem', color: 'inherit', fontWeight: 700 }}>Day {selectedDay}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
          <div className="crm-agenda-item" style={{ padding: '0.35rem 0.6rem' }}>
            <span className="crm-agenda-time" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>10:30 AM</span>
            <div className="crm-agenda-title" style={{ fontSize: '0.78rem' }}>Enterprise Demo with Acme</div>
          </div>
          <div className="crm-agenda-item" style={{ padding: '0.35rem 0.6rem' }}>
            <span
              className="crm-agenda-time"
              style={{ color: '#047857', background: 'rgba(16, 185, 129, 0.14)', fontSize: '0.68rem', padding: '0.15rem 0.4rem', fontWeight: 700, borderRadius: '4px' }}
            >
              02:00 PM
            </span>
            <div className="crm-agenda-title" style={{ fontSize: '0.78rem' }}>Pipeline Review & Forecast</div>
          </div>
        </div>
      </div>

      {/* 4. Action Button */}
      <div>
        <Link to={actionLink} style={{ width: '100%', display: 'block' }}>
          <Button
            variant="gradient"
            pill
            size="sm"
            style={{
              width: '100%',
              height: '38px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
            icon={<PlusIcon size={14} style={{ color: '#ffffff' }} />}
          >
            <span style={{ color: '#ffffff', fontWeight: 700 }}>{actionLabel}</span>
          </Button>
        </Link>
      </div>
    </aside>
  );
};
