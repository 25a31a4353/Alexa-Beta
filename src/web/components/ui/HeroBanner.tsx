import React from 'react';
import { ArrowRight } from 'lucide-react';
import { LuminousArc } from './LuminousArc';
import { cn } from '../../lib/utils';

interface HeroBannerProps {
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
  children?: React.ReactNode;
  className?: string;
}

/**
 * HeroBanner — Reusable dark hero banner for Tools (p.6) and Integrations (p.7).
 * Features atmospheric navy gradient, luminous smile curve, and typography hierarchy.
 */
export const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  subtitle,
  actionText,
  onAction,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-atmospheric-banner border border-slate-800/80 p-6 sm:p-8 text-white',
        'shadow-xl transition-all',
        className
      )}
    >
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Column: Heading, Subtitle, Action */}
        <div className="max-w-xl space-y-2.5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            {subtitle}
          </p>

          {actionText && (
            <div className="pt-2">
              <button
                onClick={onAction}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-white hover:text-blue-300 transition-colors focus:outline-none group"
              >
                <span>{actionText}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Luminous visual curve & floating elements */}
        <div className="relative flex items-center justify-center md:justify-end flex-shrink-0 min-w-[200px]">
          <div className="relative">
            <LuminousArc size="md" variant="full" />
            {children && (
              <div className="absolute inset-0 flex items-center justify-center">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
