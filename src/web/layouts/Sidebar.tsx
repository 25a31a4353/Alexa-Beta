import React from 'react';
import {
  Home,
  SquarePen,
  Target,
  BookOpen,
  Wrench,
  Network,
  BarChart2,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from '../state/router';
import { cn } from '../lib/utils';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Global Navigation Items — maintaining strictly one New Conversation option
const NAV_ITEMS: NavItem[] = [
  { name: 'Home', path: '/home', icon: Home },
  { name: 'New Conversation', path: '/new', icon: SquarePen },
  { name: 'Missions', path: '/missions', icon: Target },
  { name: 'Knowledge', path: '/knowledge', icon: BookOpen },
  { name: 'Tools', path: '/tools', icon: Wrench },
  { name: 'Integrations', path: '/integrations', icon: Network },
  { name: 'Activity', path: '/activity', icon: BarChart2 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = false,
  onClose,
}) => {
  const { path, navigate } = useRouter();

  const handleNav = (itemPath: string) => {
    navigate(itemPath);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static top-14 bottom-0 left-0 z-40',
          'w-60 bg-[#090D16] border-r border-[#161F30]',
          'flex flex-col justify-between select-none h-[calc(100vh-3.5rem)] flex-shrink-0',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Navigation Items */}
        <div className="py-3 px-3 overflow-y-auto">
          <nav className="space-y-1" aria-label="Global Primary Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isHomeActive = item.name === 'Home' && (path === '/home' || path === '/');
              const isOtherActive = item.name !== 'Home' && path.startsWith(item.path);
              const isActive = isHomeActive || isOtherActive;

              return (
                <button
                  key={item.name}
                  onClick={() => handleNav(item.path)}
                  id={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={cn(
                    'w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group text-left',
                    isActive
                      ? 'bg-[#13233F] text-[#60A5FA] border border-[#1E3A8A]/60 shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121826]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 flex-shrink-0 transition-colors stroke-[1.8]',
                      isActive ? 'text-[#60A5FA]' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile Card */}
        <div className="p-3 border-t border-[#161F30]">
          <button
            onClick={() => handleNav('/settings')}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#121826] transition-smooth group focus:outline-none"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-[#2B6CB0] text-white font-semibold text-xs flex items-center justify-center flex-shrink-0">
                SM
              </div>
              <div className="text-left truncate">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                  Shanmukheswar
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate">
                  Pro Builder
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 flex-shrink-0 ml-1" />
          </button>
        </div>
      </aside>
    </>
  );
};
