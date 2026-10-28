import React from 'react';
import { LoadingIndicator } from '../../../components/auth/LoadingIndicator';
import { EmptyState } from '../../../components/common/EmptyState';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  loadingMessage?: string;
  footer?: React.ReactNode;
}

/** The single table component used by every Lead Generation list screen. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  emptyTitle = 'Nothing to show yet',
  emptyDescription = 'No records match the current filters.',
  emptyIcon,
  emptyAction,
  loadingMessage = 'Loading...',
  footer,
}: DataTableProps<T>) {
  return (
    <div className="lg-card lg-table-card">
      {isLoading ? (
        <div className="lg-state-box">
          <LoadingIndicator size="medium" message={loadingMessage} />
        </div>
      ) : rows.length === 0 ? (
        <div className="lg-state-box">
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        </div>
      ) : (
        <>
          <div className="lg-table-scroll">
            <table className="lg-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className={`${col.className || ''} align-${col.align || 'left'}`}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={rowKey(row)}>
                    {columns.map((col) => (
                      <td key={col.key} className={`${col.className || ''} align-${col.align || 'left'}`}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {footer}
        </>
      )}
    </div>
  );
}
