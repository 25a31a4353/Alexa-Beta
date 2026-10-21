import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  FileText,
  BarChart2,
  CheckCircle2,
  Clock,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Wrench,
  Search,
  CheckSquare,
  Sparkles,
  Layers,
  ShieldCheck,
  Check,
  RefreshCw,
  Plus,
  X,
  AlertTriangle,
  AlertCircle,
  Copy,
  Trash2,
  RotateCw
} from 'lucide-react';
import { listMissions, getMission, deleteMission } from '../api/client';
import { subscribeToMissionStream } from '../api/sse';
import { Mission, ActivityEvent } from '../types';
import { useRouter } from '../state/router';
import { cn } from '../lib/utils';

// Helper to select an appropriate domain icon
const getDomainIcon = (title?: string, goal?: string) => {
  const text = ((title || '') + ' ' + (goal || '')).toLowerCase();
  if (text.includes('meet') || text.includes('calendar') || text.includes('schedule')) {
    return Calendar;
  }
  if (text.includes('doc') || text.includes('roadmap') || text.includes('paper') || text.includes('spec')) {
    return FileText;
  }
  if (text.includes('data') || text.includes('trend') || text.includes('metric') || text.includes('stat')) {
    return BarChart2;
  }
  if (text.includes('check') || text.includes('plan') || text.includes('task')) {
    return CheckSquare;
  }
  if (text.includes('tool') || text.includes('mcp') || text.includes('service')) {
    return Wrench;
  }
  return Sparkles;
};

// Friendly tool naming and description mapping grounded in real MCP tools
const formatToolMeta = (toolName?: string) => {
  if (!toolName) {
    return {
      name: 'No Active Tool Execution',
      desc: 'Waiting for AgentOrchestrator to select and invoke MCP tools.',
      icon: Wrench
    };
  }
  switch (toolName) {
    case 'document_analyze':
      return {
        name: 'Document Analysis',
        desc: 'Analyzing relevant meeting documents and extracting key information.',
        icon: FileText
      };
    case 'calendar_get_events':
      return {
        name: 'Calendar Retrieval',
        desc: 'Fetching upcoming meeting schedules, attendees, and platform links.',
        icon: Calendar
      };
    case 'knowledge_search':
      return {
        name: 'Knowledge Search',
        desc: 'Scanning connected knowledge base and documents for relevant references.',
        icon: Search
      };
    case 'ping':
      return {
        name: 'System Diagnostic',
        desc: 'Validating MCP protocol latency and transport health.',
        icon: Wrench
      };
    default: {
      const cleanName = toolName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        name: cleanName,
        desc: `Executing ${cleanName} capability over self-hosted MCP protocol (:3001).`,
        icon: Wrench
      };
    }
  }
};

// Format elapsed or execution duration cleanly
const formatDuration = (
  ms?: number | null,
  startedAt?: string | null,
  completedAt?: string | null,
  now = Date.now()
): string => {
  if (ms !== undefined && ms !== null && ms > 0) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }
  if (startedAt) {
    const start = new Date(startedAt).getTime();
    if (!isNaN(start)) {
      const end = completedAt ? new Date(completedAt).getTime() : now;
      const diff = Math.max(0, end - start);
      if (diff < 1000) return `${diff}ms`;
      return `${Math.round(diff / 1000)}s`;
    }
  }
  return '—';
};

interface LiveToolState {
  toolName: string;
  arguments: any;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  output?: any;
  errorMessage?: string;
  startedAt?: string;
  durationMs?: number;
}

const STAGES = [
  { id: 'understand', label: 'Understand', defaultIcon: Sparkles },
  { id: 'plan', label: 'Plan', defaultIcon: Layers },
  { id: 'tools', label: 'Use Tools', defaultIcon: Wrench },
  { id: 'verify', label: 'Verify', defaultIcon: ShieldCheck },
  { id: 'results', label: 'Results', defaultIcon: BarChart2 }
] as const;

export const MissionsPage: React.FC = () => {
  const { params, navigate } = useRouter();
  const [missionsList, setMissionsList] = useState<Mission[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(params.id || null);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInputExpanded, setIsInputExpanded] = useState(true);
  const [isOutputExpanded, setIsOutputExpanded] = useState(true);
  const [isStepsExpanded, setIsStepsExpanded] = useState(true);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleDeleteMission = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this mission?')) return;
    try {
      await deleteMission(id);
      setIsOptionsOpen(false);
      const data = await listMissions();
      const loaded = data.missions || [];
      setMissionsList(loaded);
      if (loaded.length > 0) {
        setSelectedMissionId(loaded[0].id);
        navigate(`/missions/${loaded[0].id}`);
      } else {
        setSelectedMissionId(null);
        setActiveMission(null);
        navigate('/missions');
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setActionNotice(`Copied ${label} to clipboard!`);
    setTimeout(() => setActionNotice(null), 2500);
    setIsOptionsOpen(false);
  };

  // Live SSE streaming state
  const [latestEvent, setLatestEvent] = useState<ActivityEvent | null>(null);
  const [liveTool, setLiveTool] = useState<LiveToolState | null>(null);
  const [livePlanSteps, setLivePlanSteps] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());

  // Real-time ticking timer while mission is actively executing
  useEffect(() => {
    const isTerminal = activeMission?.status === 'COMPLETED' || activeMission?.status === 'FAILED';
    if (isTerminal) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMission?.status]);

  // 1. Load missions list from SQLite database
  useEffect(() => {
    let isMounted = true;
    listMissions()
      .then((data) => {
        if (!isMounted) return;
        const list = data.missions || [];
        setMissionsList(list);

        // Auto-select requested mission from URL or latest mission
        if (params.id) {
          setSelectedMissionId(params.id);
        } else if (list.length > 0 && !selectedMissionId) {
          setSelectedMissionId(list[0].id);
        }
      })
      .catch((err) => {
        console.warn('[MissionsPage] List error:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  // 2. Load detailed mission data & connect real SSE stream whenever selectedMissionId changes
  useEffect(() => {
    if (!selectedMissionId) return;

    let isMounted = true;
    let sseCleanup: (() => void) | null = null;
    const seenEventIds = new Set<string>();

    // Reset ephemeral states on task switch
    setLiveTool(null);
    setLatestEvent(null);
    setLivePlanSteps([]);

    // Step A: Load initial persisted state from SQLite
    getMission(selectedMissionId)
      .then((det) => {
        if (!isMounted) return;
        setActiveMission(det);

        // Step B: Connect SSE stream (handles running missions and replays historical events)
        sseCleanup = subscribeToMissionStream({
          missionId: selectedMissionId,
          onEvent: (event) => {
            if (!isMounted) return;
            if (event.id && seenEventIds.has(event.id)) return;
            if (event.id) seenEventIds.add(event.id);

            setLatestEvent(event);

            const evtType = event.event_type || (event as any).eventType;

            if (evtType === 'tool.executing') {
              setLiveTool({
                toolName: event.metadata?.toolName || 'tool',
                arguments: event.metadata?.arguments || {},
                status: 'RUNNING',
                startedAt: event.created_at || new Date().toISOString()
              });
            } else if (evtType === 'tool.completed') {
              setLiveTool((prev) => ({
                toolName: event.metadata?.toolName || prev?.toolName || 'tool',
                arguments: prev?.arguments || {},
                status: 'COMPLETED',
                durationMs: event.metadata?.durationMs
              }));
              // Refresh database entity to catch persisted outputs
              getMission(selectedMissionId).then((updated) => {
                if (isMounted) setActiveMission(updated);
              });
            } else if (evtType === 'tool.failed') {
              setLiveTool((prev) => ({
                toolName: event.metadata?.toolName || prev?.toolName || 'tool',
                arguments: prev?.arguments || {},
                status: 'FAILED',
                errorMessage: event.metadata?.error || event.description,
                durationMs: event.metadata?.durationMs
              }));
              getMission(selectedMissionId).then((updated) => {
                if (isMounted) setActiveMission(updated);
              });
            } else if (evtType === 'plan.created') {
              if (event.metadata?.steps && Array.isArray(event.metadata.steps)) {
                setLivePlanSteps(event.metadata.steps);
              }
              getMission(selectedMissionId).then((updated) => {
                if (isMounted) setActiveMission(updated);
              });
            } else if (evtType === 'mission.completed' || evtType === 'mission.failed') {
              getMission(selectedMissionId).then((updated) => {
                if (isMounted) setActiveMission(updated);
              });
            }
          },
          onComplete: () => {
            if (isMounted) {
              getMission(selectedMissionId).then((updated) => {
                if (isMounted) setActiveMission(updated);
              });
            }
          },
          onError: (err) => {
            console.warn('[MissionsPage SSE]:', err.message);
          }
        });
      })
      .catch((err) => {
        console.warn('[MissionsPage] Get mission detail error:', err);
      });

    return () => {
      isMounted = false;
      if (sseCleanup) {
        sseCleanup();
      }
    };
  }, [selectedMissionId]);

  // Derive dynamic fields based on active mission
  const currentTitle = activeMission?.title || (isLoading ? 'Loading mission...' : 'Mission Workspace');
  const currentGoal = activeMission?.goal || '';
  const DomainIcon = getDomainIcon(currentTitle, currentGoal);

  // Derive real current status from mission or latest lifecycle event
  const currentStatus = useMemo(() => {
    if (activeMission?.status) return activeMission.status;
    if (latestEvent) {
      const evt = latestEvent.event_type || (latestEvent as any).eventType;
      if (evt === 'mission.completed') return 'COMPLETED';
      if (evt === 'mission.failed') return 'FAILED';
      if (evt?.startsWith('verification')) return 'VERIFYING';
      if (evt?.startsWith('tool') || evt === 'step.started') return 'EXECUTING';
      if (evt === 'plan.created') return 'PLANNING';
      if (evt === 'mission.started' || evt === 'understanding.completed') return 'UNDERSTANDING';
    }
    return 'CREATED';
  }, [activeMission?.status, latestEvent]);

  // Determine real 5-stage progress (Understand, Plan, Use Tools, Verify, Results)
  const stageStatus = useMemo(() => {
    switch (currentStatus) {
      case 'CREATED':
      case 'UNDERSTANDING':
        return { understand: 'active', plan: 'pending', tools: 'pending', verify: 'pending', results: 'pending' };
      case 'PLANNING':
        return { understand: 'completed', plan: 'active', tools: 'pending', verify: 'pending', results: 'pending' };
      case 'EXECUTING':
        return { understand: 'completed', plan: 'completed', tools: 'active', verify: 'pending', results: 'pending' };
      case 'VERIFYING':
        return { understand: 'completed', plan: 'completed', tools: 'completed', verify: 'active', results: 'pending' };
      case 'COMPLETED':
        return { understand: 'completed', plan: 'completed', tools: 'completed', verify: 'completed', results: 'completed' };
      case 'FAILED':
        return { understand: 'completed', plan: 'completed', tools: 'failed', verify: 'pending', results: 'failed' };
      default:
        return { understand: 'active', plan: 'pending', tools: 'pending', verify: 'pending', results: 'pending' };
    }
  }, [currentStatus]);

  // Real tool executions data from database
  const toolExecs = (activeMission as any)?.toolExecutions || (activeMission as any)?.tool_executions || [];
  const latestDbTool = toolExecs.length > 0 ? toolExecs[toolExecs.length - 1] : null;

  // Active or most recent tool
  const currentToolName = liveTool?.toolName || latestDbTool?.tool_name || null;
  const toolMeta = formatToolMeta(currentToolName || undefined);
  const ToolIcon = toolMeta.icon;

  const currentToolStatus = liveTool?.status || (latestDbTool?.status as 'RUNNING' | 'COMPLETED' | 'FAILED') || null;
  const currentToolArgs = liveTool ? liveTool.arguments : latestDbTool?.arguments ?? null;
  const currentToolOutput = liveTool?.output ?? latestDbTool?.output ?? null;
  const currentToolError = liveTool?.errorMessage || latestDbTool?.error_message || null;
  const currentToolDurationMs = liveTool?.durationMs ?? latestDbTool?.duration_ms ?? null;
  const currentToolStartedAt = liveTool?.startedAt || latestDbTool?.started_at || null;

  // Real Substeps list: derived from database mission_steps or live planned steps
  const rawSteps = activeMission?.steps || [];
  const dynamicSubsteps = useMemo(() => {
    if (rawSteps.length > 0) {
      return rawSteps.map((s, idx) => ({
        id: s.id || `step-${idx}`,
        label: s.label,
        status:
          s.status === 'COMPLETED'
            ? 'completed'
            : s.status === 'RUNNING'
            ? 'in_progress'
            : s.status === 'FAILED'
            ? 'failed'
            : 'pending',
        durationMs: s.duration_ms
      }));
    }

    if (livePlanSteps.length > 0) {
      return livePlanSteps.map((label, idx) => ({
        id: `live-plan-${idx}`,
        label,
        status: idx === 0 ? 'in_progress' : 'pending',
        durationMs: undefined
      }));
    }

    return [];
  }, [rawSteps, livePlanSteps]);

  // Real Current Step Description derived from latest event or active substep
  const currentStepTitle = useMemo(() => {
    if (currentStatus === 'COMPLETED') {
      return 'Current Step: Mission completed successfully';
    }
    if (currentStatus === 'FAILED') {
      return 'Current Step: Mission execution halted with error';
    }
    if (latestEvent) {
      const evtType = latestEvent.event_type || (latestEvent as any).eventType;
      if (evtType === 'tool.executing' && latestEvent.metadata?.toolName) {
        return `Current Step: Executing ${latestEvent.metadata.toolName}`;
      }
      if (evtType === 'tool.completed' && latestEvent.metadata?.toolName) {
        return `Current Step: ${latestEvent.metadata.toolName} completed`;
      }
      if (evtType === 'tool.failed' && latestEvent.metadata?.toolName) {
        return `Current Step: ${latestEvent.metadata.toolName} failed`;
      }
      if (evtType === 'verification.started') {
        return 'Current Step: Verifying synthesized results against tool evidence';
      }
      if (evtType === 'verification.completed') {
        return 'Current Step: Verification completed';
      }
      if (evtType === 'plan.created') {
        return 'Current Step: Formulating execution plan';
      }
      if (evtType === 'understanding.completed' || evtType === 'mission.started') {
        return 'Current Step: Understanding objective and temporal scope';
      }
    }

    const inProgress = dynamicSubsteps.find((s) => s.status === 'in_progress');
    if (inProgress) {
      return `Current Step: ${inProgress.label}`;
    }

    if (dynamicSubsteps.length > 0) {
      return `Current Step: ${dynamicSubsteps[dynamicSubsteps.length - 1].label}`;
    }

    return 'Current Step: Initializing mission...';
  }, [currentStatus, latestEvent, dynamicSubsteps]);

  // Overall mission timer
  const missionDurationText = formatDuration(
    activeMission?.duration_ms,
    activeMission?.started_at,
    activeMission?.completed_at,
    now
  );

  // Current tool timer
  const toolDurationText = formatDuration(
    currentToolDurationMs,
    currentToolStartedAt,
    currentToolStatus === 'COMPLETED' || currentToolStatus === 'FAILED' ? currentToolStartedAt : null,
    now
  );

  return (
    <div className="min-h-full bg-[#F8FAFC] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-5">
        
        {/* Top Breadcrumb & Task Switcher Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => navigate('/missions')}
              className="flex items-center space-x-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-blue-500" />
              <span>Mission</span>
            </button>
            <span className="text-slate-400 font-normal">&gt;</span>
            <span className="font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
              {currentTitle}
            </span>
          </div>

          {/* Task Switcher: Allows switching across genuine persisted missions */}
          {missionsList.length > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium hidden md:inline">Switch Task:</span>
              <select
                value={selectedMissionId || ''}
                onChange={(e) => setSelectedMissionId(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs font-medium max-w-[240px] truncate"
              >
                {missionsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title || m.goal}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* =========================================================================
            HEADER MISSION CARD (Top Summary & Horizontal 5-Stage Stepper)
            ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-8">
          
          {/* Top Mission Identity */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-4">
              {/* Task Icon Squircle */}
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100/90 flex items-center justify-center flex-shrink-0 text-blue-600 shadow-2xs">
                <DomainIcon className="w-7 h-7 stroke-[1.8]" />
              </div>

              {/* Title & Goal Description */}
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                  {currentTitle}
                </h1>
                <p className="text-[13px] md:text-sm text-slate-500 leading-relaxed max-w-4xl">
                  {currentGoal || 'Autonomous mission execution objective.'}
                </p>
              </div>
            </div>

            {/* Right Status Badge & Actions */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {currentStatus === 'COMPLETED' ? (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Completed</span>
                </div>
              ) : currentStatus === 'FAILED' ? (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Failed</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Live</span>
                </div>
              )}
              <div className="relative">
                <button 
                  onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Mission options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isOptionsOpen && activeMission && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => handleCopy(activeMission.id, 'Mission ID')}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Mission ID</span>
                    </button>
                    <button
                      onClick={() => handleCopy(activeMission.goal, 'Objective Goal')}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Goal Text</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate(`/new?prompt=${encodeURIComponent(activeMission.goal)}`);
                        setIsOptionsOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-blue-500" />
                      <span>Re-run Mission</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => handleDeleteMission(activeMission.id)}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Delete Mission</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {actionNotice && (
            <div className="mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
              {actionNotice}
            </div>
          )}

          {/* Horizontal 5-Stage Stepper: Understand ➔ Plan ➔ Use Tools ➔ Verify ➔ Results */}
          <div className="pt-2 pb-1">
            <div className="flex items-center justify-between relative max-w-3xl mx-auto px-4">
              {STAGES.map((stage, idx) => {
                const status = stageStatus[stage.id];
                const isCompleted = status === 'completed';
                const isActive = status === 'active';
                const isFailed = status === 'failed';
                const isPending = status === 'pending';
                const StageIcon = stage.defaultIcon;

                return (
                  <React.Fragment key={stage.id}>
                    {/* Stage Node */}
                    <div className="flex flex-col items-center z-10">
                      <div
                        className={cn(
                          'transition-all flex items-center justify-center',
                          isCompleted && 'w-9 h-9 rounded-full bg-emerald-500 text-white shadow-xs',
                          isActive && 'w-9 h-9 rounded-full bg-blue-600 text-white shadow-md ring-4 ring-blue-100 animate-pulse',
                          isFailed && 'w-9 h-9 rounded-full bg-rose-500 text-white shadow-xs',
                          isPending && 'w-9 h-9 rounded-xl border border-slate-300/80 bg-white text-slate-400 shadow-2xs'
                        )}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        ) : isFailed ? (
                          <X className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <StageIcon className={cn('w-4 h-4 stroke-[2.2]', isActive && 'text-white', isPending && 'text-slate-400')} />
                        )}
                      </div>
                      <span
                        className={cn(
                          'mt-2 text-xs transition-colors',
                          isCompleted && 'font-semibold text-slate-800',
                          isActive && 'font-bold text-blue-900',
                          isFailed && 'font-semibold text-rose-700',
                          isPending && 'font-medium text-slate-500'
                        )}
                      >
                        {stage.label}
                      </span>
                    </div>

                    {/* Connecting Arrow Line between stage idx and idx + 1 */}
                    {idx < STAGES.length - 1 && (
                      <div
                        className={cn(
                          'flex-1 h-[2px] mx-2 relative -mt-5 flex items-center justify-end transition-colors',
                          stageStatus[STAGES[idx + 1].id] === 'completed' || isCompleted
                            ? stageStatus[STAGES[idx + 1].id] === 'active'
                              ? 'bg-blue-400'
                              : stageStatus[STAGES[idx + 1].id] === 'completed'
                              ? 'bg-emerald-400'
                              : 'bg-slate-200'
                            : 'bg-slate-200'
                        )}
                      >
                        <div
                          className={cn(
                            'w-2 h-2 border-t-2 border-r-2 rotate-45 -mr-1 transition-colors',
                            stageStatus[STAGES[idx + 1].id] === 'completed' || isCompleted
                              ? stageStatus[STAGES[idx + 1].id] === 'active'
                                ? 'border-blue-400'
                                : stageStatus[STAGES[idx + 1].id] === 'completed'
                                ? 'border-emerald-400'
                                : 'border-slate-300'
                              : 'border-slate-300'
                          )}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

        </div>

        {/* =========================================================================
            MISSION RESULT / FAILURE SUMMARY CARD (Rendered on Completion or Failure)
            ========================================================================= */}
        {activeMission?.result_summary && (
          <div
            className={cn(
              'bg-white rounded-2xl border shadow-xs p-6 md:p-8 space-y-4',
              currentStatus === 'FAILED' ? 'border-rose-200/90' : 'border-slate-200/80'
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs',
                    currentStatus === 'FAILED'
                      ? 'bg-rose-50 border-rose-200/80 text-rose-600'
                      : 'bg-emerald-50 border-emerald-200/80 text-emerald-600'
                  )}
                >
                  {currentStatus === 'FAILED' ? (
                    <AlertTriangle className="w-5 h-5 stroke-[2]" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 stroke-[2]" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {currentStatus === 'FAILED' ? 'Mission Execution Alert' : 'Synthesized Mission Result'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {currentStatus === 'FAILED'
                      ? 'Error details recorded during autonomous execution'
                      : 'Verified and grounded against MCP tool execution evidence'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{missionDurationText}</span>
              </div>
            </div>
            <div
              className={cn(
                'text-sm leading-relaxed whitespace-pre-wrap p-4 rounded-xl border font-sans',
                currentStatus === 'FAILED'
                  ? 'bg-rose-50/50 text-rose-800 border-rose-100'
                  : 'bg-slate-50/70 text-slate-800 border-slate-100'
              )}
            >
              {activeMission.result_summary}
            </div>
          </div>
        )}

        {/* =========================================================================
            BOTTOM TWO-COLUMN SPLIT:
            Left: Dynamic Substeps Timeline
            Right: Current Tool Inspector (JSON Input & Live Output)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT COLUMN: Substeps List */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border flex items-center justify-center',
                    currentStatus === 'COMPLETED'
                      ? 'border-emerald-500 text-emerald-600'
                      : currentStatus === 'FAILED'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-blue-500/70 text-blue-600'
                  )}
                >
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      currentStatus === 'COMPLETED'
                        ? 'bg-emerald-600'
                        : currentStatus === 'FAILED'
                        ? 'bg-rose-600'
                        : 'bg-blue-600 animate-ping'
                    )}
                  />
                </div>
                <h2 className="text-[13px] md:text-sm font-semibold text-slate-900 truncate">
                  {currentStepTitle}
                </h2>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="font-mono text-slate-500">{missionDurationText}</span>
                <button
                  onClick={() => setIsStepsExpanded(!isStepsExpanded)}
                  className="p-1 hover:text-slate-600 rounded transition-colors"
                >
                  {isStepsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Substeps List with Vertical Connector */}
            {isStepsExpanded && (
              <div className="relative pl-3 space-y-4 pt-1">
                {dynamicSubsteps.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Waiting for agent to formulate execution plan milestones...
                  </div>
                ) : (
                  <>
                    {/* Continuous vertical line connecting all steps */}
                    <div className="absolute left-[21px] top-4 bottom-5 w-[1.5px] bg-slate-200/80" />

                    {dynamicSubsteps.map((substep, index) => {
                      const isCompleted = substep.status === 'completed';
                      const isInProgress = substep.status === 'in_progress';
                      const isFailed = substep.status === 'failed';
                      const isPending = substep.status === 'pending';

                      return (
                        <div key={substep.id || index} className="relative flex items-center justify-between gap-3 group">
                          
                          {/* Left: Icon & Text */}
                          <div className="flex items-center space-x-3.5 z-10">
                            {isCompleted && (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                            {isInProgress && (
                              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                                <Plus className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                            {isFailed && (
                              <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                                <X className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                            {isPending && (
                              <div className="w-5 h-5 rounded-full border border-dashed border-slate-300 bg-white flex-shrink-0" />
                            )}

                            <span
                              className={cn(
                                'text-xs md:text-[13px] transition-colors',
                                isInProgress
                                  ? 'text-slate-900 font-semibold'
                                  : isCompleted
                                  ? 'text-slate-700 font-medium'
                                  : isFailed
                                  ? 'text-rose-700 font-medium'
                                  : 'text-slate-400 font-normal'
                              )}
                            >
                              {substep.label}
                            </span>
                          </div>

                          {/* Right: Status Pill Chip & Duration */}
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {substep.durationMs ? (
                              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                                {formatDuration(substep.durationMs)}
                              </span>
                            ) : null}

                            {isCompleted && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200/70">
                                <span className="w-1.5 h-1.5 rounded-full border border-emerald-500" />
                                <span>Completed</span>
                              </span>
                            )}
                            {isInProgress && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-200/70">
                                <span className="w-1.5 h-1.5 rounded-full border border-blue-500 animate-pulse" />
                                <span>In progress</span>
                              </span>
                            )}
                            {isFailed && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-600 border border-rose-200/70">
                                <span className="w-1.5 h-1.5 rounded-full border border-rose-500" />
                                <span>Failed</span>
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-400 border border-slate-200/70">
                                <span className="w-1.5 h-1.5 rounded-full border border-slate-300" />
                                <span>Pending</span>
                              </span>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Current Tool Inspector */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Current Tool</h3>
              <button
                onClick={() => navigate('/tools')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                View all tools
              </button>
            </div>

            {/* Active Tool Banner */}
            <div className="flex items-start justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-start space-x-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-2xs',
                    currentToolStatus === 'FAILED'
                      ? 'bg-rose-50 border-rose-200/80 text-rose-500'
                      : currentToolStatus === 'COMPLETED'
                      ? 'bg-emerald-50 border-emerald-200/80 text-emerald-600'
                      : currentToolStatus === 'RUNNING'
                      ? 'bg-blue-50 border-blue-200/80 text-blue-600'
                      : 'bg-amber-50 border-amber-200/80 text-amber-500'
                  )}
                >
                  <ToolIcon className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs md:text-sm font-bold text-slate-900">
                    {toolMeta.name}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug">
                    {toolMeta.desc}
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                {currentToolStatus === 'RUNNING' ? (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span>Running</span>
                  </span>
                ) : currentToolStatus === 'COMPLETED' ? (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Completed</span>
                  </span>
                ) : currentToolStatus === 'FAILED' ? (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Failed</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    <span>Idle</span>
                  </span>
                )}
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  {toolDurationText}
                </div>
              </div>
            </div>

            {/* Input Box (Collapsible) */}
            <div className="rounded-xl border border-slate-200/80 overflow-hidden">
              <div
                onClick={() => setIsInputExpanded(!isInputExpanded)}
                className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 cursor-pointer select-none hover:bg-slate-100/70 transition-colors"
              >
                <span className="text-xs font-semibold text-slate-800">Input</span>
                {isInputExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              {isInputExpanded && (
                <div className="p-3 bg-slate-50/40 text-[11px] font-mono text-slate-700 border-t border-slate-100 overflow-x-auto whitespace-pre leading-relaxed">
                  {currentToolArgs !== null
                    ? JSON.stringify(currentToolArgs, null, 2)
                    : '// No tool execution input arguments yet'}
                </div>
              )}
            </div>

            {/* Output (Live) Box (Collapsible) */}
            <div className="rounded-xl border border-slate-200/80 overflow-hidden">
              <div
                onClick={() => setIsOutputExpanded(!isOutputExpanded)}
                className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 cursor-pointer select-none hover:bg-slate-100/70 transition-colors"
              >
                <span className="text-xs font-semibold text-slate-800">Output (Live)</span>
                {isOutputExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              {isOutputExpanded && (
                <div
                  className={cn(
                    'p-3 text-[11px] font-mono border-t border-slate-100 overflow-x-auto whitespace-pre leading-relaxed',
                    currentToolStatus === 'FAILED'
                      ? 'bg-rose-50/40 text-rose-700'
                      : 'bg-slate-50/40 text-slate-700'
                  )}
                >
                  {currentToolError ? (
                    JSON.stringify({ error: currentToolError }, null, 2)
                  ) : currentToolStatus === 'RUNNING' && currentToolOutput === null ? (
                    '// Executing tool over self-hosted MCP protocol (:3001)...'
                  ) : currentToolOutput !== null ? (
                    typeof currentToolOutput === 'object'
                      ? JSON.stringify(currentToolOutput, null, 2)
                      : String(currentToolOutput)
                  ) : (
                    '// No tool execution output received yet'
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
