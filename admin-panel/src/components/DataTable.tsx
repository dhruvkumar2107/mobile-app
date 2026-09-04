'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Badge from './Badge';
import { Pagination } from './Tabs';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
  onRowClick?: (item: T) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  keyExtractor?: (item: T) => string;
  loading?: boolean;
}

function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <tbody className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-4 bg-gray-200 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  selectedIds = [],
  onSelect,
  onRowClick,
  currentPage,
  totalPages,
  onPageChange,
  emptyMessage = 'No data found',
  emptyIcon,
  keyExtractor,
  loading = false,
}: DataTableProps<T>) {
  const getKey = (item: T) => keyExtractor ? keyExtractor(item) : (item._id as string || item.id as string || '');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelect?.(data.map((item) => getKey(item)));
    } else {
      onSelect?.([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelect?.([...selectedIds, id]);
    } else {
      onSelect?.(selectedIds.filter((i) => i !== id));
    }
  };

  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden" role="region" aria-label="Data table">
      <div className="overflow-x-auto">
        <table className="w-full" role="grid">
          <thead>
            <tr className="border-b border-border bg-gray-50/50">
              {onSelect && (
                <th className="w-12 px-4 py-3" scope="col">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-gold"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider',
                    col.className
                  )}
                  scope="col"
                  aria-sort={col.sortable ? 'none' : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="text-text-muted" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 2L9 5H3L6 2Z" fill="currentColor" opacity="0.4" />
                          <path d="M6 10L3 7H9L6 10Z" fill="currentColor" opacity="0.4" />
                        </svg>
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          {loading ? (
            <TableSkeleton columns={columns.length + (onSelect ? 1 : 0)} />
          ) : (
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (onSelect ? 1 : 0)}
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      {emptyIcon || (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center" aria-hidden="true">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                      <p className="text-sm text-text-muted">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item, index) => {
                  const id = getKey(item);
                  return (
                    <tr
                      key={id || index}
                      className={cn(
                        'table-row-hover transition-colors',
                        onRowClick && 'cursor-pointer',
                        selectedIds.includes(id) && 'bg-accent/5'
                      )}
                      onClick={() => onRowClick?.(item)}
                      tabIndex={onRowClick ? 0 : undefined}
                      onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(item); } : undefined}
                      role={onRowClick ? 'button' : undefined}
                    >
                      {onSelect && (
                        <td className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(id)}
                            onChange={(e) => handleSelectOne(id, e.target.checked)}
                            className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-gold"
                            aria-label={`Select row ${index + 1}`}
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn('px-4 py-3.5 text-sm', col.className)}
                        >
                          {col.render ? col.render(item) : (item[col.key] as React.ReactNode)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          )}
        </table>
      </div>
      {currentPage && totalPages && onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
