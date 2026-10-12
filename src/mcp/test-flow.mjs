import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ListToolsResultSchema, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

const MCP_URL = process.env.MCP_SERVER_URL || 'http://127.0.0.1:3001/mcp';

async function runTestFlow() {
  console.log('====================================================');
  console.log('REAL MCP STREAMABLE HTTP END-TO-END VERIFICATION');
  console.log('====================================================');
  console.log(`[MCP Client] Connecting to: ${MCP_URL}`);

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  const client = new Client(
    { name: 'alexa-plus-test-client', version: '1.0.0' },
    { capabilities: { roots: {} } }
  );

  try {
    // 1. Connect and initialize protocol session
    console.log('[MCP Client] Establishing Streamable HTTP session...');
    await client.connect(transport);
    console.log(`[MCP Client] Connected! Session ID: ${transport.sessionId}`);

    // 2. Discover tools dynamically via tools/list
    console.log('[MCP Client] Discovering tools via tools/list...');
    const toolsResult = await client.request(
      { method: 'tools/list', params: {} },
      ListToolsResultSchema
    );

    console.log(`[MCP Client] Discovered ${toolsResult.tools.length} tool(s):`);
    for (const tool of toolsResult.tools) {
      console.log(`  - Tool: "${tool.name}" | Description: "${tool.description}"`);
      console.log(`    Input Schema:`, JSON.stringify(tool.inputSchema));
    }

    if (!toolsResult.tools.some(t => t.name === 'ping')) {
      throw new Error('Expected tool "ping" not found in discovered tools!');
    }

    // 3. Invoke real tool with valid arguments
    console.log('\n[MCP Client] Invoking tool "ping" with valid arguments...');
    const startTime = Date.now();
    const callResult = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'ping',
          arguments: { message: 'Real Streamable HTTP Handshake Active' }
        }
      },
      CallToolResultSchema
    );
    const duration = Date.now() - startTime;

    console.log(`[MCP Client] Tool invocation succeeded in ${duration}ms!`);
    console.log('[MCP Client] Structured response content:');
    console.log(JSON.stringify(callResult, null, 2));

    // Verify content text
    const textContent = callResult.content?.find(c => c.type === 'text')?.text;
    if (!textContent || !textContent.includes('pong: Real Streamable HTTP Handshake Active')) {
      throw new Error(`Unexpected result text: ${textContent}`);
    }

    // 4. Test invalid tool arguments to verify runtime schema rejection
    console.log('\n[MCP Client] Testing invalid arguments rejection (schema validation)...');
    let schemaRejected = false;
    try {
      const invalidCallResult = await client.request(
        {
          method: 'tools/call',
          params: {
            name: 'ping',
            arguments: { invalidKey: 12345 } // missing required 'message' string
          }
        },
        CallToolResultSchema
      );
      if (invalidCallResult.isError) {
        schemaRejected = true;
        console.log('SUCCESS: Tool returned error frame for invalid parameters:');
        console.log(JSON.stringify(invalidCallResult, null, 2));
      } else {
        console.error('FAILED: Invalid arguments should have been rejected!');
      }
    } catch (schemaErr) {
      schemaRejected = true;
      console.log('SUCCESS: Invalid arguments rejected with error:', schemaErr.message);
    }

    if (!schemaRejected) {
      throw new Error('Schema validation failed to reject invalid parameters!');
    }

    // 5. Clean disconnect
    console.log('\n[MCP Client] Closing transport cleanly...');
    await transport.close();
    console.log('[MCP Client] Transport closed.');

    console.log('\n====================================================');
    console.log('TEST RESULT: 100% PASSED');
    console.log('Real MCP Client -> Streamable HTTP -> Real MCP Server -> Real Tool -> Structured Result');
    console.log('====================================================');
  } catch (error) {
    console.error('\n[MCP Client] ERROR during test flow:', error);
    try {
      await transport.close();
    } catch {}
    process.exit(1);
  }
}

runTestFlow();
