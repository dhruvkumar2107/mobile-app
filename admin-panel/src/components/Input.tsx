'use client';

import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

export default function Input({
  label,
  error,
  icon,
  className,
  required,
  id: propId,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = propId || (label ? `input-${generatedId}` : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-navy mb-1.5">
          {label}
          {required && <span className="text-error ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-navy placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold',
            'transition-all duration-200',
            'h-10',
            icon && 'pl-10',
            error && 'border-error focus:ring-error/20 focus:border-error',
            className
          )}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-error" role="alert">{error}</p>
      )}
    </div>
  );
}
