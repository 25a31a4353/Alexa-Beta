import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'node:events';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';

import { AgentOrchestrator } from '../agent/orchestrator.mjs';
import {
  getDatabase,
  createConversation,
  getConversation,
  listConversations,
  createMission,
  getMission,
  getMissionWithDetails,
  recordActivityEvent,
  getActivityEvents,
  listIntegrations
} from '../db/index.mjs';

const API_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://127.0.0.1:3001/mcp';

export const app = express();
app.use(cors());
app.use(express.json());

// In-memory event bus for bridging live AgentOrchestrator events to SSE listeners
export const missionEventBus = new EventEmitter();
missionEventBus.setMaxListeners(100);

// Helper to create an active MCP Client session to the real MCP server
export async function createMCPClient() {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
  const client = new Client(
    { name: 'alexa-plus-application-api', version: '1.0.0' },
    { capabilities: { roots: {} } }
  );
  await client.connect(transport);
  return { client, transport };
}

// Domain categorizer for discovered MCP tools
function categorizeToolDomain(name) {
  if (name.startsWith('calendar_') || name.startsWith('notifications_')) return 'External Services';
  if (name.startsWith('knowledge_') || name.startsWith('document_')) return 'Knowledge';
  if (name.startsWith('plan_') || name.startsWith('task_')) return 'Planning';
  if (name.startsWith('context_')) return 'Context';
  if (name.startsWith('data_')) return 'Data';
  if (name.startsWith('validate_') || name.startsWith('detect_')) return 'Verification';
  return 'System';
}

// =========================================================================
// 1. HEALTH & SYSTEM STATUS
// =========================================================================
app.get('/health', async (req, res) => {
  let mcpStatus = 'offline';
  try {
    const healthCheck = await fetch(MCP_SERVER_URL.replace('/mcp', '/health'), { signal: AbortSignal.timeout(1500) });
    if (healthCheck.ok) mcpStatus = 'online';
  } catch {}

  res.json({
    status: 'ok',
    service: 'alexa-plus-application-api',
    port: API_PORT,
    mcpEndpoint: MCP_SERVER_URL,
    mcpStatus,
    timestamp: new Date().toISOString()
  });
});

// =========================================================================
// 2. CONVERSATIONS API
// =========================================================================
app.post('/api/conversations', (req, res) => {
  try {
    const { title, modelId } = req.body || {};
    const conv = createConversation({
      title: title || 'New Conversation',
      modelId: modelId || 'gpt-4o'
    });
    res.status(201).json(conv);
  } catch (err) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

app.get('/api/conversations', (req, res) => {
  try {
    const conversations = listConversations();
    res.json({ total: conversations.length, conversations });
  } catch (err) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

app.get('/api/conversations/:id', (req, res) => {
  try {
    const conv = getConversation(req.params.id);
    if (!conv) {
      return res.status(404).json({ error: { code: 'CONVERSATION_NOT_FOUND', message: `Conversation "${req.params.id}" was not found` } });
    }

    const db = getDatabase();
    const missions = db.prepare('SELECT id, title, goal, status, duration_ms, created_at, completed_at FROM missions WHERE conversation_id = ? ORDER BY created_at DESC').all(conv.id);

    res.json({ ...conv, missions });
  } catch (err) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// =========================================================================
// 3. MISSIONS API
// =========================================================================
app.post('/api/missions', async (req, res) => {
  const { conversationId, goal, title, sync } = req.body || {};

  if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'Mission goal is required and must be a non-empty string.' }
    });
  }

  try {
    // 1. Resolve or create parent conversation
    let activeConvId = conversationId;
    if (activeConvId) {
      const existingConv = getConversation(activeConvId);
      if (!existingConv) {
        return res.status(404).json({
          error: { code: 'CONVERSATION_NOT_FOUND', message: `Specified conversation "${activeConvId}" not found.` }
        });
      }
    } else {
      const newConv = createConversation({
        title: title || (goal.length > 35 ? `${goal.substring(0, 35)}...` : goal)
      });
      activeConvId = newConv.id;
    }

    // 2. Persist initial mission record in SQLite
    const mission = createMission({
      conversationId: activeConvId,
      title: title || (goal.length > 45 ? `${goal.substring(0, 45)}...` : goal),
      goal: goal.trim()
    });

    const isSync = sync === true || req.query.sync === 'true' || req.headers['x-sync'] === 'true';

    // Execution runner function (orchestrates over real MCP)
    const runMissionExecution = async () => {
      let clientSession = null;
      try {
        clientSession = await createMCPClient();
        const orchestrator = new AgentOrchestrator({
          mcpClient: clientSession.client,
          maxIterations: 6,
          timeoutMs: 40000,
          enablePersistence: true,
          onEvent: (event) => {
            // Dispatch live event to event bus for SSE listeners
            missionEventBus.emit(`event:${mission.id}`, event);
          }
        });

        const execResult = await orchestrator.executeMission(goal.trim(), {
          missionId: mission.id,
          conversationId: activeConvId
        });

        return execResult;
      } catch (execErr) {
        // Handle failure to connect to MCP or execution failure
        const db = getDatabase();
        db.prepare(`
          UPDATE missions SET status = 'FAILED', result_summary = ?, completed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE id = ?
        `).run(`Execution failed: ${execErr.message}`, mission.id);

        const failEventId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        try {
          recordActivityEvent({
            id: failEventId,
            missionId: mission.id,
            conversationId: activeConvId,
            eventType: 'mission.failed',
            title: 'Mission Failed',
            description: execErr.message,
            domain: 'Mission',
            status: 'ERROR',
            metadata: { error: execErr.message },
            isSynthetic: 0
          });
        } catch {}

        const failEvent = {
          id: failEventId,
          missionId: mission.id,
          conversationId: activeConvId,
          eventType: 'mission.failed',
          title: 'Mission Failed',
          description: execErr.message,
          domain: 'Mission',
          status: 'ERROR',
          metadata: { error: execErr.message },
          timestamp: new Date().toISOString()
        };
        missionEventBus.emit(`event:${mission.id}`, failEvent);
        throw execErr;
      } finally {
        if (clientSession?.transport) {
          try { await clientSession.transport.close(); } catch {}
        }
      }
    };

    if (isSync) {
      // Synchronous execution mode (waits for completion before responding)
      try {
        const result = await runMissionExecution();
        const detailedMission = getMissionWithDetails(mission.id);
        return res.status(200).json({
          mission: detailedMission,
          result
        });
      } catch (err) {
        const detailedMission = getMissionWithDetails(mission.id);
        return res.status(500).json({
          error: { code: 'MISSION_EXECUTION_FAILED', message: err.message },
          mission: detailedMission
        });
      }
    } else {
      // Asynchronous mode: Start execution in background, return 201 with streamUrl immediately
      runMissionExecution().catch(err => {
        console.error(`[API Background Mission ${mission.id} Error]:`, err.message);
      });

      return res.status(201).json({
        mission: {
          id: mission.id,
          conversationId: activeConvId,
          title: mission.title,
          goal: mission.goal,
          status: mission.status,
          createdAt: mission.created_at
        },
        streamUrl: `/api/missions/${mission.id}/stream`
      });
    }
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

app.get('/api/missions', (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const db = getDatabase();
    let sql = 'SELECT * FROM missions WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status.toUpperCase());
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const missions = db.prepare(sql).all(...params);
    res.json({ total: missions.length, missions });
  } catch (err) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

app.get('/api/missions/:id', (req, res) => {
  try {
    const mission = getMissionWithDetails(req.params.id);
    if (!mission) {
      return res.status(404).json({
        error: { code: 'MISSION_NOT_FOUND', message: `Mission with ID "${req.params.id}" does not exist.` }
      });
    }
    res.json(mission);
  } catch (err) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// =========================================================================
// 4. REAL-TIME SERVER-SENT EVENTS (SSE) MISSION STREAM (WITH DETERMINISTIC REPLAY)
// =========================================================================
app.get('/api/missions/:id/stream', (req, res) => {
  const missionId = req.params.id;
  const mission = getMission(missionId);

  if (!mission) {
    return res.status(404).json({
      error: { code: 'MISSION_NOT_FOUND', message: `Mission "${missionId}" was not found.` }
    });
  }

  // Setup Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  res.flushHeaders?.();

  const lastEventId = req.headers['last-event-id'] || req.query.lastEventId;
  const seenEventIds = new Set();
  const pendingLiveQueue = [];
  let replayFinished = false;

  const cleanup = () => {
    missionEventBus.off(`event:${missionId}`, liveListener);
  };

  const sendEvent = (event) => {
    if (!event || !event.id) return;
    if (seenEventIds.has(event.id)) return;
    seenEventIds.add(event.id);

    try {
      res.write(`id: ${event.id}\n`);
      res.write(`event: ${event.eventType}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);

      if (event.eventType === 'mission.completed' || event.eventType === 'mission.failed') {
        setTimeout(() => {
          try { res.end(); } catch {}
          cleanup();
        }, 300);
      }
    } catch {
      cleanup();
    }
  };

  // 1. Subscribe to live events FIRST to prevent any gap between DB query and subscription
  const liveListener = (liveEvent) => {
    if (!replayFinished) {
      pendingLiveQueue.push(liveEvent);
    } else {
      sendEvent(liveEvent);
    }
  };

  missionEventBus.on(`event:${missionId}`, liveListener);
  req.on('close', cleanup);

  // 2. Replay historical persisted events from SQLite using monotonic rowid
  try {
    const db = getDatabase();
    let replaySql = 'SELECT rowid, * FROM activity_events WHERE mission_id = ?';
    const replayParams = [missionId];

    if (lastEventId) {
      const refEvent = db.prepare('SELECT rowid FROM activity_events WHERE id = ?').get(lastEventId);
      if (refEvent) {
        replaySql += ' AND rowid > ?';
        replayParams.push(refEvent.rowid);
      }
    }

    replaySql += ' ORDER BY rowid ASC';
    const historicalEvents = db.prepare(replaySql).all(...replayParams);

    for (const hEvent of historicalEvents) {
      let metaObj = {};
      try { metaObj = JSON.parse(hEvent.metadata); } catch {}

      sendEvent({
        id: hEvent.id,
        missionId: hEvent.mission_id,
        conversationId: hEvent.conversation_id,
        eventType: hEvent.event_type,
        title: hEvent.title,
        description: hEvent.description,
        domain: hEvent.domain,
        status: hEvent.status,
        metadata: metaObj,
        timestamp: hEvent.created_at
      });
    }
  } catch (replayErr) {
    console.warn('[SSE Replay Warning]:', replayErr.message);
  } finally {
    // 3. Mark replay finished and flush any live events that arrived during DB query
    replayFinished = true;
    while (pendingLiveQueue.length > 0) {
      const queuedEvent = pendingLiveQueue.shift();
      sendEvent(queuedEvent);
    }
  }

  // If mission already finished prior to stream open and stream hasn't ended yet
  const latestMission = getMission(missionId);
  if (latestMission?.status === 'COMPLETED' || latestMission?.status === 'FAILED') {
    setTimeout(() => {
      try { res.end(); } catch {}
      cleanup();
    }, 600);
  }
});

// =========================================================================
// 5. TOOLS API (DYNAMIC REAL MCP DISCOVERY)
// =========================================================================
app.get('/api/tools', async (req, res) => {
  let clientSession = null;
  try {
    clientSession = await createMCPClient();
    const toolsResult = await clientSession.client.request(
      { method: 'tools/list', params: {} },
      ListToolsResultSchema
    );

    const rawTools = toolsResult.tools || [];
    const enrichedTools = rawTools.map(t => ({
      name: t.name,
      description: t.description,
      domain: categorizeToolDomain(t.name),
      inputSchema: t.inputSchema,
      requiresApproval: t.name === 'notifications_create'
    }));

    res.json({
      total: enrichedTools.length,
      serverUrl: MCP_SERVER_URL,
      tools: enrichedTools
    });
  } catch (mcpErr) {
    res.status(503).json({
      error: {
        code: 'MCP_SERVER_UNAVAILABLE',
        message: `Failed to discover tools: MCP server is unreachable at ${MCP_SERVER_URL} (${mcpErr.message})`
      }
    });
  } finally {
    if (clientSession?.transport) {
      try { await clientSession.transport.close(); } catch {}
    }
  }
});

// =========================================================================
// 6. KNOWLEDGE API (SQLITE DOCUMENT REPOSITORY)
// =========================================================================
app.get('/api/knowledge', (req, res) => {
  try {
    const { query, category, limit = 20 } = req.query;
    const db = getDatabase();

    let sql = 'SELECT id, title, filename, file_type, category, page_count, size_mb, summary, uploaded_at FROM documents WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND LOWER(category) = ?';
      params.push(category.toLowerCase());
    }

    if (query && query.trim().length > 0) {
      sql += ' AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)';
      const wildcard = `%${query.trim()}%`;
      params.push(wildcard, wildcard, wildcard);
    }

    sql += ' ORDER BY uploaded_at DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const documents = db.prepare(sql).all(...params);
    res.json({ total: documents.length, documents });
  } catch (err) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

app.get('/api/knowledge/:id', (req, res) => {
  try {
    const db = getDatabase();
    const doc = db.prepare('SELECT * FROM documents WHERE id = ? OR filename = ?').get(req.params.id, req.params.id);

    if (!doc) {
      return res.status(404).json({
        error: { code: 'DOCUMENT_NOT_FOUND', message: `Document "${req.params.id}" not found.` }
      });
    }

    res.json({
      ...doc,
      key_insights: (() => { try { return JSON.parse(doc.key_insights); } catch { return []; } })(),
      action_items: (() => { try { return JSON.parse(doc.action_items); } catch { return []; } })(),
      risks: (() => { try { return JSON.parse(doc.risks); } catch { return []; } })(),
      decisions_needed: (() => { try { return JSON.parse(doc.decisions_needed); } catch { return []; } })()
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// =========================================================================
// 7. ACTIVITY API (REAL AUDIT TRAIL & METRICS)
// =========================================================================
app.get('/api/activity', (req, res) => {
  try {
    const { limit = 50, domain, eventType, isSynthetic } = req.query;
    const db = getDatabase();

    // 1. Calculate genuine aggregate metrics directly from SQLite
    const totalActivities = db.prepare('SELECT COUNT(*) as count FROM activity_events').get().count;
    const missionsCount = db.prepare('SELECT COUNT(*) as count FROM missions').get().count;
    const toolActionsCount = db.prepare('SELECT COUNT(*) as count FROM tool_executions').get().count;
    // Genuine user-connected integrations (never conflate with synthetic demo rows)
    const genuineConnectedCount = db.prepare("SELECT COUNT(*) as count FROM integrations WHERE status = 'CONNECTED' AND is_synthetic = 0").get().count;
    const demoIntegrationsCount = db.prepare("SELECT COUNT(*) as count FROM integrations WHERE status = 'DEMO'").get().count;

    // 2. Query event logs
    let sql = 'SELECT * FROM activity_events WHERE 1=1';
    const params = [];

    if (domain) {
      sql += ' AND domain = ?';
      params.push(domain);
    }
    if (eventType) {
      sql += ' AND event_type = ?';
      params.push(eventType);
    }
    if (isSynthetic !== undefined) {
      sql += ' AND is_synthetic = ?';
      params.push(isSynthetic === 'true' || isSynthetic === '1' ? 1 : 0);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const events = db.prepare(sql).all(...params).map(e => ({
      ...e,
      metadata: (() => { try { return JSON.parse(e.metadata); } catch { return e.metadata; } })()
    }));

    // 3. Top tools usage breakdown
    const topTools = db.prepare(`
      SELECT tool_name, COUNT(*) as count
      FROM tool_executions
      GROUP BY tool_name
      ORDER BY count DESC
      LIMIT 5
    `).all();

    res.json({
      metrics: {
        totalActivities,
        missionsCount,
        toolActionsCount,
        integrationsCount: genuineConnectedCount,
        connectedIntegrationsCount: genuineConnectedCount,
        demoIntegrationsCount
      },
      topTools,
      totalEvents: events.length,
      events
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// =========================================================================
// 8. INTEGRATIONS API (HONEST CONNECTOR STATUS)
// =========================================================================
app.get('/api/integrations', (req, res) => {
  try {
    const integrations = listIntegrations();
    const connectedCount = integrations.filter(i => i.status === 'CONNECTED' || i.status === 'DEMO').length;

    res.json({
      total: integrations.length,
      connectedCount,
      integrations
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

app.get('/api/integrations/:id', (req, res) => {
  try {
    const db = getDatabase();
    const integration = db.prepare('SELECT * FROM integrations WHERE id = ?').get(req.params.id);
    if (!integration) {
      return res.status(404).json({
        error: { code: 'INTEGRATION_NOT_FOUND', message: `Integration "${req.params.id}" not found.` }
      });
    }
    res.json(integration);
  } catch (err) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// =========================================================================
// 9. SETTINGS API (PROFILE & USER PREFERENCES)
// =========================================================================
app.get('/api/settings', (req, res) => {
  res.json({
    profile: {
      name: 'Shanmukheswar',
      email: 'shanmukheswar@example.com',
      role: 'Pro Builder',
      location: 'India',
      status: 'Active',
      joinedAt: '2026-10-01T00:00:00.000Z'
    },
    plan: {
      tier: 'Pro Builder',
      badge: 'Active',
      features: [
        'Unlimited conversations',
        'Advanced tool access',
        'Priority processing',
        'Extended context memory',
        'Early access to new features'
      ]
    },
    preferences: {
      theme: 'system',
      defaultModel: 'gpt-4o',
      notificationsEnabled: true,
      autoExecutionApproved: false
    }
  });
});

// =========================================================================
// 10. STATIC FRONTEND SERVING (VITE PRODUCTION BUNDLE)
// =========================================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_PATH = path.resolve(__dirname, '../../dist');

app.use(express.static(DIST_PATH));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  const indexPath = path.join(DIST_PATH, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// =========================================================================
// 11. SERVER STARTUP (WHEN EXECUTED DIRECTLY)
// =========================================================================
if (process.argv[1]?.endsWith('server.mjs') && !process.env.TEST_MODE) {
  app.listen(API_PORT, '127.0.0.1', () => {
    console.log(`[Application API] Process 1 API running on http://127.0.0.1:${API_PORT}`);
    console.log(`[Application API] Connected to MCP Server on ${MCP_SERVER_URL}`);
  });
}
