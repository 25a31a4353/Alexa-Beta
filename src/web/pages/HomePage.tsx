import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Database,
  Network,
  Sparkles,
  ArrowUp,
  Mic,
  Plus,
  Globe,
  ChevronDown,
  ArrowRight,
  BarChart2,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { AmazonSmileArrow, PlanetaryHorizon } from '../components/ui/AmazonBranding';
import { createMission } from '../api/client';
import { useRouter } from '../state/router';
import { cn } from '../lib/utils';

interface UseCaseCard {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  prompt: string;
}

const CAPABILITY_PILLS = [
  { id: 'docs', label: 'Analyze documents', icon: FileText, samplePrompt: 'Analyze available roadmap and strategic documents, identify key milestones, risks, and extract clear action items.' },
  { id: 'plan', label: 'Plan and organize', icon: Calendar, samplePrompt: 'Prepare an executive briefing and schedule checklist for tomorrow morning meeting.' },
  { id: 'data', label: 'Work with your data', icon: Database, samplePrompt: 'Review our product metrics and trends to find anomalies, bottlenecks, and performance gains.' },
  { id: 'tools', label: 'Use multiple tools', icon: Network, samplePrompt: 'Coordinate across calendar events and documentation tools to summarize attendee preparations.' },
  { id: 'action', label: 'Take actions for you', icon: Sparkles, samplePrompt: 'Identify preparation gaps for upcoming stakeholder sync and create prioritized checklist items.' },
];

const POPULAR_USE_CASES: UseCaseCard[] = [
  {
    id: 'meeting-prep',
    icon: Calendar,
    iconColor: 'text-[#60A5FA]',
    iconBg: 'bg-[#1E3A8A]/40 border-[#2563EB]/50',
    title: 'Prepare me for my meeting tomorrow',
    description: 'Check my calendar, analyze documents, and create a preparation plan.',
    prompt: 'Check my calendar for tomorrow, understand what the meeting is about, find relevant documents, determine what I haven\'t prepared, prepare a checklist, and remind me what I need to do.',
  },
  {
    id: 'doc-analysis',
    icon: FileText,
    iconColor: 'text-[#34D399]',
    iconBg: 'bg-[#064E3B]/40 border-[#059669]/50',
    title: 'Analyze these documents',
    description: 'Summarize key information, find insights, and create an action plan.',
    prompt: 'Analyze available project specifications and documentation. Summarize key information, extract critical technical insights, identify unknown dependencies, and formulate a step-by-step action plan.',
  },
  {
    id: 'data-review',
    icon: BarChart2,
    iconColor: 'text-[#A78BFA]',
    iconBg: 'bg-[#4C1D95]/40 border-[#7C3AED]/50',
    title: 'Review this data',
    description: 'Find key trends, risks and opportunities, and generate a report.',
    prompt: 'Review system activity and operational data metrics. Identify key trend patterns, surface failure risks, highlight optimization opportunities, and produce an executive-ready operational report.',
  },
  {
    id: 'action-plan',
    icon: CheckCircle,
    iconColor: 'text-[#FBBF24]',
    iconBg: 'bg-[#78350F]/40 border-[#D97706]/50',
    title: 'Create an action plan',
    description: 'Break down my goal into tasks, set priorities, and track progress.',
    prompt: 'Break down my high-level project release goal into structured phases. Assign priority levels to each milestone, identify verification gates, and generate an actionable progress checklist.',
  },
];

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [researchMode, setResearchMode] = useState<'deep' | 'standard'>('deep');
  const [webEnabled, setWebEnabled] = useState(true);

  // Submit mission to real Application API
  const handleLaunchMission = async (goalText?: string) => {
    const textToSubmit = (goalText || prompt).trim();
    if (!textToSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // POST /api/missions with real goal
      const res = await createMission({
        goal: textToSubmit,
        title: textToSubmit.length > 40 ? `${textToSubmit.substring(0, 40)}...` : textToSubmit,
        sync: false,
      });

      if (res && res.mission && res.mission.id) {
        // Successfully created persistent mission in SQLite -> Navigate to live workspace
        navigate(`/missions/${res.mission.id}`);
      } else {
        throw new Error('Mission created but missing valid ID.');
      }
    } catch (err: any) {
      console.error('[HomePage] Mission launch error:', err);
      setErrorMessage(
        err?.message || 'Failed to initialize mission. Please verify Application API :3000 is online.'
      );
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleLaunchMission();
    }
  };

  const handlePillClick = (samplePrompt: string) => {
    setPrompt(samplePrompt);
  };

  const handleCardClick = (card: UseCaseCard) => {
    setPrompt(card.prompt);
  };

  return (
    <div className="relative min-h-full flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto select-none overflow-hidden">
      {/* Cinematic Planetary Horizon Atmosphere */}
      <PlanetaryHorizon />

      {/* 1. HERO TOP SECTION */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto pt-2 sm:pt-4">
        {/* Amazon Alexa+ Product Track Sub-badge */}
        <div className="text-[11px] font-semibold tracking-[0.25em] text-slate-400 uppercase mb-3">
          Amazon Alexa+
        </div>

        {/* Large Multi-line Hero Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-white leading-[1.18]">
          Turn complex goals into{' '}
          <span className="text-[#38BDF8] font-extrabold">real outcomes with Alexa+</span>
        </h1>

        {/* Supporting Explanation */}
        <p className="mt-3 text-xs sm:text-sm text-slate-300 font-normal max-w-2xl leading-relaxed">
          I can understand your objective, plan the work, use multiple tools,
          <br className="hidden sm:inline" /> take actions, and keep you updated.
        </p>

        {/* Capability Pills Row */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-3xl">
          {CAPABILITY_PILLS.map((pill) => {
            const Icon = pill.icon;
            return (
              <button
                key={pill.id}
                onClick={() => handlePillClick(pill.samplePrompt)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-normal transition-all duration-150',
                  'bg-[#101726]/75 border border-[#233354] text-slate-200 backdrop-blur-md',
                  'hover:bg-[#18233C] hover:text-white hover:border-slate-500',
                  'flex items-center space-x-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm'
                )}
                title="Click to load prompt template"
              >
                <Icon className="w-3.5 h-3.5 text-slate-300" />
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>

        {/* The Iconic Glowing Amazon Smile Arrow hovering above horizon dawn */}
        <div className="mt-4 mb-1 flex items-center justify-center w-full">
          <AmazonSmileArrow width={175} />
        </div>
      </div>

      {/* 2. MAIN NATURAL-LANGUAGE PROMPT COMPOSER */}
      <div className="relative z-10 w-full max-w-3xl mx-auto mt-1">
        <div
          className={cn(
            'bg-white rounded-[22px] p-4 sm:p-5 shadow-2xl transition-all duration-200 border border-white/20',
            isSubmitting && 'opacity-85 pointer-events-none'
          )}
        >
          {/* Multiline prompt textarea */}
          <textarea
            id="home-mission-prompt-input"
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me your goal in natural language..."
            disabled={isSubmitting}
            className="w-full text-slate-800 placeholder-slate-400 text-sm sm:text-base font-normal bg-transparent resize-none focus:outline-none leading-relaxed"
          />

          {/* Bottom Toolbar */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            {/* Left Tools & Context Controls */}
            <div className="flex items-center space-x-2">
              {/* Attach Context Button */}
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors focus:outline-none"
                title="Add context or documents"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Deep Research Toggle Pill */}
              <button
                type="button"
                onClick={() => setResearchMode(m => m === 'deep' ? 'standard' : 'deep')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-colors focus:outline-none',
                  researchMode === 'deep'
                    ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <span>Deep Research</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {/* Web Discovery Pill */}
              <button
                type="button"
                onClick={() => setWebEnabled(v => !v)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-colors focus:outline-none',
                  webEnabled
                    ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <Globe className="w-3 h-3 text-slate-500" />
                <span>Web</span>
              </button>
            </div>

            {/* Right Mic & Launch Button */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
                title="Voice Input (Alexa Audio Integration)"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Primary Launch Mission Submit Arrow Button */}
              <button
                id="home-launch-mission-btn"
                type="button"
                onClick={() => handleLaunchMission()}
                disabled={!prompt.trim() || isSubmitting}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-180 focus:outline-none shadow-md',
                  prompt.trim() && !isSubmitting
                    ? 'bg-[#1D63ED] hover:bg-blue-600 text-white shadow-blue-500/25 cursor-pointer hover:scale-105 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
                title={prompt.trim() ? 'Launch Goal (Ctrl+Enter)' : 'Enter your goal to launch'}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Error States Banner */}
        {isSubmitting && (
          <div className="mt-3 px-4 py-2.5 rounded-xl bg-blue-950/70 border border-blue-800/80 text-blue-300 text-xs flex items-center justify-center space-x-2 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>Connecting to AgentOrchestrator over Application API :3000...</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 px-4 py-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 3. POPULAR USE CASES SECTION */}
      <div className="relative z-10 w-full max-w-4xl mx-auto mt-8 lg:mt-9 mb-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">
            Popular Use Cases
          </span>
          <button
            onClick={() => navigate('/missions')}
            className="text-xs font-medium text-[#3B82F6] hover:text-blue-300 flex items-center space-x-1 focus:outline-none transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {POPULAR_USE_CASES.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card)}
                className={cn(
                  'p-4 rounded-2xl transition-all duration-200 cursor-pointer group flex flex-col justify-between h-full select-none',
                  'bg-[#0E1526]/80 border border-[#1C263C] hover:border-slate-600 hover:bg-[#121B30]',
                  'shadow-lg'
                )}
              >
                <div>
                  {/* Colored Icon Container */}
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border mb-3', card.iconBg)}>
                    <Icon className={cn('w-4 h-4', card.iconColor)} />
                  </div>

                  {/* Card Title */}
                  <h3 className="text-xs sm:text-[13px] font-semibold text-slate-100 group-hover:text-white leading-snug">
                    {card.title}
                  </h3>

                  {/* Card Description */}
                  <p className="mt-1 text-[11px] text-slate-400 leading-normal line-clamp-3">
                    {card.description}
                  </p>
                </div>

                {/* Bottom Action Indicator */}
                <div className="mt-3 flex items-center justify-end">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
