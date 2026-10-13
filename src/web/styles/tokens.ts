/**
 * Amazon Developer Hackathon 2026 — Alexa+ Track
 * DESIGN SYSTEM TOKENS — VISUAL SOURCE OF TRUTH LOCK
 *
 * Centralized specifications for:
 * - Typography hierarchy
 * - Color palette (Dark Hero & Light Productivity Workspace)
 * - Atmospheric Gradients & Glows
 * - Dimensional Scale & Radius
 * - Elevation & Shadows
 */

export const TYPOGRAPHY = {
  // Display / Hero Heading (e.g. Home hero main statement)
  display: 'text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]',
  
  // Page Title (Top of Workspace screens: Knowledge, Tools, Activity, etc.)
  pageTitle: 'text-xl sm:text-2xl font-bold tracking-tight text-slate-900',
  
  // Section Title (Cards group headers, sidebar sections, sub-panels)
  sectionTitle: 'text-sm font-semibold tracking-tight text-slate-800',
  
  // Card Title (Tool cards, doc titles, integration names, activity items)
  cardTitle: 'text-sm font-semibold text-slate-900 leading-snug',
  
  // Body (Primary reading text, assistant responses, modal descriptions)
  body: 'text-sm text-slate-700 leading-relaxed font-normal',
  
  // Secondary / Subtitle (Under headings, card descriptions, tool summaries)
  secondary: 'text-xs text-slate-500 leading-normal font-normal',
  
  // Metadata / Timestamps / Small attributes
  metadata: 'text-[11px] text-slate-400 font-medium tracking-normal',
  
  // Navigation Label (Sidebar items)
  nav: 'text-[13px] font-medium tracking-tight',
  
  // Button Label (Compact action triggers)
  button: 'text-xs font-semibold tracking-wide',
  
  // Status Badge / Pill Label
  badge: 'text-[11px] font-semibold tracking-wider uppercase',
  
  // Telemetry Numbers (Timers, step counters, activity counts, latency)
  telemetry: 'font-mono text-xs sm:text-sm font-semibold tabular-nums',
} as const;

export const COLORS = {
  // Dark Base (Home Hero & Banner Highlights)
  dark: {
    bg: '#070B14',
    sidebar: '#090D16',
    surface: '#0E1424',
    card: '#141D30',
    border: '#1E293B',
    borderSubtle: '#152033',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
  },

  // Light Base (Workspace Screens 2-9)
  light: {
    bg: '#F8FAFC',
    sidebarDark: '#090D16', // Sidebar remains dark across all screens per visual spec
    card: '#FFFFFF',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    text: '#0F172A',
    textMuted: '#64748B',
  },

  // Restrained Brand Accents
  accent: {
    blue: '#2563EB',
    blueHover: '#1D4ED8',
    blueGlow: 'rgba(37, 99, 235, 0.25)',
    blueSubtle: '#EFF6FF',
    amber: '#F59E0B',
    amberWarm: '#D97706',
    amberGlow: 'rgba(245, 158, 11, 0.25)',
    amberSubtle: '#FFFBEB',
  },

  // Operational State Colors
  status: {
    completed: '#10B981', // Emerald green
    inProgress: '#3B82F6', // Cobalt blue
    pending: '#94A3B8', // Muted slate
    failed: '#EF4444', // Red
    demo: '#F59E0B', // Amber
  },

  // Category Icon Backgrounds (Restrained productivity tints)
  categories: {
    blue: { bg: 'bg-blue-50 text-blue-600 border-blue-200' },
    green: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    purple: { bg: 'bg-purple-50 text-purple-600 border-purple-200' },
    amber: { bg: 'bg-amber-50 text-amber-600 border-amber-200' },
    red: { bg: 'bg-rose-50 text-rose-600 border-rose-200' },
    cyan: { bg: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  }
} as const;

export const DIMENSIONS = {
  headerHeight: 'h-14', // 56px
  sidebarWidth: 'w-60', // 240px
  cardPadding: 'p-4 sm:p-5',
  buttonHeight: 'h-8 sm:h-9',
} as const;

export const RADIUS = {
  badge: 'rounded-full',
  button: 'rounded-lg',
  card: 'rounded-xl',
  input: 'rounded-xl',
  pill: 'rounded-full',
} as const;
