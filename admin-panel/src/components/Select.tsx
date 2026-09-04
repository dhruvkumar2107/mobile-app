'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export default function Select({
  label,
  error,
  options,
  placeholder,
  className,
  id: propId,
  ...props
}: SelectProps) {
  const selectId = propId || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-navy mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-navy h-10',
          'focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold',
          'transition-all duration-200 appearance-none',
          'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2712%27%20height%3D%2712%27%20viewBox%3D%270%200%2012%2012%27%3E%3Cpath%20fill%3D%27%2364748B%27%20d%3D%27M6%208L1%203h10z%27%2F%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[right_0.75rem_center]',
          error && 'border-error focus:ring-error/20 focus:border-error',
          className
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="mt-1 text-xs text-error" role="alert">{error}</p>
      )}
    </div>
  );
}
