import React, { useState } from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { AmazonLogo } from '../components/ui/AmazonBranding';
import { useRouter } from '../state/router';
import { cn } from '../lib/utils';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

/**
 * Global Header — Pin-to-pin match with reference design:
 * Left: Official Amazon wordmark + smile arrow in white/gold, 'Alexa+', and solid blue 'BETA' pill badge.
 * Center: Global Omnibox search ('Search your data, tools, or past conversations... ⌘ K')
 * Right: Notification bell and user avatar 'SM' in solid blue.
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
    <header className="h-14 w-full bg-[#090D16] border-b border-[#161F30] px-4 sm:px-6 flex items-center justify-between z-30 select-none flex-shrink-0 text-white">
      {/* Left: Mobile Toggle + Exact Amazon Alexa+ BETA Identity */}
      <div className="flex items-center space-x-3 w-64 flex-shrink-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          className="p-1.5 rounded-lg lg:hidden hover:bg-slate-800 text-slate-300 focus:outline-none transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate('/home')}
          className="flex items-center space-x-2.5 text-left group focus:outline-none"
        >
          {/* Authentic Amazon logo with golden smile */}
          <AmazonLogo height={23} />

          {/* Alexa+ product name */}
          <span className="font-bold text-lg tracking-tight text-white group-hover:text-blue-300 transition-colors">
            Alexa<span className="font-bold text-white">+</span>
          </span>

          {/* Solid blue BETA pill badge */}
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide bg-[#1D63ED] text-white">
            BETA
          </span>
        </button>
      </div>

      {/* Center: Global Omnibox Search (⌘K) */}
      <div className="flex-1 max-w-xl mx-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            id="global-omnibox-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your data, tools, or past conversations..."
            className={cn(
              'w-full pl-10 pr-12 py-1.5 text-xs rounded-full border transition-all duration-150',
              'bg-[#101726]/80 border-[#1E293B] text-slate-200 placeholder:text-slate-400',
              'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-[#0E1524]'
            )}
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
            <span className="text-[11px] font-medium tracking-wider text-slate-400 flex items-center space-x-1">
              <span>⌘</span>
              <span>K</span>
            </span>
          </div>
        </form>
      </div>

      {/* Right: Notification Bell & User Avatar SM */}
      <div className="flex items-center space-x-4 flex-shrink-0">
        <button
          onClick={() => navigate('/activity')}
          aria-label="View activity notifications"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none"
        >
          <Bell className="w-4 h-4 stroke-[1.75]" />
        </button>

        <button
          onClick={() => navigate('/settings')}
          aria-label="View user profile settings"
          className="focus:outline-none hover:ring-2 hover:ring-blue-500/60 rounded-full transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-[#2B6CB0] text-white font-semibold text-xs flex items-center justify-center shadow-xs">
            SM
          </div>
        </button>
      </div>
    </header>
  );
};
