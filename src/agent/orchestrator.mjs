import { ListToolsResultSchema, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { createLLMProvider } from './llm/provider.mjs';

/**
 * Alexa+ Agent Orchestrator
 * Coordinates between natural language objectives, LLM decision engines, and real MCP tool execution.
 */
export class AgentOrchestrator {
  /**
   * @param {Object} options
   * @param {import('@modelcontextprotocol/sdk/client/index.js').Client} options.mcpClient
   * @param {import('./llm/provider.mjs').BaseLLMProvider} [options.llmProvider]
   * @param {number} [options.maxIterations=6]
   * @param {number} [options.timeoutMs=45000]
   */
  constructor(options) {
    if (!options.mcpClient) {
      throw new Error('AgentOrchestrator requires an active mcpClient instance');
    }
    this.mcpClient = options.mcpClient;
    this.llmProvider = options.llmProvider || createLLMProvider();
    this.maxIterations = options.maxIterations || 6;
    this.timeoutMs = options.timeoutMs || 45000;
  }

  /**
   * Autonomously execute an end-to-end user objective through dynamic MCP tool discovery and invocation
   * @param {string} userObjective Natural language goal from user
   * @returns {Promise<Object>} Execution result with status, tool traces, and final grounded answer
   */
  async executeMission(userObjective) {
    const startTime = Date.now();
    console.log(`[Orchestrator] Starting Mission: "${userObjective}"`);

    // 1. DYNAMIC TOOL DISCOVERY: Interrogate MCP server for registered capabilities
    console.log('[Orchestrator] Discovering available tools via MCP tools/list...');
    const toolsResult = await this.mcpClient.request(
      { method: 'tools/list', params: {} },
      ListToolsResultSchema
    );

    const discoveredTools = toolsResult.tools || [];
    console.log(`[Orchestrator] Dynamically discovered ${discoveredTools.length} MCP tools:`);
    discoveredTools.forEach(t => console.log(`  • ${t.name}: ${t.description}`));

    // 2. Initialize Conversation & State
    const messages = [
      {
        role: 'system',
        content: `You are Alexa+, an advanced agentic assistant. You solve complex user objectives by selecting and invoking tools.
CRITICAL INVARIANTS:
1. Always ground your final answer strictly in the facts and data returned from tool executions.
2. Never hallucinate or invent meetings, documents, attendees, or dates not returned by tools.
3. Select the most relevant tool based on the current missing information.`
      },
      {
        role: 'user',
        content: userObjective
      }
    ];

    const executedToolTraces = [];
    let iterations = 0;
    let finalAnswer = null;
    let missionStatus = 'EXECUTING';

    // 3. CONTROLLED AGENT LOOP
    console.log(`[Orchestrator] Active Provider: "${this.llmProvider.name || 'unnamed'}" | Model: "${this.llmProvider.model || 'unspecified'}"`);

    while (iterations < this.maxIterations) {
      iterations++;
      console.log(`\n[Orchestrator Loop] --- Iteration ${iterations}/${this.maxIterations} ---`);
      console.log(`[Orchestrator] Consulting Provider "${this.llmProvider.name}" [Model: ${this.llmProvider.model}] with ${messages.length} messages and ${discoveredTools.length} tools...`);

      // Check timeout safeguard
      if (Date.now() - startTime > this.timeoutMs) {
        console.warn('[Orchestrator] Timeout threshold reached. Aborting loop.');
        missionStatus = 'TIMEOUT';
        break;
      }

      // Ask LLM Provider for next decision based on current conversation state and discovered tools
      let decision;
      try {
        decision = await this.llmProvider.generateDecision({
          messages,
          tools: discoveredTools
        });
      } catch (err) {
        console.error('[Orchestrator] LLM decision error:', err);
        missionStatus = 'LLM_ERROR';
        finalAnswer = `Agent encountered a decision error: ${err.message}`;
        break;
      }

      // Handle Final Answer
      if (decision.type === 'final_answer') {
        console.log('[Orchestrator] Provider delivered final synthesized answer.');
        finalAnswer = decision.text;
        missionStatus = 'COMPLETED';
        break;
      }

      // Handle Tool Calls
      if (decision.type === 'tool_call') {
        if (!decision.toolCalls || decision.toolCalls.length === 0) {
          console.warn('[Orchestrator] Empty tool call list received. Terminating.');
          break;
        }

        for (const toolCall of decision.toolCalls) {
          console.log(`[Orchestrator Action] LLM selected tool: "${toolCall.name}"`);
          if (decision.rationale) {
            console.log(`  Rationale: ${decision.rationale}`);
          }
          console.log(`  Arguments:`, JSON.stringify(toolCall.arguments));

          // Safeguard 1: Verify tool exists in discovered MCP catalog
          const toolExists = discoveredTools.some(t => t.name === toolCall.name);
          if (!toolExists) {
            console.error(`[Orchestrator Error] Tool "${toolCall.name}" does not exist in MCP catalog.`);
            messages.push({
              role: 'assistant',
              content: '',
              toolCalls: [toolCall]
            });
            messages.push({
              role: 'tool',
              toolCallId: toolCall.id,
              name: toolCall.name,
              content: JSON.stringify({
                error: 'TOOL_NOT_FOUND',
                message: `Tool "${toolCall.name}" is not registered on this MCP server.`
              })
            });
            continue;
          }

          // Safeguard 2: Execute tool through REAL MCP Client over Streamable HTTP
          const toolStart = Date.now();
          try {
            const mcpResult = await this.mcpClient.request(
              {
                method: 'tools/call',
                params: {
                  name: toolCall.name,
                  arguments: toolCall.arguments
                }
              },
              CallToolResultSchema
            );
            const toolDuration = Date.now() - toolStart;

            const textOutput = mcpResult.content?.[0]?.text || JSON.stringify(mcpResult);
            console.log(`[Orchestrator Success] Tool "${toolCall.name}" completed in ${toolDuration}ms.`);
            const preview = textOutput.length > 250 ? textOutput.substring(0, 250) + '... (truncated preview)' : textOutput;
            console.log(`[Orchestrator Evidence] MCP Result Received: ${preview}`);

            // Record execution trace
            executedToolTraces.push({
              iteration: iterations,
              toolName: toolCall.name,
              arguments: toolCall.arguments,
              durationMs: toolDuration,
              output: textOutput.length > 500 ? textOutput.substring(0, 500) + '...' : textOutput
            });

            // Feed assistant call and tool result back into conversation state
            console.log(`[Orchestrator Feedback] Feeding tool result (id: "${toolCall.id}") back into messages state for next turn.`);
            messages.push({
              role: 'assistant',
              content: '',
              toolCalls: [toolCall]
            });
            messages.push({
              role: 'tool',
              toolCallId: toolCall.id,
              name: toolCall.name,
              content: textOutput
            });
          } catch (mcpErr) {
            const toolDuration = Date.now() - toolStart;
            console.error(`[Orchestrator Error] MCP tool execution failed: ${mcpErr.message}`);

            executedToolTraces.push({
              iteration: iterations,
              toolName: toolCall.name,
              arguments: toolCall.arguments,
              durationMs: toolDuration,
              error: mcpErr.message
            });

            messages.push({
              role: 'assistant',
              content: '',
              toolCalls: [toolCall]
            });
            messages.push({
              role: 'tool',
              toolCallId: toolCall.id,
              name: toolCall.name,
              content: JSON.stringify({
                error: 'MCP_EXECUTION_FAILURE',
                message: mcpErr.message
              })
            });
          }
        }
      }
    }

    if (iterations >= this.maxIterations && !finalAnswer) {
      missionStatus = 'MAX_ITERATIONS_REACHED';
      finalAnswer = `Mission stopped: reached maximum iteration limit (${this.maxIterations}).`;
    }

    const totalDuration = Date.now() - startTime;
    console.log(`\n[Orchestrator Finished] Status: ${missionStatus} in ${totalDuration}ms (${iterations} iterations).`);

    return {
      status: missionStatus,
      objective: userObjective,
      iterations,
      totalDurationMs: totalDuration,
      toolsDiscoveredCount: discoveredTools.length,
      toolCallsExecutedCount: executedToolTraces.length,
      toolTraces: executedToolTraces,
      finalAnswer,
      grounded: Boolean(finalAnswer && executedToolTraces.length > 0)
    };
  }
}
