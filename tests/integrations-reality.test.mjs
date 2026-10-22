import assert from 'node:assert/strict';
import { getDatabase } from '../src/db/index.mjs';

const API_BASE = 'http://127.0.0.1:3000';

async function runTest() {
  console.log('========================================================================');
  console.log('STAGE 5: INTEGRATIONS PAGE REALITY & HONEST CAPABILITY TEST');
  console.log('========================================================================\n');

  // Step 1: Audit SQLite database records directly
  console.log('[Step 1] Auditing SQLite integrations records directly...');
  const db = getDatabase();
  const dbIntegrations = db.prepare('SELECT id, name, category, status, account_email, is_synthetic FROM integrations').all();
  assert(dbIntegrations.length >= 8, `Expected at least 8 integrations, got ${dbIntegrations.length}`);
  
  const genuineInDb = dbIntegrations.filter(i => i.status === 'CONNECTED' && !i.is_synthetic).length;
  const demoInDb = dbIntegrations.filter(i => i.status === 'DEMO' || (i.is_synthetic && i.status !== 'NOT_CONNECTED' && i.status !== 'AVAILABLE')).length;
  
  assert.equal(genuineInDb, 0, 'Genuine connected count in SQLite must be 0');
  console.log(`[PASS] SQLite contains ${dbIntegrations.length} records. Genuine Connected: ${genuineInDb}, Demo Feeds: ${demoInDb}.`);

  // Step 2: Query GET /api/integrations
  console.log('\n[Step 2] Querying Application API: GET /api/integrations...');
  const res = await fetch(`${API_BASE}/api/integrations`);
  assert.equal(res.status, 200, 'GET /api/integrations must return 200');
  const data = await res.json();

  assert.equal(data.total, dbIntegrations.length);
  assert.equal(data.genuineConnectedCount, 0, 'API genuineConnectedCount must be 0');
  assert.equal(data.connectedCount, 0, 'API connectedCount must be 0');
  assert(typeof data.demoCount === 'number', 'API demoCount must be a number');
  console.log(`[PASS] API returned honest metrics: genuineConnectedCount=${data.genuineConnectedCount}, demoCount=${data.demoCount}, total=${data.total}, availableCount=${data.availableCount}.`);

  // Step 3: Security & Secrets Redaction Audit
  console.log('\n[Step 3] Auditing API response for secret exposure / credentials...');
  const sensitiveKeys = ['password', 'secret', 'token', 'accessToken', 'refreshToken', 'apiKey', 'privateKey', 'authHeader'];
  for (const item of data.integrations) {
    for (const key of Object.keys(item)) {
      assert(!sensitiveKeys.includes(key), `Security violation: sensitive field "${key}" exposed on integration "${item.id}"`);
      if (typeof item[key] === 'string') {
        assert(!item[key].toLowerCase().includes('bearer '), `Security violation: bearer token found in field "${key}"`);
      }
    }
  }
  console.log('[PASS] Security clearance: Zero tokens, secrets, or credentials exposed across all integration records.');

  // Step 4: Verify Integration Detail (GET /api/integrations/:id)
  console.log('\n[Step 4] Querying Integration Detail: GET /api/integrations/google-calendar...');
  const detailRes = await fetch(`${API_BASE}/api/integrations/google-calendar`);
  assert.equal(detailRes.status, 200, 'GET /api/integrations/google-calendar must return 200');
  const detail = await detailRes.json();
  assert.equal(detail.id, 'google-calendar');
  assert(['AVAILABLE', 'DEMO', 'CONNECTED'].includes(detail.status));
  assert.equal(detail.capability?.mcpTool, 'calendar_get_events');
  assert(['OAUTH2', 'DEMO_SIMULATION'].includes(detail.capability?.authType));
  console.log(`[PASS] Detail returned for google-calendar: status="${detail.status}", tool="${detail.capability?.mcpTool}", auth="${detail.capability?.authType}".`);

  // Step 5: Verify 404 for missing integration
  console.log('\n[Step 5] Verifying 404 for missing integration...');
  const missingRes = await fetch(`${API_BASE}/api/integrations/non-existent-999`);
  assert.equal(missingRes.status, 404, 'Non-existent integration must return 404');
  const missingJson = await missingRes.json();
  assert.equal(missingJson.error?.code, 'INTEGRATION_NOT_FOUND');
  console.log(`[PASS] Missing integration handled with HTTP 404: ${missingJson.error.message}`);

  // Step 6: Cross-check against GET /api/activity metrics
  console.log('\n[Step 6] Cross-checking against GET /api/activity metrics...');
  const actRes = await fetch(`${API_BASE}/api/activity?limit=1`);
  assert.equal(actRes.status, 200);
  const actData = await actRes.json();
  assert.equal(actData.metrics.integrationsCount, 0, 'Activity metrics integrationsCount must match genuineConnectedCount (0)');
  assert.equal(actData.metrics.connectedIntegrationsCount, 0, 'Activity metrics connectedIntegrationsCount must be 0');
  assert(typeof actData.metrics.demoIntegrationsCount === 'number');
  console.log(`[PASS] Cross-check confirmed: Activity metrics report genuine connected: ${actData.metrics.connectedIntegrationsCount}, demo: ${actData.metrics.demoIntegrationsCount}.`);

  console.log('\n========================================================================');
  console.log('ALL STAGE 5 INTEGRATIONS PAGE REALITY TESTS PASSED (100%)');
  console.log('========================================================================\n');
}

runTest().catch((err) => {
  console.error('\n[TEST FAILURE]:', err);
  process.exit(1);
});
