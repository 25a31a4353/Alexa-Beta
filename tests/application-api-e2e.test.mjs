import http from 'node:http';
import { app, missionEventBus } from '../src/api/server.mjs';
import { getDatabase, getMissionWithDetails } from '../src/db/index.mjs';

const API_PORT = 3000;
const MCP_PORT = 3001;

async function runApplicationApiE2ETest() {
  console.log('========================================================================');
  console.log('PHASE 2: APPLICATION API + REAL-TIME SSE END-TO-END VERIFICATION');
  console.log('========================================================================');

  // Start Application API HTTP Server on port 3000
  const apiServer = http.createServer(app);
  await new Promise((resolve) => apiServer.listen(API_PORT, '127.0.0.1', resolve));
  console.log(`[PASS] Application API Server listening on http://127.0.0.1:${API_PORT}`);

  const baseUrl = `http://127.0.0.1:${API_PORT}`;

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Verify API Health Check
    // -------------------------------------------------------------------------
    console.log('\n[Step 1] Checking API health endpoint...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log(`[PASS] Health response:`, JSON.stringify(healthData));
    if (healthData.status !== 'ok' || healthData.mcpStatus !== 'online') {
      throw new Error(`Health check failed or MCP is not online: ${JSON.stringify(healthData)}`);
    }

    // -------------------------------------------------------------------------
    // STEP 2: Verify Real MCP Tools Discovery via API
    // -------------------------------------------------------------------------
    console.log('\n[Step 2] GET /api/tools (Interrogates MCP Server via tools/list)...');
    const toolsRes = await fetch(`${baseUrl}/api/tools`);
    if (!toolsRes.ok) throw new Error(`GET /api/tools failed with status ${toolsRes.status}`);
    const toolsData = await toolsRes.json();
    console.log(`[PASS] Discovered ${toolsData.total} tools dynamically through API:`);
    toolsData.tools.forEach(t => console.log(`  - [${t.domain}] ${t.name}: ${t.description}`));
    if (toolsData.total < 4 || !toolsData.tools.some(t => t.name === 'calendar_get_events')) {
      throw new Error('FAILED: Dynamic tools discovery failed to reflect MCP server tools!');
    }

    // -------------------------------------------------------------------------
    // STEP 3: Verify Knowledge API
    // -------------------------------------------------------------------------
    console.log('\n[Step 3] GET /api/knowledge (Queries SQLite Documents)...');
    const knowRes = await fetch(`${baseUrl}/api/knowledge?category=all`);
    const knowData = await knowRes.json();
    console.log(`[PASS] Found ${knowData.total} documents in knowledge base:`);
    knowData.documents.forEach(d => console.log(`  - ${d.title} (${d.filename}, ${d.page_count} pages)`));

    const singleDocRes = await fetch(`${baseUrl}/api/knowledge/doc-roadmap-01`);
    const singleDoc = await singleDocRes.json();
    console.log(`[PASS] Fetched document detail "${singleDoc.title}":`, {
      insightsCount: singleDoc.key_insights?.length,
      actionItemsCount: singleDoc.action_items?.length
    });
    if (!singleDoc.title || singleDoc.key_insights.length === 0) {
      throw new Error('FAILED: Knowledge detail endpoint returned incomplete data!');
    }

    // -------------------------------------------------------------------------
    // STEP 4: Verify Integrations API
    // -------------------------------------------------------------------------
    console.log('\n[Step 4] GET /api/integrations (Auditing honest status badges)...');
    const integRes = await fetch(`${baseUrl}/api/integrations`);
    const integData = await integRes.json();
    console.log(`[PASS] Retrieved ${integData.total} integrations (${integData.connectedCount} available/demo):`);
    integData.integrations.forEach(i => console.log(`  - ${i.name} [Status: ${i.status}] Synthetic: ${Boolean(i.is_synthetic)}`));
    if (integData.integrations.some(i => i.status === 'CONNECTED')) {
      throw new Error('SECURITY VIOLATION: Unauthenticated integration falsely marked CONNECTED!');
    }

    // -------------------------------------------------------------------------
    // STEP 5: Create Conversation
    // -------------------------------------------------------------------------
    console.log('\n[Step 5] POST /api/conversations...');
    const convRes = await fetch(`${baseUrl}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Meeting Prep Session', modelId: 'gpt-4o' })
    });
    const convData = await convRes.json();
    console.log(`[PASS] Created conversation: ID = ${convData.id} | Title = "${convData.title}"`);
    if (!convData.id || convData.status !== 'ACTIVE') {
      throw new Error('FAILED: Conversation creation failed!');
    }

    // -------------------------------------------------------------------------
    // STEP 6: POST /api/missions (Asynchronous Execution with Live SSE Stream)
    // -------------------------------------------------------------------------
    console.log('\n[Step 6] POST /api/missions with real objective and attaching SSE stream...');
    const goal = 'Prepare me for my Product Roadmap Discussion tomorrow.';

    // Start mission
    const postMissionRes = await fetch(`${baseUrl}/api/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: convData.id,
        goal
      })
    });

    if (postMissionRes.status !== 201) {
      const errBody = await postMissionRes.text();
      throw new Error(`Expected HTTP 201 from POST /api/missions, got ${postMissionRes.status}: ${errBody}`);
    }

    const createdMissionData = await postMissionRes.json();
    const missionId = createdMissionData.mission.id;
    console.log(`[PASS] Mission created in SQLite: ID = ${missionId} | Status = ${createdMissionData.mission.status}`);
    console.log(`[PASS] Stream URL: ${createdMissionData.streamUrl}`);

    // Connect to SSE stream: GET /api/missions/:id/stream
    console.log(`\n[Step 7] Connecting to SSE stream: ${baseUrl}/api/missions/${missionId}/stream...`);
    const streamedEvents = [];
    let streamCompletedPromiseResolve;
    const streamCompletedPromise = new Promise((resolve) => { streamCompletedPromiseResolve = resolve; });

    const sseReq = http.get(`${baseUrl}/api/missions/${missionId}/stream`, (res) => {
      if (res.statusCode !== 200) {
        throw new Error(`SSE stream failed with HTTP ${res.statusCode}`);
      }

      let buffer = '';
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // keep trailing incomplete chunk

        for (const block of lines) {
          if (!block.trim()) continue;
          const blockLines = block.split('\n');
          let eventType = 'message';
          let eventData = null;
          let eventId = null;

          for (const line of blockLines) {
            if (line.startsWith('id: ')) eventId = line.substring(4);
            if (line.startsWith('event: ')) eventType = line.substring(7);
            if (line.startsWith('data: ')) {
              try { eventData = JSON.parse(line.substring(6)); } catch {}
            }
          }

          if (eventData) {
            streamedEvents.push({ id: eventId, type: eventType, data: eventData });
            console.log(`  [SSE Frame Received] Event: "${eventType}" | Title: "${eventData.title || eventData.eventType}"`);

            if (eventType === 'mission.completed' || eventType === 'mission.failed') {
              streamCompletedPromiseResolve();
            }
          }
        }
      });

      res.on('end', () => {
        streamCompletedPromiseResolve();
      });
    });

    // Wait for the mission to complete via SSE
    await streamCompletedPromise;
    console.log(`\n[PASS] SSE stream received ${streamedEvents.length} frames.`);

    // -------------------------------------------------------------------------
    // STEP 8: Verify Mission Retrieval: GET /api/missions/:id
    // -------------------------------------------------------------------------
    console.log(`\n[Step 8] GET /api/missions/${missionId} to verify completed persisted state...`);
    const getMissionRes = await fetch(`${baseUrl}/api/missions/${missionId}`);
    const completedMission = await getMissionRes.json();

    console.log('[COMPLETED MISSION RETRIEVAL]:');
    console.log(`  - Status: ${completedMission.status}`);
    console.log(`  - Total Duration: ${completedMission.duration_ms}ms`);
    console.log(`  - Steps Count: ${completedMission.steps?.length}`);
    console.log(`  - Tool Executions Count: ${completedMission.toolExecutions?.length}`);
    console.log(`  - Summary Preview: ${completedMission.result_summary?.substring(0, 100)}...`);

    if (completedMission.status !== 'COMPLETED') {
      throw new Error(`FAILED: Mission status is ${completedMission.status}, expected COMPLETED!`);
    }
    if (completedMission.toolExecutions.length < 3) {
      throw new Error(`FAILED: Expected at least 3 tool executions, got ${completedMission.toolExecutions.length}`);
    }

    // -------------------------------------------------------------------------
    // STEP 9: Verify SSE Replay on Reconnection
    // -------------------------------------------------------------------------
    console.log(`\n[Step 9] Testing SSE Replay: New client connects to finished mission stream...`);
    const replayedEvents = [];
    const replayDone = new Promise((resolve) => {
      http.get(`${baseUrl}/api/missions/${missionId}/stream`, (res) => {
        let buf = '';
        res.on('data', chunk => {
          buf += chunk.toString();
          const blocks = buf.split('\n\n');
          buf = blocks.pop();
          for (const blk of blocks) {
            if (!blk.trim()) continue;
            const dataLine = blk.split('\n').find(l => l.startsWith('data: '));
            if (dataLine) {
              try { replayedEvents.push(JSON.parse(dataLine.substring(6))); } catch {}
            }
          }
        });
        res.on('end', resolve);
      });
    });

    await replayDone;
    console.log(`[PASS] SSE Replay successful: Replayed ${replayedEvents.length} historical events from SQLite.`);
    if (replayedEvents.length === 0) {
      throw new Error('FAILED: SSE Replay failed to deliver persisted events to reconnecting client!');
    }

    // -------------------------------------------------------------------------
    // STEP 10: Verify Activity API: GET /api/activity
    // -------------------------------------------------------------------------
    console.log('\n[Step 10] GET /api/activity (Verifying audit trail & metrics)...');
    const actRes = await fetch(`${baseUrl}/api/activity?limit=20`);
    const actData = await actRes.json();
    console.log('[ACTIVITY METRICS]:', JSON.stringify(actData.metrics));
    console.log(`[PASS] Returned ${actData.totalEvents} recent events.`);
    console.log('[PASS] Top Tools Used:', JSON.stringify(actData.topTools));
    if (actData.metrics.missionsCount === 0 || actData.metrics.toolActionsCount === 0) {
      throw new Error('FAILED: Activity metrics do not reflect actual executed missions and tools!');
    }

    // -------------------------------------------------------------------------
    // STEP 11: Error Contract Validation: Bad Inputs & Non-Existent Resources
    // -------------------------------------------------------------------------
    console.log('\n[Step 11] Verifying error contracts (400, 404)...');
    const badMissionRes = await fetch(`${baseUrl}/api/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: '' }) // empty goal
    });
    const badMissionErr = await badMissionRes.json();
    console.log(`[PASS] Empty goal rejected with HTTP ${badMissionRes.status}:`, badMissionErr.error);
    if (badMissionRes.status !== 400 || badMissionErr.error.code !== 'INVALID_INPUT') {
      throw new Error('FAILED: Expected HTTP 400 INVALID_INPUT for empty goal!');
    }

    const nonExistentRes = await fetch(`${baseUrl}/api/missions/msn-nonexistent-999`);
    const nonExistentErr = await nonExistentRes.json();
    console.log(`[PASS] Missing mission returned HTTP ${nonExistentRes.status}:`, nonExistentErr.error);
    if (nonExistentRes.status !== 404 || nonExistentErr.error.code !== 'MISSION_NOT_FOUND') {
      throw new Error('FAILED: Expected HTTP 404 MISSION_NOT_FOUND!');
    }

    // Clean shutdown
    await new Promise((resolve) => apiServer.close(resolve));
    console.log('\n========================================================================');
    console.log('ALL APPLICATION API & REAL-TIME SSE TESTS PASSED (100%)');
    console.log('========================================================================');
  } catch (err) {
    console.error('\n[APPLICATION API TEST ERROR]:', err);
    try { apiServer.close(); } catch {}
    process.exit(1);
  }
}

runApplicationApiE2ETest();
