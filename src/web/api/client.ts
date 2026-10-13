import {
  Conversation,
  Mission,
  McpTool,
  KnowledgeDocument,
  Integration,
  ActivityResponse,
  SettingsPayload
} from '../types';

const API_BASE = ''; // Uses relative URLs, seamlessly proxied by Vite or served directly

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errBody: any;
    try {
      errBody = await res.json();
    } catch {
      errBody = { error: { message: await res.text() } };
    }
    const message = errBody?.error?.message || `HTTP ${res.status} Error`;
    const code = errBody?.error?.code || 'API_ERROR';
    const err = new Error(message) as any;
    err.code = code;
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

// 1. Health
export async function getHealth(): Promise<{ status: string; mcpStatus: string; service: string }> {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse(res);
}

// 2. Conversations
export async function listConversations(): Promise<{ total: number; conversations: Conversation[] }> {
  const res = await fetch(`${API_BASE}/api/conversations`);
  return handleResponse(res);
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/api/conversations/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

export async function createConversation(title?: string, modelId = 'gpt-4o'): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, modelId }),
  });
  return handleResponse(res);
}

// 3. Missions
export async function listMissions(status?: string, limit = 50): Promise<{ total: number; missions: Mission[] }> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('limit', String(limit));
  const res = await fetch(`${API_BASE}/api/missions?${params.toString()}`);
  return handleResponse(res);
}

export async function getMission(id: string): Promise<Mission> {
  const res = await fetch(`${API_BASE}/api/missions/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

export async function createMission(payload: {
  goal: string;
  title?: string;
  conversationId?: string;
  sync?: boolean;
}): Promise<{ mission: Mission; streamUrl?: string; result?: any }> {
  const res = await fetch(`${API_BASE}/api/missions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// 4. Tools
export async function listTools(): Promise<{ total: number; serverUrl: string; tools: McpTool[] }> {
  const res = await fetch(`${API_BASE}/api/tools`);
  return handleResponse(res);
}

// 5. Knowledge
export async function listKnowledge(category?: string, query?: string): Promise<{ total: number; documents: KnowledgeDocument[] }> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.set('category', category);
  if (query) params.set('query', query);
  const res = await fetch(`${API_BASE}/api/knowledge?${params.toString()}`);
  return handleResponse(res);
}

export async function getKnowledgeDocument(id: string): Promise<KnowledgeDocument> {
  const res = await fetch(`${API_BASE}/api/knowledge/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

// 6. Integrations
export async function listIntegrations(): Promise<{ total: number; connectedCount: number; integrations: Integration[] }> {
  const res = await fetch(`${API_BASE}/api/integrations`);
  return handleResponse(res);
}

export async function getIntegration(id: string): Promise<Integration> {
  const res = await fetch(`${API_BASE}/api/integrations/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

// 7. Activity
export async function getActivity(filters?: { limit?: number; domain?: string; eventType?: string }): Promise<ActivityResponse> {
  const params = new URLSearchParams();
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.domain) params.set('domain', filters.domain);
  if (filters?.eventType) params.set('eventType', filters.eventType);
  const res = await fetch(`${API_BASE}/api/activity?${params.toString()}`);
  return handleResponse(res);
}

// 8. Settings
export async function getSettings(): Promise<SettingsPayload> {
  const res = await fetch(`${API_BASE}/api/settings`);
  return handleResponse(res);
}
