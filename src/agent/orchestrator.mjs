import { ListToolsResultSchema, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { createLLMProvider } from './llm/provider.mjs';
import {
  createConversation,
  getConversation,
  createMission,
  getMission,
  updateMission,
  createMissionStep,
  updateMissionStep,
  recordToolExecution,
  updateToolExecution,
  recordActivityEvent
} from '../db/index.mjs';

/**
 * Alexa+ Agent Orchestrator
 * Coordinates between natural language objectives, LLM decision engines, real MCP tool execution,
 * and persistent operational lifecycle events.
 */
export class AgentOrchestrator {
  /**
   * @param {Object} options
   * @param {import('@modelcontextprotocol/sdk/client/index.js').Client} options.mcpClient
   * @param {import('./llm/provider.mjs').BaseLLMProvider} [options.llmProvider]
   * @param {number} [options.maxIterations=6]
   * @param {number} [options.timeoutMs=45000]
   * @param {Function} [options.onEvent] Optional global event callback for telemetry / SSE
   * @param {boolean} [options.enablePersistence=true] Whether to persist state in SQLite
   */
  constructor(options) {
    if (!options.mcpClient) {
      throw new Error('AgentOrchestrator requires an active mcpClient instance');
    }
    this.mcpClient = options.mcpClient;
    this.llmProvider = options.llmProvider || createLLMProvider();
    this.maxIterations = options.maxIterations || 6;
    this.timeoutMs = options.timeoutMs || 45000;
    this.onEvent = options.onEvent || null;
    this.enablePersistence = options.enablePersistence !== false;
  }

  /**
   * Emit an operational lifecycle event to callback and activity store
   * (Operational summaries only — NEVER exposes private chain-of-thought)
   */
  emitLifecycleEvent({ missionId, conversationId, eventType, title, description, domain, status = 'INFO', metadata = {} }, callbackOverride) {
    const eventId = metadata?.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload = {
      id: eventId,
      missionId,
      conversationId,
      eventType,
      title,
      description,
      domain,
      status,
      metadata,
      timestamp: new Date().toISOString()
    };

    // 1. Dispatch to listener callback (for live SSE stream / UI)
    const handler = callbackOverride || this.onEvent;
    if (typeof handler === 'function') {
      try {
        handler(payload);
      } catch (err) {
        console.warn('[Orchestrator] Event listener error:', err.message);
      }
    }

    // 2. Persist to activity_events in SQLite
    if (this.enablePersistence) {
      try {
        recordActivityEvent({
          id: eventId,
          missionId,
          conversationId,
          eventType,
          title,
          description,
          domain,
          status,
          metadata,
          isSynthetic: 0
        });
      } catch (err) {
        console.warn('[Orchestrator] Failed to persist activity event:', err.message);
      }
    }
  }

  /**
   * Autonomously execute an end-to-end user objective through dynamic MCP tool discovery and invocation
   * @param {string} userObjective Natural language goal from user
   * @param {Object} [executionOptions]
   * @param {string} [executionOptions.missionId] Optional custom or resumed mission ID
   * @param {string} [executionOptions.conversationId] Optional conversation ID
   * @param {Function} [executionOptions.onEvent] Optional per-mission event callback
   * @returns {Promise<Object>} Execution result with status, tool traces, and final grounded answer
   */
  async executeMission(userObjective, executionOptions = {}) {
    const startTime = Date.now();
    const eventCallback = executionOptions.onEvent || this.onEvent;

    // 1. Initialize or resolve Persistent Conversation and Mission entities
    let conversationId = executionOptions.conversationId;
    let missionId = executionOptions.missionId;

    if (this.enablePersistence) {
      try {
        if (!conversationId) {
          const conv = createConversation({
            title: userObjective.length > 40 ? `${userObjective.substring(0, 40)}...` : userObjective,
            modelId: this.llmProvider.model || 'gpt-4o'
          });
          conversationId = conv.id;
        }

        let mission = missionId ? getMission(missionId) : null;
        if (!mission) {
          mission = createMission({
            id: missionId,
            conversationId,
            title: userObjective.length > 50 ? `${userObjective.substring(0, 50)}...` : userObjective,
            goal: userObjective
          });
        }
        missionId = mission.id;
        updateMission(missionId, { status: 'UNDERSTANDING', started_at: new Date().toISOString() });
      } catch (dbErr) {
        console.warn('[Orchestrator] Persistence initialization warning:', dbErr.message);
      }
    }

    console.log(`[Orchestrator] Starting Mission [ID: ${missionId || 'ephemeral'}]: "${userObjective}"`);

    this.emitLifecycleEvent({
      missionId,
      conversationId,
      eventType: 'mission.started',
      title: 'Mission Started',
      description: `Initiated autonomous mission: "${userObjective}"`,
      domain: 'Mission',
      status: 'INFO',
      metadata: { goal: userObjective, provider: this.llmProvider.name }
    }, eventCallback);

    // 2. DYNAMIC TOOL DISCOVERY: Interrogate MCP server for registered capabilities
    console.log('[Orchestrator] Discovering available tools via MCP tools/list...');
    let discoveredTools = [];
    try {
      const toolsResult = await this.mcpClient.request(
        { method: 'tools/list', params: {} },
        ListToolsResultSchema
      );
      discoveredTools = toolsResult.tools || [];
      console.log(`[Orchestrator] Dynamically discovered ${discoveredTools.length} MCP tools:`);
      discoveredTools.forEach(t => console.log(`  • ${t.name}: ${t.description}`));

      this.emitLifecycleEvent({
        missionId,
        conversationId,
        eventType: 'tool.discovered',
        title: 'MCP Tools Discovered',
        description: `Discovered ${discoveredTools.length} tools via Streamable HTTP: ${discoveredTools.map(t => t.name).join(', ')}`,
        domain: 'Tool',
        status: 'INFO',
        metadata: { toolsCount: discoveredTools.length, toolNames: discoveredTools.map(t => t.name) }
      }, eventCallback);
    } catch (mcpDiscoveryErr) {
      console.error('[Orchestrator] MCP tools/list discovery failed:', mcpDiscoveryErr);
      if (this.enablePersistence && missionId) {
        updateMission(missionId, {
          status: 'FAILED',
          result_summary: `MCP discovery failure: ${mcpDiscoveryErr.message}`,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime
        });
      }

      this.emitLifecycleEvent({
        missionId,
        conversationId,
        eventType: 'mission.failed',
        title: 'MCP Discovery Failed',
        description: `Failed to connect to MCP server: ${mcpDiscoveryErr.message}`,
        domain: 'Mission',
        status: 'ERROR',
        metadata: { error: mcpDiscoveryErr.message }
      }, eventCallback);

      return {
        status: 'FAILED',
        objective: userObjective,
        conversationId,
        missionId,
        iterations: 0,
        totalDurationMs: Date.now() - startTime,
        toolsDiscoveredCount: 0,
        toolCallsExecutedCount: 0,
        toolTraces: [],
        finalAnswer: `Unable to execute mission: MCP server unavailable (${mcpDiscoveryErr.message})`,
        grounded: false
      };
    }

    // 3. UNDERSTANDING & INITIAL PLAN FORMULATION
    if (this.enablePersistence && missionId) {
      updateMission(missionId, { status: 'PLANNING' });
    }

    this.emitLifecycleEvent({
      missionId,
      conversationId,
      eventType: 'understanding.completed',
      title: 'Goal Understood',
      description: 'Extracted core objective and temporal parameters from user goal.',
      domain: 'Mission',
      status: 'INFO',
      metadata: { goal: userObjective }
    }, eventCallback);

    // Mode-specific plan step formulation (ChatGPT-style execution modes)
    const mode = (executionOptions.executionMode || 'autonomous').toLowerCase();
    let planSteps = [];
    if (mode === 'quick') {
      planSteps = [
        { stepIndex: 1, label: 'Retrieve targeted context via tool execution', domain: 'External Services', assignedTool: 'calendar_get_events' },
        { stepIndex: 2, label: 'Synthesize direct actionable answer', domain: 'Verification', assignedTool: null }
      ];
    } else if (mode === 'build') {
      planSteps = [
        { stepIndex: 1, label: 'Formulate technical milestones & architecture requirements', domain: 'Planning', assignedTool: null },
        { stepIndex: 2, label: 'Cross-reference specifications against knowledge assets', domain: 'Knowledge', assignedTool: 'knowledge_search' },
        { stepIndex: 3, label: 'Verify dependencies and extract structured action checklist', domain: 'Knowledge', assignedTool: 'document_analyze' },
        { stepIndex: 4, label: 'Deliver implementation blueprint and verification gates', domain: 'Verification', assignedTool: null }
      ];
    } else if (mode === 'deep') {
      planSteps = [
        { stepIndex: 1, label: 'Exhaustive schedule and calendar reconnaissance', domain: 'External Services', assignedTool: 'calendar_get_events' },
        { stepIndex: 2, label: 'Deep multi-vector search across all connected documents', domain: 'Knowledge', assignedTool: 'knowledge_search' },
        { stepIndex: 3, label: 'Exhaustive document analysis, anomaly detection and risk scoring', domain: 'Knowledge', assignedTool: 'document_analyze' },
        { stepIndex: 4, label: 'Strategic executive synthesis and grounded verification', domain: 'Verification', assignedTool: null }
      ];
    } else {
      // autonomous default
      planSteps = [
        { stepIndex: 1, label: 'Discover relevant context and schedules', domain: 'External Services', assignedTool: 'calendar_get_events' },
        { stepIndex: 2, label: 'Search and inspect connected knowledge base', domain: 'Knowledge', assignedTool: 'knowledge_search' },
        { stepIndex: 3, label: 'Deeply analyze document details and identify gaps', domain: 'Knowledge', assignedTool: 'document_analyze' },
        { stepIndex: 4, label: 'Synthesize actionable results and verify findings', domain: 'Verification', assignedTool: null }
      ];
    }

    const stepIdMap = new Map();
    if (this.enablePersistence && missionId) {
      planSteps.forEach(step => {
        try {
          const s = createMissionStep({
            missionId,
            stepIndex: step.stepIndex,
            label: step.label,
            domain: step.domain,
            assignedTool: step.assignedTool,
            status: 'PENDING'
          });
          stepIdMap.set(step.stepIndex, s.id);
        } catch {}
      });
    }

    this.emitLifecycleEvent({
      missionId,
      conversationId,
      eventType: 'plan.created',
      title: 'Execution Plan Created',
      description: `Formulated ${planSteps.length} planned milestones for goal execution.`,
      domain: 'Mission',
      status: 'INFO',
      metadata: { steps: planSteps.map(s => s.label) }
    }, eventCallback);

    if (this.enablePersistence && missionId) {
      updateMission(missionId, { status: 'EXECUTING' });
    }

    // 4. Initialize Conversation & State
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

    // 5. CONTROLLED AGENT LOOP
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

          // Determine corresponding step index and step record
          const stepIndex = Math.min(iterations, planSteps.length);
          const currentStepId = stepIdMap.get(stepIndex) || null;

          if (this.enablePersistence && currentStepId) {
            updateMissionStep(currentStepId, {
              status: 'RUNNING',
              started_at: new Date().toISOString()
            });
          }

          this.emitLifecycleEvent({
            missionId,
            conversationId,
            eventType: 'step.started',
            title: `Step ${stepIndex}: ${toolCall.name}`,
            description: `Initiated tool call for ${toolCall.name}`,
            domain: 'Tool',
            status: 'INFO',
            metadata: { stepIndex, toolName: toolCall.name }
          }, eventCallback);

          let toolExecutionRecordId = null;
          if (this.enablePersistence && missionId) {
            try {
              const execRec = recordToolExecution({
                missionId,
                stepId: currentStepId,
                toolName: toolCall.name,
                arguments: toolCall.arguments,
                status: 'RUNNING',
                startedAt: new Date().toISOString()
              });
              toolExecutionRecordId = execRec.id;
            } catch {}
          }

          this.emitLifecycleEvent({
            missionId,
            conversationId,
            eventType: 'tool.executing',
            title: `Executing ${toolCall.name}`,
            description: `Calling MCP tool "${toolCall.name}" with validated arguments.`,
            domain: 'Tool',
            status: 'INFO',
            metadata: { toolName: toolCall.name, arguments: toolCall.arguments }
          }, eventCallback);

          // Safeguard 1: Verify tool exists in discovered MCP catalog
          const toolExists = discoveredTools.some(t => t.name === toolCall.name);
          if (!toolExists) {
            console.error(`[Orchestrator Error] Tool "${toolCall.name}" does not exist in MCP catalog.`);
            const notFoundMsg = `Tool "${toolCall.name}" is not registered on this MCP server.`;

            if (this.enablePersistence && toolExecutionRecordId) {
              updateToolExecution(toolExecutionRecordId, {
                status: 'FAILED',
                error_message: notFoundMsg,
                completed_at: new Date().toISOString()
              });
            }
            if (this.enablePersistence && currentStepId) {
              updateMissionStep(currentStepId, { status: 'FAILED', completed_at: new Date().toISOString() });
            }

            this.emitLifecycleEvent({
              missionId,
              conversationId,
              eventType: 'tool.failed',
              title: `Tool Not Found: ${toolCall.name}`,
              description: notFoundMsg,
              domain: 'Tool',
              status: 'ERROR',
              metadata: { toolName: toolCall.name, error: 'TOOL_NOT_FOUND' }
            }, eventCallback);

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
                message: notFoundMsg
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
            const isToolError = Boolean(mcpResult.isError);

            if (isToolError) {
              console.error(`[Orchestrator Tool Error] Tool "${toolCall.name}" reported isError=true in ${toolDuration}ms: ${textOutput}`);

              if (this.enablePersistence && toolExecutionRecordId) {
                updateToolExecution(toolExecutionRecordId, {
                  status: 'FAILED',
                  error_message: textOutput,
                  duration_ms: toolDuration,
                  completed_at: new Date().toISOString()
                });
              }
              if (this.enablePersistence && currentStepId) {
                updateMissionStep(currentStepId, {
                  status: 'FAILED',
                  duration_ms: toolDuration,
                  completed_at: new Date().toISOString()
                });
              }

              this.emitLifecycleEvent({
                missionId,
                conversationId,
                eventType: 'tool.failed',
                title: `${toolCall.name} Execution Failed`,
                description: `Tool "${toolCall.name}" returned error: ${textOutput}`,
                domain: 'Tool',
                status: 'ERROR',
                metadata: { toolName: toolCall.name, error: textOutput, durationMs: toolDuration }
              }, eventCallback);

              executedToolTraces.push({
                iteration: iterations,
                toolName: toolCall.name,
                arguments: toolCall.arguments,
                durationMs: toolDuration,
                error: textOutput,
                isError: true
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
                content: textOutput
              });
              continue;
            }

            console.log(`[Orchestrator Success] Tool "${toolCall.name}" completed in ${toolDuration}ms.`);
            const preview = textOutput.length > 250 ? textOutput.substring(0, 250) + '... (truncated preview)' : textOutput;
            console.log(`[Orchestrator Evidence] MCP Result Received: ${preview}`);

            // Record in SQLite
            if (this.enablePersistence && toolExecutionRecordId) {
              updateToolExecution(toolExecutionRecordId, {
                status: 'COMPLETED',
                output: textOutput,
                duration_ms: toolDuration,
                completed_at: new Date().toISOString()
              });
            }
            if (this.enablePersistence && currentStepId) {
              updateMissionStep(currentStepId, {
                status: 'COMPLETED',
                duration_ms: toolDuration,
                completed_at: new Date().toISOString()
              });
            }

            this.emitLifecycleEvent({
              missionId,
              conversationId,
              eventType: 'tool.completed',
              title: `${toolCall.name} Completed`,
              description: `Tool "${toolCall.name}" completed successfully in ${toolDuration}ms.`,
              domain: 'Tool',
              status: 'SUCCESS',
              metadata: { toolName: toolCall.name, durationMs: toolDuration }
            }, eventCallback);

            // Record execution trace
            executedToolTraces.push({
              iteration: iterations,
              toolName: toolCall.name,
              arguments: toolCall.arguments,
              durationMs: toolDuration,
              output: textOutput.length > 500 ? textOutput.substring(0, 500) + '...' : textOutput
            });

            // Feed assistant call and tool result back into conversation state
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

            if (this.enablePersistence && toolExecutionRecordId) {
              updateToolExecution(toolExecutionRecordId, {
                status: 'FAILED',
                error_message: mcpErr.message,
                duration_ms: toolDuration,
                completed_at: new Date().toISOString()
              });
            }
            if (this.enablePersistence && currentStepId) {
              updateMissionStep(currentStepId, {
                status: 'FAILED',
                duration_ms: toolDuration,
                completed_at: new Date().toISOString()
              });
            }

            this.emitLifecycleEvent({
              missionId,
              conversationId,
              eventType: 'tool.failed',
              title: `${toolCall.name} Execution Failed`,
              description: `Tool execution failed: ${mcpErr.message}`,
              domain: 'Tool',
              status: 'ERROR',
              metadata: { toolName: toolCall.name, error: mcpErr.message }
            }, eventCallback);

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

    // 6. VERIFICATION & FINAL GROUNDING CHECK
    if (missionStatus === 'COMPLETED' && finalAnswer) {
      if (this.enablePersistence && missionId) {
        updateMission(missionId, { status: 'VERIFYING' });
      }

      this.emitLifecycleEvent({
        missionId,
        conversationId,
        eventType: 'verification.started',
        title: 'Verifying Results',
        description: 'Cross-checking synthesized conclusions against collected tool evidence.',
        domain: 'Verification',
        status: 'INFO',
        metadata: { tracesCount: executedToolTraces.length }
      }, eventCallback);

      const hasGrounding = executedToolTraces.length > 0;
      this.emitLifecycleEvent({
        missionId,
        conversationId,
        eventType: 'verification.completed',
        title: 'Verification Complete',
        description: hasGrounding ? 'Synthesized result is grounded in tool execution evidence.' : 'Result formulated directly without tool traces.',
        domain: 'Verification',
        status: hasGrounding ? 'SUCCESS' : 'WARNING',
        metadata: { grounded: hasGrounding }
      }, eventCallback);

      if (this.enablePersistence && missionId) {
        // Mark final step completed
        const finalStepId = stepIdMap.get(4);
        if (finalStepId) {
          updateMissionStep(finalStepId, { status: 'COMPLETED', completed_at: new Date().toISOString() });
        }

        updateMission(missionId, {
          status: 'COMPLETED',
          result_summary: finalAnswer,
          duration_ms: totalDuration,
          completed_at: new Date().toISOString()
        });
      }

      this.emitLifecycleEvent({
        missionId,
        conversationId,
        eventType: 'mission.completed',
        title: 'Mission Completed',
        description: `Successfully accomplished objective in ${totalDuration}ms (${executedToolTraces.length} tool calls executed).`,
        domain: 'Mission',
        status: 'SUCCESS',
        metadata: { durationMs: totalDuration, toolCallsCount: executedToolTraces.length }
      }, eventCallback);
    } else {
      if (this.enablePersistence && missionId) {
        updateMission(missionId, {
          status: 'FAILED',
          result_summary: finalAnswer || `Mission stopped with status: ${missionStatus}`,
          duration_ms: totalDuration,
          completed_at: new Date().toISOString()
        });
      }

      this.emitLifecycleEvent({
        missionId,
        conversationId,
        eventType: 'mission.failed',
        title: 'Mission Incomplete',
        description: finalAnswer || `Mission ended with status ${missionStatus}.`,
        domain: 'Mission',
        status: 'ERROR',
        metadata: { status: missionStatus, durationMs: totalDuration }
      }, eventCallback);
    }

    return {
      status: missionStatus,
      objective: userObjective,
      conversationId,
      missionId,
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
