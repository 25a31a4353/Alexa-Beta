import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  CheckSquare,
  Search,
  BarChart2,
  Sparkles,
  ArrowRight,
  Paperclip,
  Mic,
  Send,
  Plus,
  Compass,
  Wrench,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { LuminousArc } from '../components/ui/LuminousArc';
import { createConversation, createMission } from '../api/client';
import { useRouter } from '../state/router';
import { cn } from '../lib/utils';

interface QuickStartItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  prompt: string;
}

const QUICK_START_CARDS: QuickStartItem[] = [
  {
    id: 'plan-day',
    title: 'Plan my day',
    subtitle: '"Check my calendar and prepare for tomorrow\'s meeting."',
    icon: Calendar,
    iconBg: 'bg-blue-50 border-blue-200/80',
    iconColor: 'text-blue-600',
    prompt: 'Check my calendar for tomorrow, understand what the meeting is about, find relevant documents, determine what I haven\'t prepared, prepare a checklist, and remind me what I need to do.',
  },
  {
    id: 'analyze-doc',
    title: 'Analyze a document',
    subtitle: '"Summarize this report and highlight key insights."',
    icon: FileText,
    iconBg: 'bg-purple-50 border-purple-200/80',
    iconColor: 'text-purple-600',
    prompt: 'Analyze available project specifications and roadmap documentation in knowledge base. Summarize key information, extract critical technical insights, identify unknown dependencies, and formulate a step-by-step action plan.',
  },
  {
    id: 'create-checklist',
    title: 'Create a checklist',
    subtitle: '"I\'m launching a project. Create a step-by-step checklist."',
    icon: CheckSquare,
    iconBg: 'bg-emerald-50 border-emerald-200/80',
    iconColor: 'text-emerald-600',
    prompt: 'Break down my high-level project release goal into structured execution phases. Assign priority levels to each milestone, identify verification gates, and generate an actionable progress checklist.',
  },
  {
    id: 'find-info',
    title: 'Find information',
    subtitle: '"Search my knowledge base for relevant documents."',
    icon: Search,
    iconBg: 'bg-amber-50 border-amber-200/80',
    iconColor: 'text-amber-600',
    prompt: 'Search knowledge repository for roadmap documents and investor meeting notes, cross-reference strategic priorities, and summarize key decisions.',
  },
  {
    id: 'analyze-data',
    title: 'Analyze data',
    subtitle: '"Analyze this data and generate a report."',
    icon: BarChart2,
    iconBg: 'bg-rose-50 border-rose-200/80',
    iconColor: 'text-rose-600',
    prompt: 'Review system activity and operational data metrics. Identify key trend patterns, surface failure risks, highlight optimization opportunities, and produce an executive-ready operational report.',
  },
  {
    id: 'use-tools',
    title: 'Use my tools',
    subtitle: '"Find documents in Knowledge Base, check my calendar, and summarize."',
    icon: Sparkles,
    iconBg: 'bg-indigo-50 border-indigo-200/80',
    iconColor: 'text-indigo-600',
    prompt: 'Discover available MCP tools across knowledge and calendar domains, orchestrate a multi-step investigation, and verify the outcome against real tool results.',
  },
];

export const NewConversationPage: React.FC = () => {
  const { navigate } = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState('Autonomous Decision Engine');
  const [activeMode, setActiveMode] = useState<string | null>(null);

  // Submit mission to real Application API
  const handleLaunchMission = async (customPrompt?: string) => {
    const textToSubmit = (customPrompt || prompt).trim();
    if (!textToSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Explicitly create parent conversation in SQLite via Application API
      const convTitle = textToSubmit.length > 35 ? `${textToSubmit.substring(0, 35)}...` : textToSubmit;
      const conv = await createConversation(convTitle, 'autonomous-engine-v1');

      // 2. Persist real mission linked to the conversation
      const missionRes = await createMission({
        goal: textToSubmit,
        title: convTitle,
        conversationId: conv.id,
        sync: false,
      });

      if (missionRes?.mission?.id) {
        // 3. Navigate immediately to the mission workspace with real mission ID
        navigate(`/missions/${missionRes.mission.id}`);
      } else {
        throw new Error('Mission created but missing valid ID.');
      }
    } catch (err: any) {
      console.error('[NewConversationPage] Launch error:', err);
      setErrorMessage(
        err?.message || 'Failed to dispatch mission. Please ensure Application API :3000 is reachable.'
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

  const handleCardClick = (card: QuickStartItem) => {
    setPrompt(card.prompt);
  };

  return (
    <div className="min-h-full flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-5xl mx-auto select-none">
      {/* 1. TOP HEADER & SIGNATURE LUMINOUS VISUAL */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto pt-2">
        {/* Signature Luminous Blue-to-Amber Smile Arc from Page 2 */}
        <div className="mb-3 flex items-center justify-center">
          <LuminousArc size="md" variant="full" />
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          How can <span className="text-blue-600 font-extrabold">Alexa+</span> help you today?
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-lg leading-relaxed font-normal">
          Ask a complex question, set a goal, or give me a task. I can understand, plan, use the right tools, and get things done for you.
        </p>
      </div>

      {/* 2. QUICK-START CARDS GRID (3 Columns x 2 Rows) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 my-6">
        {QUICK_START_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={cn(
                'p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs',
                'hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group',
                'flex items-start space-x-3.5'
              )}
            >
              {/* Category-Tinted Icon Box */}
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 group-hover:scale-105 transition-transform',
                  card.iconBg
                )}
              >
                <Icon className={cn('w-4 h-4', card.iconColor)} />
              </div>

              {/* Title & Subtitle */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-[13px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {card.title}
                  </h3>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
                </div>
                <p className="mt-1 text-[11px] text-slate-500 leading-normal line-clamp-2">
                  {card.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. NATURAL-LANGUAGE COMPOSER CONTAINER */}
      <div className="w-full max-w-4xl mx-auto mt-auto">
        <div
          className={cn(
            'bg-white rounded-2xl border border-slate-200 shadow-sm p-4 transition-all duration-150',
            'focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100',
            isSubmitting && 'opacity-85 pointer-events-none'
          )}
        >
          {/* Main multiline input */}
          <div className="relative">
            <textarea
              id="new-conversation-prompt-input"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to do..."
              disabled={isSubmitting}
              className="w-full text-slate-800 placeholder-slate-400 text-sm font-normal bg-transparent resize-none focus:outline-none leading-relaxed pr-24"
            />

            {/* Top-Right Mini Actions (Paperclip, Mic, Send) */}
            <div className="absolute top-0 right-0 flex items-center space-x-1.5">
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none opacity-60 cursor-not-allowed"
                title="File upload (Coming in future multimodal stage)"
                disabled
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
                title="Voice input via Alexa integration"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                id="new-conversation-submit-btn"
                type="button"
                onClick={() => handleLaunchMission()}
                disabled={!prompt.trim() || isSubmitting}
                className={cn(
                  'p-2 rounded-lg flex items-center justify-center transition-all focus:outline-none shadow-xs',
                  prompt.trim() && !isSubmitting
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                    : 'bg-blue-300 text-white cursor-not-allowed'
                )}
                title={prompt.trim() ? 'Submit Goal (Ctrl+Enter)' : 'Enter what you want to do'}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Bottom Toolbar: Quick Action Pills + Honest Model Selector */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            {/* Left Action Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors focus:outline-none"
                title="Add context"
              >
                <Plus className="w-4 h-4" />
              </button>

              {[
                { id: 'search', label: 'Q Search', icon: Search },
                { id: 'research', label: 'Deep Research', icon: Compass },
                { id: 'plan', label: 'Create Plan', icon: CheckSquare },
                { id: 'tools', label: 'Use Tools', icon: Wrench },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActiveMode(activeMode === pill.id ? null : pill.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors focus:outline-none',
                    activeMode === pill.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <pill.icon className="w-3 h-3 text-slate-500" />
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>

            {/* Right: Honest Model Selector */}
            <div className="flex items-center space-x-2">
              <div className="relative inline-block text-left">
                <select
                  value={activeModel}
                  onChange={(e) => setActiveModel(e.target.value)}
                  className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none transition-colors cursor-pointer',
                    'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  )}
                  title="LLM Decision Provider"
                >
                  <option value="Autonomous Decision Engine">
                    Autonomous Engine (Active)
                  </option>
                  <option value="Claude 3.5 Sonnet" disabled>
                    Claude 3.5 Sonnet (Key Required)
                  </option>
                  <option value="GPT-4o" disabled>
                    GPT-4o (Key Required)
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Submitting Feedback State */}
        {isSubmitting && (
          <div className="mt-3 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs flex items-center justify-center space-x-2 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>Creating conversation & dispatching agent mission...</span>
          </div>
        )}

        {/* Error Feedback State */}
        {errorMessage && (
          <div className="mt-3 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
