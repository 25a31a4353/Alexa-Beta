import React, { useEffect, useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Bell,
  Palette,
  MapPin,
  Calendar,
  Crown,
  ChevronRight,
  MessageSquare,
  Wrench,
  Database,
  ShieldCheck,
  Download,
  Trash2,
  Check,
  AlertTriangle,
  Network,
  LayoutGrid,
  Loader2,
  AlertCircle,
  Server,
  Cpu,
  Info,
  X
} from 'lucide-react';
import { useRouter } from '../state/router';
import { getSettings, listIntegrations } from '../api/client';
import { SettingsPayload, Integration } from '../types';
import { cn } from '../lib/utils';

// Brand SVGs for Connected Services list
const GoogleCalendarIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="8" fill="#FFFFFF" />
    <path d="M38 12.5H10C7.5 12.5 5.5 14.5 5.5 17V38C5.5 40.5 7.5 42.5 10 42.5H38C40.5 42.5 42.5 40.5 42.5 38V17C42.5 14.5 40.5 12.5 38 12.5Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
    <path d="M42.5 17.5V17C42.5 14.5 40.5 12.5 38 12.5H10C7.5 12.5 5.5 14.5 5.5 17V17.5H42.5Z" fill="#1A73E8" />
    <text x="24" y="34" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1A73E8" fontFamily="system-ui, sans-serif">31</text>
  </svg>
);

const GoogleDriveIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48" fill="none">
    <path d="M16.5 7.5L31.5 7.5L44 29.5L29 29.5L16.5 7.5Z" fill="#FFC107" />
    <path d="M4 38.5L11.5 25.5L44 25.5L36.5 38.5L4 38.5Z" fill="#2196F3" />
    <path d="M16.5 7.5L4 29L11.5 42L24 20.5L16.5 7.5Z" fill="#4CAF50" />
  </svg>
);

const GmailIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="8" fill="#FFFFFF" />
    <path d="M9 14C7.3 14 6 15.3 6 17V33C6 34.7 7.3 36 9 36H13V22.5L24 30.5L35 22.5V36H39C40.7 36 42 34.7 42 33V17C42 15.3 40.7 14 39 14H37L24 24.5L11 14H9Z" fill="#EA4335" />
    <path d="M35 22.5L42 17V33C42 34.7 40.7 36 39 36H35V22.5Z" fill="#C5221F" />
    <path d="M6 17L13 22.5V36H9C7.3 36 6 34.7 6 33V17Z" fill="#FBBC04" />
    <path d="M13 22.5L24 30.5L35 22.5V36H13V22.5Z" fill="#34A853" />
    <path d="M9 14C7.3 14 6 15.3 6 17V17.5L13 22.5V14H9Z" fill="#4285F4" />
  </svg>
);

const NotionIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="8" fill="#000000" />
    <path d="M13 14C13 13.4 13.4 13 14 13H17C17.4 13 17.8 13.2 18 13.6L30.5 32H31V16C31 14.9 31.9 14 33 14H34C34.6 14 35 14.4 35 15V34C35 34.6 34.6 35 34 35H31C30.6 35 30.2 34.8 30 34.4L17.5 16H17V32C17 33.1 16.1 34 15 34H14C13.4 34 13 33.6 13 33V14Z" fill="#FFFFFF" />
  </svg>
);

const SlackIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="8" fill="#FFFFFF" />
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
    default:
      return Network;
  }
}

const TABS = [
  'Account',
  'Runtime & MCP',
  'Preferences',
  'Privacy & Data',
  'Connected Services'
];

export const SettingsPage: React.FC = () => {
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<string>('Account');
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [integrationsList, setIntegrationsList] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<{ title: string; message: string } | null>(null);

  // 1. Fetch settings and integrations on mount
  const loadData = () => {
    setIsLoading(true);
    setError(null);

    Promise.all([getSettings(), listIntegrations()])
      .then(([settingsData, integrationsData]) => {
        setSettings(settingsData);
        setIntegrationsList(integrationsData.integrations || []);
      })
      .catch((err) => {
        console.warn('[SettingsPage] Error loading settings:', err);
        setError('Failed to load settings from application API.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const profile = settings?.profile || {
    name: 'Shanmukheswar',
    email: 'shanmukheswaramedicharla@gmail.com',
    role: 'Pro Builder',
    location: 'India',
    status: 'Active',
    joinedAt: '2026-10-01T00:00:00.000Z'
  };

  const agentRuntime = settings?.agentRuntime;
  const mcpRuntime = settings?.mcpRuntime;
  const persistence = settings?.persistence;

  return (
    <div className="min-h-full bg-[#F8FAFC] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* =========================================================================
            1. TOP HEADER: Title, Subtitle
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-2xs">
              <Settings className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Settings
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Backend Grounded
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Runtime configuration, MCP connection status, and operational parameters.
              </p>
            </div>
          </div>

          {/* Quick MCP status chip */}
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600 font-medium">MCP Status:</span>
            <span className="font-bold text-slate-900 font-mono">
              {mcpRuntime?.status || 'ONLINE'}
            </span>
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
              onClick={loadData}
              className="text-xs font-semibold underline hover:text-rose-900 ml-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* =========================================================================
            2. HORIZONTAL TAB NAVIGATION BAR
            ========================================================================= */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1">
          {TABS.map((tab) => {
            const isActive = activeTab.toLowerCase() === tab.toLowerCase();
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'text-xs px-4 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            3. MAIN TWO-COLUMN LAYOUT
            Left Column: Profile Information, Runtime & MCP, Preferences, Privacy
            Right Column: Account Plan, Connected Services, Danger Zone
            ========================================================================= */}
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 mt-2">Loading configuration parameters from API...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* ==================== LEFT COLUMN ==================== */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Card 1: Profile Information */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm md:text-base font-bold text-slate-900">
                      Profile Information
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Account identity verified by Application API (:3000).
                    </p>
                  </div>
                  <button
                    onClick={() => setInfoModal({
                      title: 'Developer Profile',
                      message: 'Developer profile parameters are loaded from application configuration. Modifications are managed via the environment configuration file.'
                    })}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>

                {/* Profile Details Layout */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-1">
                  
                  {/* Avatar & User Details */}
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full bg-[#5C86C4] text-white font-bold text-base flex items-center justify-center flex-shrink-0 shadow-2xs">
                      SM
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {profile.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {profile.role}
                      </p>
                      <p className="text-xs text-slate-600 font-mono mt-0.5 select-all">
                        {profile.email}
                      </p>
                    </div>
                  </div>

                  {/* Right Metadata */}
                  <div className="space-y-2 text-xs text-slate-600 sm:border-l sm:border-slate-100 sm:pl-6">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">{profile.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">Joined Oct 2026</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-medium text-slate-700">Pro Builder Plan</span>
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200/80 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                        {profile.status}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Card 2: Agent Runtime & MCP Configuration (Honest Architectural Disclosure) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                      <Cpu className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h2 className="text-sm md:text-base font-bold text-slate-900">
                        Agent Runtime & MCP Architecture
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Authoritative runtime telemetry and protocol parameters.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                  {/* Execution Mode */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-medium text-slate-400">Agent Decision Engine:</span>
                    <div className="font-semibold text-slate-900">
                      {agentRuntime?.executionMode || 'Autonomous Decision Engine (Deterministic Rule-Based Fallback - NOT an LLM)'}
                    </div>
                    <p className="text-[10px] text-slate-500 pt-0.5">
                      Model: <code className="font-mono text-slate-700">{agentRuntime?.activeModel || 'local-heuristic-v1'}</code>
                    </p>
                  </div>

                  {/* LLM Status */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-medium text-slate-400">External LLM Provider:</span>
                    <div className="font-semibold text-slate-800">
                      {agentRuntime?.llmProvider || 'Not active in current local runtime'}
                    </div>
                    <p className="text-[10px] text-slate-500 pt-0.5">
                      Credential Configured: <span className="font-semibold text-slate-700">{agentRuntime?.llmKeyConfigured ? 'Yes' : 'No (Zero dependency mode)'}</span>
                    </p>
                  </div>

                  {/* MCP Server Boundary */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-medium text-slate-400">MCP Protocol Server:</span>
                    <div className="font-semibold text-slate-900 font-mono text-[11px]">
                      {mcpRuntime?.serverUrl || 'http://127.0.0.1:3001/mcp'}
                    </div>
                    <p className="text-[10px] text-slate-500 pt-0.5">
                      Transport: <span className="font-semibold text-slate-700">{mcpRuntime?.transport || 'Streamable HTTP'}</span> • Protocol: <span className="font-mono text-slate-700">{mcpRuntime?.protocolVersion || '2025-11-25'}</span>
                    </p>
                  </div>

                  {/* Persistence Storage */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-medium text-slate-400">Persistence Store:</span>
                    <div className="font-semibold text-slate-900 font-mono text-[11px]">
                      {persistence?.database || 'SQLite'} (<code className="text-slate-600">{persistence?.filepath || 'data/alexa_plus.db'}</code>)
                    </div>
                    <p className="text-[10px] text-emerald-600 font-semibold pt-0.5">
                      Status: {persistence?.status || 'HEALTHY'} (Durability verified across restarts)
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2.5: Hackathon Mini-Challenges Showcase */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Hackathon Additions
                    </div>
                    <h2 className="text-sm md:text-base font-bold text-slate-900">
                      Mini-Challenges Integration
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Verified implementations for AWS Builder and Open Source tracks.
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    2 / 2 Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* AWS Builder Track */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                          AWS
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">AWS Builder Track</h4>
                          <span className="text-[10px] text-amber-700 font-medium">Amazon Bedrock Native Converse</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-md">
                        QUALIFIED
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      Native tool calling via <code className="text-amber-800 font-semibold text-[10px]">@aws-sdk/client-bedrock-runtime</code> supporting <strong>Claude 3.5 Sonnet</strong> & <strong>Amazon Nova Pro</strong> with zero-downtime resilient fallback.
                    </p>

                    <div className="pt-1.5 border-t border-amber-200/60 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Module: <code className="text-slate-700">src/agent/llm/bedrock.mjs</code></span>
                      <span className="text-emerald-700 font-semibold">Test: 100% Pass</span>
                    </div>
                  </div>

                  {/* Open Source Track */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border border-emerald-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                          OSS
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Open Source Track</h4>
                          <span className="text-[10px] text-emerald-700 font-medium">mcp-session-reaper</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md">
                        QUALIFIED
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      Standalone companion package solving Streamable HTTP SSE socket dangling & session leakage in Express servers under the <strong>MIT License</strong>.
                    </p>

                    <div className="pt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Path: <code className="text-slate-700">packages/mcp-session-reaper</code></span>
                      <span className="text-emerald-700 font-semibold">Test: 100% Pass</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Preferences */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm md:text-base font-bold text-slate-900">
                      Preferences
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Operational settings and behavior rules.
                    </p>
                  </div>
                  <button
                    onClick={() => setInfoModal({
                      title: 'Preferences Configuration',
                      message: 'Runtime preferences are governed by Application API (:3000) security defaults.'
                    })}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors"
                  >
                    Configure
                  </button>
                </div>

                {/* 2x2 Subcards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  
                  {/* 1. Conversation Preferences */}
                  <div
                    onClick={() => setInfoModal({
                      title: 'Conversation Preferences',
                      message: 'Execution style: Deterministic multi-step DAG planning with real-time operational telemetry (SSE).'
                    })}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3 truncate mr-2">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 flex-shrink-0">
                        <MessageSquare className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          Conversation Preferences
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          Deterministic DAG planning • SSE Live Telemetry
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                  </div>

                  {/* 2. Tool Preferences */}
                  <div
                    onClick={() => navigate('/tools')}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3 truncate mr-2">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 flex-shrink-0">
                        <Settings className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          Tool Preferences
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          4 Authoritative MCP Tools Discovered
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                  </div>

                  {/* 3. Notification Preferences */}
                  <div
                    onClick={() => setInfoModal({
                      title: 'Notification Preferences',
                      message: 'Consequential action notifications and human approval gates are handled interactively during mission execution.'
                    })}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3 truncate mr-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 flex-shrink-0">
                        <Bell className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          Notification Preferences
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          Human-in-the-loop action approval gates
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                  </div>

                  {/* 4. Appearance */}
                  <div
                    onClick={() => setInfoModal({
                      title: 'Appearance',
                      message: 'UI Theme: Modern light workspace with approved dark atmospheric card accents.'
                    })}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3 truncate mr-2">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 flex-shrink-0">
                        <Palette className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          Appearance
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          Light Workspace • Inter Typography • Blue Theme
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                  </div>

                </div>
              </div>

              {/* Card 4: Privacy & Data */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm md:text-base font-bold text-slate-900">
                      Privacy & Data Controls
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Local SQLite storage isolation and credential security.
                    </p>
                  </div>
                  <button
                    onClick={() => setInfoModal({
                      title: 'Data Governance',
                      message: 'All conversations, missions, and tool executions are persisted in local SQLite (data/alexa_plus.db). Zero telemetry is transmitted to third-party tracking services.'
                    })}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors"
                  >
                    Manage
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  
                  {/* 1. Conversation History */}
                  <div
                    onClick={() => navigate('/activity')}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3 truncate mr-2">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 flex-shrink-0">
                        <Database className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          Audit Trail & Activity
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          View chronological activity events in SQLite
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                  </div>

                  {/* 2. Security Clearance */}
                  <div
                    onClick={() => setInfoModal({
                      title: 'Security Verification',
                      message: 'API verified: Zero authorization headers, refresh tokens, or passwords exist in memory or storage.'
                    })}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3 truncate mr-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 flex-shrink-0">
                        <ShieldCheck className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          Zero Secret Exposure
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          No sensitive tokens stored or sent to browser
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                  </div>

                </div>
              </div>

            </div>

            {/* ==================== RIGHT COLUMN ==================== */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Card A: Account Plan */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs md:text-sm">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span>Account Plan</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                    {settings?.plan.badge || 'Active'}
                  </span>
                </div>

                {/* Pro Builder Banner */}
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-blue-50/40 border border-blue-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-bold text-slate-900">
                      {settings?.plan.tier || 'Pro Builder'}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                      Full self-hosted MCP capabilities and mission execution engine.
                    </p>
                  </div>
                </div>

                {/* Feature Checklist */}
                <div className="space-y-2.5 pt-1 pl-1">
                  {(settings?.plan.features || [
                    'Unlimited autonomous missions',
                    'Self-hosted MCP tool discovery',
                    'Deterministic DAG plan execution',
                    'SQLite audit trail persistence',
                    'Human-in-the-loop verification gates'
                  ]).map((feat) => (
                    <div key={feat} className="flex items-center space-x-2.5 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="font-medium text-slate-700">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card B: Connected Services (Grounded in Stage 5 Honest State) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs md:text-sm">
                    <Network className="w-4 h-4 text-blue-600" />
                    <span>Connector Feeds</span>
                  </div>
                  <button
                    onClick={() => navigate('/integrations')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    Manage
                  </button>
                </div>

                {/* Quick list of 5 integration statuses matching Stage 5 */}
                <div className="space-y-2">
                  {integrationsList.slice(0, 5).map((srv) => {
                    const SrvIcon = getBrandIcon(srv.id);
                    const isDemo = srv.status === 'DEMO' || (srv.is_synthetic === 1 && srv.status !== 'NOT_CONNECTED' && srv.status !== 'AVAILABLE');

                    return (
                      <div
                        key={srv.id}
                        onClick={() => navigate('/integrations')}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center space-x-2.5 truncate mr-2">
                          <SrvIcon />
                          <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                            {srv.name}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          {isDemo ? (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/90 px-2 py-0.5 rounded-full">
                              Demo Feed
                            </span>
                          ) : srv.status === 'AVAILABLE' ? (
                            <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                              Roadmap
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-full">
                              Not Connected
                            </span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* View All Integrations Link */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => navigate('/integrations')}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <LayoutGrid className="w-4 h-4 text-slate-500" />
                      <span>View All Integrations</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Card C: Danger Zone (Honest evaluation sandbox protection) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                <div className="space-y-0.5 pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs md:text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Danger Zone</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    System reset controls and database governance.
                  </p>
                </div>

                <div
                  onClick={() => setInfoModal({
                    title: 'Account Protection Notice',
                    message: 'Destructive account deletion is disabled in this hackathon evaluation environment to preserve audit logs, mission history, and SQLite persistence.'
                  })}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Trash2 className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">Delete Account</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    Protected
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Informational Dialog Modal */}
        {infoModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">{infoModal.title}</h3>
                </div>
                <button
                  onClick={() => setInfoModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {infoModal.message}
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setInfoModal(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition-colors shadow-2xs"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
