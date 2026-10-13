import React from 'react';
import { cn } from '../../lib/utils';

interface LuminousArcProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'subtle';
}

/**
 * LuminousArc — Signature visual element from the design specification.
 * A luminous blue-to-amber curved arc with soft atmospheric glow.
 * Present on Home (p.1), New Conversation (p.2), Tools (p.6), and Integrations (p.7).
 */
export const LuminousArc: React.FC<LuminousArcProps> = ({
  className,
  size = 'md',
  variant = 'full',
}) => {
  const dimensions = {
    sm: 'w-48 h-8',
    md: 'w-72 sm:w-80 h-10 sm:h-12',
    lg: 'w-96 sm:w-[480px] h-14 sm:h-16',
  }[size];

  return (
    <div
      className={cn(
        'relative flex items-center justify-center select-none pointer-events-none',
        dimensions,
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 320 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          {/* Linear gradient flowing from radiant blue/cyan to warm amber/orange */}
          <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#06B6D4" stopOpacity="0.75" />
            <stop offset="65%" stopColor="#F59E0B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.95" />
          </linearGradient>

          {/* Glow filter for atmospheric luminance */}
          <filter id="arcGlow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient background glow line */}
        {variant === 'full' && (
          <path
            d="M 20,16 Q 160,52 300,16"
            stroke="url(#arcGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.35"
            filter="url(#arcGlow)"
          />
        )}

        {/* Crisp foreground luminous smile arc */}
        <path
          d="M 20,16 Q 160,52 300,16"
          stroke="url(#arcGradient)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Dynamic amber leading arrowhead on the right tip */}
        <polygon
          points="298,8 308,18 296,24 300,17"
          fill="#D97706"
          className="drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
        />
      </svg>
    </div>
  );
};
