'use client';

import React, { useId } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onEnter?: () => void;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  onEnter,
}: SearchInputProps) {
  const inputId = useId();

  return (
    <div className={cn('relative', className)}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-white text-navy placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all duration-200 h-10"
        aria-label={placeholder}
      />
    </div>
  );
}
