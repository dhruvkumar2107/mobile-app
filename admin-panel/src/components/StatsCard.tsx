'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
  gold?: boolean;
}

function formatIndianNumber(num: string): string {
  const cleaned = num.replace(/[^0-9.]/g, '');
  if (!cleaned || isNaN(Number(cleaned))) return num;

  const parts = cleaned.split('.');
  const intPart = parts[0];
  const decPart = parts.length > 1 ? '.' + parts[1] : '';

  if (intPart.length <= 3) return num;

  let result = intPart.slice(-3);
  let remaining = intPart.slice(0, -3);

  while (remaining.length > 2) {
    result = remaining.slice(-2) + ',' + result;
    remaining = remaining.slice(0, -2);
  }
  if (remaining.length > 0) {
    result = remaining + ',' + result;
  }

  return result + decPart;
}

export default function StatsCard({
  title,
  value,
  change,
  icon,
  subtitle,
  className,
  gold = false,
}: StatsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setDisplayValue(value);
    }
  }, [value]);

  const formattedValue = displayValue.includes('₹')
    ? '₹' + formatIndianNumber(displayValue.replace('₹', ''))
    : displayValue.includes('%')
      ? displayValue
      : formatIndianNumber(displayValue);

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-border p-5 transition-all duration-200 hover:shadow-md hover:border-gray-300 group tooltip-wrapper',
        gold && 'border-gold/20 bg-gradient-to-br from-white to-amber-50/30',
        className
      )}
      role="article"
      aria-label={`${title}: ${formattedValue}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</p>
          <p className={cn(
            'mt-2 text-2xl font-bold tracking-tight transition-colors',
            gold ? 'text-gold-dark' : 'text-navy'
          )}>
            {formattedValue}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center mt-2 gap-1" aria-label={`${isPositive ? 'Increased' : isNegative ? 'Decreased' : 'No change'} by ${Math.abs(change)}%`}>
              {isPositive ? (
                <TrendingUp size={14} className="text-success" aria-hidden="true" />
              ) : isNegative ? (
                <TrendingDown size={14} className="text-error" aria-hidden="true" />
              ) : null}
              <span className={cn(
                'text-xs font-semibold',
                isPositive && 'text-success',
                isNegative && 'text-error',
                !isPositive && !isNegative && 'text-text-muted'
              )}>
                {isPositive ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-text-muted">vs last period</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            'p-2.5 rounded-lg transition-all duration-200',
            gold
              ? 'bg-gold/10 text-gold group-hover:bg-gold/20'
              : 'bg-gray-100 text-text-secondary group-hover:bg-navy group-hover:text-white'
          )} aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
