import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart2,
  Calendar,
  MessageSquare,
  Compass,
  Wrench,
  Network,
  FileText,
  CheckSquare,
  CheckCircle2,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  AlertTriangle,
  Search,
  RefreshCw,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { getActivity } from '../api/client';
import { ActivityResponse, ActivityEvent } from '../types';
import { cn } from '../lib/utils';

// Helper to format ISO timestamps realistically into readable string
function formatActivityTime(isoString?: string): string {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return isoString;
  }
}

// Friendly tool presentation mapping
function getToolMeta(toolName: string) {
  switch (toolName) {
    case 'calendar_get_events':
      return { name: 'Calendar Retrieval', icon: Calendar, iconBg: 'bg-blue-50', iconColor: 'text-blue-500' };
    case 'knowledge_search':
      return { name: 'Knowledge Search', icon: Search, iconBg: 'bg-amber-50', iconColor: 'text-amber-500' };
    case 'document_analyze':
      return { name: 'Document Analysis', icon: FileText, iconBg: 'bg-purple-50', iconColor: 'text-purple-500' };
    case 'ping':
      return { name: 'System Diagnostic', icon: Wrench, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' };
    default:
      return {
        name: toolName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        icon: Wrench,
        iconBg: 'bg-slate-50',
        iconColor: 'text-slate-600'
      };
  }
}

// Helper to derive presentation visual attributes from real persisted event
function getEventVisuals(event: ActivityEvent) {
  const evtType = event.event_type || (event as any).eventType || '';
  const status = event.status || 'INFO';

  if (status === 'ERROR' || evtType === 'mission.failed' || evtType === 'tool.failed') {
    return {
      dotColor: 'bg-rose-500',
      icon: AlertTriangle,
      iconBg: 'bg-rose-50 border-rose-200/80',
      iconColor: 'text-rose-600',
      tag: 'Error',
      tagBg: 'bg-rose-50 border-rose-200/80',
      tagColor: 'text-rose-700'
    };
  }

  if (evtType === 'mission.completed') {
    return {
      dotColor: 'bg-emerald-500',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 border-emerald-100',
      iconColor: 'text-emerald-500',
      tag: 'Mission',
      tagBg: 'bg-emerald-50 border-emerald-200/80',
      tagColor: 'text-emerald-700'
    };
  }

  if (evtType.startsWith('tool.')) {
    const isSuccess = evtType === 'tool.completed';
    return {
      dotColor: isSuccess ? 'bg-emerald-500' : 'bg-blue-500',
      icon: Wrench,
      iconBg: 'bg-amber-50 border-amber-100',
      iconColor: 'text-amber-500',
      tag: 'Tool',
      tagBg: 'bg-amber-50 border-amber-200/80',
      tagColor: 'text-amber-700'
    };
  }

  if (evtType.startsWith('verification.')) {
    return {
      dotColor: 'bg-purple-500',
      icon: ShieldCheck,
      iconBg: 'bg-purple-50 border-purple-100',
      iconColor: 'text-purple-500',
      tag: 'Verification',
      tagBg: 'bg-purple-50 border-purple-200/80',
      tagColor: 'text-purple-700'
    };
  }

  if (evtType === 'plan.created') {
    return {
      dotColor: 'bg-blue-500',
      icon: Layers,
      iconBg: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-500',
      tag: 'Planning',
      tagBg: 'bg-blue-50 border-blue-200/80',
      tagColor: 'text-blue-700'
    };
  }

  if (evtType === 'mission.started' || evtType === 'understanding.completed') {
    return {
      dotColor: 'bg-blue-500',
      icon: Compass,
      iconBg: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-500',
      tag: 'Mission',
      tagBg: 'bg-blue-50 border-blue-200/80',
      tagColor: 'text-blue-700'
    };
  }

  return {
    dotColor: 'bg-slate-400',
    icon: Clock,
    iconBg: 'bg-slate-50 border-slate-200',
    iconColor: 'text-slate-600',
    tag: event.domain || 'System',
    tagBg: 'bg-slate-50 border-slate-200',
    tagColor: 'text-slate-600'
  };
}

export const ActivityPage: React.FC = () => {
  const [activityData, setActivityData] = useState<ActivityResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<string>('All Time');
  const [inspectedEventId, setInspectedEventId] = useState<string | null>(null);

  // Filter category state
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({
    Missions: true,
    'Tool Actions': true,
    Planning: true,
    Verification: true,
    'Errors / Alerts': true
  });

  // Load genuine activity events from SQLite backend
  const loadActivityData = async () => {
    setIsLoading(true);
    try {
      const res = await getActivity();
      setActivityData(res);
    } catch (err) {
      console.warn('[ActivityPage] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivityData();
  }, []);

  // Real metric counts directly from SQLite persistence
  const totalActivitiesCount = activityData?.metrics?.totalActivities ?? 0;
  const missionsCount = activityData?.metrics?.missionsCount ?? 0;
  const toolActionsCount = activityData?.metrics?.toolActionsCount ?? 0;
  const integrationsCount = activityData?.metrics?.integrationsCount ?? 0;

  // Toggle filter checkbox
  const toggleFilter = (type: string) => {
    setSelectedTypes((prev) => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSelectAll = () => {
    setSelectedTypes({
      Missions: true,
      'Tool Actions': true,
      Planning: true,
      Verification: true,
      'Errors / Alerts': true
    });
  };

  const handleClearAll = () => {
    setSelectedTypes({
      Missions: false,
      'Tool Actions': false,
      Planning: false,
      Verification: false,
      'Errors / Alerts': false
    });
  };

  // Filtered real events list
  const filteredEvents = useMemo(() => {
    const rawEvents = activityData?.events || [];

    return rawEvents.filter((item) => {
      const evtType = item.event_type || (item as any).eventType || '';
      const isError = item.status === 'ERROR' || evtType === 'mission.failed' || evtType === 'tool.failed';
      const isMission = evtType.startsWith('mission.') || item.domain === 'Mission';
      const isTool = evtType.startsWith('tool.') || item.domain === 'Tool';
      const isPlan = evtType === 'plan.created' || evtType === 'step.started' || evtType === 'understanding.completed';
      const isVerify = evtType.startsWith('verification.') || item.domain === 'Verification';

      // Type filtering
      let matchesType = false;
      if (isError && selectedTypes['Errors / Alerts']) matchesType = true;
      else if (isMission && selectedTypes['Missions']) matchesType = true;
      else if (isTool && selectedTypes['Tool Actions']) matchesType = true;
      else if (isPlan && selectedTypes['Planning']) matchesType = true;
      else if (isVerify && selectedTypes['Verification']) matchesType = true;
      else if (!isError && !isMission && !isTool && !isPlan && !isVerify) matchesType = true;

      if (!matchesType) return false;

      // Search filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesTypeStr = evtType.toLowerCase().includes(q);
        const matchesMissionId = item.mission_id?.toLowerCase().includes(q);
        const matchesToolName = (item.metadata as any)?.toolName?.toLowerCase()?.includes(q);

        if (!matchesTitle && !matchesDesc && !matchesTypeStr && !matchesMissionId && !matchesToolName) {
          return false;
        }
      }

      return true;
    });
  }, [activityData?.events, selectedTypes, searchQuery]);

  // Top Tools Used data derived directly from tool_executions in SQLite
  const topTools = useMemo(() => {
    const tools = activityData?.topTools || [];
    if (tools.length === 0) return [];
    const maxCount = Math.max(...tools.map((t) => t.count), 1);

    return tools.map((t) => {
      const meta = getToolMeta(t.tool_name);
      const widthPct = Math.max(12, Math.round((t.count / maxCount) * 100));
      return {
        name: meta.name,
        rawName: t.tool_name,
        icon: meta.icon,
        iconBg: meta.iconBg,
        iconColor: meta.iconColor,
        count: t.count,
        width: `${widthPct}%`
      };
    });
  }, [activityData?.topTools]);

  return (
    <div className="min-h-full bg-[#F8FAFC] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* =========================================================================
            1. TOP HEADER: Title, Subtitle, Search & Refresh Action
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-2xs">
              <BarChart2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Activity
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  SQLite Audit Log
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Authoritative execution history, operational telemetry, and tool activity across Alexa+.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto">
            {/* Search Input in Header */}
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail..."
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400 font-medium"
              />
            </div>

            {/* Refresh Action */}
            <button
              onClick={loadActivityData}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs transition-colors disabled:opacity-50"
              title="Refresh activity audit trail"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', isLoading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. TOP ROW OF 4 STAT CARDS WITH SVG SPARKLINE GRAPHS (REAL PERSISTED METRICS)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Activities (Blue Graph) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/90 flex items-center justify-center text-blue-500 flex-shrink-0">
                <MessageSquare className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-slate-900 leading-none">
                  {totalActivitiesCount}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  Total Activities
                </div>
              </div>
            </div>

            {/* Blue Sparkline Wave Graph */}
            <div className="w-20 h-10 flex-shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 80 40">
                <path
                  d="M 2 30 Q 20 34, 35 24 T 55 18 T 78 6"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 2: Missions (Green Graph) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/90 flex items-center justify-center text-emerald-500 flex-shrink-0">
                <Compass className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-slate-900 leading-none">
                  {missionsCount}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  Missions
                </div>
              </div>
            </div>

            {/* Green Sparkline Wave Graph */}
            <div className="w-20 h-10 flex-shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 80 40">
                <path
                  d="M 2 28 Q 18 32, 34 20 T 54 10 T 78 18"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 3: Tool Actions (Purple Graph) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100/90 flex items-center justify-center text-purple-500 flex-shrink-0">
                <Wrench className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-slate-900 leading-none">
                  {toolActionsCount}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  Tool Actions
                </div>
              </div>
            </div>

            {/* Purple Sparkline Wave Graph */}
            <div className="w-20 h-10 flex-shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 80 40">
                <path
                  d="M 2 24 Q 22 12, 44 26 T 64 8 T 78 20"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 4: Integrations (Amber Graph) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100/90 flex items-center justify-center text-amber-500 flex-shrink-0">
                <Network className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-slate-900 leading-none">
                  {integrationsCount}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  Connected Integrations
                </div>
              </div>
            </div>

            {/* Amber Sparkline Wave Graph */}
            <div className="w-20 h-10 flex-shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 80 40">
                <path
                  d="M 2 26 Q 24 28, 46 16 T 68 18 T 78 8"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

        </div>

        {/* =========================================================================
            3. MAIN TWO-COLUMN SPLIT
            Left: Recent Activity Timeline (Grounded in SQLite activity_events)
            Right: Activity Filters & Top Tools Used Breakdown
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* ==================== LEFT COLUMN: Recent Activity Timeline ==================== */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm md:text-base font-bold text-slate-900">
                  Recent Activity Audit Trail
                </h2>
                <p className="text-xs text-slate-500">
                  Showing {filteredEvents.length} of {totalActivitiesCount} recorded events
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                WAL mode persistence
              </span>
            </div>

            {/* Connected Vertical Timeline */}
            {isLoading ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading audit trail from database...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No matching activity records</h3>
                <p className="text-xs text-slate-400">
                  Try adjusting your filter checkboxes or clearing your search query.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 pt-2">
                {/* Continuous vertical connector line */}
                <div className="absolute left-[13px] top-4 bottom-5 w-[1.5px] bg-slate-200/80" />

                {filteredEvents.map((item) => {
                  const visuals = getEventVisuals(item);
                  const Icon = visuals.icon;
                  const isInspected = inspectedEventId === item.id;
                  const timeFormatted = formatActivityTime(item.created_at);

                  return (
                    <div key={item.id} className="relative flex flex-col group">
                      
                      <div className="flex items-center justify-between gap-3">
                        {/* Left dot on timeline */}
                        <div className={cn('absolute -left-[18px] w-2.5 h-2.5 rounded-full ring-4 ring-white z-10', visuals.dotColor)} />

                        {/* Middle: Icon + Title & Description */}
                        <div className="flex items-center space-x-3.5 truncate mr-2 flex-1">
                          <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-2xs', visuals.iconBg, visuals.iconColor)}>
                            <Icon className="w-4 h-4 stroke-[2]" />
                          </div>

                          <div className="truncate">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate">
                                {item.title}
                              </h3>
                              {item.mission_id && (
                                <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
                                  ({item.mission_id.substring(0, 14)}...)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Right: Timestamp & Tag Pill */}
                        <div className="flex items-center space-x-3 flex-shrink-0 text-right">
                          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                            {timeFormatted}
                          </span>
                          <span className={cn('text-[10px] font-semibold px-2.5 py-0.5 rounded-full border', visuals.tagBg, visuals.tagColor)}>
                            {visuals.tag}
                          </span>
                          <button
                            onClick={() => setInspectedEventId(isInspected ? null : item.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                            title="Inspect event payload"
                          >
                            {isInspected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Operational Telemetry Payload Drawer */}
                      {isInspected && (
                        <div className="ml-12 mt-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-[11px] font-mono text-slate-700 space-y-1.5 overflow-x-auto">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-200/60 pb-1">
                            <span>EVENT ID: {item.id}</span>
                            <span>TYPE: {item.event_type}</span>
                          </div>
                          {item.mission_id && <div>mission_id: {item.mission_id}</div>}
                          {item.conversation_id && <div>conversation_id: {item.conversation_id}</div>}
                          <div>timestamp: {item.created_at}</div>
                          {item.metadata && (
                            <div className="pt-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Payload:</span>
                              <pre className="mt-0.5 whitespace-pre leading-relaxed text-slate-600">
                                {JSON.stringify(item.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}

              </div>
            )}

          </div>

          {/* ==================== RIGHT COLUMN: Filters & Top Tools Used ==================== */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Card A: Activity Filters */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs md:text-sm">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span>Activity Filters</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Activity Type Checkboxes */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Event Domain Filter
                </div>
                
                {['Missions', 'Tool Actions', 'Planning', 'Verification', 'Errors / Alerts'].map((type) => {
                  const isChecked = !!selectedTypes[type];
                  return (
                    <div
                      key={type}
                      onClick={() => toggleFilter(type)}
                      className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer select-none py-1 group"
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0',
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 group-hover:border-blue-400 bg-white'
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-medium text-slate-700">{type}</span>
                    </div>
                  );
                })}
              </div>

              {/* Persistence Details */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Persistence Store:</span>
                  <span className="font-mono font-medium text-slate-700">SQLite (activity_events)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Data Integrity:</span>
                  <span className="font-medium text-emerald-600">Survives Restarts</span>
                </div>
              </div>

            </div>

            {/* Card B: Top Tools Used (Horizontal Usage Breakdown Grounded in tool_executions) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs md:text-sm">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>Top Tools Used</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  tool_executions
                </span>
              </div>

              {/* Progress Bars for Real Tools */}
              {topTools.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No tool executions recorded yet.
                </div>
              ) : (
                <div className="space-y-3.5 pt-1">
                  {topTools.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <div key={tool.rawName} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 truncate">
                            <div className={cn('w-5 h-5 rounded flex items-center justify-center flex-shrink-0', tool.iconBg, tool.iconColor)}>
                              <ToolIcon className="w-3 h-3 stroke-[2.2]" />
                            </div>
                            <span className="font-semibold text-slate-800 truncate">{tool.name}</span>
                          </div>
                          <span className="font-mono text-slate-600 font-bold text-[11px] ml-2 flex-shrink-0">
                            {tool.count} calls
                          </span>
                        </div>

                        {/* Blue Progress Bar Track */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: tool.width }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
