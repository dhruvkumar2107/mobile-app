'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('border-b border-border', className)} role="tablist" aria-label="Filter tabs">
      <div className="flex gap-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200',
              activeTab === tab.id
                ? 'border-gold text-navy'
                : 'border-transparent text-text-secondary hover:text-navy hover:border-gray-300'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'ml-1.5 px-1.5 py-0.5 text-xs rounded-full',
                activeTab === tab.id ? 'bg-gold/10 text-gold-dark' : 'bg-gray-100 text-text-muted'
              )} aria-label={`${tab.count} items`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return start + i;
  }).filter((p) => p <= totalPages);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-border" role="navigation" aria-label="Pagination">
      <p className="text-sm text-text-secondary">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 text-text-secondary hover:text-navy hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Go to previous page"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'min-w-[32px] h-8 text-sm font-medium rounded-lg transition-colors',
              page === currentPage
                ? 'bg-navy text-white'
                : 'text-text-secondary hover:bg-gray-100'
            )}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 text-text-secondary hover:text-navy hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Go to next page"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
