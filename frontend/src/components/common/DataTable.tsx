import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: (row: T, index?: number) => string;
  keyExtractor?: (row: T, index?: number) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching your current filter.',
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const getKey = keyExtractor || rowKey || ((row: any, idx?: number) => row._id || row.id || String(idx));
  const resolvedEmptyDescription = emptyMessage || emptyDescription;
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <LoadingSpinner label="Loading data records..." />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <EmptyState
          title={emptyTitle}
          description={resolvedEmptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </div>
    );
  }

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3 px-4 ${getAlignClass(col.align)} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, rowIdx) => (
              <tr
                key={getKey(row, rowIdx)}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-slate-50/80 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col, colIdx) => {
                  let cellContent: React.ReactNode = null;
                  if (col.render) {
                    cellContent = col.render(row, rowIdx);
                  } else if (typeof col.accessor === 'function') {
                    cellContent = col.accessor(row);
                  } else if (col.accessor) {
                    cellContent = row[col.accessor] as unknown as React.ReactNode;
                  }

                  return (
                    <td
                      key={colIdx}
                      className={`py-3 px-4 ${getAlignClass(col.align)} ${col.className || ''}`}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
