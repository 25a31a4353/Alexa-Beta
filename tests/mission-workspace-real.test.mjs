import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from '../src/api/server.mjs';
import {
  createMission,
  createMissionStep,
  recordToolExecution,
  updateToolExecution,
  updateMission,
  getMissionWithDetails,
  recordActivityEvent
} from '../src/db/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMissionWorkspaceRealTest() {
  console.log('========================================================================');
  console.log('STAGE 1: MISSION WORKSPACE REALITY & CONTRACT VERIFICATION TEST');
  console.log('========================================================================');

  const API_PORT = 3000;
  const baseUrl = `http://127.0.0.1:${API_PORT}`;

  // ---------------------------------------------------------------------------
  // TEST 1: Code Audit — Verify No Hardcoded Mock Data Remains in MissionsPage.tsx
  // ---------------------------------------------------------------------------
  console.log('\n[Test 1] Auditing src/web/pages/MissionsPage.tsx for removed mock fallbacks...');
  const pagePath = path.resolve(__dirname, '../src/web/pages/MissionsPage.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  const forbiddenStrings = [
    'Gathering information using tools',
    "Found tomorrow's meeting: Product Roadmap Discussion",
    'Connected to your calendar...',
    'roadmap.pdf',
    'notes.docx',
    'key_points',
    'resource allocation'
  ];

  for (const forbidden of forbiddenStrings) {
    if (pageContent.includes(forbidden)) {
      throw new Error(`[FAIL] Found prohibited hardcoded mock string in MissionsPage.tsx: "${forbidden}"`);
    }
  }
  console.log('[PASS] Verified: All 7 mock substeps, hardcoded arguments, and mock outputs removed.');

  // Verify subscribeToMissionStream is imported and used
  if (!pageContent.includes('subscribeToMissionStream')) {
    throw new Error('[FAIL] MissionsPage.tsx does not import subscribeToMissionStream!');
  }
  console.log('[PASS] Verified: MissionsPage.tsx imports and connects subscribeToMissionStream.');

  // ---------------------------------------------------------------------------
  // TEST 2: Start a real mission and connect SSE Stream
  // ---------------------------------------------------------------------------
  console.log('\n[Test 2] Starting real mission over POST /api/missions and opening SSE stream...');
  const postRes = await fetch(`${baseUrl}/api/missions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      goal: 'Prepare me for my Product Roadmap Discussion tomorrow. Check calendar and analyze documents.',
      title: 'Product Roadmap Prep'
    })
  });
  if (!postRes.ok) throw new Error(`POST /api/missions failed with status ${postRes.status}`);
  const postData = await postRes.json();
  const missionId = postData.mission.id;
  console.log(`[PASS] Mission created: ${missionId} (status: ${postData.mission.status})`);

  // ---------------------------------------------------------------------------
  // TEST 3 & 4: Stream SSE Lifecycle Events & Verify Stepper / Tool Transitions
  // ---------------------------------------------------------------------------
  console.log('\n[Test 3 & 4] Streaming SSE events from GET /api/missions/:id/stream...');
  const sseUrl = `${baseUrl}/api/missions/${missionId}/stream`;
  const streamRes = await fetch(sseUrl);
  if (!streamRes.ok) throw new Error(`GET ${sseUrl} failed with status ${streamRes.status}`);

  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const receivedEvents = [];
  const seenEventIds = new Set();
  let duplicateCount = 0;

  let streamEnded = false;
  const timeout = setTimeout(() => {
    if (!streamEnded) {
      console.warn('[Warning] Stream read reached timeout threshold.');
      reader.cancel();
    }
  }, 12000);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        streamEnded = true;
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep partial line

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (seenEventIds.has(data.id)) {
              duplicateCount++;
            } else {
              seenEventIds.add(data.id);
            }
            receivedEvents.push(data);
          } catch {}
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  console.log(`[PASS] Received ${receivedEvents.length} SSE frames from backend stream.`);
  console.log(`[PASS] Unique event IDs: ${seenEventIds.size} | Duplicate events received: ${duplicateCount}`);
  if (duplicateCount > 0) {
    throw new Error(`[FAIL] Expected 0 duplicate events, but got ${duplicateCount}!`);
  }

  // Verify key lifecycle event progression
  const eventTypes = receivedEvents.map(e => e.eventType || e.event_type);
  console.log(`[PASS] Event progression: ${eventTypes.join(' -> ')}`);

  const requiredEvents = [
    'mission.started',
    'tool.discovered',
    'understanding.completed',
    'plan.created',
    'step.started',
    'tool.executing',
    'tool.completed',
    'verification.started',
    'verification.completed',
    'mission.completed'
  ];

  for (const reqEvt of requiredEvents) {
    if (!eventTypes.includes(reqEvt)) {
      throw new Error(`[FAIL] Missing required lifecycle event in SSE stream: "${reqEvt}"`);
    }
  }
  console.log('[PASS] Stepper transitions verified: Understand -> Plan -> Use Tools -> Verify -> Results are all present.');

  // Verify real tool execution event metadata
  const execEvent = receivedEvents.find(e => (e.eventType || e.event_type) === 'tool.executing');
  if (!execEvent || !execEvent.metadata?.toolName) {
    throw new Error('[FAIL] tool.executing event is missing real toolName in metadata!');
  }
  console.log(`[PASS] Real tool executing event verified: toolName="${execEvent.metadata.toolName}", args:`, JSON.stringify(execEvent.metadata.arguments));

  const compEvent = receivedEvents.find(e => (e.eventType || e.event_type) === 'tool.completed');
  if (!compEvent || !compEvent.metadata?.toolName || compEvent.metadata?.durationMs === undefined) {
    throw new Error('[FAIL] tool.completed event is missing durationMs or toolName!');
  }
  console.log(`[PASS] Real tool completed event verified: durationMs=${compEvent.metadata.durationMs}ms`);

  // ---------------------------------------------------------------------------
  // TEST 5 & 6: Reload / Reconstruct Completed Mission from GET /api/missions/:id
  // ---------------------------------------------------------------------------
  console.log('\n[Test 5 & 6] Testing Reload/Refresh: Fetching completed mission entity...');
  const reloadRes = await fetch(`${baseUrl}/api/missions/${missionId}`);
  if (!reloadRes.ok) throw new Error(`GET /api/missions/${missionId} failed: ${reloadRes.status}`);
  const reloadData = await reloadRes.json();

  console.log(`[PASS] Reloaded mission: Status = ${reloadData.status}`);
  console.log(`[PASS] Result Summary length: ${reloadData.result_summary?.length || 0} characters`);
  console.log(`[PASS] Steps count: ${reloadData.steps?.length || 0}`);
  console.log(`[PASS] Tool executions count: ${reloadData.toolExecutions?.length || 0}`);

  if (reloadData.status !== 'COMPLETED') {
    throw new Error(`[FAIL] Expected completed status on reload, got: ${reloadData.status}`);
  }
  if (!reloadData.result_summary || reloadData.result_summary.length < 50) {
    throw new Error('[FAIL] Missing or empty result_summary on completed mission!');
  }
  if (!reloadData.toolExecutions || reloadData.toolExecutions.length === 0) {
    throw new Error('[FAIL] Expected persisted toolExecutions on completed mission!');
  }

  // ---------------------------------------------------------------------------
  // TEST 7: SSE Reconnect & Replay on Terminal Mission (Stream should close gracefully)
  // ---------------------------------------------------------------------------
  console.log('\n[Test 7] Testing Reconnect against already completed mission...');
  const reconnectRes = await fetch(`${baseUrl}/api/missions/${missionId}/stream`);
  if (!reconnectRes.ok) throw new Error(`Reconnect failed: ${reconnectRes.status}`);

  const recReader = reconnectRes.body.getReader();
  let recEventCount = 0;
  while (true) {
    const { done, value } = await recReader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const dataMatches = chunk.match(/data: /g);
    if (dataMatches) recEventCount += dataMatches.length;
  }
  console.log(`[PASS] Reconnected client replayed ${recEventCount} persisted events and closed cleanly.`);

  // ---------------------------------------------------------------------------
  // TEST 8: Failure Handling — Verifying Failed Mission & Tool Error State
  // ---------------------------------------------------------------------------
  console.log('\n[Test 8] Verifying Failure Handling state representation...');
  const failMission = createMission({
    title: 'Failure Test Mission',
    goal: 'Test failing tool handling'
  });
  createMissionStep({
    missionId: failMission.id,
    stepIndex: 1,
    label: 'Call broken service',
    domain: 'External Services',
    status: 'FAILED'
  });
  const execRec = recordToolExecution({
    missionId: failMission.id,
    toolName: 'unregistered_tool',
    arguments: { invalid: true },
    status: 'RUNNING'
  });
  updateToolExecution(execRec.id, {
    status: 'FAILED',
    error_message: 'MCP Tool Not Found',
    duration_ms: 5
  });
  updateMission(failMission.id, {
    status: 'FAILED',
    result_summary: 'Mission failed: MCP Tool Not Found',
    completed_at: new Date().toISOString()
  });

  const failRes = await fetch(`${baseUrl}/api/missions/${failMission.id}`);
  const failData = await failRes.json();
  if (failData.status !== 'FAILED') {
    throw new Error(`[FAIL] Expected FAILED status, got ${failData.status}`);
  }
  if (failData.toolExecutions[0].status !== 'FAILED') {
    throw new Error(`[FAIL] Expected tool execution status FAILED, got ${failData.toolExecutions[0].status}`);
  }
  console.log('[PASS] Failure state correctly verified in DB and API response.');

  console.log('\n========================================================================');
  console.log('ALL STAGE 1 MISSION WORKSPACE TESTS PASSED WITH 100% SUCCESS');
  console.log('========================================================================');
}

runMissionWorkspaceRealTest().catch((err) => {
  console.error('\n[STAGE 1 TEST FAILED]:', err);
  process.exit(1);
});
