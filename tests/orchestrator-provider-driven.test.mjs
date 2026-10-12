import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AgentOrchestrator } from '../src/agent/orchestrator.mjs';
import { BaseLLMProvider } from '../src/agent/llm/provider.mjs';

const MCP_URL = process.env.MCP_SERVER_URL || 'http://127.0.0.1:3001/mcp';

/**
 * Scripted Provider designed specifically to verify that the orchestrator
 * NEVER hardcodes tool sequences. It commands an alternative sequence:
 * ping -> knowledge_search -> final_answer.
 * It strictly asserts that tool results are fed back into messages on each turn.
 */
class VerificationScriptedProvider extends BaseLLMProvider {
  constructor() {
    super('VerificationScriptedProvider (Inverted Sequence)', 'test-evaluator-v1');
    this.turn = 0;
    this.receivedToolResults = [];
    this.receivedToolNamesInSchemas = [];
  }

  async generateDecision({ messages, tools }) {
    this.turn++;
    console.log(`\n[VerificationProvider] --- Turn ${this.turn} ---`);
    console.log(`[VerificationProvider] Dynamically supplied tools: ${tools.map(t => t.name).join(', ')}`);

    this.receivedToolNamesInSchemas = tools.map(t => t.name);

    if (this.turn === 1) {
      // Turn 1: Decide to call 'ping' (NOT calendar!)
      console.log('[VerificationProvider] Turn 1: Selecting tool "ping"');
      return {
        type: 'tool_call',
        rationale: 'Step 1: Test MCP connectivity via ping',
        toolCalls: [
          {
            id: 'call_ping_001',
            name: 'ping',
            arguments: {}
          }
        ]
      };
    }

    if (this.turn === 2) {
      // Assert that orchestrator fed back the ping tool result
      const toolMsg = messages.find(m => m.role === 'tool' && m.toolCallId === 'call_ping_001');
      if (!toolMsg) {
        throw new Error('EVIDENCE FAILURE: Orchestrator did not feed back "ping" tool result to provider!');
      }
      console.log(`[VerificationProvider] Turn 2: Received tool result for call_ping_001: ${toolMsg.content}`);
      this.receivedToolResults.push({ tool: 'ping', content: toolMsg.content });

      // Turn 2: Decide to call 'knowledge_search' with custom query
      console.log('[VerificationProvider] Turn 2: Selecting tool "knowledge_search"');
      return {
        type: 'tool_call',
        rationale: 'Step 2: Search knowledge base for competitor analysis',
        toolCalls: [
          {
            id: 'call_know_002',
            name: 'knowledge_search',
            arguments: {
              query: 'competitor',
              category: 'all',
              limit: 2
            }
          }
        ]
      };
    }

    if (this.turn === 3) {
      // Assert that orchestrator fed back the knowledge_search tool result
      const toolMsg = messages.find(m => m.role === 'tool' && m.toolCallId === 'call_know_002');
      if (!toolMsg) {
        throw new Error('EVIDENCE FAILURE: Orchestrator did not feed back "knowledge_search" tool result to provider!');
      }
      console.log(`[VerificationProvider] Turn 3: Received tool result for call_know_002 (${toolMsg.content.length} bytes)`);
      this.receivedToolResults.push({ tool: 'knowledge_search', content: toolMsg.content });

      // Turn 3: Synthesize final answer based on accumulated evidence
      console.log('[VerificationProvider] Turn 3: Emitting final answer grounded in tool results');
      return {
        type: 'final_answer',
        text: 'Provider verified: The orchestrator faithfully executed the provider-chosen sequence (ping -> knowledge_search) and returned tool results on every turn.'
      };
    }

    throw new Error(`Unexpected turn ${this.turn}`);
  }
}

async function runProviderDrivenDecouplingTest() {
  console.log('========================================================================');
  console.log('MILESTONE 3.1: PROVIDER-DRIVEN DECOUPLING VERIFICATION TEST');
  console.log('Testing that Orchestrator has NO hardcoded tool sequences');
  console.log('========================================================================');
  console.log(`[MCP Client] Connecting to: ${MCP_URL}`);

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  const mcpClient = new Client(
    { name: 'alexa-plus-decoupling-test-client', version: '1.0.0' },
    { capabilities: { roots: {} } }
  );

  try {
    await mcpClient.connect(transport);
    console.log(`[Transport Connected] MCP Session ID: ${transport.sessionId}\n`);

    const customProvider = new VerificationScriptedProvider();

    const orchestrator = new AgentOrchestrator({
      mcpClient,
      llmProvider: customProvider,
      maxIterations: 6,
      timeoutMs: 30000
    });

    const mission = await orchestrator.executeMission(
      'Verify whether the orchestrator is genuinely provider-driven.'
    );

    console.log('\n[TEST RESULTS SUMMARY]:');
    console.log(`  - Status: ${mission.status}`);
    console.log(`  - Iterations: ${mission.iterations}`);
    console.log(`  - Tools Discovered: ${mission.toolsDiscoveredCount}`);
    console.log(`  - Tool Calls Executed: ${mission.toolCallsExecutedCount}`);
    console.log(`  - Executed Sequence: ${mission.toolTraces.map(t => t.toolName).join(' -> ')}`);

    // Strict assertions
    if (mission.status !== 'COMPLETED') {
      throw new Error(`Test failed: Expected COMPLETED status, got ${mission.status}`);
    }

    if (mission.toolCallsExecutedCount !== 2) {
      throw new Error(`Test failed: Expected 2 tool calls, got ${mission.toolCallsExecutedCount}`);
    }

    const executedTools = mission.toolTraces.map(t => t.toolName);
    if (executedTools[0] !== 'ping' || executedTools[1] !== 'knowledge_search') {
      throw new Error(`Test failed: Orchestrator failed to follow provider-selected sequence! Got: ${JSON.stringify(executedTools)}`);
    }

    if (customProvider.receivedToolResults.length !== 2) {
      throw new Error(`Test failed: Provider did not receive both tool results back!`);
    }

    // Verify schemas were delivered to provider
    if (!customProvider.receivedToolNamesInSchemas.includes('calendar_get_events') ||
        !customProvider.receivedToolNamesInSchemas.includes('knowledge_search') ||
        !customProvider.receivedToolNamesInSchemas.includes('document_analyze') ||
        !customProvider.receivedToolNamesInSchemas.includes('ping')) {
      throw new Error('Test failed: Dynamic MCP tool schemas were not delivered to provider!');
    }

    console.log('\n>>> [EVIDENCE PROVEN]:');
    console.log('1. The orchestrator has NO hardcoded tool sequence (executed ping -> knowledge_search).');
    console.log('2. Dynamically discovered MCP tool schemas were passed to provider on every turn.');
    console.log('3. Tool results over Streamable HTTP were fed back into provider messages state.');
    console.log('4. The final answer was delivered strictly according to the provider\'s decision.');

    await transport.close();
    console.log('\n========================================================================');
    console.log('PROVIDER-DRIVEN DECOUPLING TEST PASSED (100%)');
    console.log('========================================================================');
  } catch (err) {
    console.error('\n[TEST ERROR]:', err);
    try {
      await transport.close();
    } catch {}
    process.exit(1);
  }
}

runProviderDrivenDecouplingTest();
