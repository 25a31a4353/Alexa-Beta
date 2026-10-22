import { randomUUID } from 'node:crypto';

import { BaseLLMProvider } from './base.mjs';
export { BaseLLMProvider };

/**
 * Autonomous Decision Engine (Deterministic Heuristic Fallback - NOT a Neural LLM)
 * 
 * IMPORTANT VERIFICATION NOTE:
 * This engine operates as a zero-dependency, local rule-based simulator.
 * It does NOT execute a neural network, call an external LLM API, or use model weights.
 * It evaluates conversation state, regex intent, and tool output schemas to simulate
 * agentic tool decisions when no live LLM provider credential is configured.
 */
export class AutonomousDecisionEngine extends BaseLLMProvider {
  constructor(options = {}) {
    super('AutonomousDecisionEngine (Deterministic Rule-Based Fallback - NOT an LLM)', 'local-heuristic-v1');
    this.options = options;
  }

  async generateDecision({ messages, tools, systemPrompt }) {
    console.log(`[Provider Observability] Provider: "${this.name}" | Model: "${this.model}"`);
    console.log(`[Provider Observability] Tools supplied to engine: ${tools?.length || 0}`);

    // 1. Extract the root user objective
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    const toolMessages = messages.filter(m => m.role === 'tool');

    // Index available tools by name for capability checks
    const availableToolNames = new Set(tools.map(t => t.name));

    // 2. Inspect accumulated evidence from previous tool executions
    let calendarData = null;
    let emailData = null;
    let driveData = null;
    let knowledgeData = null;
    let analysisData = null;

    for (const tm of toolMessages) {
      try {
        const parsed = JSON.parse(tm.content);
        if (tm.name === 'calendar_get_events' || tm.name === 'outlook_calendar_get_events' || parsed.events) {
          calendarData = parsed;
        } else if (tm.name === 'gmail_search' || tm.name === 'outlook_search' || parsed.emails) {
          emailData = parsed;
        } else if (tm.name === 'drive_search' || parsed.files) {
          driveData = parsed;
        } else if (tm.name === 'knowledge_search' || parsed.documents) {
          knowledgeData = parsed;
        } else if (tm.name === 'document_analyze' || parsed.key_topics) {
          analysisData = parsed;
        }
      } catch {}
    }

    // 3. CASE A: Pure Knowledge/Document search query (e.g. "search my knowledge base for X")
    const isExplicitKnowledgeOnly = /search.*(document|knowledge|report|file)|find.*(document|file|research)/i.test(userMessage) 
      && !/(calendar|schedule|meeting|tomorrow.*discussion)/i.test(userMessage);

    if (isExplicitKnowledgeOnly) {
      if (!knowledgeData && availableToolNames.has('knowledge_search')) {
        let queryTerm = userMessage
          .replace(/^.*?(for|about|on|regarding)\s+(documents|files|notes|reports)?\s*(about|on|regarding)?\s*/i, '')
          .replace(/['"]/g, '')
          .trim();
        if (!queryTerm) queryTerm = userMessage;

        return {
          type: 'tool_call',
          rationale: `Objective is to search knowledge base for "${queryTerm}". Calling knowledge_search directly.`,
          toolCalls: [
            {
              id: `call_${randomUUID().slice(0, 8)}`,
              name: 'knowledge_search',
              arguments: {
                query: queryTerm,
                category: 'all',
                limit: 5
              }
            }
          ]
        };
      }

      if (knowledgeData) {
        const docList = knowledgeData.documents?.map(d => `• **${d.title}** (${d.filename}) - Relevance: ${d.relevance}`).join('\n') || 'No documents matched.';
        return {
          type: 'final_answer',
          text: `Here are the relevant documents found in your knowledge base for "${userMessage}":\n\n${docList}`,
          sourcesUsed: knowledgeData.documents?.map(d => d.filename) || []
        };
      }
    }

    // 4. CASE B: Pure Calendar query (e.g. "what meetings do I have tomorrow?")
    const isExplicitCalendarOnly = /what('s| is).*calendar|check.*calendar|upcoming meetings|what meetings/i.test(userMessage)
      && !/(prepare|analyze|checklist|review document|emails?|inbox)/i.test(userMessage);

    if (isExplicitCalendarOnly) {
      if (!calendarData && availableToolNames.has('calendar_get_events')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const start = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0).toISOString();
        const end = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59).toISOString();

        return {
          type: 'tool_call',
          rationale: 'Objective requests calendar schedule. Calling calendar_get_events.',
          toolCalls: [
            {
              id: `call_${randomUUID().slice(0, 8)}`,
              name: 'calendar_get_events',
              arguments: { startDate: start, endDate: end }
            }
          ]
        };
      }

      if (calendarData) {
        const sourceLabel = calendarData.source || 'Connected Calendar';
        const eventsList = calendarData.events?.map(e => `• **${e.title}** (${e.startTime} on ${e.platform}) [Source: ${e.source || sourceLabel}]`).join('\n') || 'No meetings scheduled.';
        return {
          type: 'final_answer',
          text: `Here is your schedule:\n\n${eventsList}\n\n*Calendar Source: ${sourceLabel}*`,
          sourcesUsed: [sourceLabel]
        };
      }
    }

    // 5. CASE C: Complex Mission Workflow (e.g. "Prepare me for my important meeting tomorrow...")
    // Stage 1: If meeting has not been discovered yet, call calendar_get_events
    if (!calendarData) {
      if (!availableToolNames.has('calendar_get_events')) {
        return {
          type: 'final_answer',
          text: 'Unable to proceed: Required tool "calendar_get_events" is not available on the connected MCP server.'
        };
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const start = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0).toISOString();
      const end = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59).toISOString();

      return {
        type: 'tool_call',
        rationale: 'Meeting context and details are required first. Calling calendar_get_events to discover tomorrow\'s meeting schedule.',
        toolCalls: [
          {
            id: `call_${randomUUID().slice(0, 8)}`,
            name: 'calendar_get_events',
            arguments: {
              startDate: start,
              endDate: end,
              query: 'Product Roadmap'
            }
          }
        ]
      };
    }

    // Stage 2: Calendar event discovered -> check if email search is requested and available
    const targetMeeting = calendarData.events?.[0];
    if (!targetMeeting) {
      return {
        type: 'final_answer',
        text: 'I checked your calendar for tomorrow, but could not find any meeting matching your request.'
      };
    }

    const searchTopic = targetMeeting.title.replace(/Discussion|Meeting|Sync/gi, '').trim() || targetMeeting.title;

    // Check if the user mentioned checking emails and an email tool is available
    const wantsEmail = /email|gmail|outlook|inbox|messages/i.test(userMessage);
    if (wantsEmail && !emailData) {
      if (availableToolNames.has('gmail_search')) {
        return {
          type: 'tool_call',
          rationale: `Searching authenticated Gmail for email threads and updates concerning "${searchTopic}".`,
          toolCalls: [
            {
              id: `call_${randomUUID().slice(0, 8)}`,
              name: 'gmail_search',
              arguments: { query: searchTopic, maxResults: 5 }
            }
          ]
        };
      } else if (availableToolNames.has('outlook_search')) {
        return {
          type: 'tool_call',
          rationale: `Searching authenticated Outlook for messages concerning "${searchTopic}".`,
          toolCalls: [
            {
              id: `call_${randomUUID().slice(0, 8)}`,
              name: 'outlook_search',
              arguments: { query: searchTopic, maxResults: 5 }
            }
          ]
        };
      }
    }

    // Stage 3: Search relevant documents in knowledge base or drive
    if (!knowledgeData && !driveData) {
      if (availableToolNames.has('knowledge_search')) {
        return {
          type: 'tool_call',
          rationale: `Found upcoming meeting "${targetMeeting.title}". Searching connected knowledge assets for documents matching "${searchTopic}".`,
          toolCalls: [
            {
              id: `call_${randomUUID().slice(0, 8)}`,
              name: 'knowledge_search',
              arguments: {
                query: searchTopic,
                category: 'all',
                limit: 5
              }
            }
          ]
        };
      }
    }

    // Stage 4: Analyze the primary document
    const primaryDocument = knowledgeData?.documents?.[0] || driveData?.files?.[0];
    if (!primaryDocument && !analysisData) {
      return {
        type: 'final_answer',
        text: `Found meeting "${targetMeeting.title}", but no relevant roadmap or specification documents were found.`
      };
    }

    if (!analysisData && primaryDocument) {
      if (!availableToolNames.has('document_analyze')) {
        return {
          type: 'final_answer',
          text: `Found document "${primaryDocument.title || primaryDocument.name}", but "document_analyze" tool is not available to extract preparation items.`
        };
      }

      return {
        type: 'tool_call',
        rationale: `Found relevant document "${primaryDocument.title || primaryDocument.name}". Analyzing it for key topics, decisions, action items, and risks.`,
        toolCalls: [
          {
            id: `call_${randomUUID().slice(0, 8)}`,
            name: 'document_analyze',
            arguments: {
              documentIds: [primaryDocument.documentId || primaryDocument.fileId || 'doc-roadmap-01'],
              analysisType: 'all',
              focus: ['decisions', 'action_items', 'risks', 'preparation_gaps']
            }
          }
        ]
      };
    }

    // Stage 5: Grounded Synthesis across all discovered evidence
    const calendarSource = targetMeeting.source || calendarData.source || 'Local MCP Dataset';
    const brief = [
      `### Meeting Preparation Brief: ${targetMeeting.title}`,
      `**Schedule:** Tomorrow at 10:00 AM via ${targetMeeting.platform}`,
      `**Attendees:** ${targetMeeting.attendees.join(', ')}`,
      `**Calendar Source:** ${calendarSource}`,
    ];

    if (emailData && emailData.emails && emailData.emails.length > 0) {
      brief.push(
        `\n#### 📬 Relevant Email Intelligence (${emailData.source || 'Connected Email'}):`,
        ...emailData.emails.slice(0, 3).map(e => `• **${e.subject}** (${e.sender}) — "${e.snippet.substring(0, 110)}..."`)
      );
    }

    if (primaryDocument) {
      brief.push(`**Primary Document Analyzed:** ${primaryDocument.title || primaryDocument.name} (\`${primaryDocument.filename || primaryDocument.name}\`)\n`);
    }

    if (analysisData) {
      brief.push(
        `#### 📌 Key Strategic Topics:`,
        ...analysisData.key_topics.map(t => `• ${t}`),
        `\n#### ❓ Key Decisions You Must Prepare For:`,
        ...analysisData.decisions_needed.map(d => `• **${d}**`),
        `\n#### ⚠️ Identified Risks:`,
        ...analysisData.risks.map(r => `• ${r}`),
        `\n#### ✅ Recommended Preparation Actions & Checklist:`,
        ...analysisData.recommendations_for_user.map(rec => `• ${rec}`),
        `\n*(Actionable checklist generated from real execution evidence. Note: External push notification reminders are not scheduled.)*`
      );
    }

    return {
      type: 'final_answer',
      text: brief.join('\n'),
      sourcesUsed: [targetMeeting.platform, calendarSource, primaryDocument?.filename || primaryDocument?.name || 'Knowledge Base']
    };
  }
}

/**
 * OpenAI-Compatible Provider implementation (for external live endpoints or compatible local gateways)
 */
export class OpenAICompatibleProvider extends BaseLLMProvider {
  constructor(config = {}) {
    const model = config.model || process.env.LLM_MODEL || 'gpt-4o';
    super('OpenAICompatibleProvider (Neural LLM)', model);
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.baseURL = config.baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = model;
  }

  async generateDecision({ messages, tools, systemPrompt }) {
    console.log(`[Provider Observability] Provider: "${this.name}" | Model: "${this.model}"`);
    console.log(`[Provider Observability] Target Endpoint: ${this.baseURL}/chat/completions (Authorization header redacted)`);
    console.log(`[Provider Observability] Tools supplied to LLM: ${tools?.length || 0}`);

    if (!this.apiKey || this.apiKey === 'your_key_here' || this.apiKey.includes('placeholder')) {
      throw new Error('OPENAI_API_KEY is not configured with a valid active credential.');
    }

    // Format MCP tools into OpenAI function calling schema
    const formattedTools = (tools || []).map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema || { type: 'object', properties: {} }
      }
    }));

    if (formattedTools.length > 0) {
      console.log(`[Provider Observability] Dynamically discovered tool schemas supplied to LLM:`);
      formattedTools.forEach(t => console.log(`  • ${t.function.name}: ${Object.keys(t.function.parameters.properties || {}).length} parameter(s)`));
    }

    const formattedMessages = [];
    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of messages) {
      if (msg.role === 'tool') {
        formattedMessages.push({
          role: 'tool',
          tool_call_id: msg.toolCallId,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        });
      } else if (msg.role === 'assistant' && msg.toolCalls) {
        formattedMessages.push({
          role: 'assistant',
          content: msg.content || null,
          tool_calls: msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments)
            }
          }))
        });
      } else {
        formattedMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    console.log(`[Provider Observability] Dispatched HTTP POST to LLM (/chat/completions with ${formattedMessages.length} messages)`);

    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: formattedMessages,
        tools: formattedTools.length > 0 ? formattedTools : undefined,
        temperature: 0.1
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0]?.message;

    if (choice?.tool_calls && choice.tool_calls.length > 0) {
      const toolCalls = choice.tool_calls.map(tc => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments || '{}')
      }));

      console.log(`[Provider Observability] LLM Decision: TOOL_CALL (${toolCalls.length} tool(s) selected by neural model)`);
      toolCalls.forEach(tc => {
        console.log(`  - Selected Tool: "${tc.name}" with arguments:`, JSON.stringify(tc.arguments));
      });

      return {
        type: 'tool_call',
        toolCalls
      };
    }

    console.log('[Provider Observability] LLM Decision: FINAL_ANSWER (Generated by neural model)');
    return {
      type: 'final_answer',
      text: choice?.content || ''
    };
  }
}

import { AmazonBedrockProvider } from './bedrock.mjs';

/**
 * Factory function to create the active LLM provider
 */
export function createLLMProvider(overrideType) {
  const providerType = (overrideType || process.env.LLM_PROVIDER || '').toLowerCase();
  const rawKey = process.env.OPENAI_API_KEY || '';
  const hasRealKey = rawKey.length > 0 && rawKey !== 'your_key_here' && !rawKey.includes('placeholder');

  // AWS Builder Track: Native Amazon Bedrock Provider
  if (providerType === 'bedrock' || (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID)) {
    console.log('[Provider Factory] Selected AWS Builder Provider: AmazonBedrockProvider');
    return new AmazonBedrockProvider();
  }

  if (providerType === 'openai' || hasRealKey) {
    if (hasRealKey) {
      console.log('[Provider Factory] Selected Neural LLM Provider: OpenAICompatibleProvider');
      return new OpenAICompatibleProvider();
    } else {
      console.warn('[Provider Factory] OpenAI requested but OPENAI_API_KEY is placeholder or unconfigured.');
    }
  }

  console.log('[Provider Factory] Selected Fallback Provider: AutonomousDecisionEngine (Deterministic Rule-Based Fallback - NOT an LLM)');
  return new AutonomousDecisionEngine();
}
