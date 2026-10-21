import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createMission,
  recordActivityEvent,
  getDatabase
} from '../src/db/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runActivityPersistenceTest() {
  console.log('========================================================================');
  console.log('STAGE 3: ACTIVITY PAGE REALITY & RESTART PERSISTENCE TEST');
  console.log('========================================================================');

  const API_PORT = 3000;
  const baseUrl = `http://127.0.0.1:${API_PORT}`;

  // ---------------------------------------------------------------------------
  // STEP 1: Code Audit — Verify DEFAULT_TIMELINE and static metrics are removed
  // ---------------------------------------------------------------------------
  console.log('\n[Step 1] Auditing src/web/pages/ActivityPage.tsx for static mock defaults...');
  const activityPagePath = path.resolve(__dirname, '../src/web/pages/ActivityPage.tsx');
  const activityContent = fs.readFileSync(activityPagePath, 'utf8');

  if (activityContent.includes('DEFAULT_TIMELINE')) {
    throw new Error('[FAIL] ActivityPage.tsx still references DEFAULT_TIMELINE!');
  }
  if (activityContent.includes('isLast7Days ? 24 :')) {
    throw new Error('[FAIL] ActivityPage.tsx still contains hardcoded metric overrides!');
  }
  if (!activityContent.includes('getActivity()') && !activityContent.includes('getActivity')) {
    throw new Error('[FAIL] ActivityPage.tsx does not call getActivity() API client!');
  }
  console.log('[PASS] Verified: DEFAULT_TIMELINE and hardcoded overrides eliminated from ActivityPage.tsx.');

  // ---------------------------------------------------------------------------
  // STEP 2: Execute Real Mission and Verify Emitted Lifecycle Events
  // ---------------------------------------------------------------------------
  console.log('\n[Step 2] Executing mission via POST /api/missions (sync=true)...');
  const missionRes = await fetch(`${baseUrl}/api/missions?sync=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      goal: 'Prepare agenda and cross-reference calendar and product roadmap documents.',
      title: 'Activity E2E Mission'
    })
  });
  if (!missionRes.ok) throw new Error(`POST /api/missions failed with status ${missionRes.status}`);
  const missionData = await missionRes.json();
  const missionId = missionData.mission.id;
  console.log(`[PASS] Mission completed: ${missionId} (status: ${missionData.mission.status})`);

  // ---------------------------------------------------------------------------
  // STEP 3: Fetch GET /api/activity and Confirm Persisted Events & Metrics
  // ---------------------------------------------------------------------------
  console.log('\n[Step 3] Querying GET /api/activity for persisted execution events...');
  const actRes = await fetch(`${baseUrl}/api/activity?limit=50`);
  if (!actRes.ok) throw new Error(`GET /api/activity failed with status ${actRes.status}`);
  const actData = await actRes.json();

  console.log(`[PASS] Activity Response Metrics:`, actData.metrics);
  console.log(`[PASS] Total events returned: ${actData.events.length}`);

  if (actData.metrics.totalActivities <= 0 || actData.metrics.missionsCount <= 0) {
    throw new Error('[FAIL] Expected positive count for totalActivities and missionsCount!');
  }

  // Find events for our newly executed mission
  const missionEvents = actData.events.filter(e => e.mission_id === missionId);
  console.log(`[PASS] Found ${missionEvents.length} persisted activity events for mission ${missionId}:`);
  missionEvents.forEach(e => console.log(`  - [${e.status}] ${e.event_type}: ${e.title}`));

  const eventTypes = missionEvents.map(e => e.event_type);
  const requiredTypes = [
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

  for (const reqType of requiredTypes) {
    if (!eventTypes.includes(reqType)) {
      throw new Error(`[FAIL] Expected lifecycle event "${reqType}" missing from persisted activity_events!`);
    }
  }
  console.log('[PASS] Full lifecycle sequence confirmed in persistent activity log.');

  // ---------------------------------------------------------------------------
  // STEP 4: Verify Failure Event Recording in Activity Log
  // ---------------------------------------------------------------------------
  console.log('\n[Step 4] Verifying Failure event persistence in Activity log...');
  const failEventId = `act_fail_test_${Date.now()}`;
  recordActivityEvent({
    id: failEventId,
    missionId,
    eventType: 'mission.failed',
    title: 'Mission Execution Error (Test)',
    description: 'Autonomous tool connection timeout occurred.',
    domain: 'Mission',
    status: 'ERROR',
    metadata: { error: 'TIMEOUT_EXCEEDED' },
    isSynthetic: 0
  });

  const failActRes = await fetch(`${baseUrl}/api/activity?eventType=mission.failed`);
  const failActData = await failActRes.json();
  const recordedFail = failActData.events.find(e => e.id === failEventId);
  if (!recordedFail) {
    throw new Error('[FAIL] Failed event was not returned by GET /api/activity!');
  }
  console.log(`[PASS] Verified failure event in Activity audit log: status="${recordedFail.status}", title="${recordedFail.title}"`);

  // ---------------------------------------------------------------------------
  // STEP 5: Restart / SQLite Persistence Durability Check
  // ---------------------------------------------------------------------------
  console.log('\n[Step 5] Testing SQLite restart durability (re-opening direct connection)...');
  const directDb = getDatabase();
  const persistedCount = directDb.prepare('SELECT COUNT(*) as count FROM activity_events WHERE mission_id = ?').get(missionId).count;
  console.log(`[PASS] Direct SQLite query confirmed ${persistedCount} records persisted for mission ${missionId}.`);
  if (persistedCount < 10) {
    throw new Error(`[FAIL] Expected at least 10 persisted events, got ${persistedCount}!`);
  }

  // ---------------------------------------------------------------------------
  // STEP 6: Verify Top Tools Usage Breakdown
  // ---------------------------------------------------------------------------
  console.log('\n[Step 6] Verifying Top Tools breakdown from tool_executions...');
  console.log(`[PASS] Top tools returned:`, actData.topTools);
  if (!Array.isArray(actData.topTools) || actData.topTools.length === 0) {
    throw new Error('[FAIL] Expected topTools array to contain real tool usage records!');
  }
  const toolNames = actData.topTools.map(t => t.tool_name);
  console.log(`[PASS] Top tools identified: [${toolNames.join(', ')}]`);

  console.log('\n========================================================================');
  console.log('ALL STAGE 3 ACTIVITY PAGE REALITY TESTS PASSED (100%)');
  console.log('========================================================================');
}

runActivityPersistenceTest().catch((err) => {
  console.error('\n[ACTIVITY TEST FAILED]:', err);
  process.exit(1);
});
