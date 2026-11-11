import React from 'react';
import type { AuditLogSummary } from '../../../types/audit-log.types';
import {
  ActivityIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
} from '../../../components/common/Icons';

interface AuditLogSummaryCardsProps {
  summary: AuditLogSummary | null;
  isLoading: boolean;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(16, 185, 129, 0.22)',
  borderRadius: '14px',
  padding: '16px 18px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: '104px',
  boxSizing: 'border-box',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '6px',
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#475569',
};

const cardSubtextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748B',
  marginTop: '4px',
  lineHeight: 1.2,
};

export const AuditLogSummaryCards: React.FC<AuditLogSummaryCardsProps> = ({
  summary,
  isLoading,
}) => {
  if (isLoading && !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mb-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse lg-card"
            style={{
              ...cardStyle,
              backgroundColor: '#FFFFFF',
            }}
          >
            <div style={{ height: '14px', width: '80px', borderRadius: '6px', backgroundColor: '#E2E8F0', marginBottom: '8px' }} />
            <div style={{ height: '26px', width: '60px', borderRadius: '6px', backgroundColor: '#CBD5E1' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const successRate =
    summary.totalLogs > 0
      ? Math.round((summary.successCount / summary.totalLogs) * 100)
      : 100;

  const topUser = summary.topActiveUsers?.[0];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mb-5">
      {/* Total Logs */}
      <div className="lg-card" style={cardStyle}>
        <div style={cardHeaderStyle}>
          <span style={cardLabelStyle}>Total Activity</span>
          <ActivityIcon size={16} style={{ color: '#10B981' }} />
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#062E03', lineHeight: 1.1 }}>
          {summary.totalLogs.toLocaleString()}
        </div>
        <p style={cardSubtextStyle}>Recorded audit events</p>
      </div>

      {/* Successful Events */}
      <div className="lg-card" style={cardStyle}>
        <div style={cardHeaderStyle}>
          <span style={cardLabelStyle}>Successful</span>
          <CheckCircleIcon size={16} style={{ color: '#10B981' }} />
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#10B981', lineHeight: 1.1 }}>
          {summary.successCount.toLocaleString()}
        </div>
        <p style={cardSubtextStyle}>{successRate}% success rate</p>
      </div>

      {/* Failed Events */}
      <div className="lg-card" style={cardStyle}>
        <div style={cardHeaderStyle}>
          <span style={cardLabelStyle}>Failed Events</span>
          <AlertCircleIcon size={16} style={{ color: '#E11D48' }} />
        </div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: summary.failureCount > 0 ? '#E11D48' : '#062E03',
            lineHeight: 1.1,
          }}
        >
          {summary.failureCount.toLocaleString()}
        </div>
        <p style={cardSubtextStyle}>Requires attention</p>
      </div>

      {/* Warnings / Security */}
      <div className="lg-card" style={cardStyle}>
        <div style={cardHeaderStyle}>
          <span style={cardLabelStyle}>Warnings</span>
          <ClockIcon size={16} style={{ color: '#D97706' }} />
        </div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: summary.warningCount > 0 ? '#D97706' : '#062E03',
            lineHeight: 1.1,
          }}
        >
          {summary.warningCount.toLocaleString()}
        </div>
        <p style={cardSubtextStyle}>Security anomalies</p>
      </div>

      {/* Top Active Contributor */}
      <div
        className="lg-card col-span-2 sm:col-span-2 md:col-span-4 lg:col-span-1"
        style={cardStyle}
      >
        <div style={cardHeaderStyle}>
          <span style={cardLabelStyle}>Top Actor</span>
          <UsersIcon size={16} style={{ color: '#10B981' }} />
        </div>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#062E03',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={topUser?.userName || topUser?.userEmail || 'N/A'}
        >
          {topUser?.userName || topUser?.userEmail?.split('@')[0] || 'System'}
        </div>
        <p
          style={{
            ...cardSubtextStyle,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {topUser ? `${topUser.activityCount} actions logged` : 'No user logs yet'}
        </p>
      </div>
    </div>
  );
};


