import React from 'react';
import {
  Home,
  SquarePen,
  Compass,
  BookOpen,
  Wrench,
  Boxes,
  BarChart2,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from '../state/router';
import { Avatar } from '../components/ui/Avatar';
import { cn } from '../lib/utils';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

// IMMUTABLE 8 SIDEBAR NAVIGATION ITEMS (STRICT VISUAL & ARCHITECTURAL CONTRACT)
const NAV_ITEMS: NavItem[] = [
  { name: 'Home', path: '/home', icon: Home },
  { name: 'New Conversation', path: '/new', icon: SquarePen },
  { name: 'Missions', path: '/missions', icon: Compass },
  { name: 'Knowledge', path: '/knowledge', icon: BookOpen },
  { name: 'Tools', path: '/tools', icon: Wrench },
  { name: 'Integrations', path: '/integrations', icon: Boxes },
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
          'w-60 bg-brand-sidebar border-r border-slate-800/80',
          'flex flex-col justify-between select-none h-[calc(100vh-3.5rem)] flex-shrink-0',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Navigation Items (Strictly 8 Items) */}
        <div className="py-3 px-2.5 overflow-y-auto">
          <nav className="space-y-1" aria-label="Global Primary Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                path === item.path ||
                (item.path === '/home' && path === '/') ||
                (item.path === '/missions' && path.startsWith('/missions'));

              return (
                <button
                  key={item.name}
                  onClick={() => handleNav(item.path)}
                  id={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={cn(
                    'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-smooth group',
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/25 shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 flex-shrink-0 transition-colors',
                      isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile Card */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={() => handleNav('/settings')}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 transition-smooth group focus:outline-none"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <Avatar initials="SM" size="sm" status="online" />
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
