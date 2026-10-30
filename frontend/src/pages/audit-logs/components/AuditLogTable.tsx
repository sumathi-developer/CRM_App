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
    return <span className="ml-1 text-purple-600">{sortOrder === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200">
            <tr>
              <th
                scope="col"
                className="py-3.5 px-4 cursor-pointer hover:text-gray-800"
                onClick={() => onSortChange?.('createdAt')}
              >
                <div className="flex items-center">
                  <span>Timestamp</span>
                  {renderSortIndicator('createdAt')}
                </div>
              </th>
              <th
                scope="col"
                className="py-3.5 px-4 cursor-pointer hover:text-gray-800"
                onClick={() => onSortChange?.('userEmail')}
              >
                <div className="flex items-center">
                  <span>Responsible User</span>
                  {renderSortIndicator('userEmail')}
                </div>
              </th>
              <th
                scope="col"
                className="py-3.5 px-4 cursor-pointer hover:text-gray-800"
                onClick={() => onSortChange?.('action')}
              >
                <div className="flex items-center">
                  <span>Event Action</span>
                  {renderSortIndicator('action')}
                </div>
              </th>
              <th
                scope="col"
                className="py-3.5 px-4 cursor-pointer hover:text-gray-800"
                onClick={() => onSortChange?.('entityType')}
              >
                <div className="flex items-center">
                  <span>Record Target</span>
                  {renderSortIndicator('entityType')}
                </div>
              </th>
              <th scope="col" className="py-3.5 px-4">
                Status
              </th>
              <th scope="col" className="py-3.5 px-4 hidden md:table-cell">
                Client / IP
              </th>
              <th scope="col" className="py-3.5 px-4 text-right">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && logs.length === 0 ? (
              // Loading Skeleton
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-4 w-28 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-16 bg-gray-100 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200" />
                      <div>
                        <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                        <div className="h-3 w-32 bg-gray-100 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 w-20 bg-gray-200 rounded-full" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 w-24 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-36 bg-gray-100 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 w-16 bg-gray-200 rounded-full" />
                  </td>
                  <td className="py-4 px-4 hidden md:table-cell">
                    <div className="h-4 w-20 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-28 bg-gray-100 rounded" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-8 w-16 bg-gray-200 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-3">
                    <ShieldIcon size={24} />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    No Audit Logs Found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
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
                    className="hover:bg-purple-50/40 cursor-pointer transition"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {formatAuditDateTime(log.createdAt)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatRelativeTime(log.createdAt)}
                      </div>
                    </td>

                    {/* Responsible User */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700 text-xs">
                          {hasUserName ? (
                            (log.userName || log.userEmail || 'U')[0].toUpperCase()
                          ) : (
                            <UserIcon size={14} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {log.userName || log.userEmail || 'System Process'}
                          </div>
                          {log.userEmail && log.userName && (
                            <div className="text-xs text-gray-500 truncate">
                              {log.userEmail}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Event Action */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getActionBadgeClass(
                          log.action,
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Record Target */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${getEntityBadgeClass(
                            log.entityType,
                          )}`}
                        >
                          {log.entityType}
                        </span>
                        {log.entityName && (
                          <span
                            className="font-medium text-gray-800 text-xs truncate max-w-[180px]"
                            title={log.entityName}
                          >
                            {log.entityName}
                          </span>
                        )}
                      </div>
                      {log.entityId && !log.entityName && (
                        <div className="mt-0.5 font-mono text-[11px] text-gray-400 truncate max-w-[160px]">
                          {log.entityId}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
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
                    <td className="py-3 px-4 text-xs text-gray-600 hidden md:table-cell whitespace-nowrap">
                      <div className="font-mono text-gray-700">
                        {log.ipAddress || 'Internal IP'}
                      </div>
                      <div className="text-gray-400 text-[11px]">
                        {browser} • {os}
                      </div>
                    </td>

                    {/* Action Details */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLog(log);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                      >
                        <EyeIcon size={13} />
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
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/75 px-4 py-2 text-xs text-gray-500">
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <LockIcon size={13} className="text-slate-500" />
          <span>Immutable Audit Trail: Logs are cryptographically signed and read-only.</span>
        </div>
        <div className="text-gray-400 hidden sm:block">
          SOC 2 / ISO 27001 Compliant
        </div>
      </div>
    </div>
  );
};

