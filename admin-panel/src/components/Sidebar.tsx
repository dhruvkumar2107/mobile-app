'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Warehouse,
  Tag,
  Star,
  BarChart3,
  Megaphone,
  RotateCcw,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Crown,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/coupons', label: 'Coupons', icon: Tag },
  { href: '/reviews', label: 'Reviews', icon: Star },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/returns', label: 'Returns', icon: RotateCcw },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const navRef = useRef<HTMLElement>(null);

  const activeIndex = navItems.findIndex(
    (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = navRef.current?.querySelectorAll<HTMLAnchorElement>('a[role="menuitem"], a[data-nav]');
      if (!items || items.length === 0) return;

      let newIndex = focusedIndex;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        newIndex = Math.min(focusedIndex + 1, items.length - 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        newIndex = Math.max(focusedIndex - 1, 0);
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = items.length - 1;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < navItems.length) {
          window.location.href = navItems[focusedIndex].href;
        }
        return;
      }

      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
        items[newIndex]?.focus();
      }
    },
    [focusedIndex]
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-sidebar z-40 transition-all duration-300 flex flex-col',
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-white/10 shrink-0',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="LUXE Admin Home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              <Crown size={18} className="text-navy" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wider">LUXE</h1>
              <p className="text-[10px] text-gold/60 tracking-[0.2em] -mt-0.5">ADMIN PANEL</p>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center" aria-label="LUXE Admin Home">
            <Crown size={18} className="text-navy" />
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        ref={navRef}
        className="flex-1 overflow-y-auto py-3 px-2"
        role="menubar"
        aria-label="Main menu"
        onKeyDown={handleKeyDown}
      >
        <div className="space-y-0.5">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <div key={item.href} className="tooltip-wrapper">
                <Link
                  href={item.href}
                  data-nav
                  role="menuitem"
                  tabIndex={focusedIndex === index ? 0 : -1}
                  aria-current={isActive ? 'page' : undefined}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onFocus={() => setFocusedIndex(index)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-gold/10 text-gold shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gold rounded-r-full" />
                  )}
                  <Icon size={18} className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-gold' : 'text-white/40 group-hover:text-white/70'
                  )} aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
                {collapsed && (
                  <span className="tooltip-text" role="tooltip">
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Collapse toggle for collapsed state */}
      {collapsed && (
        <div className="px-2 pb-3">
          <div className="tooltip-wrapper">
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>
            <span className="tooltip-text" role="tooltip">Expand</span>
          </div>
        </div>
      )}

      {/* Bottom section */}
      {!collapsed && (
        <div className="p-3 border-t border-white/10 shrink-0">
          <button
            onClick={() => {
              localStorage.removeItem('admin_token');
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Sign out of admin panel"
          >
            <LogOut size={18} aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
