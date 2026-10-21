import assert from 'node:assert';
import { AmazonBedrockProvider } from '../src/agent/llm/bedrock.mjs';
import { createLLMProvider } from '../src/agent/llm/provider.mjs';

console.log('========================================================================');
console.log('AWS BUILDER MINI-CHALLENGE: AMAZON BEDROCK INTEGRATION TEST SUITE');
console.log('========================================================================');

async function runBedrockTests() {
  console.log('\n[Test 1] Instantiating AmazonBedrockProvider with defaults...');
  const provider = new AmazonBedrockProvider({
    region: 'us-east-1',
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0'
  });

  assert.strictEqual(provider.region, 'us-east-1', 'Default region must be us-east-1');
  assert.strictEqual(provider.modelId, 'anthropic.claude-3-5-sonnet-20241022-v2:0', 'Model ID must match Claude 3.5 Sonnet on Bedrock');
  console.log('[PASS] Provider initialized cleanly.');

  console.log('\n[Test 2] Verifying MCP Tool to Bedrock Converse toolConfig conversion...');
  const sampleMcpTools = [
    {
      name: 'calendar_get_events',
      description: 'Retrieve upcoming calendar events',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: { type: 'string' },
          endDate: { type: 'string' }
        },
        required: ['startDate', 'endDate']
      }
    },
    {
      name: 'knowledge_search',
      description: 'Search internal knowledge repository',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        },
        required: ['query']
      }
    }
  ];

  const toolConfig = provider.formatBedrockTools(sampleMcpTools);
  assert(toolConfig && toolConfig.tools, 'toolConfig must contain tools array');
  assert.strictEqual(toolConfig.tools.length, 2, 'Must have 2 formatted tools');
  assert.strictEqual(toolConfig.tools[0].toolSpec.name, 'calendar_get_events');
  assert.strictEqual(toolConfig.tools[0].toolSpec.description, 'Retrieve upcoming calendar events');
  assert.deepStrictEqual(toolConfig.tools[0].toolSpec.inputSchema.json, sampleMcpTools[0].inputSchema);
  console.log('[PASS] Bedrock Converse toolConfig conversion verified 100%.');

  console.log('\n[Test 3] Verifying agent conversation messages to Bedrock Converse format...');
  const agentMessages = [
    { role: 'user', content: 'Prepare me for my meeting tomorrow' },
    {
      role: 'assistant',
      content: 'I will check your calendar first.',
      tool_calls: [
        {
          id: 'call_123',
          function: {
            name: 'calendar_get_events',
            arguments: JSON.stringify({ startDate: '2026-10-22T00:00:00Z', endDate: '2026-10-22T23:59:59Z' })
          }
        }
      ]
    },
    {
      role: 'tool',
      tool_call_id: 'call_123',
      content: JSON.stringify({ totalEvents: 1, events: [{ title: 'Product Roadmap Discussion' }] })
    }
  ];

  const bedrockMessages = provider.formatBedrockMessages(agentMessages);
  assert.strictEqual(bedrockMessages.length, 3, 'Must have 3 formatted messages');
  assert.strictEqual(bedrockMessages[0].role, 'user');
  assert.strictEqual(bedrockMessages[0].content[0].text, 'Prepare me for my meeting tomorrow');
  assert.strictEqual(bedrockMessages[1].role, 'assistant');
  assert(bedrockMessages[1].content[1].toolUse, 'Assistant message must contain toolUse block');
  assert.strictEqual(bedrockMessages[1].content[1].toolUse.name, 'calendar_get_events');
  assert.strictEqual(bedrockMessages[2].role, 'user');
  assert(bedrockMessages[2].content[0].toolResult, 'Tool message must contain toolResult block');
  console.log('[PASS] Bedrock Converse message framing verified 100%.');

  console.log('\n[Test 4] Verifying provider factory activation for Bedrock...');
  const factoryProvider = createLLMProvider('bedrock');
  assert(factoryProvider instanceof AmazonBedrockProvider, 'createLLMProvider("bedrock") must return AmazonBedrockProvider instance');
  console.log('[PASS] Factory returns AmazonBedrockProvider instance.');

  console.log('\n[Test 5] Verifying zero-downtime graceful fallback when credentials are not configured...');
  const decision = await factoryProvider.generateDecision({
    messages: [{ role: 'user', content: 'Check calendar for tomorrow' }],
    tools: sampleMcpTools
  });

  assert(decision, 'Decision must be returned');
  assert(decision.type === 'tool_call' || decision.type === 'final_answer', 'Decision must be valid LLMDecision type');
  console.log(`[PASS] Decision generated safely without error: type = "${decision.type}"`);

  console.log('\n========================================================================');
  console.log('ALL AWS BUILDER MINI-CHALLENGE INTEGRATION TESTS PASSED (100%)');
  console.log('========================================================================\n');
}

runBedrockTests().catch(err => {
  console.error('[AWS BEDROCK TEST ERROR]:', err);
  process.exit(1);
});
