import React from 'react';
import { cn } from '../../lib/utils';

/**
 * AmazonLogo — Exact Amazon logo with white wordmark and orange smile arrow.
 * Uses extracted transparent high-res asset directly from user reference.
 */
export const AmazonLogo: React.FC<{ className?: string; height?: number }> = ({
  className,
  height = 24,
}) => {
  return (
    <div className={cn('flex items-center select-none', className)}>
      <img
        src="/brand/amazon-logo-white.png"
        alt="Amazon"
        style={{ height: `${height}px` }}
        className="w-auto object-contain block drop-shadow-xs"
        onError={(e) => {
          // Fallback if image path not available
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};

/**
 * AmazonSmileArrow — The exact standalone Amazon smile arrow from user reference.
 * Uses extracted transparent high-res asset with warm golden-amber backlight glow.
 */
export const AmazonSmileArrow: React.FC<{ className?: string; width?: number }> = ({
  className,
  width = 175,
}) => {
  return (
    <div className={cn('relative flex items-center justify-center select-none', className)}>
      {/* Soft warm amber glow backlight */}
      <div
        className="absolute w-[220px] h-[60px] bg-[#FF9900]/30 blur-2xl rounded-full scale-125 pointer-events-none"
        style={{ top: '10%' }}
      />

      <img
        src="/brand/amazon-smile-exact.png"
        alt="Amazon Smile"
        style={{ width: `${width}px` }}
        className="w-auto object-contain block relative z-10 drop-shadow-[0_0_12px_rgba(255,153,0,0.65)]"
      />
    </div>
  );
};

/**
 * PlanetaryHorizon — The cinematic planetary/orbital horizon from the reference image.
 * Features an orbital curve spanning across the canvas, atmospheric blue limb glow,
 * and a warm golden sunburst at the center horizon.
 */
export const PlanetaryHorizon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'absolute inset-x-0 pointer-events-none select-none overflow-hidden',
        className
      )}
      style={{ height: '340px', bottom: '135px' }}
      aria-hidden="true"
    >
      {/* Central dawn/sunburst illumination right under the smile arrow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[520px] h-[170px] rounded-full blur-[48px] pointer-events-none"
        style={{
          bottom: '75px',
          background: 'radial-gradient(ellipse at center, rgba(255, 170, 40, 0.5) 0%, rgba(255, 140, 0, 0.25) 40%, rgba(56, 189, 248, 0.15) 70%, transparent 100%)',
        }}
      />

      {/* Atmospheric blue limb illumination */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[960px] h-[190px] rounded-full blur-[65px] pointer-events-none"
        style={{
          bottom: '60px',
          background: 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.28) 0%, rgba(37, 99, 235, 0.16) 50%, transparent 80%)',
        }}
      />

      {/* SVG Planetary Horizon Arc */}
      <svg
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible absolute inset-0"
      >
        <defs>
          {/* Horizon limb stroke gradient */}
          <linearGradient id="horizonLimbGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.1" />
            <stop offset="25%" stopColor="#38BDF8" stopOpacity="0.45" />
            <stop offset="46%" stopColor="#60A5FA" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.98" />
            <stop offset="54%" stopColor="#60A5FA" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#38BDF8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.1" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="horizonGlow" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient atmospheric glow line */}
        <path
          d="M -100,210 Q 720,60 1540,210"
          stroke="url(#horizonLimbGrad)"
          strokeWidth="9"
          fill="none"
          opacity="0.8"
          filter="url(#horizonGlow)"
        />

        {/* Crisp luminous horizon line */}
        <path
          d="M -100,210 Q 720,60 1540,210"
          stroke="url(#horizonLimbGrad)"
          strokeWidth="2.5"
          fill="none"
        />

        {/* Dark planetary body gradient fill below the arc */}
        <path
          d="M -100,210 Q 720,60 1540,210 L 1540,300 L -100,300 Z"
          fill="url(#planetBodyGrad)"
          opacity="0.95"
        />

        <linearGradient id="planetBodyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#0B132B" stopOpacity="0.75" />
          <stop offset="30%" stopColor="#070C1A" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#070B14" stopOpacity="1" />
        </linearGradient>
      </svg>
    </div>
  );
};
