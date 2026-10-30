import React from 'react';
import type { AuditLogPaginationMeta } from '../../../types/audit-log.types';
import { ArrowLeftIcon, ArrowRightIcon } from '../../../components/common/Icons';

interface AuditLogPaginationProps {
  meta: AuditLogPaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isLoading?: boolean;
}

export const AuditLogPagination: React.FC<AuditLogPaginationProps> = ({
  meta,
  onPageChange,
  onLimitChange,
  isLoading = false,
}) => {
  const { total, page, limit, totalPages } = meta;

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers to display
  const getVisiblePages = () => {
    const pages: number[] = [];
    const delta = 2;
    for (
      let i = Math.max(1, page - delta);
      i <= Math.min(totalPages, page + delta);
      i++
    ) {
      pages.push(i);
    }
    return pages;
  };

  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 px-1 text-sm text-gray-700">
      {/* Items count & page size */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">
          Showing <span className="font-semibold text-gray-900">{startItem}</span> to{' '}
          <span className="font-semibold text-gray-900">{endItem}</span> of{' '}
          <span className="font-semibold text-gray-900">{total.toLocaleString()}</span> logs
        </span>

        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <label htmlFor="audit-page-size" className="font-medium">
            Per page:
          </label>
          <select
            id="audit-page-size"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            disabled={isLoading}
            className="rounded border border-gray-300 bg-white py-1 px-2 text-xs font-medium text-gray-800 focus:border-purple-500 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Pagination buttons */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
        >
          <ArrowLeftIcon size={13} />
          <span>Prev</span>
        </button>

        {/* Page Number Buttons */}
        {getVisiblePages().map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            disabled={isLoading}
            className={`min-w-[28px] rounded-lg border px-2 py-1 text-xs font-semibold transition ${
              pageNum === page
                ? 'border-purple-600 bg-purple-600 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {pageNum}
          </button>
        ))}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
        >
          <span>Next</span>
          <ArrowRightIcon size={13} />
        </button>
      </div>
    </div>
  );
};

