'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gold';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-success-bg text-success border border-success/20',
    warning: 'bg-warning-bg text-warning border border-warning/20',
    error: 'bg-error-bg text-error border border-error/20',
    info: 'bg-info-bg text-info border border-info/20',
    gold: 'bg-amber-50 text-gold-dark border border-gold/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const dotColors = {
    default: 'bg-gray-500',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
    gold: 'bg-gold',
  };

  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full',
      variants[variant],
      sizes[size]
    )} role="status">
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', dotColors[variant], dot && variant === 'success' && 'animate-badge-pulse')} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
