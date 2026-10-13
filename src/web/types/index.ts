// Shared TypeScript interfaces matching the Application API (:3000)

export type MissionStatus =
  | 'CREATED'
  | 'UNDERSTANDING'
  | 'PLANNING'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED';

export type StepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type ToolExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type IntegrationStatus =
  | 'CONNECTED'
  | 'DEMO'
  | 'AVAILABLE'
  | 'NOT_CONNECTED'
  | 'COMING_SOON';

export interface Conversation {
  id: string;
  title: string;
  model_id: string;
  status: 'ACTIVE' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
  missions?: Mission[];
}

export interface MissionStep {
  id: string;
  mission_id: string;
  step_index: number;
  label: string;
  domain: string;
  assigned_tool?: string | null;
  status: StepStatus;
  duration_ms?: number;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface ToolExecution {
  id: string;
  mission_id: string;
  step_id?: string | null;
  tool_name: string;
  arguments: any;
  status: ToolExecutionStatus;
  output?: any;
  error_message?: string | null;
  duration_ms?: number;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  mission_id?: string | null;
  conversation_id?: string | null;
  event_type: string;
  title: string;
  description: string;
  domain: string;
  status: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  metadata?: any;
  is_synthetic?: number;
  created_at: string;
}

export interface Mission {
  id: string;
  conversation_id: string;
  title: string;
  goal: string;
  status: MissionStatus;
  duration_ms: number;
  result_summary?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  steps?: MissionStep[];
  toolExecutions?: ToolExecution[];
  activityEvents?: ActivityEvent[];
}

export interface McpTool {
  name: string;
  description: string;
  domain: string;
  inputSchema?: any;
  requiresApproval?: boolean;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  category: string;
  page_count: number;
  size_mb: number;
  summary: string;
  content?: string;
  key_insights?: string[];
  action_items?: string[];
  risks?: string[];
  decisions_needed?: string[];
  uploaded_at: string;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  status: IntegrationStatus;
  account_email?: string | null;
  is_synthetic: number;
  last_sync_at?: string | null;
  created_at: string;
}

export interface ActivityMetrics {
  totalActivities: number;
  missionsCount: number;
  toolActionsCount: number;
  integrationsCount: number;
  connectedIntegrationsCount: number;
  demoIntegrationsCount: number;
}

export interface ActivityResponse {
  metrics: ActivityMetrics;
  topTools: Array<{ tool_name: string; count: number }>;
  totalEvents: number;
  events: ActivityEvent[];
}

export interface SettingsPayload {
  profile: {
    name: string;
    email: string;
    role: string;
    location: string;
    status: string;
    joinedAt: string;
  };
  plan: {
    tier: string;
    badge: string;
    features: string[];
  };
  preferences: {
    theme: string;
    defaultModel: string;
    notificationsEnabled: boolean;
    autoExecutionApproved: boolean;
  };
}
