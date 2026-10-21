import React, { useState, useRef } from 'react';
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
  MicOff,
  Send,
  Plus,
  Compass,
  Wrench,
  AlertCircle,
  Loader2,
  ChevronDown,
  X,
  Zap,
  Check,
  Globe
} from 'lucide-react';
import { AmazonSmileArrow } from '../components/ui/AmazonBranding';
import { createConversation, createMission, uploadKnowledgeDocument } from '../api/client';
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

interface AttachedDoc {
  id: string;
  name: string;
  size: string;
  content: string;
}

export type ExecutionMode = 'quick' | 'deep' | 'autonomous' | 'build';

interface ModeOption {
  id: ExecutionMode;
  name: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const EXECUTION_MODES: ModeOption[] = [
  {
    id: 'quick',
    name: 'Quick',
    tagline: 'Fast direct query',
    description: 'Rapid single-shot response using targeted tool retrieval.',
    icon: Zap,
    color: 'text-amber-500'
  },
  {
    id: 'deep',
    name: 'Deep Research',
    tagline: 'Exhaustive document analysis',
    description: 'Multi-step document inspection, anomaly detection, and deep synthesis.',
    icon: Search,
    color: 'text-blue-500'
  },
  {
    id: 'autonomous',
    name: 'Autonomous',
    tagline: 'Full DAG planning & MCP tools',
    description: 'Full multi-step DAG planning loop with self-correcting MCP tools.',
    icon: Sparkles,
    color: 'text-purple-500'
  },
  {
    id: 'build',
    name: 'Build',
    tagline: 'Specs & action checklist',
    description: 'Technical requirements breakdown, specifications, and action plans.',
    icon: Wrench,
    color: 'text-emerald-500'
  }
];

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
  const { navigate, params } = useRouter();
  const [prompt, setPrompt] = useState(params.prompt || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState('Autonomous Decision Engine');
  
  // Real execution mode & options
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('deep');
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [webEnabled, setWebEnabled] = useState(true);
  const [attachedDocs, setAttachedDocs] = useState<AttachedDoc[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  React.useEffect(() => {
    if (params.prompt) {
      setPrompt(params.prompt);
    }
  }, [params.prompt]);

  // Document attachment handler (ChatGPT-style + button)
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingDoc(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const sizeFormatted = file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

        // Automatically index into SQLite Knowledge Base
        await uploadKnowledgeDocument({
          title: file.name.replace(/\.[^/.]+$/, ''),
          filename: file.name,
          fileType: file.name.split('.').pop()?.toUpperCase() || 'TXT',
          category: 'Uploaded',
          content: text || `Uploaded file ${file.name}`,
          summary: `User-attached file: ${file.name} (${sizeFormatted})`
        });

        setAttachedDocs(prev => [
          ...prev,
          { id: docId, name: file.name, size: sizeFormatted, content: text }
        ]);
      } catch (err: any) {
        console.error('[NewConversationPage] File upload failed:', err);
      }
    }
    setIsUploadingDoc(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachedDoc = (id: string) => {
    setAttachedDocs(prev => prev.filter(d => d.id !== id));
  };

  // Real-time Speech-to-Text via Web Speech API (Microphone)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript.trim()) {
          setPrompt(prev => prev ? `${prev} ${currentTranscript.trim()}` : currentTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Speech Recognition Error]:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[Speech Recognition Start Error]:', err);
      setIsListening(false);
    }
  };

  // Submit mission to real Application API
  const handleLaunchMission = async (customPrompt?: string) => {
    const textToSubmit = (customPrompt || prompt).trim();
    if (!textToSubmit || isSubmitting) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Explicitly create parent conversation in SQLite via Application API
      const convTitle = textToSubmit.length > 35 ? `${textToSubmit.substring(0, 35)}...` : textToSubmit;
      const conv = await createConversation(convTitle, 'autonomous-engine-v1');

      // 2. Persist real mission linked to the conversation with execution mode & attached docs
      const missionRes = await createMission({
        goal: textToSubmit,
        title: convTitle,
        conversationId: conv.id,
        executionMode,
        webEnabled,
        attachedDocuments: attachedDocs.map(d => ({ name: d.name, size: d.size })),
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

  const currentModeObj = EXECUTION_MODES.find(m => m.id === executionMode) || EXECUTION_MODES[1];
  const CurrentModeIcon = currentModeObj.icon;

  return (
    <div className="min-h-full flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-5xl mx-auto select-none">
      {/* Hidden file input for document attachment */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.txt,.md,.json,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 1. TOP HEADER & SIGNATURE LUMINOUS VISUAL */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto pt-2">
        <div className="mb-3 flex items-center justify-center">
          <AmazonSmileArrow width={150} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          How can <span className="text-blue-600 font-extrabold">Alexa+</span> help you today?
        </h1>

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
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 group-hover:scale-105 transition-transform',
                  card.iconBg
                )}
              >
                <Icon className={cn('w-4 h-4', card.iconColor)} />
              </div>

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
        {/* Attached Document Chips */}
        {attachedDocs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachedDocs.map(doc => (
              <div
                key={doc.id}
                className="flex items-center space-x-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-medium truncate max-w-[150px]">{doc.name}</span>
                <span className="text-[10px] text-blue-500">({doc.size})</span>
                <button
                  type="button"
                  onClick={() => removeAttachedDoc(doc.id)}
                  className="hover:text-red-500 transition-colors ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

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
              placeholder="Describe what you want to do... (e.g., plan a project, cross-check calendar, summarize files)"
              disabled={isSubmitting}
              className="w-full text-slate-800 placeholder-slate-400 text-sm font-normal bg-transparent resize-none focus:outline-none leading-relaxed pr-24"
            />

            {/* Top-Right Mini Actions (Paperclip, Mic, Send) */}
            <div className="absolute top-0 right-0 flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleFileClick}
                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
                title="Attach documents (.pdf, .docx, .txt, .json)"
              >
                {isUploadingDoc ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={cn(
                  'p-1.5 rounded-lg transition-colors focus:outline-none',
                  isListening
                    ? 'bg-rose-100 text-rose-600 animate-pulse'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                )}
                title={isListening ? 'Listening... click to stop recording' : 'Speech input (Microphone)'}
              >
                {isListening ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4" />}
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

          {/* Bottom Toolbar: Quick Action Pills + ChatGPT-style Execution Mode */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            {/* Left Action Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* ChatGPT-style Plus button */}
              <button
                type="button"
                onClick={handleFileClick}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors focus:outline-none"
                title="Attach document or dataset"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Web Search toggle */}
              <button
                type="button"
                onClick={() => setWebEnabled(!webEnabled)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors focus:outline-none',
                  webEnabled
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-500 hover:bg-slate-100'
                )}
                title="Toggle Web Search context"
              >
                <Globe className="w-3 h-3 text-blue-500" />
                <span>Web {webEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {/* Quick mode selector buttons */}
              {[
                { id: 'quick' as ExecutionMode, label: 'Quick', icon: Zap },
                { id: 'deep' as ExecutionMode, label: 'Deep Research', icon: Search },
                { id: 'autonomous' as ExecutionMode, label: 'Autonomous', icon: Sparkles },
                { id: 'build' as ExecutionMode, label: 'Build', icon: Wrench },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setExecutionMode(pill.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors focus:outline-none',
                    executionMode === pill.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <pill.icon className="w-3 h-3 text-slate-500" />
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>

            {/* Right: Execution Mode Dropdown & LLM selector */}
            <div className="flex items-center space-x-2 relative">
              {/* Execution Mode Dropdown Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModeOpen(!isModeOpen)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-700 flex items-center space-x-1.5 transition-colors"
                >
                  <CurrentModeIcon className={cn('w-3.5 h-3.5', currentModeObj.color)} />
                  <span className="font-semibold">{currentModeObj.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isModeOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={() => setIsModeOpen(false)}
                    />
                    <div className="absolute right-0 bottom-full mb-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50">
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Select Execution Mode</span>
                    </div>
                    {EXECUTION_MODES.map((mode) => {
                      const ModeIcon = mode.icon;
                      const isSelected = executionMode === mode.id;
                      return (
                        <div
                          key={mode.id}
                          onClick={() => {
                            setExecutionMode(mode.id);
                            setIsModeOpen(false);
                          }}
                          className={cn(
                            'px-3 py-2 flex items-start space-x-2.5 hover:bg-slate-50 cursor-pointer transition-colors',
                            isSelected && 'bg-blue-50/60'
                          )}
                        >
                          <ModeIcon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', mode.color)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={cn('text-xs font-semibold', isSelected ? 'text-blue-700' : 'text-slate-800')}>
                                {mode.name}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 ml-1" />}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">{mode.tagline}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{mode.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

              {/* Model Selector */}
              <div className="relative inline-block text-left">
                <select
                  value={activeModel}
                  onChange={(e) => setActiveModel(e.target.value)}
                  className="text-xs font-semibold px-2 py-1 rounded-lg border bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer"
                  title="LLM Decision Provider"
                >
                  <option value="Autonomous Decision Engine">Autonomous Engine</option>
                  <option value="Claude 3.5 Sonnet" disabled>Claude 3.5 Sonnet (API Key Req)</option>
                  <option value="GPT-4o" disabled>GPT-4o (API Key Req)</option>
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
