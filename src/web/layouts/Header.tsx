import React, { useState } from 'react';
import { Search, Bell, Menu, Sparkles } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { useRouter } from '../state/router';
import { cn } from '../lib/utils';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

/**
 * Global Header — Matches all 9 pages of the visual reference:
 * Spans full width (h-14, 56px) across top with dark slate chrome.
 * Left: Product branding ('Alexa+ BETA')
 * Center: Global Omnibox search ('Search your data, tools, or past conversations... ⌘K')
 * Right: Notification bell and user avatar 'SM'
 */
export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { navigate } = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/knowledge?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-14 w-full bg-brand-sidebar border-b border-slate-800/80 px-4 flex items-center justify-between z-30 select-none flex-shrink-0 text-white">
      {/* Left: Mobile Toggle + Product Identity */}
      <div className="flex items-center space-x-3 w-60 flex-shrink-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          className="p-1.5 rounded-lg lg:hidden hover:bg-slate-800 text-slate-300 focus:outline-none transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate('/home')}
          className="flex items-center space-x-2 text-left group focus:outline-none"
        >
          {/* Subtle agentic spark mark */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-base tracking-tight text-white group-hover:text-blue-400 transition-colors">
              Alexa<span className="text-blue-500 font-extrabold">+</span>
            </span>
            <Badge variant="beta">BETA</Badge>
          </div>
        </button>
      </div>

      {/* Center: Global Omnibox Search (⌘K) */}
      <div className="flex-1 max-w-xl mx-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            id="global-omnibox-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your data, tools, or past conversations..."
            className={cn(
              'w-full pl-10 pr-12 py-1.5 text-xs rounded-full border transition-smooth',
              'bg-slate-900/90 border-slate-700/80 text-slate-100 placeholder:text-slate-400',
              'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-950'
            )}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold rounded border tracking-wider bg-slate-800 text-slate-400 border-slate-700">
              ⌘K
            </kbd>
          </div>
        </form>
      </div>

      {/* Right: Notifications & User Avatar */}
      <div className="flex items-center space-x-3 flex-shrink-0">
        <button
          onClick={() => navigate('/activity')}
          aria-label="View activity notifications"
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-brand-sidebar animate-pulse" />
        </button>

        <button
          onClick={() => navigate('/settings')}
          aria-label="View user profile settings"
          className="focus:outline-none hover:ring-2 hover:ring-blue-500/60 rounded-full transition-all"
        >
          <Avatar initials="SM" size="sm" status="online" />
        </button>
      </div>
    </header>
  );
};
