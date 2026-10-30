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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-log-details-title"
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <ShieldIcon size={20} />
            </div>
            <div>
              <h2
                id="audit-log-details-title"
                className="text-base font-bold text-gray-900 flex items-center gap-2"
              >
                <span>Audit Log Details</span>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getActionBadgeClass(
                    log.action,
                  )}`}
                >
                  {log.action}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusMeta.badgeClass}`}
                >
                  {log.status === 'SUCCESS' && <CheckCircleIcon size={11} />}
                  {log.status === 'FAILURE' && <AlertCircleIcon size={11} />}
                  {log.status === 'WARNING' && <ClockIcon size={11} />}
                  <span>{statusMeta.label}</span>
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Recorded {formatAuditDateTime(log.createdAt)} ({formatRelativeTime(log.createdAt)})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Navigation Tabs inside modal */}
        <div className="flex border-b border-gray-200 px-6 bg-white text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          {hasDiffChanges && (
            <button
              type="button"
              onClick={() => setActiveTab('changes')}
              className={`py-3 px-3 border-b-2 transition ${
                activeTab === 'changes'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Changes & Diffs
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'raw'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Raw JSON Payload
          </button>

          <div className="ml-auto flex items-center py-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              {copiedJson ? <CheckIcon size={12} className="text-emerald-600" /> : null}
              <span>{copiedJson ? 'JSON Copied' : 'Copy JSON'}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'overview' && (
            <>
              {/* Log UUID Bar */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Log Entry UUID:
                  </span>
                  <div className="font-mono text-xs font-semibold text-gray-800 break-all">
                    {log.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50"
                >
                  {copiedId ? <CheckIcon size={12} className="text-emerald-600" /> : null}
                  <span>{copiedId ? 'Copied' : 'Copy UUID'}</span>
                </button>
              </div>

              {/* Grid with Actor, Target, and Network details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Actor Card */}
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <UserIcon size={14} className="text-purple-600" />
                    <span>Responsible User</span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-xs text-gray-400">Name:</span>
                      <p className="font-semibold text-gray-900">
                        {log.userName || log.userEmail || 'System / Automated Routine'}
                      </p>
                    </div>
                    {log.userEmail && (
                      <div>
                        <span className="text-xs text-gray-400">Email:</span>
                        <p className="font-mono text-xs text-gray-700">{log.userEmail}</p>
                      </div>
                    )}
                    {log.userId && (
                      <div>
                        <span className="text-xs text-gray-400">User ID:</span>
                        <p className="font-mono text-[11px] text-gray-500 truncate" title={log.userId}>
                          {log.userId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Record Card */}
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <ShieldIcon size={14} className="text-blue-600" />
                    <span>Target Record</span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-xs text-gray-400">Category:</span>
                      <div>
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
                        <span className="text-xs text-gray-400">Entity Name:</span>
                        <p className="font-semibold text-gray-900">{log.entityName}</p>
                      </div>
                    )}
                    {log.entityId && (
                      <div>
                        <span className="text-xs text-gray-400">Entity ID:</span>
                        <p className="font-mono text-[11px] text-gray-500 truncate" title={log.entityId}>
                          {log.entityId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Network & Device Info */}
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <ClockIcon size={14} className="text-emerald-600" />
                    <span>Network & Client</span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-xs text-gray-400">IP Address:</span>
                      <p className="font-mono text-xs font-semibold text-gray-800">
                        {log.ipAddress || 'Internal Network'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Browser / Platform:</span>
                      <p className="text-xs font-medium text-gray-800">
                        {browser} on {os}
                      </p>
                    </div>
                    {log.userAgent && (
                      <div>
                        <span className="text-xs text-gray-400">User Agent:</span>
                        <p
                          className="font-mono text-[11px] text-gray-500 break-all bg-gray-50 p-1.5 rounded"
                          title={log.userAgent}
                        >
                          {log.userAgent}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workspace Context */}
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <LockIcon size={14} className="text-slate-600" />
                    <span>Security & Workspace</span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-xs text-gray-400">Workspace ID:</span>
                      <p className="font-mono text-[11px] text-gray-600 truncate">
                        {log.workspaceId || 'Default Organization Workspace'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Immutability:</span>
                      <p className="text-xs font-semibold text-emerald-700">
                        Cryptographically Sealed
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Execution Status:</span>
                      <p className="text-xs font-medium text-gray-800">
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
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Field Value Modifications
              </h3>
              {allDiffKeys.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600">
                      <tr>
                        <th className="py-2.5 px-3">Field</th>
                        <th className="py-2.5 px-3 bg-rose-50/50 text-rose-800">Previous Value</th>
                        <th className="py-2.5 px-3 bg-emerald-50/50 text-emerald-800">Updated Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allDiffKeys.map((key) => {
                        const oldVal = oldValues[key];
                        const newVal = newValues[key];
                        return (
                          <tr key={key} className="hover:bg-gray-50">
                            <td className="py-2 px-3 font-mono font-medium text-gray-800">
                              {key}
                            </td>
                            <td className="py-2 px-3 font-mono text-rose-700 bg-rose-50/20">
                              {oldVal !== undefined ? JSON.stringify(oldVal) : '—'}
                            </td>
                            <td className="py-2 px-3 font-mono text-emerald-700 bg-emerald-50/20 font-semibold">
                              {newVal !== undefined ? JSON.stringify(newVal) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : details.changes ? (
                <pre className="rounded-xl bg-gray-900 p-4 text-xs font-mono text-emerald-400 overflow-x-auto">
                  {JSON.stringify(details.changes, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-gray-500">
                  No individual field diffs recorded for this entry.
                </p>
              )}
            </div>
          )}

          {/* Raw JSON Tab */}
          {activeTab === 'raw' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Complete Record JSON:</span>
                <span className="font-mono text-[11px] text-gray-400">
                  {Object.keys(log).length} attributes
                </span>
              </div>
              <pre className="rounded-xl bg-slate-900 p-4 text-xs font-mono text-slate-100 overflow-x-auto max-h-96">
                {JSON.stringify(log, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 bg-gray-50 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <LockIcon size={14} className="text-slate-500" />
            <span>Read-Only Compliance Record: Frontend edits are strictly disabled.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

