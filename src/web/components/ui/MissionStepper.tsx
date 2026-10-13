import React from 'react';
import { Check, Compass, Wrench, ShieldCheck, BarChart3, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export type MissionPhase = 'understand' | 'plan' | 'use_tools' | 'verify' | 'results';
export type PhaseStatus = 'completed' | 'in_progress' | 'pending';

interface PhaseStep {
  id: MissionPhase;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PHASES: PhaseStep[] = [
  { id: 'understand', label: 'Understand', icon: Compass },
  { id: 'plan', label: 'Plan', icon: Compass },
  { id: 'use_tools', label: 'Use Tools', icon: Wrench },
  { id: 'verify', label: 'Verify', icon: ShieldCheck },
  { id: 'results', label: 'Results', icon: BarChart3 },
];

interface MissionStepperProps {
  currentPhase: MissionPhase;
  phaseStatuses?: Partial<Record<MissionPhase, PhaseStatus>>;
  className?: string;
}

/**
 * MissionStepper — Reusable 5-step lifecycle pipeline from Page 4:
 * Understand -> Plan -> Use Tools -> Verify -> Results
 */
export const MissionStepper: React.FC<MissionStepperProps> = ({
  currentPhase,
  phaseStatuses = {},
  className,
}) => {
  const currentIdx = PHASES.findIndex((p) => p.id === currentPhase);

  return (
    <div className={cn('w-full py-3 select-none', className)}>
      <div className="flex items-center justify-between relative max-w-2xl mx-auto">
        {PHASES.map((phase, idx) => {
          const explicitStatus = phaseStatuses[phase.id];
          const isCompleted =
            explicitStatus === 'completed' || (explicitStatus === undefined && idx < currentIdx);
          const isCurrent =
            explicitStatus === 'in_progress' || (explicitStatus === undefined && idx === currentIdx);
          const isPending =
            explicitStatus === 'pending' || (explicitStatus === undefined && idx > currentIdx);

          const Icon = phase.icon;

          return (
            <React.Fragment key={phase.id}>
              {/* Connector line between steps */}
              {idx > 0 && (
                <div
                  className={cn(
                    'flex-1 h-[2px] mx-2 sm:mx-3 transition-colors',
                    idx <= currentIdx ? 'bg-emerald-500' : 'bg-slate-200'
                  )}
                />
              )}

              {/* Step indicator node */}
              <div className="flex flex-col items-center group">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    isCompleted && 'bg-emerald-500 text-white shadow-xs',
                    isCurrent && 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm animate-pulse',
                    isPending && 'bg-white border border-slate-300 text-slate-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <Icon className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-xs font-semibold tracking-tight transition-colors',
                    isCompleted && 'text-emerald-700',
                    isCurrent && 'text-blue-600 font-bold',
                    isPending && 'text-slate-400'
                  )}
                >
                  {phase.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
