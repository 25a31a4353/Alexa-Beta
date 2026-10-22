import React, { useEffect, useState, useMemo } from 'react';
import {
  Network,
  ArrowRight,
  MoreVertical,
  Check,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Info,
  X,
  Plus,
  Wrench,
  Clock,
  Key,
  CheckCircle2,
  Trash2,
  Zap,
  ChevronRight,
  Filter
} from 'lucide-react';
import { AmazonSmileArrow } from '../components/ui/AmazonBranding';
import {
  listIntegrations,
  getIntegration,
  connectIntegration,
  disconnectIntegration,
  IntegrationDetailResponse,
  ListIntegrationsResponse
} from '../api/client';
import { Integration, IntegrationStatus } from '../types';
import { cn } from '../lib/utils';
import { PLUGIN_CATEGORIES, PLUGINS_DATA, PluginItem } from '../data/pluginsCatalog';

import {
  getIntegrationLogo,
  GoogleCalendarLogo,
  GoogleDriveLogo,
  NotionLogo,
  FigmaLogo,
  SlackLogo
} from '../data/integrationLogos';

function renderPluginIcon(plugin: PluginItem) {
  const Logo = getIntegrationLogo(plugin.id, plugin.name);
  return <Logo className="w-7 h-7 flex-shrink-0" />;
}

export const IntegrationsPage: React.FC = () => {
  const [dbIntegrations, setDbIntegrations] = useState<Integration[]>([]);
  const [counts, setCounts] = useState({ genuineConnectedCount: 0, demoCount: 2, total: 103, availableCount: 101 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal inspection states
  const [selectedPlugin, setSelectedPlugin] = useState<PluginItem | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<IntegrationDetailResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [accountEmailInput, setAccountEmailInput] = useState<string>('shanmukheswaramedicharla@gmail.com');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectMessage, setConnectMessage] = useState<string | null>(null);

  const [lastLiveTelemetry, setLastLiveTelemetry] = useState<{
    toolName?: string;
    timestamp?: string;
  } | null>(null);

  const fetchIntegrations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: ListIntegrationsResponse = await listIntegrations();
      setDbIntegrations(data.integrations || []);
      setCounts({
        genuineConnectedCount: data.genuineConnectedCount ?? 0,
        demoCount: data.demoCount ?? 2,
        total: data.total ?? 103,
        availableCount: data.availableCount ?? 101
      });
    } catch (err: any) {
      console.warn('[IntegrationsPage] Failed to fetch integrations:', err);
      setError(err.message || 'Unable to load integrations matrix.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();

    // Check for OAuth callback status in URL hash
    const hash = window.location.hash || '';
    if (hash.includes('connected=google')) {
      setConnectMessage('Successfully authenticated with Google OAuth! Google Calendar, Gmail, and Drive are now active.');
      window.history.replaceState(null, '', window.location.pathname + '#/integrations');
      fetchIntegrations();
    } else if (hash.includes('connected=microsoft')) {
      setConnectMessage('Successfully authenticated with Microsoft 365 OAuth! Microsoft Outlook and Calendar are now active.');
      window.history.replaceState(null, '', window.location.pathname + '#/integrations');
      fetchIntegrations();
    } else if (hash.includes('error=')) {
      const match = hash.match(/error=([^&]+)/);
      if (match) {
        setError(`OAuth Authorization Error: ${decodeURIComponent(match[1])}`);
      }
      window.history.replaceState(null, '', window.location.pathname + '#/integrations');
    }

    // Subscribe to real-time application telemetry via global SSE
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events/stream');
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.eventType?.startsWith('tool.')) {
            setLastLiveTelemetry({
              toolName: data.metadata?.toolName || data.title,
              timestamp: data.timestamp || new Date().toISOString()
            });
          } else if (data.eventType?.startsWith('integration.')) {
            fetchIntegrations();
          }
        } catch {}
      };
      es.addEventListener('tool.executing', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          setLastLiveTelemetry({
            toolName: data.metadata?.toolName || data.title,
            timestamp: data.timestamp || new Date().toISOString()
          });
        } catch {}
      });
      es.addEventListener('tool.completed', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          setLastLiveTelemetry({
            toolName: data.metadata?.toolName || data.title,
            timestamp: data.timestamp || new Date().toISOString()
          });
        } catch {}
      });
    } catch {}

    return () => {
      es?.close();
    };
  }, []);

  // Merge static catalog with live DB status
  const mergedCatalog: PluginItem[] = useMemo(() => {
    const dbMap = new Map<string, Integration>();
    dbIntegrations.forEach((item) => dbMap.set(item.id, item));

    return PLUGINS_DATA.map((staticItem) => {
      const dbMatch = dbMap.get(staticItem.id);
      if (dbMatch) {
        return {
          ...staticItem,
          status: dbMatch.status,
          account_email: dbMatch.account_email
        };
      }
      return staticItem;
    });
  }, [dbIntegrations]);

  // Installed (Demo / Connected) plugins for quick-access shelf
  const installedPlugins = useMemo(() => {
    return mergedCatalog.filter(
      (p) => p.status === 'CONNECTED' || p.status === 'DEMO'
    );
  }, [mergedCatalog]);

  // Filtered by Search & Category
  const filteredList = useMemo(() => {
    let list = mergedCatalog;

    if (activeCategory === 'Installed') {
      list = list.filter((p) => p.status === 'CONNECTED' || p.status === 'DEMO');
    } else if (activeCategory !== 'All') {
      list = list.filter((p) => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.mcpTool && p.mcpTool.toLowerCase().includes(q))
      );
    }

    return list;
  }, [mergedCatalog, activeCategory, searchQuery]);

  // Group filtered results by official 17 categories
  const groupedCategories = useMemo(() => {
    const groups: [string, PluginItem[]][] = [];
    const targetCategories = activeCategory === 'All' || activeCategory === 'Installed'
      ? PLUGIN_CATEGORIES
      : [activeCategory];

    for (const cat of targetCategories) {
      const matches = filteredList.filter((p) => p.category === cat);
      if (matches.length > 0) {
        groups.push([cat, matches]);
      }
    }
    return groups;
  }, [filteredList, activeCategory]);

  const handleOpenPlugin = (plugin: PluginItem) => {
    setSelectedPlugin(plugin);
    setSelectedDetail(null);
    setConnectMessage(null);
    setApiKeyInput('');
    setAccountEmailInput(plugin.account_email || 'shanmukheswaramedicharla@gmail.com');
    setIsDetailLoading(true);

    getIntegration(plugin.id)
      .then((detail) => setSelectedDetail(detail))
      .catch((err) => {
        console.warn('[IntegrationsPage] Failed to fetch integration detail:', err);
      })
      .finally(() => {
        setIsDetailLoading(false);
      });
  };

  const handleConnect = async (id: string) => {
    setIsConnecting(true);
    setConnectMessage(null);
    try {
      if (id.startsWith('google') || id === 'gmail') {
        window.location.href = `/api/integrations/google/authorize?integrationId=${encodeURIComponent(id)}`;
        return;
      }
      if (id === 'outlook' || id.startsWith('microsoft')) {
        window.location.href = `/api/integrations/microsoft/authorize?integrationId=${encodeURIComponent(id)}`;
        return;
      }
      setConnectMessage('This connector is cataloged for enterprise roadmap rollout.');
    } catch (err: any) {
      setConnectMessage(`Connection failed: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    setIsConnecting(true);
    setConnectMessage(null);
    try {
      await disconnectIntegration(id);
      setConnectMessage('Plugin disconnected.');
      fetchIntegrations();
      if (selectedPlugin && selectedPlugin.id === id) {
        setSelectedPlugin({ ...selectedPlugin, status: 'AVAILABLE' });
      }
    } catch (err: any) {
      setConnectMessage(`Disconnect failed: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFC] py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* =========================================================================
            1. TOP HEADER: Title, Active Feeds Badge & MCP Telemetry
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-2xs">
              <Network className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Plugins &amp; Integrations
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  17 Categories • 103 Integrations
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                External service boundaries and Model Context Protocol (<code className="font-mono text-slate-700">MCP</code>) tool execution channels.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto">
            {/* Live Active Feeds Metric */}
            <div className="inline-flex items-center space-x-2.5 bg-white border border-slate-200/90 text-xs px-3.5 py-2 rounded-xl shadow-2xs font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800">
                {counts.genuineConnectedCount > 0 ? `${counts.genuineConnectedCount} Live OAuth • ` : ''}2 Local MCP Feeds
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-mono text-[11px]">
                {lastLiveTelemetry?.toolName ? `Live: ${lastLiveTelemetry.toolName}` : ':3001/mcp'}
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. HERO BANNER: Signature Dark Atmospheric Card with Amazon Smile & Floating Icons
            ========================================================================= */}
        <div className="bg-[#0B1120] rounded-2xl border border-[#162035] p-6 md:p-8 shadow-xs relative overflow-hidden text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute -top-12 -right-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-xl space-y-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Bridge natural language to execution.
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Alexa+ connects autonomous agent missions to real tools via the Model Context Protocol (MCP). Local calendar and knowledge repositories are indexed locally without requiring third-party cloud credentials.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>103 Plugins Cataloged Across 17 Industry Categories</span>
              </span>
            </div>
          </div>

          {/* Floating Brand Icons with Amazon Smile Arrow */}
          <div className="relative z-10 hidden sm:flex items-center space-x-2.5 p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center p-1">
              <GoogleCalendarLogo className="w-7 h-7" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center p-1">
              <GoogleDriveLogo className="w-7 h-7" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#0B0F17] shadow-sm flex items-center justify-center p-1">
              <NotionLogo className="w-7 h-7" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center p-1">
              <FigmaLogo className="w-7 h-7" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center p-1">
              <SlackLogo className="w-7 h-7" />
            </div>
            <AmazonSmileArrow className="w-24 h-4 text-[#FF9900] absolute -bottom-2 left-1/2 -translate-x-1/2" />
          </div>
        </div>

        {/* =========================================================================
            3. REAL-TIME SEARCH BAR
            ========================================================================= */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plugins, tools, descriptions, or categories..."
            className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* =========================================================================
            4. INSTALLED QUICK-ACCESS SHELF ("Installed >")
            ========================================================================= */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-wide flex items-center gap-1.5">
                <span>Installed</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </h2>
              <span className="text-[11px] text-slate-500">({installedPlugins.length} enabled)</span>
            </div>
            <button
              onClick={() => setActiveCategory(activeCategory === 'Installed' ? 'All' : 'Installed')}
              className={cn(
                "text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium",
                activeCategory === 'Installed'
                  ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {activeCategory === 'Installed' ? 'Show All Categories' : 'View Installed Only'}
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {installedPlugins.map((plugin) => (
              <button
                key={plugin.id}
                onClick={() => handleOpenPlugin(plugin)}
                className="flex items-center space-x-2.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/90 hover:border-blue-200 rounded-xl px-3 py-2 flex-shrink-0 transition-all text-left group shadow-2xs cursor-pointer"
              >
                <div className="relative">
                  {renderPluginIcon(plugin)}
                  <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 ring-2 ring-white" />
                </div>
                <div className="min-w-0 pr-1">
                  <p className="text-xs font-semibold text-slate-900 truncate max-w-[130px] group-hover:text-blue-600 transition-colors">
                    {plugin.name}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium capitalize truncate">
                    {plugin.status === 'DEMO' ? 'Local MCP Feed' : 'Connected'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================================
            5. HORIZONTAL CATEGORY FILTER PILLS
            ========================================================================= */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveCategory('All')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer border",
              activeCategory === 'All'
                ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
            )}
          >
            All Categories ({filteredList.length})
          </button>
          {PLUGIN_CATEGORIES.map((cat) => {
            const count = PLUGINS_DATA.filter((p) => p.category === cat).length;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 cursor-pointer border",
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold"
                    : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                )}
              >
                {cat} <span className={cn("text-[10px] ml-1", isActive ? "text-blue-200" : "text-slate-400")}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            6. CATEGORY SECTIONS WITH 2-COLUMN PLUGIN GRIDS
            ========================================================================= */}
        <div className="space-y-7 pt-1">
          {groupedCategories.map(([categoryName, plugins]) => (
            <div key={categoryName} className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <button
                  onClick={() => setActiveCategory(categoryName)}
                  className="flex items-center space-x-1.5 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors group cursor-pointer"
                >
                  <span className="tracking-wide">{categoryName}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </button>
                <span className="text-[11px] text-slate-400 font-medium">
                  {plugins.length} {plugins.length === 1 ? 'plugin' : 'plugins'}
                </span>
              </div>

              {/* 2-Column Grid matching reference layout in light theme */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plugins.map((plugin) => {
                  const isInstalled = plugin.status === 'CONNECTED' || plugin.status === 'DEMO';
                  return (
                    <div
                      key={plugin.id}
                      onClick={() => handleOpenPlugin(plugin)}
                      className={cn(
                        "bg-white rounded-2xl border transition-all p-3.5 flex items-center justify-between gap-3 cursor-pointer group shadow-2xs hover:shadow-xs",
                        isInstalled
                          ? "border-emerald-200/90 bg-emerald-50/15 hover:border-emerald-300"
                          : "border-slate-200/80 hover:border-blue-300"
                      )}
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <div className="flex-shrink-0">
                          {renderPluginIcon(plugin)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {plugin.name}
                            </h3>
                            {isInstalled && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                                {plugin.status === 'DEMO' ? 'Local MCP' : 'Connected'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-[280px] sm:max-w-xs md:max-w-[220px] lg:max-w-sm mt-0.5">
                            {plugin.description}
                          </p>
                        </div>
                      </div>

                      {/* Right Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPlugin(plugin);
                        }}
                        className={cn(
                          "w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all cursor-pointer border text-xs",
                          isInstalled
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                        )}
                        title={isInstalled ? "Inspect Active Integration" : "Add Integration"}
                      >
                        {isInstalled ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {groupedCategories.length === 0 && (
            <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">No plugins found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search query or select "All Categories".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="mt-4 px-4 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* =========================================================================
            7. INTERACTIVE PLUGIN DETAIL & CONNECTION MODAL
            ========================================================================= */}
        {selectedPlugin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
              className="bg-white border border-slate-200/90 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 text-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPlugin(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-start space-x-3.5 pr-8">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0">
                  {renderPluginIcon(selectedPlugin)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {selectedPlugin.name}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedPlugin.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedPlugin.description}
                  </p>
                </div>
              </div>

              {/* Capability Matrix Details */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Assigned MCP Tool:</span>
                  <code className="text-blue-700 font-mono text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedDetail?.capability?.mcpTool || selectedPlugin.mcpTool || 'None (Planned)'}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Capability Domain:</span>
                  <span className="text-slate-900 font-medium">
                    {selectedDetail?.capability?.domain || selectedPlugin.domain || selectedPlugin.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Authentication Protocol:</span>
                  <span className="text-amber-700 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {selectedDetail?.capability?.authType || selectedPlugin.authType || 'OAUTH2'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <span className={cn(
                    "font-bold text-[11px]",
                    selectedPlugin.status === 'CONNECTED' ? "text-emerald-600" :
                    selectedPlugin.status === 'DEMO' ? "text-amber-600" : "text-slate-500"
                  )}>
                    {selectedPlugin.status === 'DEMO' ? 'Local MCP Runtime Feed' :
                     selectedPlugin.status === 'CONNECTED' ? 'Verified Connected' : 'Available / Planned'}
                  </span>
                </div>
              </div>

              {/* Status Message */}
              {connectMessage && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs">
                  {connectMessage}
                </div>
              )}

              {/* Connection Controls */}
              {selectedPlugin.status === 'CONNECTED' ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    <p className="font-semibold flex items-center gap-1.5 text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Live OAuth 2.0 Connection Active
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Authenticated Account: <span className="font-mono font-bold text-slate-800">{selectedPlugin.account_email || 'Authorized Account'}</span>
                    </p>
                    <p className="text-[10px] text-emerald-600/90 mt-0.5">
                      Tokens securely encrypted with AES-256-GCM.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDisconnect(selectedPlugin.id)}
                    disabled={isConnecting}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span>Disconnect &amp; Revoke OAuth Access</span>
                  </button>
                </div>
              ) : selectedPlugin.id.startsWith('google') || selectedPlugin.id === 'gmail' ? (
                <div className="space-y-3">
                  {selectedPlugin.status === 'DEMO' && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
                      <p className="font-semibold flex items-center gap-1 text-amber-900">
                        <Info className="w-3.5 h-3.5 text-amber-600" />
                        Local MCP Feed Active (Zero-Key Demo)
                      </p>
                      <p className="text-amber-800/90">
                        Currently using local MCP dataset fallback. You can connect your real Google Account via Google OAuth below.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => handleConnect(selectedPlugin.id)}
                    disabled={isConnecting}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    <span>Connect with Google OAuth</span>
                  </button>
                </div>
              ) : selectedPlugin.id === 'outlook' || selectedPlugin.id.startsWith('microsoft') ? (
                <div className="space-y-3">
                  <button
                    onClick={() => handleConnect(selectedPlugin.id)}
                    disabled={isConnecting}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0078D4] hover:bg-[#006abc] text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    <span>Connect with Microsoft 365</span>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-slate-500" />
                    Planned Integration
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    This connector is cataloged in the 17-category integrations registry. Automated OAuth 2.0 authorization is planned on the enterprise capability roadmap.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
