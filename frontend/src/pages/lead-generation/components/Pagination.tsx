import React from 'react';
import type { PaginationMeta } from '../../../types/lead-generation.types';

interface PaginationProps {
  meta?: PaginationMeta | null;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  noun?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  meta,
  onPageChange,
  disabled = false,
  noun = 'records',
}) => {
  if (!meta) return null;

  const { page, totalPages, total, limit } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <div className="lg-pagination">
      <span className="lg-pagination-info">
        Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong> {noun}
      </span>

      {totalPages > 1 && (
        <div className="lg-pagination-controls">
          <button
            type="button"
            className="lg-page-btn"
            onClick={() => onPageChange(page - 1)}
            disabled={disabled || page <= 1}
          >
            Previous
          </button>

          {pages.map((p, idx) => (
            <React.Fragment key={p}>
              {idx > 0 && p - pages[idx - 1] > 1 && <span className="lg-page-gap">…</span>}
              <button
                type="button"
                className={`lg-page-num ${p === page ? 'is-active' : ''}`}
                onClick={() => onPageChange(p)}
                disabled={disabled}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            </React.Fragment>
          ))}

          <button
            type="button"
            className="lg-page-btn"
            onClick={() => onPageChange(page + 1)}
            disabled={disabled || page >= totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
