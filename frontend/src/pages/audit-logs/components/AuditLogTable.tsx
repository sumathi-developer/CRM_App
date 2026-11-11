import React from 'react';
import type { AuditLogEntry } from '../../../types/audit-log.types';
import {
  AUDIT_STATUS_META,
  formatAuditDateTime,
  formatRelativeTime,
  getActionBadgeClass,
  getEntityBadgeClass,
  parseUserAgent,
} from '../auditLogConstants';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  LockIcon,
  ShieldIcon,
  UserIcon,
} from '../../../components/common/Icons';

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  isLoading: boolean;
  onSelectLog: (log: AuditLogEntry) => void;
  sortBy?: 'createdAt' | 'action' | 'entityType' | 'userEmail';
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (field: 'createdAt' | 'action' | 'entityType' | 'userEmail') => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  isLoading,
  onSelectLog,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  onSortChange,
}) => {
  const renderSortIndicator = (field: 'createdAt' | 'action' | 'entityType' | 'userEmail') => {
    if (sortBy !== field) return null;
    return <span style={{ marginLeft: '4px', color: '#10B981', fontWeight: 700 }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div
      className="lg-card"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(16, 185, 129, 0.22)',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        padding: 0,
      }}
    >
      <div className="overflow-x-auto" style={{ width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '880px' }}>
          <thead
            style={{
              backgroundColor: '#F4FAF6',
              borderBottom: '1px solid rgba(16, 185, 129, 0.18)',
            }}
          >
            <tr>
              <th
                scope="col"
                onClick={() => onSortChange?.('createdAt')}
                style={{
                  padding: '14px 20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#062E03',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Timestamp</span>
                  {renderSortIndicator('createdAt')}
                </div>
              </th>
              <th
                scope="col"
                onClick={() => onSortChange?.('userEmail')}
                style={{
                  padding: '14px 18px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#062E03',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Responsible User</span>
                  {renderSortIndicator('userEmail')}
                </div>
              </th>
              <th
                scope="col"
                onClick={() => onSortChange?.('action')}
                style={{
                  padding: '14px 18px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#062E03',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Event Action</span>
                  {renderSortIndicator('action')}
                </div>
              </th>
              <th
                scope="col"
                onClick={() => onSortChange?.('entityType')}
                style={{
                  padding: '14px 18px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#062E03',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Record Target</span>
                  {renderSortIndicator('entityType')}
                </div>
              </th>
              <th
                scope="col"
                style={{
                  padding: '14px 18px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#062E03',
                }}
              >
                Status
              </th>
              <th
                scope="col"
                className="hidden md:table-cell"
                style={{
                  padding: '14px 18px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#062E03',
                }}
              >
                Client / IP
              </th>
              <th
                scope="col"
                style={{
                  padding: '14px 20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#062E03',
                  textAlign: 'right',
                }}
              >
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && logs.length === 0 ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse" style={{ borderBottom: '1px solid #F1F5F2' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ height: '14px', width: '110px', backgroundColor: '#E2E8F0', borderRadius: '4px', marginBottom: '6px' }} />
                    <div style={{ height: '12px', width: '60px', backgroundColor: '#F1F5F9', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ height: '32px', width: '32px', borderRadius: '9999px', backgroundColor: '#E2E8F0' }} />
                      <div>
                        <div style={{ height: '14px', width: '90px', backgroundColor: '#E2E8F0', borderRadius: '4px', marginBottom: '6px' }} />
                        <div style={{ height: '12px', width: '120px', backgroundColor: '#F1F5F9', borderRadius: '4px' }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ height: '22px', width: '70px', backgroundColor: '#E2E8F0', borderRadius: '9999px' }} />
                  </td>
                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ height: '20px', width: '80px', backgroundColor: '#E2E8F0', borderRadius: '4px', marginBottom: '4px' }} />
                    <div style={{ height: '12px', width: '110px', backgroundColor: '#F1F5F9', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ height: '22px', width: '65px', backgroundColor: '#E2E8F0', borderRadius: '9999px' }} />
                  </td>
                  <td className="hidden md:table-cell" style={{ padding: '16px 18px' }}>
                    <div style={{ height: '14px', width: '80px', backgroundColor: '#E2E8F0', borderRadius: '4px', marginBottom: '6px' }} />
                    <div style={{ height: '12px', width: '100px', backgroundColor: '#F1F5F9', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ height: '28px', width: '70px', backgroundColor: '#E2E8F0', borderRadius: '8px', marginLeft: 'auto' }} />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <div
                    style={{
                      margin: '0 auto 12px auto',
                      display: 'flex',
                      height: '48px',
                      width: '48px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '9999px',
                      backgroundColor: '#EAF4ED',
                      color: '#10B981',
                    }}
                  >
                    <ShieldIcon size={24} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#062E03', margin: '0 0 4px 0' }}>
                    No Audit Logs Found
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '360px', margin: '0 auto' }}>
                    No activity logs match your current search query or filter parameters.
                  </p>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const statusMeta =
                  AUDIT_STATUS_META[log.status] || AUDIT_STATUS_META.SUCCESS;
                const { browser, os } = parseUserAgent(log.userAgent);
                const hasUserName = Boolean(log.userName || log.userEmail);

                return (
                  <tr
                    key={log.id}
                    onClick={() => onSelectLog(log)}
                    style={{
                      borderBottom: '1px solid #F1F5F2',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F8FCF9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Timestamp */}
                    <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: '#062E03', fontSize: '13px' }}>
                        {formatAuditDateTime(log.createdAt)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        {formatRelativeTime(log.createdAt)}
                      </div>
                    </td>

                    {/* Responsible User */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            height: '32px',
                            width: '32px',
                            flexShrink: 0,
                            borderRadius: '9999px',
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '12px',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                          }}
                        >
                          {hasUserName ? (
                            (log.userName || log.userEmail || 'U')[0].toUpperCase()
                          ) : (
                            <UserIcon size={14} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: '#062E03',
                              fontSize: '13px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '180px',
                            }}
                            title={log.userName || log.userEmail || 'System Process'}
                          >
                            {log.userName || log.userEmail || 'System Process'}
                          </div>
                          {log.userEmail && log.userName && (
                            <div
                              style={{
                                fontSize: '11px',
                                color: '#64748B',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '180px',
                              }}
                              title={log.userEmail}
                            >
                              {log.userEmail}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Event Action */}
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getActionBadgeClass(
                          log.action,
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Record Target */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${getEntityBadgeClass(
                            log.entityType,
                          )}`}
                        >
                          {log.entityType}
                        </span>
                        {log.entityName && (
                          <span
                            style={{
                              fontWeight: 600,
                              color: '#062E03',
                              fontSize: '12px',
                              maxWidth: '180px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={log.entityName}
                          >
                            {log.entityName}
                          </span>
                        )}
                      </div>
                      {log.entityId && !log.entityName && (
                        <div
                          style={{
                            marginTop: '2px',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: '#64748B',
                            maxWidth: '160px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={log.entityId}
                        >
                          {log.entityId}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.badgeClass}`}
                      >
                        {log.status === 'SUCCESS' && (
                          <CheckCircleIcon size={12} />
                        )}
                        {log.status === 'FAILURE' && (
                          <AlertCircleIcon size={12} />
                        )}
                        {log.status === 'WARNING' && <ClockIcon size={12} />}
                        <span>{statusMeta.label}</span>
                      </span>
                    </td>

                    {/* Client / IP */}
                    <td className="hidden md:table-cell" style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: '#062E03' }}>
                        {log.ipAddress || 'Internal IP'}
                      </div>
                      <div style={{ color: '#64748B', fontSize: '11px', marginTop: '2px' }}>
                        {browser} • {os}
                      </div>
                    </td>

                    {/* Action Details */}
                    <td style={{ padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLog(log);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          backgroundColor: '#FFFFFF',
                          color: '#062E03',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#EAF4ED';
                          e.currentTarget.style.borderColor = '#10B981';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                          e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                        }}
                      >
                        <EyeIcon size={13} style={{ color: '#10B981' }} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Read-Only Security Compliance Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(16, 185, 129, 0.15)',
          backgroundColor: '#F8FCF9',
          padding: '12px 20px',
          fontSize: '12px',
          color: '#475569',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#062E03', fontWeight: 500 }}>
          <LockIcon size={14} style={{ color: '#10B981' }} />
          <span>Immutable Audit Trail: Logs are cryptographically signed and read-only.</span>
        </div>
        <div className="hidden sm:block" style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>
          SOC 2 / ISO 27001 Compliant
        </div>
      </div>
    </div>
  );
};

