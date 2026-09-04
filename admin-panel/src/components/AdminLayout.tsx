'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CommandPalette from '@/components/CommandPalette';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[68px]' : 'ml-[260px]'}`}>
        <Header onCommandPaletteOpen={() => setCommandPaletteOpen(true)} />
        <main id="main-content" className="p-6" tabIndex={-1}>
          {children}
        </main>
      </div>
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
