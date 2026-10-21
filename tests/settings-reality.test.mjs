import assert from 'node:assert/strict';

const API_BASE = 'http://127.0.0.1:3000';

async function runTest() {
  console.log('========================================================================');
  console.log('STAGE 6: SETTINGS PAGE REALITY & CONFIGURATION HONESTY TEST');
  console.log('========================================================================\n');

  // Step 1: Query GET /api/settings
  console.log('[Step 1] Querying Application API: GET /api/settings...');
  const res = await fetch(`${API_BASE}/api/settings`);
  assert.equal(res.status, 200, 'GET /api/settings must return HTTP 200');
  const settings = await res.json();
  console.log('[PASS] Settings endpoint returned HTTP 200.');

  // Step 2: Verify user profile details & email
  console.log('\n[Step 2] Verifying profile configuration...');
  assert.equal(settings.profile.name, 'Shanmukheswar');
  assert.equal(settings.profile.email, 'shanmukheswaramedicharla@gmail.com');
  assert.equal(settings.profile.role, 'Pro Builder');
  assert.equal(settings.profile.location, 'India');
  console.log(`[PASS] Profile confirmed: "${settings.profile.name}" <${settings.profile.email}>.`);

  // Step 3: Verify Agent Provider Honesty
  console.log('\n[Step 3] Verifying agent decision engine honesty...');
  assert(settings.agentRuntime, 'agentRuntime must be present');
  assert.equal(settings.agentRuntime.status, 'ONLINE');
  assert.equal(settings.agentRuntime.executionMode, 'Autonomous Decision Engine (Deterministic Rule-Based Fallback - NOT an LLM)');
  assert.equal(settings.agentRuntime.activeModel, 'local-heuristic-v1');
  assert.equal(settings.agentRuntime.llmProvider, 'Not active in current local runtime');
  assert.equal(settings.agentRuntime.llmKeyConfigured, false, 'llmKeyConfigured must be false in local zero-credential mode');
  console.log(`[PASS] Agent runtime honest disclosure confirmed:
  - Mode: "${settings.agentRuntime.executionMode}"
  - Model: "${settings.agentRuntime.activeModel}"
  - LLM Provider: "${settings.agentRuntime.llmProvider}"`);

  // Step 4: Verify MCP Runtime configuration
  console.log('\n[Step 4] Verifying MCP runtime parameters...');
  assert(settings.mcpRuntime, 'mcpRuntime must be present');
  assert.equal(settings.mcpRuntime.status, 'ONLINE');
  assert.equal(settings.mcpRuntime.transport, 'Streamable HTTP');
  assert.equal(settings.mcpRuntime.protocolVersion, '2025-11-25');
  assert.equal(settings.mcpRuntime.toolsCount, 4);
  console.log(`[PASS] MCP parameters confirmed: ${settings.mcpRuntime.serverUrl} (${settings.mcpRuntime.transport}, ${settings.mcpRuntime.toolsCount} tools).`);

  // Step 5: Verify SQLite persistence status
  console.log('\n[Step 5] Verifying persistence store telemetry...');
  assert(settings.persistence, 'persistence telemetry must be present');
  assert.equal(settings.persistence.database, 'SQLite');
  assert.equal(settings.persistence.filepath, 'data/alexa_plus.db');
  assert.equal(settings.persistence.status, 'HEALTHY');
  console.log(`[PASS] Persistence verified: ${settings.persistence.database} at ${settings.persistence.filepath}.`);

  // Step 6: Security & Zero Secret Leakage Audit
  console.log('\n[Step 6] Auditing Settings response for forbidden secret patterns...');
  const stringified = JSON.stringify(settings).toLowerCase();
  const forbiddenPatterns = [
    'apikey',
    'accesstoken',
    'refreshtoken',
    'password',
    'secret',
    'authorization',
    'bearer '
  ];

  for (const pattern of forbiddenPatterns) {
    assert(!stringified.includes(pattern), `Security failure: settings payload exposed sensitive key/pattern "${pattern}"`);
  }
  console.log('[PASS] Security clearance: No API keys, passwords, bearer tokens, or secrets exposed in settings payload.');

  // Step 7: Cross-check Settings connected services against Integrations API
  console.log('\n[Step 7] Cross-checking against GET /api/integrations...');
  const intRes = await fetch(`${API_BASE}/api/integrations`);
  assert.equal(intRes.status, 200);
  const intData = await intRes.json();
  assert.equal(intData.genuineConnectedCount, 0, 'No genuine connected external services should exist');
  assert.equal(intData.demoCount, 2, 'Exactly 2 demo simulation feeds should exist');
  console.log('[PASS] Consistency check: Integrations matrix matches settings profile and demo count (0 genuine, 2 demo).');

  console.log('\n========================================================================');
  console.log('ALL STAGE 6 SETTINGS REALITY TESTS PASSED (100%)');
  console.log('========================================================================\n');
}

runTest().catch((err) => {
  console.error('\n[TEST FAILURE]:', err);
  process.exit(1);
});
