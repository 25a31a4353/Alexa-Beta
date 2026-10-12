import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AgentOrchestrator } from '../src/agent/orchestrator.mjs';

const MCP_URL = process.env.MCP_SERVER_URL || 'http://127.0.0.1:3001/mcp';

async function runAutonomousAgentTests() {
  console.log('========================================================================');
  console.log('ALEXA+ MILESTONE 3: AUTONOMOUS AGENT ORCHESTRATION TEST SUITE');
  console.log('========================================================================');
  console.log(`[MCP Client] Connecting to: ${MCP_URL}`);

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  const mcpClient = new Client(
    { name: 'alexa-plus-autonomous-test-client', version: '1.0.0' },
    { capabilities: { roots: {} } }
  );

  try {
    await mcpClient.connect(transport);
    console.log(`[Transport Connected] MCP Session ID: ${transport.sessionId}\n`);

    const orchestrator = new AgentOrchestrator({
      mcpClient,
      maxIterations: 6,
      timeoutMs: 30000
    });

    // =========================================================================
    // TEST 1: Complex Multi-Step Mission Execution
    // =========================================================================
    console.log('========================================================================');
    console.log('TEST 1: AUTONOMOUS MISSION — "Prepare me for my Product Roadmap Discussion tomorrow"');
    console.log('========================================================================');

    const mission1 = await orchestrator.executeMission(
      'Prepare me for my Product Roadmap Discussion tomorrow.'
    );

    console.log('\n[TEST 1 SUMMARY]:');
    console.log(`  - Status: ${mission1.status}`);
    console.log(`  - Iterations: ${mission1.iterations}`);
    console.log(`  - Tools Discovered: ${mission1.toolsDiscoveredCount}`);
    console.log(`  - Tool Calls Executed: ${mission1.toolCallsExecutedCount}`);
    console.log(`  - Tool Sequence Executed:`);
    mission1.toolTraces.forEach((t, i) => {
      console.log(`    ${i + 1}. [${t.toolName}] in ${t.durationMs}ms with args:`, JSON.stringify(t.arguments));
    });

    console.log('\n[TEST 1 FINAL GROUNDED ANSWER]:');
    console.log(mission1.finalAnswer);

    // Assertions for Test 1
    if (mission1.status !== 'COMPLETED') {
      throw new Error(`TEST 1 FAILED: Expected COMPLETED status, got ${mission1.status}`);
    }
    if (mission1.toolCallsExecutedCount !== 3) {
      throw new Error(`TEST 1 FAILED: Expected 3 tool calls, got ${mission1.toolCallsExecutedCount}`);
    }
    const executedTools1 = mission1.toolTraces.map(t => t.toolName);
    if (executedTools1[0] !== 'calendar_get_events' || executedTools1[1] !== 'knowledge_search' || executedTools1[2] !== 'document_analyze') {
      throw new Error(`TEST 1 FAILED: Unexpected tool order: ${JSON.stringify(executedTools1)}`);
    }
    if (!mission1.finalAnswer.includes('Product Roadmap Discussion') || !mission1.finalAnswer.includes('Q4 Product Roadmap')) {
      throw new Error('TEST 1 FAILED: Final answer is not grounded in tool results!');
    }
    console.log('\n>>> [TEST 1 PASSED]: Autonomous multi-step mission completed successfully!');

    // =========================================================================
    // TEST 2: Proof That Tool Sequence Is NOT Hardcoded
    // Different Objective: Search documents directly without needing calendar!
    // =========================================================================
    console.log('\n========================================================================');
    console.log('TEST 2: PROOF THAT SEQUENCE IS NOT HARDCODED');
    console.log('Objective: "Search my knowledge base for documents about competitor analysis"');
    console.log('Expected: Agent should invoke knowledge_search directly WITHOUT calling calendar.');
    console.log('========================================================================');

    const mission2 = await orchestrator.executeMission(
      'Search my knowledge base for documents about competitor analysis'
    );

    console.log('\n[TEST 2 SUMMARY]:');
    console.log(`  - Status: ${mission2.status}`);
    console.log(`  - Iterations: ${mission2.iterations}`);
    console.log(`  - Tool Calls Executed: ${mission2.toolCallsExecutedCount}`);
    console.log(`  - Tool Sequence Executed:`);
    mission2.toolTraces.forEach((t, i) => {
      console.log(`    ${i + 1}. [${t.toolName}] in ${t.durationMs}ms with args:`, JSON.stringify(t.arguments));
    });

    console.log('\n[TEST 2 FINAL ANSWER]:');
    console.log(mission2.finalAnswer);

    // Assertions for Test 2
    if (mission2.status !== 'COMPLETED') {
      throw new Error(`TEST 2 FAILED: Expected COMPLETED status, got ${mission2.status}`);
    }
    if (mission2.toolCallsExecutedCount !== 1) {
      throw new Error(`TEST 2 FAILED: Expected exactly 1 tool call, got ${mission2.toolCallsExecutedCount}`);
    }
    if (mission2.toolTraces[0].toolName !== 'knowledge_search') {
      throw new Error(`TEST 2 FAILED: Expected knowledge_search, got ${mission2.toolTraces[0].toolName}`);
    }
    if (mission2.toolTraces.some(t => t.toolName === 'calendar_get_events')) {
      throw new Error('TEST 2 FAILED: Calendar tool was called when only knowledge search was requested!');
    }
    if (!mission2.finalAnswer.includes('Competitor Analysis')) {
      throw new Error('TEST 2 FAILED: Expected Competitor Analysis document in answer!');
    }
    console.log('\n>>> [TEST 2 PASSED]: Proven that tool sequence is capability-driven, NOT hardcoded!');

    // Clean disconnect
    await transport.close();
    console.log('\n========================================================================');
    console.log('ALL AUTONOMOUS AGENT ORCHESTRATION TESTS PASSED (100%)');
    console.log('========================================================================');
  } catch (error) {
    console.error('\n[AGENT TEST ERROR]:', error);
    try {
      await transport.close();
    } catch {}
    process.exit(1);
  }
}

runAutonomousAgentTests();
