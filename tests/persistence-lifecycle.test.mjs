import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AgentOrchestrator } from '../src/agent/orchestrator.mjs';
import {
  getDatabase,
  createConversation,
  getConversation,
  createMission,
  getMission,
  getMissionWithDetails,
  createMissionStep,
  updateMissionStep,
  recordToolExecution,
  updateToolExecution,
  recordActivityEvent,
  getActivityEvents,
  listIntegrations
} from '../src/db/index.mjs';

const MCP_URL = process.env.MCP_SERVER_URL || 'http://127.0.0.1:3001/mcp';

async function runPersistenceLifecycleVerification() {
  console.log('========================================================================');
  console.log('PHASE 1 & 1.5: PERSISTENCE FOUNDATION & LIFECYCLE EVENT TEST SUITE');
  console.log('========================================================================');

  // ---------------------------------------------------------------------------
  // PART A: DIRECT SQLITE PERSISTENCE REPOSITORY VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n[PART A] Verifying SQLite Schemas & Repository Functions...');
  const db = getDatabase();

  // 1. Create Conversation
  const conv = createConversation({
    title: 'Executive Meeting Prep Test',
    modelId: 'gpt-4o'
  });
  console.log(`[PASS] Created Conversation ID: ${conv.id} | Status: ${conv.status}`);
  if (!conv.id || conv.status !== 'ACTIVE') {
    throw new Error('FAILED: Conversation creation returned invalid entity!');
  }

  // 2. Create Mission
  const msn = createMission({
    conversationId: conv.id,
    title: 'Prepare Meeting Action Items',
    goal: 'Review roadmap, verify calendar, and summarize deliverables'
  });
  console.log(`[PASS] Created Mission ID: ${msn.id} | Status: ${msn.status}`);
  if (!msn.id || msn.status !== 'CREATED' || msn.conversation_id !== conv.id) {
    throw new Error('FAILED: Mission creation returned invalid entity!');
  }

  // 3. Create Mission Steps
  const step1 = createMissionStep({
    missionId: msn.id,
    stepIndex: 1,
    label: 'Check calendar schedule',
    domain: 'External Services',
    assignedTool: 'calendar_get_events',
    status: 'PENDING'
  });
  const step2 = createMissionStep({
    missionId: msn.id,
    stepIndex: 2,
    label: 'Analyze Q4 roadmap',
    domain: 'Knowledge',
    assignedTool: 'document_analyze',
    status: 'PENDING'
  });
  console.log(`[PASS] Created Steps: ${step1.id} & ${step2.id}`);

  // 4. Record Tool Execution
  const toolExec = recordToolExecution({
    missionId: msn.id,
    stepId: step1.id,
    toolName: 'calendar_get_events',
    arguments: { query: 'Product Roadmap' },
    status: 'RUNNING'
  });
  console.log(`[PASS] Recorded Running Tool Execution: ${toolExec.id}`);

  // 5. Update Tool Execution to COMPLETED
  const updatedExec = updateToolExecution(toolExec.id, {
    status: 'COMPLETED',
    output: { totalEvents: 1, title: 'Product Roadmap Discussion' },
    duration_ms: 24,
    completed_at: new Date().toISOString()
  });
  console.log(`[PASS] Updated Tool Execution to COMPLETED in ${updatedExec.duration_ms}ms`);
  if (updatedExec.status !== 'COMPLETED') {
    throw new Error('FAILED: Tool execution status update failed!');
  }

  // 6. Record Activity Events
  const act1 = recordActivityEvent({
    missionId: msn.id,
    conversationId: conv.id,
    eventType: 'tool.completed',
    title: 'Calendar Checked',
    description: 'Found upcoming roadmap discussion meeting.',
    domain: 'Tool',
    status: 'SUCCESS',
    metadata: { durationMs: 24 },
    isSynthetic: 0
  });
  console.log(`[PASS] Recorded Real Activity Event: ${act1.id} [is_synthetic: ${act1.is_synthetic}]`);

  // 7. Verify Integrations and synthetic flags
  const integrations = listIntegrations();
  console.log(`[PASS] Loaded ${integrations.length} Integrations from DB:`);
  integrations.forEach(i => {
    console.log(`  - ${i.name} [Category: ${i.category}] Status: ${i.status} (Synthetic/Demo: ${Boolean(i.is_synthetic)})`);
  });
  const realConnections = integrations.filter(i => i.status === 'CONNECTED');
  if (realConnections.length > 0) {
    throw new Error('SECURITY VIOLATION: Fake unauthenticated integration was marked CONNECTED!');
  }

  // ---------------------------------------------------------------------------
  // PART B: REAL MCP CLIENT & AGENT ORCHESTRATOR END-TO-END EXECUTION
  // ---------------------------------------------------------------------------
  console.log('\n[PART B] Verifying Agent Lifecycle Events & Persistence during Real MCP Execution...');
  console.log(`[MCP Client] Connecting to: ${MCP_URL}`);

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  const mcpClient = new Client(
    { name: 'alexa-plus-lifecycle-test-client', version: '1.0.0' },
    { capabilities: { roots: {} } }
  );

  try {
    await mcpClient.connect(transport);
    console.log(`[Transport Connected] MCP Session ID: ${transport.sessionId}\n`);

    const capturedEvents = [];
    const orchestrator = new AgentOrchestrator({
      mcpClient,
      maxIterations: 6,
      timeoutMs: 30000,
      enablePersistence: true,
      onEvent: (event) => {
        capturedEvents.push(event);
        console.log(`  [Lifecycle Event: ${event.eventType}] [${event.status}] ${event.title}: ${event.description}`);
      }
    });

    // Execute Autonomous Mission
    const missionObjective = 'Prepare me for my Product Roadmap Discussion tomorrow.';
    const result = await orchestrator.executeMission(missionObjective);

    console.log('\n[MISSION EXECUTION RESULT]:');
    console.log(`  - Status: ${result.status}`);
    console.log(`  - Mission ID: ${result.missionId}`);
    console.log(`  - Conversation ID: ${result.conversationId}`);
    console.log(`  - Iterations: ${result.iterations}`);
    console.log(`  - Duration: ${result.totalDurationMs}ms`);
    console.log(`  - Discovered Tools: ${result.toolsDiscoveredCount}`);
    console.log(`  - Executed Tools: ${result.toolCallsExecutedCount}`);
    console.log(`  - Captured Lifecycle Events: ${capturedEvents.length}`);

    // Verify Event Lifecycle Coverage
    const eventTypes = capturedEvents.map(e => e.eventType);
    console.log(`\nCaptured Event Types Sequence: ${eventTypes.join(' -> ')}`);

    const expectedEvents = [
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

    for (const expected of expectedEvents) {
      if (!eventTypes.includes(expected)) {
        throw new Error(`FAILED: Expected lifecycle event "${expected}" was not emitted!`);
      }
    }
    console.log('[PASS] All 10 expected operational lifecycle events were emitted successfully!');

    // ---------------------------------------------------------------------------
    // PART C: VERIFY PERSISTENCE ACROSS RESTART / RETRIEVAL
    // ---------------------------------------------------------------------------
    console.log('\n[PART C] Simulating Application Restart / Retrieving State from Database...');
    const persistedMission = getMissionWithDetails(result.missionId);

    if (!persistedMission) {
      throw new Error(`FAILED: Mission ${result.missionId} not found in database!`);
    }

    console.log('[PERSISTED MISSION ENTITY]:');
    console.log(`  - ID: ${persistedMission.id}`);
    console.log(`  - Title: ${persistedMission.title}`);
    console.log(`  - Status: ${persistedMission.status}`);
    console.log(`  - Total Duration: ${persistedMission.duration_ms}ms`);
    console.log(`  - Result Summary Length: ${persistedMission.result_summary?.length} characters`);
    console.log(`  - Persisted Steps Count: ${persistedMission.steps.length}`);
    console.log(`  - Persisted Tool Executions Count: ${persistedMission.toolExecutions.length}`);
    console.log(`  - Persisted Activity Events Count: ${persistedMission.activityEvents.length}`);

    if (persistedMission.status !== 'COMPLETED') {
      throw new Error(`FAILED: Expected COMPLETED status in DB, got ${persistedMission.status}`);
    }
    if (persistedMission.toolExecutions.length !== result.toolCallsExecutedCount) {
      throw new Error(`FAILED: Expected ${result.toolCallsExecutedCount} tool executions in DB, got ${persistedMission.toolExecutions.length}`);
    }

    // Inspect individual persisted tool executions
    console.log('\nPersisted Tool Executions Details:');
    persistedMission.toolExecutions.forEach((te, i) => {
      console.log(`  ${i + 1}. [${te.tool_name}] Status: ${te.status} | Duration: ${te.duration_ms}ms`);
      console.log(`     Args: ${JSON.stringify(te.arguments)}`);
      console.log(`     Output preview: ${typeof te.output === 'string' ? te.output.substring(0, 80) : JSON.stringify(te.output).substring(0, 80)}...`);
      if (te.status !== 'COMPLETED') {
        throw new Error(`FAILED: Persisted tool execution ${te.id} status is not COMPLETED!`);
      }
    });

    // ---------------------------------------------------------------------------
    // PART D: ERROR & FAILING TOOL EXECUTION PERSISTENCE
    // ---------------------------------------------------------------------------
    console.log('\n[PART D] Verifying Failure Handling Persistence...');
    const failedExec = recordToolExecution({
      missionId: result.missionId,
      toolName: 'unregistered_tool',
      arguments: { test: 123 },
      status: 'RUNNING'
    });

    updateToolExecution(failedExec.id, {
      status: 'FAILED',
      error_message: 'MCP error -32601: Tool not found',
      duration_ms: 10,
      completed_at: new Date().toISOString()
    });

    const refreshedFailedExec = db.prepare('SELECT * FROM tool_executions WHERE id = ?').get(failedExec.id);
    console.log(`[PASS] Failed tool execution cleanly recorded: Status: ${refreshedFailedExec.status} | Error: "${refreshedFailedExec.error_message}"`);
    if (refreshedFailedExec.status !== 'FAILED' || !refreshedFailedExec.error_message.includes('Tool not found')) {
      throw new Error('FAILED: Error persistence test failed!');
    }

    await transport.close();
    console.log('\n========================================================================');
    console.log('ALL PHASE 1 & 1.5 TESTS PASSED WITH 100% SUCCESS');
    console.log('========================================================================');
  } catch (err) {
    console.error('\n[LIFECYCLE TEST ERROR]:', err);
    try {
      await transport.close();
    } catch {}
    process.exit(1);
  }
}

runPersistenceLifecycleVerification();
