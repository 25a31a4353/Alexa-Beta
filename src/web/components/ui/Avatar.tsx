import React from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'busy' | 'offline';
}

export const Avatar: React.FC<AvatarProps> = ({
  className,
  initials = 'SM',
  size = 'md',
  status,
  ...props
}) => {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs font-semibold',
    lg: 'w-10 h-10 text-sm font-semibold',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    busy: 'bg-amber-500',
    offline: 'bg-slate-400',
  };

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center tracking-wider shadow-sm select-none',
          sizes[size],
          className
        )}
        {...props}
      >
        {initials}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-slate-900',
            size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
            statusColors[status]
          )}
        />
      )}
    </div>
  );
};
