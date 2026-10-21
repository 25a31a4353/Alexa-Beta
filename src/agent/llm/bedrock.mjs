import { randomUUID } from 'node:crypto';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { BaseLLMProvider } from './base.mjs';

/**
 * AWS Builder Mini-Challenge: Amazon Bedrock LLM Provider
 * 
 * Supports Anthropic Claude 3.5 Sonnet, Amazon Nova, and Titan on Amazon Bedrock
 * using the official AWS Bedrock Converse API with tool-calling capabilities.
 */
export class AmazonBedrockProvider extends BaseLLMProvider {
  /**
   * @param {Object} options
   * @param {string} [options.region] AWS region (defaults to AWS_REGION or 'us-east-1')
   * @param {string} [options.modelId] Bedrock model ID (defaults to Claude 3.5 Sonnet on Bedrock)
   * @param {string} [options.accessKeyId] AWS Access Key ID
   * @param {string} [options.secretAccessKey] AWS Secret Access Key
   * @param {any} [options.fallbackEngine] Optional fallback engine instance
   */
  constructor(options = {}) {
    const region = options.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
    const modelId = options.modelId || process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';

    super(`AmazonBedrockProvider (${modelId})`, modelId);

    this.region = region;
    this.modelId = modelId;
    this.fallbackEngine = options.fallbackEngine || null;

    // Check if AWS credentials exist
    const hasAwsCreds = Boolean(
      (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
      (options.accessKeyId && options.secretAccessKey)
    );

    this.hasCredentials = hasAwsCreds;

    if (hasAwsCreds) {
      const clientConfig = { region: this.region };
      if (options.accessKeyId && options.secretAccessKey) {
        clientConfig.credentials = {
          accessKeyId: options.accessKeyId,
          secretAccessKey: options.secretAccessKey
        };
      }
      this.client = new BedrockRuntimeClient(clientConfig);
      console.log(`[AWS Bedrock Provider] Initialized BedrockRuntimeClient for region "${this.region}" using model "${this.modelId}"`);
    } else {
      console.log(`[AWS Bedrock Provider] AWS credentials not detected in environment. Configured with resilient AutonomousDecisionEngine fallback.`);
    }
  }

  async getFallbackEngine() {
    if (!this.fallbackEngine) {
      const { AutonomousDecisionEngine } = await import('./provider.mjs');
      this.fallbackEngine = new AutonomousDecisionEngine();
    }
    return this.fallbackEngine;
  }

  /**
   * Converts generic MCP tools into AWS Bedrock Converse tool specifications
   * @param {Array<any>} tools
   * @returns {Object} Bedrock toolConfig
   */
  formatBedrockTools(tools) {
    if (!tools || tools.length === 0) return undefined;

    return {
      tools: tools.map(t => ({
        toolSpec: {
          name: t.name,
          description: t.description || `Tool ${t.name}`,
          inputSchema: {
            json: t.inputSchema || { type: 'object', properties: {} }
          }
        }
      }))
    };
  }

  /**
   * Converts standard conversation messages to Bedrock Converse format
   * @param {Array<any>} messages
   * @returns {Array<any>}
   */
  formatBedrockMessages(messages) {
    const bedrockMessages = [];

    for (const msg of messages) {
      if (msg.role === 'system') continue; // Handled separately in system parameter

      if (msg.role === 'tool') {
        bedrockMessages.push({
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: msg.tool_call_id || `call_${randomUUID().substring(0, 8)}`,
                content: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }],
                status: 'success'
              }
            }
          ]
        });
      } else if (msg.role === 'assistant' && msg.tool_calls) {
        const content = [];
        if (msg.content) {
          content.push({ text: msg.content });
        }
        for (const tc of msg.tool_calls) {
          content.push({
            toolUse: {
              toolUseId: tc.id || `call_${randomUUID().substring(0, 8)}`,
              name: tc.function?.name || tc.name,
              input: typeof tc.function?.arguments === 'string' 
                ? JSON.parse(tc.function.arguments) 
                : (tc.function?.arguments || tc.arguments || {})
            }
          });
        }
        bedrockMessages.push({ role: 'assistant', content });
      } else {
        bedrockMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
        });
      }
    }

    // Bedrock requires at least one user message
    if (bedrockMessages.length === 0) {
      bedrockMessages.push({ role: 'user', content: [{ text: 'Hello' }] });
    }

    return bedrockMessages;
  }

  /**
   * Generates agent decision using AWS Bedrock Converse API with fallback
   * @param {Object} params
   * @param {Array<any>} params.messages
   * @param {Array<any>} params.tools
   * @param {string} [params.systemPrompt]
   * @returns {Promise<import('./types.mjs').LLMDecision>}
   */
  async generateDecision({ messages, tools, systemPrompt }) {
    console.log(`[Provider Observability] Provider: "${this.name}" | Region: "${this.region}" | Model: "${this.modelId}"`);
    console.log(`[Provider Observability] Tools supplied to Bedrock: ${tools?.length || 0}`);

    if (!this.hasCredentials || !this.client) {
      console.log(`[AWS Bedrock Provider] Active runtime in fallback mode. Handing execution to AutonomousDecisionEngine.`);
      const fallback = await this.getFallbackEngine();
      return fallback.generateDecision({ messages, tools, systemPrompt });
    }

    try {
      const bedrockTools = this.formatBedrockTools(tools);
      const bedrockMessages = this.formatBedrockMessages(messages);

      const commandInput = {
        modelId: this.modelId,
        messages: bedrockMessages,
        system: systemPrompt ? [{ text: systemPrompt }] : undefined,
        toolConfig: bedrockTools,
        inferenceConfig: {
          maxTokens: 2048,
          temperature: 0.1
        }
      };

      console.log(`[AWS Bedrock] Invoking Bedrock Converse API for model: ${this.modelId}`);
      const command = new ConverseCommand(commandInput);
      const response = await this.client.send(command);

      const content = response.output?.message?.content || [];
      const toolUseBlocks = content.filter(c => c.toolUse);

      if (toolUseBlocks.length > 0) {
        const toolCalls = toolUseBlocks.map(block => ({
          id: block.toolUse.toolUseId,
          name: block.toolUse.name,
          arguments: block.toolUse.input
        }));

        console.log(`[AWS Bedrock] Decision: TOOL_CALL (${toolCalls.length} tool(s) selected by Bedrock model)`);
        toolCalls.forEach(tc => {
          console.log(`  - Bedrock Tool Call: "${tc.name}" with args:`, JSON.stringify(tc.arguments));
        });

        return {
          type: 'tool_call',
          toolCalls
        };
      }

      // Final text answer
      const text = content.map(c => c.text || '').join('\n').trim();
      console.log('[AWS Bedrock] Decision: FINAL_ANSWER (Generated by Bedrock model)');
      return {
        type: 'final_answer',
        text: text || 'Completed mission analysis via Amazon Bedrock.'
      };
    } catch (err) {
      console.warn(`[AWS Bedrock Provider] Converse call failed (${err.message}). Recovering with AutonomousDecisionEngine fallback.`);
      const fallback = await this.getFallbackEngine();
      return fallback.generateDecision({ messages, tools, systemPrompt });
    }
  }
}
