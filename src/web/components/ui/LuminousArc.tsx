import React from 'react';
import { AmazonSmileArrow } from './AmazonBranding';
import { cn } from '../../lib/utils';

interface LuminousArcProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'subtle';
}

/**
 * LuminousArc — Displays the authentic Amazon Smile symbol across all pages.
 */
export const LuminousArc: React.FC<LuminousArcProps> = ({
  className,
  size = 'md',
}) => {
  const width = {
    sm: 120,
    md: 155,
    lg: 180,
  }[size];

  return (
    <div
      className={cn(
        'relative flex items-center justify-center select-none pointer-events-none',
        className
      )}
      aria-hidden="true"
    >
      <AmazonSmileArrow width={width} />
    </div>
  );
};
