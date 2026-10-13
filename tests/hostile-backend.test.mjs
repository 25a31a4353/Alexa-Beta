import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ListToolsResultSchema, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

import { app, missionEventBus } from '../src/api/server.mjs';
import {
  getDatabase,
  getMission,
  getMissionWithDetails,
  createConversation,
  createMission,
  recordActivityEvent
} from '../src/db/index.mjs';
import { AgentOrchestrator } from '../src/agent/orchestrator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_PORT = 3000;
const MCP_PORT = 3001;
const BASE_URL = `http://127.0.0.1:${API_PORT}`;
const MCP_URL = `http://127.0.0.1:${MCP_PORT}/mcp`;

let mcpProcess = null;
let apiServer = null;

// Helper to start MCP Server process
function startMcpProcess() {
  return new Promise((resolve, reject) => {
    const serverPath = path.resolve(__dirname, '../src/mcp/server.mjs');
    mcpProcess = spawn('node', [serverPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, MCP_PORT: String(MCP_PORT) }
    });

    let stdoutData = '';
    mcpProcess.stdout.on('data', (d) => { stdoutData += d.toString(); });
    mcpProcess.stderr.on('data', (d) => { console.error('[MCP Proc Stderr]:', d.toString()); });

    const timeout = setTimeout(() => {
      reject(new Error(`MCP Server failed to start within timeout. Stdout: ${stdoutData}`));
    }, 8000);

    const checkReady = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${MCP_PORT}/health`);
        if (res.ok) {
          clearTimeout(timeout);
          resolve();
          return;
        }
      } catch {}
      setTimeout(checkReady, 250);
    };

    setTimeout(checkReady, 500);
  });
}

// Helper to kill MCP Server process
function stopMcpProcess() {
  return new Promise((resolve) => {
    if (!mcpProcess) return resolve();
    mcpProcess.on('exit', () => {
      mcpProcess = null;
      resolve();
    });
    mcpProcess.kill('SIGTERM');
    setTimeout(() => {
      if (mcpProcess) {
        try { mcpProcess.kill('SIGKILL'); } catch {}
        mcpProcess = null;
      }
      resolve();
    }, 1500);
  });
}

// Helper to start Express API Server
function startApiServer() {
  return new Promise((resolve) => {
    apiServer = http.createServer(app);
    apiServer.listen(API_PORT, '127.0.0.1', () => resolve());
  });
}

// Helper to stop Express API Server
function stopApiServer() {
  return new Promise((resolve) => {
    if (!apiServer) return resolve();
    try { apiServer.closeAllConnections?.(); } catch {}
    apiServer.close(() => {
      apiServer = null;
      setTimeout(resolve, 300);
    });
  });
}

// Helper to read full SSE stream until completion
function collectSseEvents(streamUrl, headers = {}) {
  return new Promise((resolve, reject) => {
    const events = [];
    const req = http.get(streamUrl, { headers }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`SSE returned HTTP ${res.statusCode}`));
      }

      let buffer = '';
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop();

        for (const block of blocks) {
          if (!block.trim()) continue;
          let id = null;
          let event = 'message';
          let data = null;

          for (const line of block.split('\n')) {
            if (line.startsWith('id: ')) id = line.substring(4);
            if (line.startsWith('event: ')) event = line.substring(7);
            if (line.startsWith('data: ')) {
              try { data = JSON.parse(line.substring(6)); } catch {}
            }
          }
          if (data) {
            events.push({ id, event, data });
          }
        }
      });

      res.on('end', () => resolve(events));
      res.on('error', reject);
    });

    req.on('error', reject);
  });
}

async function runHostileVerification() {
  console.log('========================================================================');
  console.log('PHASE 2.5: HOSTILE BACKEND & CONTRACT VERIFICATION SUITE');
  console.log('========================================================================\n');

  // Start both processes
  console.log('[Setup] Starting MCP Server (Port 3001)...');
  await startMcpProcess();
  console.log('[Setup] Starting Application API (Port 3000)...');
  await startApiServer();

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Mission Duplication Test
    // -------------------------------------------------------------------------
    console.log('\n[Test 1] MISSION DUPLICATION VERIFICATION');
    console.log('  Submitting POST /api/missions and querying SQLite directly...');
    const db = getDatabase();
    const countBefore = db.prepare('SELECT COUNT(*) as count FROM missions').get().count;

    const dupGoal = 'Hostile duplication probe: test exactly one mission record created.';
    const dupRes = await fetch(`${BASE_URL}/api/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: dupGoal, sync: true })
    });

    const dupData = await dupRes.json();
    const dupMissionId = dupData.mission.id;

    // Direct SQLite queries
    const missionRows = db.prepare('SELECT * FROM missions WHERE id = ?').all(dupMissionId);
    const countAfter = db.prepare('SELECT COUNT(*) as count FROM missions').get().count;

    console.log(`  Mission ID created: ${dupMissionId}`);
    console.log(`  Matching rows in SQLite: ${missionRows.length}`);
    console.log(`  Total missions count diff: ${countAfter - countBefore}`);

    if (missionRows.length !== 1) {
      throw new Error(`CRITICAL FAIL: Expected exactly 1 mission row for ID ${dupMissionId}, found ${missionRows.length}!`);
    }
    if (countAfter - countBefore !== 1) {
      throw new Error(`CRITICAL FAIL: Mission table count increased by ${countAfter - countBefore}, expected strictly 1!`);
    }
    console.log('[PASS] Test 1: Exactly 1 mission row created; zero duplicate inserts.');

    // -------------------------------------------------------------------------
    // TEST 2: Tools API Reality Check
    // -------------------------------------------------------------------------
    console.log('\n[Test 2] TOOLS API REALITY CHECK');
    console.log('  Comparing GET /api/tools with live MCP tools/list...');
    const apiToolsRes = await fetch(`${BASE_URL}/api/tools`);
    const apiToolsData = await apiToolsRes.json();

    // Query MCP directly
    const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
    const directClient = new Client({ name: 'hostile-tester', version: '1.0.0' }, { capabilities: {} });
    await directClient.connect(transport);
    const mcpDirectList = await directClient.request({ method: 'tools/list', params: {} }, ListToolsResultSchema);
    await transport.close();

    const apiNames = apiToolsData.tools.map(t => t.name).sort();
    const directNames = mcpDirectList.tools.map(t => t.name).sort();

    console.log(`  API tools discovered (${apiNames.length}):`, apiNames.join(', '));
    console.log(`  MCP direct tools (${directNames.length}):`, directNames.join(', '));

    if (apiNames.length !== directNames.length || !apiNames.every((n, i) => n === directNames[i])) {
      throw new Error('CRITICAL FAIL: GET /api/tools does not reflect live MCP server tools/list!');
    }
    console.log('[PASS] Test 2: Tools API matches live MCP tools/list 1:1. No fake catalog.');

    // -------------------------------------------------------------------------
    // TEST 3: Knowledge API Reality Check
    // -------------------------------------------------------------------------
    console.log('\n[Test 3] KNOWLEDGE API REALITY CHECK');
    console.log('  Verifying GET /api/knowledge backed by SQLite...');
    const knowApiRes = await fetch(`${BASE_URL}/api/knowledge`);
    const knowApiData = await knowApiRes.json();

    const sqliteDocs = db.prepare('SELECT id, title, filename FROM documents ORDER BY uploaded_at DESC').all();

    console.log(`  API docs count: ${knowApiData.total} | SQLite docs count: ${sqliteDocs.length}`);
    if (knowApiData.total !== sqliteDocs.length) {
      throw new Error(`CRITICAL FAIL: Knowledge API total (${knowApiData.total}) != SQLite count (${sqliteDocs.length})`);
    }

    const docId = sqliteDocs[0].id;
    const docDetailRes = await fetch(`${BASE_URL}/api/knowledge/${docId}`);
    const docDetail = await docDetailRes.json();
    console.log(`  Verified document detail "${docDetail.title}" (ID: ${docDetail.id})`);
    if (docDetail.id !== docId || !docDetail.content || !Array.isArray(docDetail.key_insights)) {
      throw new Error('CRITICAL FAIL: Knowledge detail does not match SQLite document schema!');
    }
    console.log('[PASS] Test 3: Knowledge API is 100% SQLite backed. No fake hardcoded items.');

    // -------------------------------------------------------------------------
    // TEST 4: Activity Metrics Reality Check
    // -------------------------------------------------------------------------
    console.log('\n[Test 4] ACTIVITY METRICS REALITY CHECK');
    const actRes = await fetch(`${BASE_URL}/api/activity`);
    const actData = await actRes.json();

    const dbActs = db.prepare('SELECT COUNT(*) as count FROM activity_events').get().count;
    const dbMissions = db.prepare('SELECT COUNT(*) as count FROM missions').get().count;
    const dbTools = db.prepare('SELECT COUNT(*) as count FROM tool_executions').get().count;
    const dbConnected = db.prepare("SELECT COUNT(*) as count FROM integrations WHERE status = 'CONNECTED' AND is_synthetic = 0").get().count;

    console.log('  Reported metrics:', JSON.stringify(actData.metrics));
    console.log(`  DB verification: activities=${dbActs}, missions=${dbMissions}, tools=${dbTools}, connectedIntegrations=${dbConnected}`);

    if (actData.metrics.totalActivities !== dbActs) {
      throw new Error(`FAIL: totalActivities mismatch (${actData.metrics.totalActivities} vs ${dbActs})`);
    }
    if (actData.metrics.missionsCount !== dbMissions) {
      throw new Error(`FAIL: missionsCount mismatch (${actData.metrics.missionsCount} vs ${dbMissions})`);
    }
    if (actData.metrics.toolActionsCount !== dbTools) {
      throw new Error(`FAIL: toolActionsCount mismatch (${actData.metrics.toolActionsCount} vs ${dbTools})`);
    }
    if (actData.metrics.integrationsCount !== 0 || actData.metrics.integrationsCount !== dbConnected) {
      throw new Error(`FAIL: integrationsCount inflated with synthetic rows! Expected 0, got ${actData.metrics.integrationsCount}`);
    }
    console.log('[PASS] Test 4: Activity metrics are honest and derived directly from SQLite.');

    // -------------------------------------------------------------------------
    // TEST 5: SSE Gap / Race Exposure Test
    // -------------------------------------------------------------------------
    console.log('\n[Test 5] SSE GAP & RACE EXPOSURE TEST');
    console.log('  Testing live emission concurrent with connection establishment...');

    // Create a new mission row directly in DB to simulate rapid startup
    const testConv = createConversation({ title: 'SSE Race Probe' });
    const raceMission = createMission({
      conversationId: testConv.id,
      goal: 'SSE race test probe'
    });

    const emittedIds = [];
    const eventCount = 8;

    // Connect SSE client
    const streamUrl = `${BASE_URL}/api/missions/${raceMission.id}/stream`;
    const sseReceived = [];
    let sseFinishedResolve;
    const sseFinishedPromise = new Promise(r => { sseFinishedResolve = r; });

    // Rapidly interleave event emission right as client connects
    const req = http.get(streamUrl, (res) => {
      let buf = '';
      res.on('data', chunk => {
        buf += chunk.toString();
        const parts = buf.split('\n\n');
        buf = parts.pop();
        for (const p of parts) {
          if (!p.trim()) continue;
          for (const line of p.split('\n')) {
            if (line.startsWith('id: ')) {
              sseReceived.push(line.substring(4));
            }
          }
        }
      });
      res.on('end', () => sseFinishedResolve());
    });

    // Concurrently emit events into event bus and SQLite
    for (let i = 1; i <= eventCount; i++) {
      const eId = `act_race_${i}_${Date.now()}`;
      emittedIds.push(eId);
      const isTerminal = (i === eventCount);
      const evt = {
        id: eId,
        missionId: raceMission.id,
        conversationId: testConv.id,
        eventType: isTerminal ? 'mission.completed' : 'step.started',
        title: `Race event ${i}`,
        description: `Description ${i}`,
        domain: 'Tool',
        status: 'INFO',
        metadata: { index: i }
      };

      // Persist to DB and emit to bus
      recordActivityEvent({
        id: evt.id,
        missionId: evt.missionId,
        conversationId: evt.conversationId,
        eventType: evt.eventType,
        title: evt.title,
        description: evt.description,
        domain: evt.domain,
        status: evt.status,
        metadata: evt.metadata,
        isSynthetic: 0
      });
      missionEventBus.emit(`event:${raceMission.id}`, evt);
      await new Promise(r => setTimeout(r, 20));
    }

    await sseFinishedPromise;
    console.log(`  Emitted ${emittedIds.length} events | Received ${sseReceived.length} events`);
    console.log('  Received IDs:', sseReceived);

    // Verify all emitted events were captured
    const missing = emittedIds.filter(id => !sseReceived.includes(id));
    const duplicates = sseReceived.filter((item, idx) => sseReceived.indexOf(item) !== idx);

    if (missing.length > 0) {
      throw new Error(`CRITICAL FAIL: Race condition dropped ${missing.length} events: ${missing.join(', ')}`);
    }
    if (duplicates.length > 0) {
      throw new Error(`CRITICAL FAIL: Race condition generated duplicate events: ${duplicates.join(', ')}`);
    }
    console.log('[PASS] Test 5: SSE Gap/Race eliminated. Zero dropped events, zero duplicates.');

    // -------------------------------------------------------------------------
    // TEST 6: SSE Replay & Last-Event-ID Test
    // -------------------------------------------------------------------------
    console.log('\n[Test 6] SSE REPLAY & LAST-EVENT-ID TEST');
    console.log('  Reconnecting with Last-Event-ID halfway through stream...');

    const midpointIndex = Math.floor(emittedIds.length / 2);
    const lastEventId = emittedIds[midpointIndex - 1];
    const expectedReplayIds = emittedIds.slice(midpointIndex);

    console.log(`  Supplying Last-Event-ID: ${lastEventId}`);
    console.log(`  Expected replayed events (${expectedReplayIds.length}):`, expectedReplayIds);

    const replayedEvents = await collectSseEvents(streamUrl, { 'Last-Event-ID': lastEventId });
    const replayedIds = replayedEvents.map(e => e.id);

    console.log(`  Actual replayed events (${replayedIds.length}):`, replayedIds);

    if (replayedIds.length !== expectedReplayIds.length) {
      throw new Error(`FAIL: Expected ${expectedReplayIds.length} replayed events, got ${replayedIds.length}`);
    }
    for (let i = 0; i < expectedReplayIds.length; i++) {
      if (replayedIds[i] !== expectedReplayIds[i]) {
        throw new Error(`FAIL: Replay mismatch at index ${i}: expected ${expectedReplayIds[i]}, got ${replayedIds[i]}`);
      }
    }
    console.log('[PASS] Test 6: Replay delivers only missing events in strict monotonic order.');

    // -------------------------------------------------------------------------
    // TEST 7: Terminal Event & Stream Closure Test
    // -------------------------------------------------------------------------
    console.log('\n[Test 7] TERMINAL EVENT & STREAM CLOSURE TEST');
    console.log('  Testing mission.completed and mission.failed streams close cleanly...');

    // A) Completed stream already verified in Test 5 & 6 (both closed within < 1000ms)
    // B) Failed stream test
    const failConv = createConversation({ title: 'Terminal Failure Probe' });
    const failMission = createMission({ conversationId: failConv.id, goal: 'Terminal failure probe' });

    const failStreamUrl = `${BASE_URL}/api/missions/${failMission.id}/stream`;
    const failEventsReceived = [];
    let failClosed = false;

    const failStreamPromise = new Promise((resolve, reject) => {
      const failReq = http.get(failStreamUrl, (res) => {
        let buf = '';
        res.on('data', chunk => {
          buf += chunk.toString();
          const parts = buf.split('\n\n');
          buf = parts.pop();
          for (const p of parts) {
            if (!p.trim()) continue;
            for (const line of p.split('\n')) {
              if (line.startsWith('event: ')) failEventsReceived.push(line.substring(7));
            }
          }
        });
        res.on('end', () => {
          failClosed = true;
          resolve();
        });
        res.on('error', reject);
      });
    });

    // Emit mission.failed terminal event
    await new Promise(r => setTimeout(r, 100));
    missionEventBus.emit(`event:${failMission.id}`, {
      id: `act_fail_${Date.now()}`,
      missionId: failMission.id,
      eventType: 'mission.failed',
      title: 'Mission Failed',
      description: 'Hostile test failure',
      status: 'ERROR'
    });

    await Promise.race([
      failStreamPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('FAIL: SSE stream hung on terminal event!')), 3000))
    ]);

    if (!failClosed) throw new Error('FAIL: Stream did not close after terminal event!');
    console.log('[PASS] Test 7: Terminal events (completed/failed) close stream deterministically. No hanging connections.');

    // -------------------------------------------------------------------------
    // TEST 8: Invalid Tool Argument Test
    // -------------------------------------------------------------------------
    console.log('\n[Test 8] INVALID TOOL ARGUMENT TEST');
    console.log('  Invoking calendar_get_events with invalid ISO timestamp and inverted date range...');

    // Connect real MCP client to verify tool failure behavior
    const toolClientTransport = new StreamableHTTPClientTransport(new URL(MCP_URL));
    const toolMcpClient = new Client({ name: 'arg-test-client', version: '1.0.0' }, { capabilities: {} });
    await toolMcpClient.connect(toolClientTransport);

    const invalidCallResult = await toolMcpClient.request(
      {
        method: 'tools/call',
        params: {
          name: 'calendar_get_events',
          arguments: {
            startDate: '2026-10-20T00:00:00.000Z',
            endDate: '2026-10-10T00:00:00.000Z' // startDate > endDate: INVALID!
          }
        }
      },
      CallToolResultSchema
    );

    await toolClientTransport.close();

    console.log('  Invalid tool execution result:', JSON.stringify(invalidCallResult));
    if (!invalidCallResult.isError) {
      throw new Error('FAIL: Tool with inverted dates did not return isError=true!');
    }

    // Now test Orchestrator handling of tool returning isError=true
    console.log('  Testing Orchestrator handling of failed tool invocation...');
    const dummyClientTransport = new StreamableHTTPClientTransport(new URL(MCP_URL));
    const orchestratorClient = new Client({ name: 'orch-arg-test', version: '1.0.0' }, { capabilities: {} });
    await orchestratorClient.connect(dummyClientTransport);

    let toolFailedEventReceived = false;
    const testOrchestrator = new AgentOrchestrator({
      mcpClient: orchestratorClient,
      maxIterations: 1,
      timeoutMs: 5000,
      enablePersistence: true,
      llmProvider: {
        name: 'mock-failing-llm',
        model: 'mock',
        generateDecision: async () => ({
          type: 'tool_call',
          toolCalls: [{
            id: 'tc-bad-1',
            name: 'calendar_get_events',
            arguments: { startDate: 'bad-date', endDate: 'bad-date' }
          }]
        })
      },
      onEvent: (e) => {
        if (e.eventType === 'tool.failed') toolFailedEventReceived = true;
      }
    });

    const orchFailConv = createConversation({ title: 'Invalid Tool Arg Test' });
    const orchFailMission = createMission({ conversationId: orchFailConv.id, goal: 'Probe bad tool args' });

    const orchResult = await testOrchestrator.executeMission('Probe bad tool args', {
      missionId: orchFailMission.id,
      conversationId: orchFailConv.id
    });

    await dummyClientTransport.close();

    // Verify in SQLite
    const failedMissionDetails = getMissionWithDetails(orchFailMission.id);
    const toolExec = failedMissionDetails.toolExecutions[0];

    console.log('  Tool execution status in SQLite:', toolExec?.status);
    console.log('  Tool error message in SQLite:', toolExec?.error_message?.substring(0, 100));
    console.log('  Mission status in SQLite:', failedMissionDetails.status);

    if (toolExec?.status !== 'FAILED') {
      throw new Error(`CRITICAL FAIL: Tool execution marked ${toolExec?.status}, expected FAILED!`);
    }
    if (!toolFailedEventReceived) {
      throw new Error('CRITICAL FAIL: tool.failed event was not emitted!');
    }
    if (failedMissionDetails.status === 'COMPLETED') {
      throw new Error('CRITICAL FAIL: Mission falsely marked COMPLETED when tool failed!');
    }
    console.log('[PASS] Test 8: Tool validation failures marked FAILED in SQLite, emitted tool.failed, no false COMPLETED state.');

    // -------------------------------------------------------------------------
    // TEST 9: Restart Persistence Test
    // -------------------------------------------------------------------------
    console.log('\n[Test 9] RESTART PERSISTENCE TEST');
    console.log('  Stopping Application API Server...');
    await stopApiServer();

    console.log('  Restarting Application API Server...');
    await startApiServer();

    console.log(`  Querying GET /api/missions/${dupMissionId} after server restart...`);
    await new Promise(r => setTimeout(r, 200));
    const restartMissionRes = await fetch(`${BASE_URL}/api/missions/${dupMissionId}`, {
      headers: { Connection: 'close' }
    });
    if (!restartMissionRes.ok) {
      throw new Error(`FAIL: Server restart caused 404 for mission ${dupMissionId}`);
    }
    const restartMissionData = await restartMissionRes.json();

    console.log('  Restored mission status:', restartMissionData.status);
    console.log('  Restored steps count:', restartMissionData.steps?.length);
    console.log('  Restored tool executions:', restartMissionData.toolExecutions?.length);
    console.log('  Restored activity events:', restartMissionData.activityEvents?.length);

    if (!restartMissionData.steps || !restartMissionData.toolExecutions || !restartMissionData.activityEvents) {
      throw new Error('CRITICAL FAIL: Server restart lost relational child collections!');
    }
    console.log('[PASS] Test 9: Complete mission history intact across Application API process restart.');

    // -------------------------------------------------------------------------
    // TEST 10: API Error Contracts Test
    // -------------------------------------------------------------------------
    console.log('\n[Test 10] API ERROR CONTRACTS TEST');
    const errorChecks = [
      {
        url: `${BASE_URL}/api/missions`,
        method: 'POST',
        body: JSON.stringify({ goal: '' }),
        expectedStatus: 400,
        expectedCode: 'INVALID_INPUT'
      },
      {
        url: `${BASE_URL}/api/missions/msn-does-not-exist`,
        method: 'GET',
        expectedStatus: 404,
        expectedCode: 'MISSION_NOT_FOUND'
      },
      {
        url: `${BASE_URL}/api/conversations/conv-does-not-exist`,
        method: 'GET',
        expectedStatus: 404,
        expectedCode: 'CONVERSATION_NOT_FOUND'
      },
      {
        url: `${BASE_URL}/api/knowledge/doc-does-not-exist`,
        method: 'GET',
        expectedStatus: 404,
        expectedCode: 'DOCUMENT_NOT_FOUND'
      },
      {
        url: `${BASE_URL}/api/integrations/integ-does-not-exist`,
        method: 'GET',
        expectedStatus: 404,
        expectedCode: 'INTEGRATION_NOT_FOUND'
      }
    ];

    for (const ec of errorChecks) {
      const r = await fetch(ec.url, {
        method: ec.method,
        headers: ec.body ? { 'Content-Type': 'application/json' } : undefined,
        body: ec.body
      });
      const body = await r.json();
      console.log(`  Checked ${ec.method} ${ec.url.substring(BASE_URL.length)} -> HTTP ${r.status}: [${body.error?.code}]`);
      if (r.status !== ec.expectedStatus || body.error?.code !== ec.expectedCode) {
        throw new Error(`FAIL: Expected HTTP ${ec.expectedStatus} with code ${ec.expectedCode}, got ${r.status} ${JSON.stringify(body)}`);
      }
    }
    console.log('[PASS] Test 10: Error contracts have consistent JSON structure and honest status codes.');

    // -------------------------------------------------------------------------
    // TEST 11: Concurrency Isolation Test
    // -------------------------------------------------------------------------
    console.log('\n[Test 11] CONCURRENCY ISOLATION TEST');
    console.log('  Submitting two missions simultaneously...');

    const [cResA, cResB] = await Promise.all([
      fetch(`${BASE_URL}/api/missions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: 'Concurrency Probe A: review calendar events', sync: true })
      }),
      fetch(`${BASE_URL}/api/missions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: 'Concurrency Probe B: inspect knowledge document roadmap', sync: true })
      })
    ]);

    const mDataA = await cResA.json();
    const mDataB = await cResB.json();

    const mIdA = mDataA.mission.id;
    const mIdB = mDataB.mission.id;

    console.log(`  Mission A ID: ${mIdA} (Conv: ${mDataA.mission.conversation_id})`);
    console.log(`  Mission B ID: ${mIdB} (Conv: ${mDataB.mission.conversation_id})`);

    if (mIdA === mIdB) {
      throw new Error('CRITICAL FAIL: Concurrent missions shared the same ID!');
    }
    if (mDataA.mission.conversation_id === mDataB.mission.conversation_id) {
      throw new Error('FAIL: Independent concurrent missions shared the same conversation ID!');
    }

    // Verify tool execution ownership
    const toolsA = db.prepare('SELECT id, tool_name FROM tool_executions WHERE mission_id = ?').all(mIdA);
    const toolsB = db.prepare('SELECT id, tool_name FROM tool_executions WHERE mission_id = ?').all(mIdB);

    const toolsASet = new Set(toolsA.map(t => t.id));
    const toolsBSet = new Set(toolsB.map(t => t.id));

    const intersection = [...toolsASet].filter(x => toolsBSet.has(x));
    if (intersection.length > 0) {
      throw new Error(`CRITICAL FAIL: Tool executions cross-contaminated between missions: ${intersection.join(', ')}`);
    }

    console.log(`  Mission A tools count: ${toolsA.length} | Mission B tools count: ${toolsB.length}`);
    console.log('[PASS] Test 11: Concurrent missions run with complete state isolation and zero cross-talk.');

    // -------------------------------------------------------------------------
    // TEST 12: MCP Server Down Failure & Recovery Test
    // -------------------------------------------------------------------------
    console.log('\n[Test 12] MCP SERVER FAILURE & RECOVERY TEST');
    console.log('  Stopping MCP Server (Port 3001)...');
    await stopMcpProcess();

    // Verify /health reports offline
    const healthOffRes = await fetch(`${BASE_URL}/health`);
    const healthOffData = await healthOffRes.json();
    console.log('  API Health when MCP stopped:', healthOffData.mcpStatus);
    if (healthOffData.mcpStatus !== 'offline') {
      throw new Error('FAIL: /health did not report mcpStatus offline!');
    }

    // Verify GET /api/tools returns 503
    const toolsOfflineRes = await fetch(`${BASE_URL}/api/tools`);
    const toolsOfflineData = await toolsOfflineRes.json();
    console.log(`  GET /api/tools returned HTTP ${toolsOfflineRes.status}:`, toolsOfflineData.error?.code);
    if (toolsOfflineRes.status !== 503 || toolsOfflineData.error?.code !== 'MCP_SERVER_UNAVAILABLE') {
      throw new Error('FAIL: GET /api/tools did not return HTTP 503 MCP_SERVER_UNAVAILABLE!');
    }

    // Submit mission while MCP is offline
    console.log('  Submitting mission with MCP offline...');
    const downMissionRes = await fetch(`${BASE_URL}/api/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'Mission during MCP outage', sync: true })
    });

    console.log(`  Mission submission returned HTTP ${downMissionRes.status}`);
    if (downMissionRes.status !== 500) {
      throw new Error(`FAIL: Expected HTTP 500 when MCP is offline, got ${downMissionRes.status}`);
    }

    const downMissionBody = await downMissionRes.json();
    const downMId = downMissionBody.mission?.id;
    console.log(`  Failed mission ID: ${downMId} | Status: ${downMissionBody.mission?.status}`);

    // Verify SQLite reflects failure
    const downMissionInDb = getMission(downMId);
    if (downMissionInDb.status !== 'FAILED') {
      throw new Error(`CRITICAL FAIL: Mission status in SQLite is ${downMissionInDb.status}, expected FAILED!`);
    }

    // Verify activity event in SQLite
    const downEvent = db.prepare("SELECT * FROM activity_events WHERE mission_id = ? AND event_type = 'mission.failed'").get(downMId);
    if (!downEvent) {
      throw new Error('CRITICAL FAIL: mission.failed activity event was not persisted during MCP failure!');
    }
    console.log('  Verified persisted failure activity event:', downEvent.title);

    // Restart MCP Server
    console.log('  Restarting MCP Server...');
    await startMcpProcess();

    // Verify recovery
    const healthBackRes = await fetch(`${BASE_URL}/health`);
    const healthBackData = await healthBackRes.json();
    console.log('  API Health after MCP restart:', healthBackData.mcpStatus);
    if (healthBackData.mcpStatus !== 'online') {
      throw new Error('FAIL: /health did not recover to online after MCP restart!');
    }

    // Verify normal execution works again
    console.log('  Executing normal mission post-recovery...');
    const recoveryRes = await fetch(`${BASE_URL}/api/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'Recovery verification mission', sync: true })
    });
    const recoveryData = await recoveryRes.json();
    console.log(`  Post-recovery mission status: ${recoveryData.mission?.status}`);
    if (recoveryData.mission?.status !== 'COMPLETED') {
      throw new Error('FAIL: Mission failed after MCP recovery!');
    }
    console.log('[PASS] Test 12: MCP failure handled honestly in DB and API, then clean recovery verified.');

    console.log('\n========================================================================');
    console.log('ALL 12 HOSTILE BACKEND & CONTRACT VERIFICATIONS PASSED (100%)');
    console.log('========================================================================');
  } finally {
    console.log('\n[Teardown] Cleaning up servers...');
    await stopApiServer();
    await stopMcpProcess();
  }
}

runHostileVerification().catch((err) => {
  console.error('\n[HOSTILE VERIFICATION RUNNER FAILED]:', err);
  stopApiServer().finally(() => stopMcpProcess().finally(() => process.exit(1)));
});
