'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bell, Moon, Sun, Command, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onCommandPaletteOpen: () => void;
}

export default function Header({ onCommandPaletteOpen }: HeaderProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationCount] = useState(3);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldDark = saved !== null ? saved === 'true' : prefersDark;

    setDarkMode(shouldDark);
    document.documentElement.classList.toggle('dark', shouldDark);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('darkMode', String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onCommandPaletteOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCommandPaletteOpen]);

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 shrink-0 sticky top-0 z-30" role="banner">
      {/* Search */}
      <button
        onClick={onCommandPaletteOpen}
        className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-muted bg-gray-50 border border-border rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all w-72 focus-visible:ring-2 focus-visible:ring-gold"
        aria-label="Open search (Ctrl+K)"
      >
        <Search size={15} className="shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">Search anything...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-text-muted bg-white border border-border rounded" aria-hidden="true">
          <Command size={10} /> K
        </kbd>
      </button>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Dark mode */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-text-secondary hover:text-navy hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 text-text-secondary hover:text-navy hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
        >
          <Bell size={18} aria-hidden="true" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-badge-pulse" aria-hidden="true">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" role="separator" aria-hidden="true" />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProfile(!showProfile);
            }}
            className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-expanded={showProfile}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              <span className="text-xs font-bold text-navy">AD</span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-navy leading-none">Admin</p>
              <p className="text-[11px] text-text-muted mt-0.5">Super Admin</p>
            </div>
            <ChevronDown size={14} className={cn('text-text-muted hidden sm:block transition-transform', showProfile && 'rotate-180')} aria-hidden="true" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-border rounded-xl shadow-xl py-1.5 animate-fade-in z-50" role="menu" aria-label="User menu">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-sm font-medium text-navy">Admin User</p>
                <p className="text-xs text-text-muted">admin@luxe.com</p>
              </div>
              <button role="menuitem" className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-text-secondary hover:bg-gray-50 transition-colors">
                <User size={15} aria-hidden="true" />
                Profile
              </button>
              <button role="menuitem" className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-text-secondary hover:bg-gray-50 transition-colors">
                <Settings size={15} aria-hidden="true" />
                Settings
              </button>
              <div className="border-t border-border mt-1 pt-1">
                <button
                  role="menuitem"
                  onClick={() => {
                    localStorage.removeItem('admin_token');
                    window.location.href = '/login';
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-error hover:bg-error-bg transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut size={15} aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
