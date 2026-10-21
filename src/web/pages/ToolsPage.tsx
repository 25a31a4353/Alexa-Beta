import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Search,
  Wrench,
  Settings,
  ArrowRight,
  Network,
  Play,
  Check,
  BarChart2,
  Sliders,
  Box,
  Database,
  RefreshCw,
  AlertTriangle,
  Code,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Terminal,
  X,
  Copy,
  Zap
} from 'lucide-react';
import { listTools, getHealth, executeTool, createMission } from '../api/client';
import { McpTool } from '../types';
import { useRouter } from '../state/router';
import { AmazonSmileArrow } from '../components/ui/AmazonBranding';
import { cn } from '../lib/utils';

// Deterministic presentation metadata ONLY for known tools
const PRESENTATION_META: Record<
  string,
  {
    displayName: string;
    domain: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconBorder: string;
    iconColor: string;
    tagBg: string;
    tagColor: string;
    samplePrompt: string;
  }
> = {
  calendar_get_events: {
    displayName: 'Calendar Retrieval',
    domain: 'External Services',
    icon: Calendar,
    iconBg: 'bg-blue-50',
    iconBorder: 'border-blue-100/90',
    iconColor: 'text-blue-500',
    tagBg: 'bg-purple-50',
    tagColor: 'text-purple-600',
    samplePrompt: 'Check my upcoming calendar events and identify the meetings I need to prepare for.'
  },
  knowledge_search: {
    displayName: 'Knowledge Search',
    domain: 'Knowledge',
    icon: Search,
    iconBg: 'bg-amber-50',
    iconBorder: 'border-amber-100/90',
    iconColor: 'text-amber-500',
    tagBg: 'bg-amber-50/70',
    tagColor: 'text-amber-700',
    samplePrompt: 'Search my knowledge base for information relevant to my upcoming work.'
  },
  document_analyze: {
    displayName: 'Document Analysis',
    domain: 'Knowledge',
    icon: FileText,
    iconBg: 'bg-amber-50',
    iconBorder: 'border-amber-100/90',
    iconColor: 'text-amber-500',
    tagBg: 'bg-slate-100',
    tagColor: 'text-slate-600',
    samplePrompt: 'Analyze the relevant documents and identify key points, risks, and action items.'
  },
  ping: {
    displayName: 'System Diagnostic (Ping)',
    domain: 'System',
    icon: Wrench,
    iconBg: 'bg-emerald-50',
    iconBorder: 'border-emerald-100/90',
    iconColor: 'text-emerald-500',
    tagBg: 'bg-emerald-50',
    tagColor: 'text-emerald-700',
    samplePrompt: 'Run an end-to-end diagnostic ping check on self-hosted MCP server and report transport health.'
  }
};

// Planned capabilities clearly isolated from real executable MCP tools
const ROADMAP_CAPABILITIES = [
  {
    id: 'plan-task-mgmt',
    name: 'Task Management',
    description: 'Autonomous task breakdown with dependency graphing and milestone tracking.',
    domain: 'Planning',
    icon: Sliders
  },
  {
    id: 'plan-data-analysis',
    name: 'Data Analysis',
    description: 'Ad-hoc multi-dimensional SQL querying, anomaly detection, and charts.',
    domain: 'Data',
    icon: Database
  },
  {
    id: 'plan-notifications',
    name: 'Notification Dispatch',
    description: 'Multi-channel outbound notifications across Slack, Email, and SMS gateways.',
    domain: 'External Services',
    icon: Network
  }
];

export const ToolsPage: React.FC = () => {
  const { navigate } = useRouter();
  const [tools, setTools] = useState<McpTool[]>([]);
  const [serverUrl, setServerUrl] = useState<string>('http://127.0.0.1:3001/mcp');
  const [mcpStatus, setMcpStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('All Tools');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectedToolName, setInspectedToolName] = useState<string | null>(null);

  // Load real tools dynamically from Application API -> MCP tools/list
  const fetchToolsData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [toolsData, healthData] = await Promise.all([
        listTools(),
        getHealth().catch(() => ({ mcpStatus: 'offline', status: 'error', service: 'api' }))
      ]);

      setTools(toolsData.tools || []);
      if (toolsData.serverUrl) setServerUrl(toolsData.serverUrl);
      setMcpStatus(healthData.mcpStatus === 'online' ? 'online' : 'offline');
    } catch (err: any) {
      console.warn('[ToolsPage] Failed to fetch tools from MCP:', err);
      setError(err.message || 'MCP Server is currently unreachable.');
      setMcpStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchToolsData();
  }, []);

  // Compute dynamic category pills from real tools
  const dynamicCategories = useMemo(() => {
    const domains = Array.from(new Set(tools.map((t) => t.domain || 'System')));
    return ['All Tools', ...domains];
  }, [tools]);

  // Filter tools based on category pill and search query
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const toolDomain = tool.domain || 'System';
      const matchesCategory =
        selectedCategory === 'All Tools' || toolDomain.toLowerCase() === selectedCategory.toLowerCase();
      const meta = PRESENTATION_META[tool.name];
      const displayName = meta?.displayName || tool.name;

      const matchesSearch =
        !searchQuery.trim() ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [tools, selectedCategory, searchQuery]);

  // Interactive Direct Tool Runner state
  const [activeRunningTool, setActiveRunningTool] = useState<McpTool | null>(null);
  const [toolArgsText, setToolArgsText] = useState<string>('{}');
  const [isExecutingTool, setIsExecutingTool] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Action: Open interactive tool runner
  const handleUseTool = (tool: McpTool) => {
    setActiveRunningTool(tool);
    setExecutionResult(null);
    setExecutionError(null);

    let defaultArgs = {};
    if (tool.name === 'calendar_get_events') {
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      defaultArgs = {
        startDate: now.toISOString(),
        endDate: nextWeek.toISOString(),
        query: 'Product Roadmap'
      };
    } else if (tool.name === 'knowledge_search') {
      defaultArgs = {
        query: 'Roadmap',
        category: 'all',
        limit: 5
      };
    } else if (tool.name === 'document_analyze') {
      defaultArgs = {
        documentIds: ['doc-roadmap-01'],
        analysisType: 'all'
      };
    } else if (tool.name === 'ping') {
      defaultArgs = {
        message: 'Direct probe from Tools console'
      };
    }
    setToolArgsText(JSON.stringify(defaultArgs, null, 2));
  };

  const handleExecuteLive = async () => {
    if (!activeRunningTool) return;
    setIsExecutingTool(true);
    setExecutionError(null);
    setExecutionResult(null);

    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(toolArgsText);
      } catch (pErr: any) {
        throw new Error(`Invalid JSON arguments: ${pErr.message}`);
      }

      const res = await executeTool(activeRunningTool.name, parsedArgs);
      setExecutionResult(res);
    } catch (err: any) {
      setExecutionError(err?.message || 'Tool execution failed');
    } finally {
      setIsExecutingTool(false);
    }
  };

  const handleLaunchAutonomous = () => {
    if (!activeRunningTool) return;
    const meta = PRESENTATION_META[activeRunningTool.name];
    const prompt = meta?.samplePrompt || `Execute ${activeRunningTool.name} tool and synthesize results.`;
    navigate(`/new?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* =========================================================================
            1. TOP HEADER: Title, Real MCP Health Status & Refresh
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Tools
              </h1>
              {/* Dynamic executable tools count badge */}
              {!isLoading && !error && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {tools.length} Executable Tools
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Live capabilities discovered over self-hosted Model Context Protocol (MCP) stream.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto">
            {/* Live MCP Server Status Indicator */}
            <div className="inline-flex items-center space-x-2 bg-white border border-slate-200/90 text-xs px-3 py-1.5 rounded-xl shadow-2xs font-medium text-slate-700">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  mcpStatus === 'online'
                    ? 'bg-emerald-500'
                    : mcpStatus === 'offline'
                    ? 'bg-rose-500'
                    : 'bg-amber-400 animate-pulse'
                )}
              />
              <span className="font-mono text-[11px]">
                {mcpStatus === 'online' ? 'MCP Online (:3001)' : 'MCP Offline'}
              </span>
            </div>

            {/* Refresh Tool Catalog Action */}
            <button
              onClick={fetchToolsData}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs transition-colors disabled:opacity-50"
              title="Refresh MCP tool catalog"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', isLoading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. HERO BANNER: Dark Atmospheric Card with Amazon Smile & Floating Icons
            ========================================================================= */}
        <div className="bg-[#0B1120] rounded-2xl border border-[#162035] p-6 md:p-8 shadow-xs relative overflow-hidden text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left Text & CTA */}
          <div className="space-y-2 z-10 max-w-xl">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Multiple capabilities. One intelligent agent.
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Alexa+ autonomously discovers, interrogates, and executes the right tools over Streamable HTTP.
            </p>
            <div className="pt-2 flex items-center space-x-3">
              <button
                onClick={() => setSelectedCategory('All Tools')}
                className="inline-flex items-center space-x-2 bg-[#131D33] hover:bg-[#1A2845] border border-blue-500/30 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-2xs group"
              >
                <span>View {tools.length} discovered tools</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <span className="text-[11px] text-slate-400 font-mono">
                transport: streamable_http
              </span>
            </div>
          </div>

          {/* Right Visual: Glowing Amazon Smile curve with floating capability badges */}
          <div className="relative w-full md:w-80 h-28 flex items-center justify-end z-10 pr-2">
            <div className="absolute right-0 bottom-2 w-64 pointer-events-none">
              <AmazonSmileArrow className="w-full text-[#FF9900] drop-shadow-[0_2px_12px_rgba(255,153,0,0.6)]" />
            </div>

            {/* Floating neon icons */}
            <div className="flex items-center space-x-4 mb-3 mr-6 z-10">
              <div className="w-10 h-10 rounded-xl bg-[#111A2E]/90 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10 backdrop-blur-xs">
                <Box className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#111A2E]/90 border border-blue-400/50 text-blue-300 flex items-center justify-center shadow-lg shadow-blue-400/10 backdrop-blur-xs -translate-y-2">
                <Calendar className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#111A2E]/90 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10 backdrop-blur-xs translate-y-1">
                <FileText className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>
          </div>

        </div>

        {/* =========================================================================
            3. FILTER TABS BAR & SEARCH INPUT
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          
          {/* Dynamic Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {dynamicCategories.map((cat) => {
              const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap',
                    isActive
                      ? 'bg-blue-100/80 text-blue-600 font-semibold shadow-2xs border border-blue-200/80'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Box on Right */}
          <div className="relative flex-shrink-0 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search MCP tools..."
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400 font-medium"
            />
          </div>

        </div>

        {/* =========================================================================
            4. ACTIVE MCP EXECUTABLE TOOLS GRID
            ========================================================================= */}
        {isLoading ? (
          // Loading Skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 animate-pulse h-36"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-100 rounded-md w-1/3" />
                    <div className="h-3 bg-slate-100 rounded-md w-3/4" />
                  </div>
                </div>
                <div className="pt-2 flex justify-between">
                  <div className="h-4 bg-slate-100 rounded-md w-16" />
                  <div className="h-4 bg-slate-100 rounded-md w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Honest MCP Unavailable State
          <div className="bg-white rounded-2xl border border-rose-200/90 shadow-xs p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900">
                MCP Server Unavailable
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Unable to discover tools over Streamable HTTP at <span className="font-mono text-slate-700">{serverUrl}</span>.
                Ensure the MCP daemon is running and accessible.
              </p>
            </div>
            <div>
              <button
                onClick={fetchToolsData}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        ) : filteredTools.length === 0 ? (
          // Empty Search / Filter State
          <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-2">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No matching tools found</h3>
            <p className="text-xs text-slate-400">
              No discovered MCP tools match your query: "{searchQuery}".
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Discovered Executable MCP Tools ({filteredTools.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Source: Streamable HTTP (:3001)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTools.map((tool) => {
                const meta = PRESENTATION_META[tool.name];
                const displayName = meta?.displayName || tool.name;
                const Icon = meta?.icon || Wrench;
                const iconBg = meta?.iconBg || 'bg-slate-50';
                const iconBorder = meta?.iconBorder || 'border-slate-200';
                const iconColor = meta?.iconColor || 'text-slate-600';
                const tagBg = meta?.tagBg || 'bg-slate-100';
                const tagColor = meta?.tagColor || 'text-slate-600';
                const isInspected = inspectedToolName === tool.name;

                return (
                  <div
                    key={tool.name}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:border-blue-400/80 hover:shadow-sm transition-all group flex flex-col justify-between"
                  >
                    {/* Top: Icon + Title & Real MCP Description */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3.5">
                          <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-2xs', iconBg, iconBorder, iconColor)}>
                            <Icon className="w-5 h-5 stroke-[2]" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {displayName}
                              </h3>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                {tool.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-snug">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Schema Inspection Drawer (Optional/Expandable) */}
                      {isInspected && tool.inputSchema && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] font-mono text-slate-700 overflow-x-auto">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Input Schema:
                          </div>
                          <pre className="whitespace-pre leading-relaxed">
                            {JSON.stringify(tool.inputSchema, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Domain Tag, Schema Toggle & Use Action */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-50">
                      <div className="flex items-center space-x-2">
                        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-md', tagBg, tagColor)}>
                          {tool.domain || 'System'}
                        </span>
                        {tool.inputSchema && (
                          <button
                            onClick={() => setInspectedToolName(isInspected ? null : tool.name)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 font-mono inline-flex items-center space-x-1"
                          >
                            <span>Schema</span>
                            {isInspected ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleUseTool(tool)}
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors group-hover:translate-x-0.5"
                      >
                        <span>Use</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            5. ROADMAP CAPABILITIES (Explicitly Labeled as Planned / Non-Executable)
            ========================================================================= */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Roadmap Capabilities (Planned)
            </span>
            <span className="text-[11px] text-slate-400">
              Not yet registered on MCP server
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-75">
            {ROADMAP_CAPABILITIES.map((cap) => {
              const CapIcon = cap.icon;
              return (
                <div
                  key={cap.id}
                  className="bg-white/80 rounded-2xl border border-dashed border-slate-300 p-4 flex flex-col justify-between h-[120px]"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                      <CapIcon className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs font-semibold text-slate-700 truncate">
                          {cap.name}
                        </h4>
                        <span className="text-[9px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded">
                          PLANNED
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                        {cap.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>{cap.domain}</span>
                    <span className="italic">Unavailable</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            6. BOTTOM PIPELINE BANNER: Tool Orchestration Flow
            ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          
          {/* Left Title & Subtitle */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-2xs">
              <Network className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tool Orchestration Pipeline
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Alexa+ AgentOrchestrator discovers and executes MCP tools over Streamable HTTP.
              </p>
            </div>
          </div>

          {/* Right Pipeline Stepper: Discover Tools ➔ Select ➔ Execute ➔ Verify ➔ Deliver Results */}
          <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4 overflow-x-auto pt-2 lg:pt-0">
            
            {/* Step 1: Discover Tools */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full border border-blue-200 bg-blue-50/70 text-blue-600 flex items-center justify-center shadow-2xs">
                <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-medium text-slate-700 mt-1 whitespace-nowrap">Discover Tools</span>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 -mt-3" />

            {/* Step 2: Select */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full border border-blue-200 bg-blue-50/70 text-blue-600 flex items-center justify-center shadow-2xs">
                <Sliders className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-medium text-slate-700 mt-1 whitespace-nowrap">Select</span>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 -mt-3" />

            {/* Step 3: Execute */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full border border-blue-200 bg-blue-50/70 text-blue-600 flex items-center justify-center shadow-2xs">
                <Play className="w-3.5 h-3.5 stroke-[2.5] fill-blue-600" />
              </div>
              <span className="text-[10px] font-medium text-slate-700 mt-1 whitespace-nowrap">Execute</span>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 -mt-3" />

            {/* Step 4: Verify */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="text-[10px] font-medium text-slate-700 mt-1 whitespace-nowrap">Verify</span>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 -mt-3" />

            {/* Step 5: Deliver Results */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full border border-blue-200 bg-blue-50/70 text-blue-600 flex items-center justify-center shadow-2xs">
                <BarChart2 className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-medium text-slate-700 mt-1 whitespace-nowrap">Deliver Results</span>
            </div>

          </div>

        </div>

      </div>

      {/* =========================================================================
          7. DIRECT INTERACTIVE MCP TOOL RUNNER MODAL
          ========================================================================= */}
      {activeRunningTool && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100/70 border border-blue-200/80 flex items-center justify-center text-blue-600">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900 font-mono">
                      {activeRunningTool.name}
                    </h3>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      Live MCP
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {activeRunningTool.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveRunningTool(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                    <span>Input Arguments (JSON)</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    Schema validated by MCP server
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={toolArgsText}
                  onChange={(e) => setToolArgsText(e.target.value)}
                  className="w-full font-mono text-xs bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-none"
                  placeholder="{}"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleLaunchAutonomous}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center space-x-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-600" />
                  <span>Launch as Autonomous Mission</span>
                </button>

                <button
                  type="button"
                  onClick={handleExecuteLive}
                  disabled={isExecutingTool}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center space-x-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {isExecutingTool ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing on MCP :3001...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Execute Tool Now</span>
                    </>
                  )}
                </button>
              </div>

              {/* Execution Error Banner */}
              {executionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                  <span className="font-mono">{executionError}</span>
                </div>
              )}

              {/* Execution Result Terminal */}
              {executionResult && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Execution Result</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Duration: {executionResult.durationMs}ms
                    </span>
                  </div>
                  <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto max-h-60 border border-slate-800 leading-relaxed whitespace-pre-wrap">
                    {executionResult.parsed
                      ? JSON.stringify(executionResult.parsed, null, 2)
                      : executionResult.output || 'Tool completed with no textual output.'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
