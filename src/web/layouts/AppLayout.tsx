import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useRouter } from '../state/router';
import { cn } from '../lib/utils';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { path } = useRouter();

  // Screen 1 (Home) uses deep midnight slate hero.
  // Screens 2 through 9 use crisp light slate productivity workspace as explicitly specified.
  const isDarkHome = path === '/home' || path === '/';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-brand-dark">
      {/* 1. Global Full-Width Header */}
      <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      {/* 2. Workspace Shell: Immutable Sidebar + Dynamic Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden transition-colors',
            isDarkHome ? 'bg-atmospheric-hero text-slate-100' : 'bg-light-bg text-slate-900'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
