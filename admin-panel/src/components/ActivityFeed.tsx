'use client';

import React from 'react';
import { timeAgo } from '@/lib/utils';
import { ShoppingCart, UserPlus, Package, Star, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityItem } from '@/types';

const iconMap = {
  order: <ShoppingCart size={14} />,
  customer: <UserPlus size={14} />,
  product: <Package size={14} />,
  review: <Star size={14} />,
  system: <Settings size={14} />,
};

const colorMap = {
  order: 'bg-info-bg text-info',
  customer: 'bg-success-bg text-success',
  product: 'bg-warning-bg text-warning',
  review: 'bg-amber-50 text-gold-dark',
  system: 'bg-gray-100 text-text-secondary',
};

const linkMap: Record<string, string> = {
  order: '/orders',
  customer: '/customers',
  product: '/products',
  review: '/reviews',
  system: '/settings',
};

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-0" role="feed" aria-label="Activity feed">
      {activities.map((activity, index) => (
        <a
          key={activity.id || index}
          href={linkMap[activity.type] || '#'}
          className="flex items-start gap-3 py-3 border-b border-border last:border-0 animate-fade-in hover:bg-gray-50/50 transition-colors -mx-2 px-2 rounded-lg"
          style={{ animationDelay: `${index * 50}ms` }}
          aria-label={`${activity.message} - ${timeAgo(activity.time)}`}
        >
          <div className={cn('p-1.5 rounded-lg shrink-0', colorMap[activity.type])} aria-hidden="true">
            {iconMap[activity.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-navy leading-relaxed">{activity.message}</p>
            <p className="text-xs text-text-muted mt-0.5">
              <time dateTime={activity.time}>{timeAgo(activity.time)}</time>
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}
