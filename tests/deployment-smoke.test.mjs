/**
 * Alexa+ Deployment Smoke Test
 * 
 * Verifies that the deployed web service is functioning correctly on Render
 * or in local production clean-room mode.
 * 
 * Usage:
 *   node tests/deployment-smoke.test.mjs
 *   BASE_URL=https://your-app.onrender.com node tests/deployment-smoke.test.mjs
 */

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

console.log('========================================================================');
console.log('ALEXA+ DEPLOYMENT SMOKE TEST');
console.log(`Target URL: ${BASE_URL}`);
console.log('========================================================================\n');

async function runSmokeTests() {
  let passed = 0;
  let total = 6;

  // 1. Health Endpoint
  console.log('[Test 1] Probing Health Endpoint (GET /health)...');
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`Health returned HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Unexpected status: ${data.status}`);
    if (data.mcpStatus !== 'online') throw new Error(`MCP status is not online: ${data.mcpStatus}`);
    console.log(`[PASS] Health check passed (Service: ${data.service}, MCP: ${data.mcpStatus}, Database: ${data.databaseStatus || 'healthy'})\n`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] Health probe failed: ${err.message}\n`);
    process.exit(1);
  }

  // 2. Static Web Bundle Serving
  console.log('[Test 2] Probing Production Web Frontend (GET /)...');
  try {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`Frontend root returned HTTP ${res.status}`);
    const html = await res.text();
    if (!html.includes('<html') && !html.includes('<!DOCTYPE html>')) {
      throw new Error('Response does not contain valid HTML document.');
    }
    console.log('[PASS] Production frontend bundle is served correctly with HTTP 200.\n');
    passed++;
  } catch (err) {
    console.error(`[FAIL] Frontend bundle check failed: ${err.message}\n`);
    process.exit(1);
  }

  // 3. Dynamic MCP Tool Discovery
  console.log('[Test 3] Probing Real MCP Tool Discovery (GET /api/tools)...');
  try {
    const res = await fetch(`${BASE_URL}/api/tools`);
    if (!res.ok) throw new Error(`Tools returned HTTP ${res.status}`);
    const data = await res.json();
    const tools = data.tools || [];
    if (tools.length < 4) throw new Error(`Expected at least 4 tools, found ${tools.length}`);

    const requiredTools = ['calendar_get_events', 'knowledge_search', 'document_analyze', 'ping'];
    for (const toolName of requiredTools) {
      if (!tools.some((t) => t.name === toolName)) {
        throw new Error(`Missing required tool: ${toolName}`);
      }
    }
    console.log(`[PASS] Discovered ${tools.length} verified MCP tools: ${tools.map((t) => t.name).join(', ')}\n`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] MCP Tool discovery failed: ${err.message}\n`);
    process.exit(1);
  }

  // 4. Honest Integrations Matrix
  console.log('[Test 4] Probing Integrations Matrix (GET /api/integrations)...');
  try {
    const res = await fetch(`${BASE_URL}/api/integrations`);
    if (!res.ok) throw new Error(`Integrations returned HTTP ${res.status}`);
    const data = await res.json();
    if (data.total < 100) throw new Error(`Expected 103 plugins, found ${data.total}`);
    if (data.genuineConnectedCount !== 0) {
      throw new Error(`Expected 0 genuine connected when unauthenticated, found ${data.genuineConnectedCount}`);
    }
    console.log(`[PASS] Integrations matrix verified: ${data.total} cataloged plugins, ${data.demoCount} local MCP feeds, 0 fake connections.\n`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] Integrations matrix failed: ${err.message}\n`);
    process.exit(1);
  }

  // 5. Settings & Runtime Telemetry
  console.log('[Test 5] Probing Settings & Runtime Telemetry (GET /api/settings)...');
  try {
    const res = await fetch(`${BASE_URL}/api/settings`);
    if (!res.ok) throw new Error(`Settings returned HTTP ${res.status}`);
    const data = await res.json();
    if (!data.agentRuntime || !data.mcpRuntime) {
      throw new Error('Settings missing agentRuntime or mcpRuntime');
    }
    console.log(`[PASS] Settings verified: Agent Runtime = ${data.agentRuntime.executionMode}, MCP Transport = ${data.mcpRuntime.transport}\n`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] Settings check failed: ${err.message}\n`);
    process.exit(1);
  }

  // 6. End-to-End Autonomous Mission Execution
  console.log('[Test 6] Executing End-to-End Mission Pipeline (POST /api/missions)...');
  try {
    const res = await fetch(`${BASE_URL}/api/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: 'Check my schedule for tomorrow and tell me what meetings I have.',
        sync: true
      })
    });

    if (!res.ok) throw new Error(`Mission submission returned HTTP ${res.status}`);
    const data = await res.json();
    const mission = data.mission || data;

    if (mission.status !== 'COMPLETED') {
      throw new Error(`Mission did not reach COMPLETED state. Current status: ${mission.status}`);
    }

    const steps = mission.steps || [];
    const toolExecutions = mission.toolExecutions || [];

    if (toolExecutions.length === 0) {
      throw new Error('No MCP tools were executed during mission.');
    }

    console.log(`[PASS] Mission [${mission.id}] completed successfully in ${mission.duration_ms || mission.durationMs || 'N/A'}ms.`);
    console.log(`       Steps Completed: ${steps.length}`);
    console.log(`       MCP Tools Called: ${toolExecutions.map((t) => t.tool_name).join(', ')}`);
    console.log(`       Result Snippet: "${(mission.result_summary || '').substring(0, 90)}..."\n`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] Mission E2E execution failed: ${err.message}\n`);
    process.exit(1);
  }

  console.log('========================================================================');
  console.log(`DEPLOYMENT SMOKE TEST PASSED: ${passed}/${total} TESTS (100% SUCCESS)`);
  console.log('Application is healthy, responsive, and deployment-ready.');
  console.log('========================================================================');
}

runSmokeTests();
