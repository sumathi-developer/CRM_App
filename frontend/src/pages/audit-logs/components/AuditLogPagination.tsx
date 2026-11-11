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
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 4px 6px 4px',
        fontSize: '13px',
        color: '#062E03',
      }}
    >
      {/* Items count & page size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#475569' }}>
          Showing <span style={{ fontWeight: 700, color: '#062E03' }}>{startItem}</span> to{' '}
          <span style={{ fontWeight: 700, color: '#062E03' }}>{endItem}</span> of{' '}
          <span style={{ fontWeight: 700, color: '#062E03' }}>{total.toLocaleString()}</span> logs
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
          <label htmlFor="audit-page-size" style={{ fontWeight: 600, color: '#062E03' }}>
            Per page:
          </label>
          <select
            id="audit-page-size"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            disabled={isLoading}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#062E03',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
              height: '32px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Pagination buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '34px',
            padding: '0 14px',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            backgroundColor: '#FFFFFF',
            color: '#062E03',
            fontSize: '12px',
            fontWeight: 600,
            cursor: page <= 1 || isLoading ? 'not-allowed' : 'pointer',
            opacity: page <= 1 || isLoading ? 0.45 : 1,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (page > 1 && !isLoading) {
              e.currentTarget.style.backgroundColor = '#EAF4ED';
              e.currentTarget.style.borderColor = '#10B981';
            }
          }}
          onMouseLeave={(e) => {
            if (page > 1 && !isLoading) {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
            }
          }}
        >
          <ArrowLeftIcon size={13} />
          <span>Prev</span>
        </button>

        {/* Page Number Buttons */}
        {getVisiblePages().map((pageNum) => {
          const isActive = pageNum === page;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              disabled={isLoading}
              style={{
                minWidth: '34px',
                height: '34px',
                padding: '0 10px',
                borderRadius: '8px',
                border: isActive ? '1px solid #10B981' : '1px solid rgba(16, 185, 129, 0.2)',
                backgroundColor: isActive ? '#10B981' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#062E03',
                fontSize: '12px',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isActive ? '0 2px 6px rgba(16, 185, 129, 0.3)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '34px',
            padding: '0 14px',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            backgroundColor: '#FFFFFF',
            color: '#062E03',
            fontSize: '12px',
            fontWeight: 600,
            cursor: page >= totalPages || isLoading ? 'not-allowed' : 'pointer',
            opacity: page >= totalPages || isLoading ? 0.45 : 1,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (page < totalPages && !isLoading) {
              e.currentTarget.style.backgroundColor = '#EAF4ED';
              e.currentTarget.style.borderColor = '#10B981';
            }
          }}
          onMouseLeave={(e) => {
            if (page < totalPages && !isLoading) {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
            }
          }}
        >
          <span>Next</span>
          <ArrowRightIcon size={13} />
        </button>
      </div>
    </div>
  );
};

