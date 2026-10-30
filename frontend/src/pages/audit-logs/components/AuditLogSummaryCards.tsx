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

export const AuditLogSummaryCards: React.FC<AuditLogSummaryCardsProps> = ({
  summary,
  isLoading,
}) => {
  if (isLoading && !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="h-4 w-20 rounded bg-gray-200 mb-2" />
            <div className="h-7 w-16 rounded bg-gray-200" />
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mb-6">
      {/* Total Logs */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between text-gray-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Total Activity
          </span>
          <ActivityIcon size={16} className="text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {summary.totalLogs.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-gray-500">Recorded audit events</p>
      </div>

      {/* Successful Events */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between text-gray-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Successful
          </span>
          <CheckCircleIcon size={16} className="text-emerald-600" />
        </div>
        <div className="text-2xl font-bold text-emerald-600">
          {summary.successCount.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-gray-500">{successRate}% success rate</p>
      </div>

      {/* Failed Events */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between text-gray-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Failed Events
          </span>
          <AlertCircleIcon size={16} className="text-rose-600" />
        </div>
        <div className="text-2xl font-bold text-rose-600">
          {summary.failureCount.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-gray-500">Requires attention</p>
      </div>

      {/* Warnings / Security */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between text-gray-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Warnings
          </span>
          <ClockIcon size={16} className="text-amber-500" />
        </div>
        <div className="text-2xl font-bold text-amber-600">
          {summary.warningCount.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-gray-500">Security anomalies</p>
      </div>

      {/* Top Active Contributor */}
      <div className="col-span-2 sm:col-span-2 md:col-span-4 lg:col-span-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between text-gray-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Top Actor
          </span>
          <UsersIcon size={16} className="text-blue-600" />
        </div>
        <div
          className="text-base font-bold text-gray-900 truncate"
          title={topUser?.userName || topUser?.userEmail || 'N/A'}
        >
          {topUser?.userName || topUser?.userEmail?.split('@')[0] || 'System'}
        </div>
        <p className="mt-1 text-xs text-gray-500 truncate">
          {topUser ? `${topUser.activityCount} actions logged` : 'No user logs yet'}
        </p>
      </div>
    </div>
  );
};

