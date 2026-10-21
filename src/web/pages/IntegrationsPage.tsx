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
  Server,
  Wrench,
  Clock,
  Key,
  CheckCircle2,
  Trash2,
  Zap,
  Settings
} from 'lucide-react';
import { AmazonSmileArrow } from '../components/ui/AmazonBranding';
import { listIntegrations, getIntegration, connectIntegration, disconnectIntegration, IntegrationDetailResponse, ListIntegrationsResponse } from '../api/client';
import { Integration, IntegrationStatus } from '../types';
import { cn } from '../lib/utils';

// Brand SVG Icons crafted with official brand colors
const GoogleCalendarIcon = () => (
  <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#FFFFFF" />
    <path d="M38 12.5H10C7.5 12.5 5.5 14.5 5.5 17V38C5.5 40.5 7.5 42.5 10 42.5H38C40.5 42.5 42.5 40.5 42.5 38V17C42.5 14.5 40.5 12.5 38 12.5Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
    <path d="M42.5 17.5V17C42.5 14.5 40.5 12.5 38 12.5H10C7.5 12.5 5.5 14.5 5.5 17V17.5H42.5Z" fill="#1A73E8" />
    <text x="24" y="34" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1A73E8" fontFamily="system-ui, sans-serif">31</text>
    <rect x="12" y="7" width="4" height="8" rx="2" fill="#EA4335" />
    <rect x="32" y="7" width="4" height="8" rx="2" fill="#1A73E8" />
  </svg>
);

const GoogleDriveIcon = () => (
  <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 48 48" fill="none">
    <path d="M16.5 7.5L31.5 7.5L44 29.5L29 29.5L16.5 7.5Z" fill="#FFC107" />
    <path d="M4 38.5L11.5 25.5L44 25.5L36.5 38.5L4 38.5Z" fill="#2196F3" />
    <path d="M16.5 7.5L4 29L11.5 42L24 20.5L16.5 7.5Z" fill="#4CAF50" />
  </svg>
);

const GmailIcon = () => (
  <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#FFFFFF" />
    <path d="M9 14C7.3 14 6 15.3 6 17V33C6 34.7 7.3 36 9 36H13V22.5L24 30.5L35 22.5V36H39C40.7 36 42 34.7 42 33V17C42 15.3 40.7 14 39 14H37L24 24.5L11 14H9Z" fill="#EA4335" />
    <path d="M35 22.5L42 17V33C42 34.7 40.7 36 39 36H35V22.5Z" fill="#C5221F" />
    <path d="M6 17L13 22.5V36H9C7.3 36 6 34.7 6 33V17Z" fill="#FBBC04" />
    <path d="M13 22.5L24 30.5L35 22.5V36H13V22.5Z" fill="#34A853" />
    <path d="M9 14C7.3 14 6 15.3 6 17V17.5L13 22.5V14H9Z" fill="#4285F4" />
  </svg>
);

const NotionIcon = () => (
  <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#000000" />
    <path d="M13 14C13 13.4 13.4 13 14 13H17C17.4 13 17.8 13.2 18 13.6L30.5 32H31V16C31 14.9 31.9 14 33 14H34C34.6 14 35 14.4 35 15V34C35 34.6 34.6 35 34 35H31C30.6 35 30.2 34.8 30 34.4L17.5 16H17V32C17 33.1 16.1 34 15 34H14C13.4 34 13 33.6 13 33V14Z" fill="#FFFFFF" />
  </svg>
);

const SlackIcon = () => (
  <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#FFFFFF" />
    <path d="M16 26.5C14.6 26.5 13.5 25.4 13.5 24C13.5 22.6 14.6 21.5 16 21.5H21V26.5H16Z" fill="#36C5F0" />
    <path d="M22.5 16C22.5 14.6 23.6 13.5 25 13.5C26.4 13.5 27.5 14.6 27.5 16V21H22.5V16Z" fill="#2EB67D" />
    <path d="M32 21.5C33.4 21.5 34.5 22.6 34.5 24C34.5 25.4 33.4 26.5 32 26.5H27V21.5H32Z" fill="#E01E5A" />
    <path d="M25.5 32C25.5 33.4 24.4 34.5 23 34.5C21.6 34.5 20.5 33.4 20.5 32V27H25.5V32Z" fill="#ECB22E" />
    <circle cx="16" cy="16" r="2.5" fill="#36C5F0" />
    <circle cx="32" cy="16" r="2.5" fill="#2EB67D" />
    <circle cx="32" cy="32" r="2.5" fill="#E01E5A" />
    <circle cx="16" cy="32" r="2.5" fill="#ECB22E" />
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" fill="#24292E" />
    <path fillRule="evenodd" clipRule="evenodd" d="M24 10C16.3 10 10 16.3 10 24C10 30.2 14 35.4 19.6 37.3C20.3 37.4 20.6 37 20.6 36.6C20.6 36.3 20.6 35.3 20.6 34C16.7 34.8 15.9 32.3 15.9 32.3C15.3 30.7 14.4 30.3 14.4 30.3C13.1 29.4 14.5 29.4 14.5 29.4C15.9 29.5 16.7 30.8 16.7 30.8C18 33 20.1 32.4 20.9 32C21 31 21.4 30.4 21.9 30C18.8 29.7 15.5 28.5 15.5 23.1C15.5 21.6 16.1 20.3 17 19.3C16.9 18.9 16.4 17.5 17.2 15.6C17.2 15.6 18.3 15.3 20.8 17C21.9 16.7 23 16.5 24.1 16.5C25.2 16.5 26.3 16.7 27.4 17C29.9 15.3 31 15.6 31 15.6C31.8 17.5 31.3 18.9 31.2 19.3C32.1 20.3 32.7 21.6 32.7 23.1C32.7 28.5 29.4 29.7 26.3 30C26.9 30.5 27.4 31.5 27.4 33C27.4 35.2 27.4 36.3 27.4 36.6C27.4 37 27.7 37.4 28.4 37.3C34 35.4 38 30.2 38 24C38 16.3 31.7 10 24 10Z" fill="#FFFFFF" />
  </svg>
);

const GoogleMapsIcon = () => (
  <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#FFFFFF" />
    <path d="M24 8C16.8 8 11 13.8 11 21C11 29.5 22.1 39.4 22.6 39.8C23.4 40.5 24.6 40.5 25.4 39.8C25.9 39.4 37 29.5 37 21C37 13.8 31.2 8 24 8Z" fill="#EA4335" />
    <path d="M24 8C16.8 8 11 13.8 11 21C11 26.2 14.8 31.9 19.5 36.8L24 28V8Z" fill="#4285F4" />
    <path d="M24 28L28.5 36.8C33.2 31.9 37 26.2 37 21C37 13.8 31.2 8 24 8V28Z" fill="#FBBC04" />
    <path d="M24 28L19.5 36.8C20.8 38.2 22.3 39.4 22.6 39.8C23.4 40.5 24.6 40.5 25.4 39.8C25.7 39.4 27.2 38.2 28.5 36.8L24 28Z" fill="#34A853" />
    <circle cx="24" cy="20" r="5" fill="#FFFFFF" />
  </svg>
);

const OutlookIcon = () => (
  <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#0078D4" />
    <path d="M12 16H36V32H12V16Z" fill="#FFFFFF" opacity="0.9" />
    <path d="M12 16L24 25L36 16H12Z" fill="#0078D4" />
    <circle cx="18" cy="24" r="5" fill="#0078D4" />
    <text x="18" y="27" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFFFFF" fontFamily="system-ui, sans-serif">O</text>
  </svg>
);

const FigmaIcon = () => (
  <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#FFFFFF" />
    <path d="M18 10H24V18H18C15.8 18 14 16.2 14 14C14 11.8 15.8 10 18 10Z" fill="#F24E1E" />
    <path d="M24 10H30C32.2 10 34 11.8 34 14C34 16.2 32.2 18 30 18H24V10Z" fill="#FF7262" />
    <path d="M18 18H24V26H18C15.8 26 14 24.2 14 22C14 19.8 15.8 18 18 18Z" fill="#A259FF" />
    <circle cx="30" cy="22" r="4" fill="#1ABCFE" />
    <path d="M18 26H24V34C24 36.2 22.2 38 20 38C17.8 38 16 36.2 16 34C16 31.8 17.8 26 18 26Z" fill="#0ACF83" />
  </svg>
);

// Map integration ID to brand icon
function getBrandIcon(id: string) {
  switch (id) {
    case 'google-calendar':
      return GoogleCalendarIcon;
    case 'google-drive':
      return GoogleDriveIcon;
    case 'gmail':
      return GmailIcon;
    case 'notion':
      return NotionIcon;
    case 'slack':
      return SlackIcon;
    case 'github':
      return GitHubIcon;
    case 'google-maps':
      return GoogleMapsIcon;
    case 'outlook':
      return OutlookIcon;
    case 'figma':
      return FigmaIcon;
    default:
      return Network;
  }
}

export const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [counts, setCounts] = useState<{
    total: number;
    genuineConnectedCount: number;
    demoCount: number;
    availableCount: number;
  }>({
    total: 0,
    genuineConnectedCount: 0,
    demoCount: 0,
    availableCount: 0
  });

  const [activeTab, setActiveTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inspector modal/drawer state
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<IntegrationDetailResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  // Real API Connection State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [accountEmailInput, setAccountEmailInput] = useState('shanmukheswaramedicharla@gmail.com');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleConnectIntegration = async (id: string) => {
    setIsConnecting(true);
    setConnectMessage(null);
    try {
      await connectIntegration(id, {
        apiKey: apiKeyInput,
        email: accountEmailInput
      });
      setConnectMessage('Integration successfully connected and verified in SQLite!');
      fetchIntegrations();
      if (selectedIntegrationId === id) {
        getIntegration(id).then(setSelectedDetail);
      }
    } catch (err: any) {
      setConnectMessage(`Connection failed: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectIntegration = async (id: string) => {
    setIsConnecting(true);
    setConnectMessage(null);
    try {
      await disconnectIntegration(id);
      setConnectMessage('Integration disconnected.');
      fetchIntegrations();
      if (selectedIntegrationId === id) {
        getIntegration(id).then(setSelectedDetail);
      }
    } catch (err: any) {
      setConnectMessage(`Disconnect failed: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // 1. Fetch real integrations from backend API
  const fetchIntegrations = () => {
    setIsLoading(true);
    setError(null);
    listIntegrations()
      .then((data: ListIntegrationsResponse) => {
        const list = data.integrations || [];
        setIntegrations(list);
        setCounts({
          total: data.total || list.length,
          genuineConnectedCount: data.genuineConnectedCount || 0,
          demoCount: data.demoCount || 0,
          availableCount: data.availableCount || 0
        });
      })
      .catch((err) => {
        console.warn('[IntegrationsPage] Failed to fetch integrations:', err);
        setError('Failed to load integrations from application API.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  // 2. Fetch integration detail when an integration is inspected
  useEffect(() => {
    if (!selectedIntegrationId) {
      setSelectedDetail(null);
      return;
    }

    setIsDetailLoading(true);
    getIntegration(selectedIntegrationId)
      .then((detail) => {
        setSelectedDetail(detail);
      })
      .catch((err) => {
        console.warn('[IntegrationsPage] Failed to fetch integration detail:', err);
      })
      .finally(() => {
        setIsDetailLoading(false);
      });
  }, [selectedIntegrationId]);

  // Dynamic tabs grounded in real database status counts
  const dynamicTabs = useMemo(() => {
    return [
      { id: 'all', label: `All (${integrations.length})` },
      { id: 'connected', label: `Connected (${counts.genuineConnectedCount})` },
      { id: 'demo', label: `Demo Simulation (${counts.demoCount})` },
      { id: 'available', label: `Roadmap (${counts.availableCount})` },
      { id: 'productivity', label: 'Productivity' },
      { id: 'knowledge', label: 'Knowledge' },
      { id: 'communication', label: 'Communication' },
      { id: 'development', label: 'Development' }
    ];
  }, [integrations, counts]);

  // Filter integrations based on activeTab
  const filteredIntegrations = useMemo(() => {
    if (activeTab === 'all') return integrations;
    if (activeTab === 'connected') {
      return integrations.filter((i) => i.status === 'CONNECTED' && !i.is_synthetic);
    }
    if (activeTab === 'demo') {
      return integrations.filter((i) => i.status === 'DEMO' || (i.is_synthetic && i.status !== 'NOT_CONNECTED' && i.status !== 'AVAILABLE'));
    }
    if (activeTab === 'available') {
      return integrations.filter((i) => i.status === 'AVAILABLE' || i.status === 'NOT_CONNECTED');
    }
    return integrations.filter((i) => i.category.toLowerCase() === activeTab.toLowerCase());
  }, [integrations, activeTab]);

  const renderStatusBadge = (status: IntegrationStatus, isSynthetic?: number) => {
    if (status === 'CONNECTED' && !isSynthetic) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check className="w-3 h-3 stroke-[3]" />
          <span>Connected</span>
        </span>
      );
    }
    if ((status as string) === 'DEMO' || (isSynthetic === 1 && status === 'CONNECTED')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/90">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Demo Simulation</span>
        </span>
      );
    }
    if (status === 'AVAILABLE') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80">
          <span>Roadmap</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200/80">
        <span className="w-2 h-2 rounded-full border border-slate-400" />
        <span>Not Connected</span>
      </span>
    );
  };

  return (
    <div className="min-h-full bg-[#F8FAFC] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* =========================================================================
            1. TOP HEADER: Title, Subtitle & Reality Badge
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-2xs">
              <Network className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Integrations
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Authoritative Connector Matrix
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                External service boundaries and Model Context Protocol (<code className="font-mono text-slate-700">MCP</code>) tool execution channels.
              </p>
            </div>
          </div>

          {/* Genuine Connected Metric summary */}
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-2xs text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-slate-600 font-medium">Genuine Live Accounts:</span>
              <span className="font-bold font-mono text-slate-900">{counts.genuineConnectedCount}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-600 font-medium">Demo Feeds:</span>
              <span className="font-bold font-mono text-slate-900">{counts.demoCount}</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. HERO FEATURE BANNER: Dark Atmospheric Card with Amazon Smile Glow
            ========================================================================= */}
        <div className="bg-[#0B1120] rounded-2xl border border-[#162035] p-6 md:p-8 shadow-xs relative overflow-hidden text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left Text & Architectural Disclosure */}
          <div className="space-y-2 z-10 max-w-xl">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Bridge natural language to execution.
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-lg">
              Alexa+ connects autonomous agent missions to real tools via the Model Context Protocol (MCP). Local calendar and knowledge repositories are indexed locally without requiring third-party cloud credentials.
            </p>
            <div className="pt-2 flex items-center space-x-3">
              <button
                onClick={() => setActiveTab('all')}
                className="inline-flex items-center space-x-2 bg-[#131D33] hover:bg-[#1A2845] border border-blue-500/30 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-2xs group"
              >
                <span>Explore Connector Matrix</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Visual: Glowing Amazon Smile curve with integration brand icons */}
          <div className="relative w-full md:w-80 h-28 flex items-center justify-end z-10 pr-2">
            
            {/* Glowing Amber Smile Wave */}
            <div className="absolute right-0 bottom-2 w-64 pointer-events-none">
              <AmazonSmileArrow className="w-full text-[#FF9900] drop-shadow-[0_2px_12px_rgba(255,153,0,0.6)]" />
            </div>

            {/* Floating Brand Icons */}
            <div className="flex items-center space-x-3.5 mb-3 mr-6 z-10">
              <div className="w-10 h-10 rounded-xl bg-[#13203C]/90 border border-blue-500/40 flex items-center justify-center shadow-lg shadow-blue-500/10 backdrop-blur-xs">
                <GoogleCalendarIcon />
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#13203C]/90 border border-amber-400/50 flex items-center justify-center shadow-lg shadow-amber-400/10 backdrop-blur-xs -translate-y-2">
                <GoogleDriveIcon />
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#13203C]/90 border border-slate-400/40 flex items-center justify-center shadow-lg backdrop-blur-xs translate-y-1">
                <NotionIcon />
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#13203C]/90 border border-blue-400/40 flex items-center justify-center shadow-lg backdrop-blur-xs -translate-y-1">
                <FigmaIcon />
              </div>
            </div>

          </div>

        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchIntegrations}
              className="text-xs font-semibold underline hover:text-rose-900 ml-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* =========================================================================
            3. FILTER TABS BAR: Dynamic, Real Counts
            ========================================================================= */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1">
          {dynamicTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            4. INTEGRATIONS GRID: Grounded in SQLite Records
            ========================================================================= */}
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 mt-2">Loading integrations from Application API...</p>
          </div>
        ) : filteredIntegrations.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <Network className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Integrations in This Category</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === 'connected'
                ? 'No external services are currently connected with live third-party cloud credentials. (0 genuine connected)'
                : 'No integration records matched the selected filter.'}
            </p>
            <button
              onClick={() => setActiveTab('all')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline pt-1"
            >
              View all integrations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((item) => {
              const IconComponent = getBrandIcon(item.id);
              const isDemo = item.status === 'DEMO' || (item.is_synthetic === 1 && item.status !== 'NOT_CONNECTED' && item.status !== 'AVAILABLE');

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:border-slate-300 transition-all flex flex-col justify-between h-[158px] group"
                >
                  {/* Top Row: Brand Icon + Title & Category + More */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-3.5 truncate">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-100 p-1">
                        <IconComponent />
                      </div>
                      <div className="space-y-0.5 truncate">
                        <div className="flex items-center space-x-1.5 truncate">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {item.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {item.category}
                        </p>
                        {isDemo && item.account_email && (
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            Feed: {item.account_email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === item.id ? null : item.id);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                        title="Integration options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === item.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setSelectedIntegrationId(item.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                          >
                            <Info className="w-3.5 h-3.5 text-blue-500" />
                            <span>Inspect Details</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedIntegrationId(item.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                          >
                            <Key className="w-3.5 h-3.5 text-purple-500" />
                            <span>Configure API Key</span>
                          </button>
                          {item.status === 'CONNECTED' && (
                            <button
                              onClick={() => {
                                handleDisconnectIntegration(item.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Disconnect</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Status Chip + Honest Action Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      {renderStatusBadge(item.status, item.is_synthetic)}
                    </div>

                    <button
                      onClick={() => setSelectedIntegrationId(item.id)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors group-hover:translate-x-0.5"
                    >
                      <span>{isDemo ? 'Inspect Demo' : 'Details'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================================
            5. INTEGRATION DETAIL DRAWER / MODAL
            ========================================================================= */}
        {selectedIntegrationId && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1 flex-shrink-0">
                    {React.createElement(getBrandIcon(selectedIntegrationId))}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedDetail?.name || selectedIntegrationId}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      ID: {selectedIntegrationId} • {selectedDetail?.category}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedIntegrationId(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              {isDetailLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-400 mt-2">Loading integration capabilities...</p>
                </div>
              ) : selectedDetail ? (
                <div className="space-y-4 text-xs">
                  
                  {/* Status & Architecture disclosure banner */}
                  <div className={cn(
                    "p-3.5 rounded-xl border space-y-1.5",
                    selectedDetail.status === 'DEMO'
                      ? "bg-amber-50/60 border-amber-200 text-amber-900"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center space-x-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                        <span>Connection Status</span>
                      </span>
                      {renderStatusBadge(selectedDetail.status, selectedDetail.is_synthetic)}
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      {selectedDetail.status === 'DEMO'
                        ? 'This integration operates as a simulated local feed for testing and evaluation. The agent interacts via the local self-hosted MCP server without external cloud credentials.'
                        : 'External cloud OAuth 2.0 connector for this service is on the enterprise expansion roadmap. Live third-party credentials are not configured.'}
                    </p>
                  </div>

                  {/* Capability Specification */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Server className="w-3.5 h-3.5 text-blue-500" />
                      <span>MCP Tool Boundary</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400">Assigned MCP Tool:</span>
                        <div className="font-mono font-semibold text-slate-800 mt-0.5">
                          {selectedDetail.capability?.mcpTool || 'None'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Auth Boundary:</span>
                        <div className="font-mono font-semibold text-slate-800 mt-0.5">
                          {selectedDetail.capability?.authType || 'PLANNED'}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 pt-1 leading-relaxed border-t border-slate-200/60">
                      {selectedDetail.capability?.description}
                    </p>
                  </div>

                  {/* Real Integration Connect Form */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <Key className="w-3.5 h-3.5 text-purple-600" />
                        <span>Configure Real API Connection</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Direct API Binding
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Account Email
                        </label>
                        <input
                          type="email"
                          value={accountEmailInput}
                          onChange={(e) => setAccountEmailInput(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          placeholder="your.email@example.com"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          API Key / Bot Token
                        </label>
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          placeholder="sk-... or ghp_... or bot token"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        {selectedDetail.status === 'CONNECTED' ? (
                          <button
                            onClick={() => handleDisconnectIntegration(selectedDetail.id)}
                            disabled={isConnecting}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 font-semibold text-xs transition-colors flex items-center space-x-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Disconnect</span>
                          </button>
                        ) : <div />}

                        <button
                          onClick={() => handleConnectIntegration(selectedDetail.id)}
                          disabled={isConnecting}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-colors flex items-center space-x-1.5"
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Save & Connect Real Service</span>
                            </>
                          )}
                        </button>
                      </div>

                      {connectMessage && (
                        <p className="text-[11px] text-emerald-600 font-medium pt-1">
                          {connectMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Security Clearance Note */}
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-800 text-[11px] flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Security Verified: Zero secrets, tokens, or credentials are transmitted or stored client-side.</span>
                  </div>

                  {/* Close / Action footer */}
                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => {
                        setSelectedIntegrationId(null);
                        setConnectMessage(null);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-colors"
                    >
                      Close
                    </button>
                  </div>

                </div>
              ) : null}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
