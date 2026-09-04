'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Search, ShoppingCart, Users, Package, Tag, Settings, BarChart3, Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems: CommandItem[] = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: <BarChart3 size={16} />, category: 'Navigation', action: () => { window.location.href = '/dashboard'; onClose(); } },
    { id: 'orders', label: 'Go to Orders', icon: <ShoppingCart size={16} />, category: 'Navigation', action: () => { window.location.href = '/orders'; onClose(); } },
    { id: 'products', label: 'Go to Products', icon: <Package size={16} />, category: 'Navigation', action: () => { window.location.href = '/products'; onClose(); } },
    { id: 'customers', label: 'Go to Customers', icon: <Users size={16} />, category: 'Navigation', action: () => { window.location.href = '/customers'; onClose(); } },
    { id: 'coupons', label: 'Go to Coupons', icon: <Tag size={16} />, category: 'Navigation', action: () => { window.location.href = '/coupons'; onClose(); } },
    { id: 'settings', label: 'Go to Settings', icon: <Settings size={16} />, category: 'Navigation', action: () => { window.location.href = '/settings'; onClose(); } },
    { id: 'notifications', label: 'Go to Notifications', icon: <Bell size={16} />, category: 'Navigation', action: () => { window.location.href = '/notifications'; onClose(); } },
  ];

  const filtered = allItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          document.dispatchEvent(new CustomEvent('open-command-palette'));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [filtered, selectedIndex, onClose]
  );

  useEffect(() => {
    const selected = listRef.current?.children[selectedIndex] as HTMLElement;
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] animate-overlay-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" aria-hidden="true" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={18} className="text-text-muted shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 text-sm text-navy placeholder:text-text-muted focus:outline-none"
            role="combobox"
            aria-expanded={true}
            aria-controls="command-list"
            aria-activedescendant={filtered[selectedIndex] ? `command-item-${filtered[selectedIndex].id}` : undefined}
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium text-text-muted bg-gray-100 rounded" aria-hidden="true">
            ESC
          </kbd>
        </div>
        <div ref={listRef} id="command-list" className="max-h-64 overflow-y-auto p-2" role="listbox" aria-label="Search results">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-text-muted">No results found</p>
          ) : (
            filtered.map((item, index) => (
              <button
                key={item.id}
                id={`command-item-${item.id}`}
                onClick={item.action}
                role="option"
                aria-selected={index === selectedIndex}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2 text-sm text-navy rounded-lg transition-colors',
                  index === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                )}
              >
                <span className="text-text-muted" aria-hidden="true">{item.icon}</span>
                {item.label}
                <span className="ml-auto text-xs text-text-muted">{item.category}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
