import React, { useState } from 'react';
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
  CheckIcon,
  ClockIcon,
  LockIcon,
  ShieldIcon,
  UserIcon,
  XIcon,
} from '../../../components/common/Icons';

interface AuditLogDetailsModalProps {
  log: AuditLogEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogDetailsModal: React.FC<AuditLogDetailsModalProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'changes' | 'raw'>('overview');

  if (!isOpen || !log) return null;

  const statusMeta = AUDIT_STATUS_META[log.status] || AUDIT_STATUS_META.SUCCESS;
  const { browser, os } = parseUserAgent(log.userAgent);

  const handleCopyId = () => {
    void navigator.clipboard.writeText(log.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyJson = () => {
    const raw = JSON.stringify(log, null, 2);
    void navigator.clipboard.writeText(raw);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Inspect details payload for before/after changes
  const details = log.details || {};
  const hasDiffChanges =
    Boolean(details.oldValues && details.newValues) ||
    Boolean(details.changes && typeof details.changes === 'object');

  const oldValues = details.oldValues || {};
  const newValues = details.newValues || {};
  const allDiffKeys = Array.from(
    new Set([...Object.keys(oldValues), ...Object.keys(newValues)]),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-log-details-title"
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '780px',
          borderRadius: '16px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(16, 185, 129, 0.18)',
            padding: '16px 24px',
            backgroundColor: '#F8FCF9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                height: '38px',
                width: '38px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                backgroundColor: '#EAF4ED',
                color: '#10B981',
                flexShrink: 0,
              }}
            >
              <ShieldIcon size={20} />
            </div>
            <div>
              <h2
                id="audit-log-details-title"
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#062E03',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  margin: 0,
                }}
              >
                <span>Audit Log Details</span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getActionBadgeClass(
                    log.action,
                  )}`}
                >
                  {log.action}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.badgeClass}`}
                >
                  {log.status === 'SUCCESS' && <CheckCircleIcon size={11} />}
                  {log.status === 'FAILURE' && <AlertCircleIcon size={11} />}
                  {log.status === 'WARNING' && <ClockIcon size={11} />}
                  <span>{statusMeta.label}</span>
                </span>
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0' }}>
                Recorded {formatAuditDateTime(log.createdAt)} ({formatRelativeTime(log.createdAt)})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: '8px',
              padding: '6px',
              color: '#64748B',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EAF4ED';
              e.currentTarget.style.color = '#062E03';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748B';
            }}
            aria-label="Close modal"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Navigation Tabs inside modal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid rgba(16, 185, 129, 0.16)',
            padding: '0 24px',
            backgroundColor: '#FFFFFF',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: activeTab === 'overview' ? '#10B981' : '#64748B',
              border: 'none',
              borderBottom: activeTab === 'overview' ? '2px solid #10B981' : '2px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Overview
          </button>
          {hasDiffChanges && (
            <button
              type="button"
              onClick={() => setActiveTab('changes')}
              style={{
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: activeTab === 'changes' ? '#10B981' : '#64748B',
                border: 'none',
                borderBottom: activeTab === 'changes' ? '2px solid #10B981' : '2px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Changes & Diffs
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: activeTab === 'raw' ? '#10B981' : '#64748B',
              border: 'none',
              borderBottom: activeTab === 'raw' ? '2px solid #10B981' : '2px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Raw JSON Payload
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleCopyJson}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                backgroundColor: '#F1F8F3',
                color: '#062E03',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EAF4ED';
                e.currentTarget.style.borderColor = '#10B981';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F8F3';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.28)';
              }}
            >
              {copiedJson ? <CheckIcon size={12} style={{ color: '#10B981' }} /> : null}
              <span>{copiedJson ? 'JSON Copied' : 'Copy JSON'}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            backgroundColor: '#FFFFFF',
          }}
        >
          {activeTab === 'overview' && (
            <>
              {/* Log UUID Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.22)',
                  backgroundColor: '#F8FCF9',
                  padding: '12px 16px',
                  gap: '12px',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#475569',
                      marginBottom: '3px',
                    }}
                  >
                    Log Entry UUID:
                  </span>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#062E03',
                      wordBreak: 'break-all',
                    }}
                  >
                    {log.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.28)',
                    backgroundColor: '#FFFFFF',
                    color: '#062E03',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#EAF4ED';
                    e.currentTarget.style.borderColor = '#10B981';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.28)';
                  }}
                >
                  {copiedId ? <CheckIcon size={12} style={{ color: '#10B981' }} /> : null}
                  <span>{copiedId ? 'Copied' : 'Copy UUID'}</span>
                </button>
              </div>

              {/* Grid with Actor, Target, and Network details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Actor Card */}
                <div
                  style={{
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.22)',
                    padding: '16px 18px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#062E03',
                    }}
                  >
                    <UserIcon size={15} style={{ color: '#10B981' }} />
                    <span>Responsible User</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Name:</span>
                      <p style={{ fontWeight: 600, color: '#062E03', fontSize: '13px', margin: '2px 0 0 0' }}>
                        {log.userName || log.userEmail || 'System / Automated Routine'}
                      </p>
                    </div>
                    {log.userEmail && (
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Email:</span>
                        <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#062E03', margin: '2px 0 0 0' }}>
                          {log.userEmail}
                        </p>
                      </div>
                    )}
                    {log.userId && (
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>User ID:</span>
                        <p
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: '#475569',
                            margin: '2px 0 0 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={log.userId}
                        >
                          {log.userId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Record Card */}
                <div
                  style={{
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.22)',
                    padding: '16px 18px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#062E03',
                    }}
                  >
                    <ShieldIcon size={15} style={{ color: '#10B981' }} />
                    <span>Target Record</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Category:</span>
                      <div style={{ marginTop: '3px' }}>
                        <span
                          className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${getEntityBadgeClass(
                            log.entityType,
                          )}`}
                        >
                          {log.entityType}
                        </span>
                      </div>
                    </div>
                    {log.entityName && (
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Entity Name:</span>
                        <p style={{ fontWeight: 600, color: '#062E03', fontSize: '13px', margin: '2px 0 0 0' }}>
                          {log.entityName}
                        </p>
                      </div>
                    )}
                    {log.entityId && (
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Entity ID:</span>
                        <p
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: '#475569',
                            margin: '2px 0 0 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={log.entityId}
                        >
                          {log.entityId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Network & Device Info */}
                <div
                  style={{
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.22)',
                    padding: '16px 18px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#062E03',
                    }}
                  >
                    <ClockIcon size={15} style={{ color: '#10B981' }} />
                    <span>Network & Client</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>IP Address:</span>
                      <p style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: '#062E03', margin: '2px 0 0 0' }}>
                        {log.ipAddress || 'Internal Network'}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Browser / Platform:</span>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#062E03', margin: '2px 0 0 0' }}>
                        {browser} on {os}
                      </p>
                    </div>
                    {log.userAgent && (
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '3px' }}>User Agent:</span>
                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: '#062E03',
                            wordBreak: 'break-all',
                            backgroundColor: '#F1F8F3',
                            border: '1px solid rgba(16, 185, 129, 0.18)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            lineHeight: 1.4,
                          }}
                          title={log.userAgent}
                        >
                          {log.userAgent}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workspace Context */}
                <div
                  style={{
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.22)',
                    padding: '16px 18px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#062E03',
                    }}
                  >
                    <LockIcon size={15} style={{ color: '#10B981' }} />
                    <span>Security & Workspace</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Workspace ID:</span>
                      <p
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          color: '#475569',
                          margin: '2px 0 0 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {log.workspaceId || 'Default Organization Workspace'}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Immutability:</span>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#10B981', margin: '2px 0 0 0' }}>
                        Cryptographically Sealed
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Execution Status:</span>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#062E03', margin: '2px 0 0 0' }}>
                        {statusMeta.label} ({log.status})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Changes / Diffs Tab */}
          {activeTab === 'changes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#475569',
                  margin: 0,
                }}
              >
                Field Value Modifications
              </h3>
              {allDiffKeys.length > 0 ? (
                <div
                  style={{
                    border: '1px solid rgba(16, 185, 129, 0.22)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                    <thead style={{ backgroundColor: '#F4FAF6', borderBottom: '1px solid rgba(16, 185, 129, 0.18)', fontWeight: 600, color: '#062E03' }}>
                      <tr>
                        <th style={{ padding: '10px 14px' }}>Field</th>
                        <th style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#DC2626' }}>Previous Value</th>
                        <th style={{ padding: '10px 14px', backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#047857' }}>Updated Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allDiffKeys.map((key) => {
                        const oldVal = oldValues[key];
                        const newVal = newValues[key];
                        return (
                          <tr key={key} style={{ borderBottom: '1px solid #F1F5F2' }}>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600, color: '#062E03' }}>
                              {key}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#DC2626', backgroundColor: 'rgba(254, 242, 242, 0.6)' }}>
                              {oldVal !== undefined ? JSON.stringify(oldVal) : '—'}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#047857', backgroundColor: 'rgba(236, 253, 245, 0.6)', fontWeight: 600 }}>
                              {newVal !== undefined ? JSON.stringify(newVal) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : details.changes ? (
                <pre
                  style={{
                    borderRadius: '10px',
                    backgroundColor: '#0F172A',
                    padding: '16px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#34D399',
                    overflowX: 'auto',
                    margin: 0,
                  }}
                >
                  {JSON.stringify(details.changes, null, 2)}
                </pre>
              ) : (
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                  No individual field diffs recorded for this entry.
                </p>
              )}
            </div>
          )}

          {/* Raw JSON Tab */}
          {activeTab === 'raw' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
                <span style={{ fontWeight: 600, color: '#062E03' }}>Complete Record JSON:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748B' }}>
                  {Object.keys(log).length} attributes
                </span>
              </div>
              <pre
                style={{
                  borderRadius: '10px',
                  backgroundColor: '#0F172A',
                  padding: '16px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#E2E8F0',
                  overflowX: 'auto',
                  maxHeight: '380px',
                  margin: 0,
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                {JSON.stringify(log, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(16, 185, 129, 0.18)',
            padding: '14px 24px',
            backgroundColor: '#F8FCF9',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#062E03', fontWeight: 500 }}>
            <LockIcon size={14} style={{ color: '#10B981' }} />
            <span>Read-Only Compliance Record: Frontend edits are strictly disabled.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '7px 18px',
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

