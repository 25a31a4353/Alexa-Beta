import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ListToolsResultSchema, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

const MCP_URL = process.env.MCP_SERVER_URL || 'http://127.0.0.1:3001/mcp';

async function runCalendarEndToEndTest() {
  console.log('================================================================');
  console.log('ALEXA+ END-TO-END TEST: CALENDAR CAPABILITY OVER STREAMABLE HTTP');
  console.log('================================================================');
  console.log(`[MCP Client] Connecting to: ${MCP_URL}`);

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  const client = new Client(
    { name: 'alexa-plus-calendar-tester', version: '1.0.0' },
    { capabilities: { roots: {} } }
  );

  try {
    // 1. Establish session
    console.log('[Step 1] Initializing Streamable HTTP protocol session...');
    await client.connect(transport);
    console.log(`[Step 1 PASS] Session active: ${transport.sessionId}`);

    // 2. Discover tools
    console.log('\n[Step 2] Discovering tools via tools/list...');
    const toolsResult = await client.request(
      { method: 'tools/list', params: {} },
      ListToolsResultSchema
    );

    console.log(`[Step 2] Discovered ${toolsResult.tools.length} tool(s):`);
    for (const tool of toolsResult.tools) {
      console.log(`  - Tool Name: "${tool.name}"`);
      console.log(`    Description: ${tool.description}`);
    }

    const calendarTool = toolsResult.tools.find(t => t.name === 'calendar_get_events');
    if (!calendarTool) {
      throw new Error('FAILED: "calendar_get_events" was not discovered in the MCP catalog!');
    }
    console.log('[Step 2 PASS] "calendar_get_events" is dynamically registered with full schema.');

    // 3. Invoke calendar_get_events for upcoming meetings
    console.log('\n[Step 3] Invoking "calendar_get_events" for tomorrow\'s time window...');
    const now = new Date();
    const startRange = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endRange = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 23, 59, 59);

    const callResult = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'calendar_get_events',
          arguments: {
            startDate: startRange.toISOString(),
            endDate: endRange.toISOString()
          }
        }
      },
      CallToolResultSchema
    );

    const rawText = callResult.content?.find(c => c.type === 'text')?.text;
    if (!rawText) {
      throw new Error('FAILED: Empty response from calendar_get_events!');
    }

    const parsedData = JSON.parse(rawText);
    console.log('[Step 3] Structured Calendar Response:');
    console.log(JSON.stringify(parsedData, null, 2));

    if (!parsedData.events || parsedData.events.length === 0) {
      throw new Error('FAILED: No events returned from calendar query!');
    }

    const roadmapMeeting = parsedData.events.find(e => e.title === 'Product Roadmap Discussion');
    if (!roadmapMeeting) {
      throw new Error('FAILED: Expected "Product Roadmap Discussion" meeting was not found!');
    }
    console.log(`[Step 3 PASS] Successfully retrieved meeting: "${roadmapMeeting.title}" via "${roadmapMeeting.platform}" with ${roadmapMeeting.attendees.length} attendees.`);

    // 4. Test Query Filter
    console.log('\n[Step 4] Testing search keyword query filter (query: "Sync")...');
    const filteredResult = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'calendar_get_events',
          arguments: {
            startDate: startRange.toISOString(),
            endDate: endRange.toISOString(),
            query: 'Sync'
          }
        }
      },
      CallToolResultSchema
    );

    const filteredData = JSON.parse(filteredResult.content[0].text);
    console.log(`[Step 4] Filter matched ${filteredData.events.length} event(s):`);
    filteredData.events.forEach(e => console.log(`  - Match: "${e.title}"`));
    if (filteredData.events.some(e => !e.title.includes('Sync') && !e.description?.includes('Sync'))) {
      throw new Error('FAILED: Keyword filter returned irrelevant events!');
    }
    console.log('[Step 4 PASS] Keyword search filtering verified.');

    // 5. Test Error Handling: Invalid Date Range
    console.log('\n[Step 5] Testing error handling: startDate after endDate...');
    const invalidRangeResult = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'calendar_get_events',
          arguments: {
            startDate: '2026-10-20T00:00:00Z',
            endDate: '2026-10-10T00:00:00Z'
          }
        }
      },
      CallToolResultSchema
    );

    if (!invalidRangeResult.isError) {
      throw new Error('FAILED: Invalid date range should have returned isError: true!');
    }
    const errorPayload = JSON.parse(invalidRangeResult.content[0].text);
    console.log(`[Step 5 PASS] Server correctly returned structured error: ${errorPayload.error} - ${errorPayload.message}`);

    // 6. Test Error Handling: Schema Rejection for missing required arguments
    console.log('\n[Step 6] Testing Zod schema rejection for missing parameters...');
    let schemaCaught = false;
    try {
      const missingArgResult = await client.request(
        {
          method: 'tools/call',
          params: {
            name: 'calendar_get_events',
            arguments: {} // missing both startDate and endDate
          }
        },
        CallToolResultSchema
      );
      if (missingArgResult.isError) {
        schemaCaught = true;
        console.log('[Step 6 PASS] Missing parameter rejected with structured error frame:', missingArgResult.content[0].text);
      }
    } catch (err) {
      schemaCaught = true;
      console.log('[Step 6 PASS] Missing parameter rejected with MCP error:', err.message);
    }

    if (!schemaCaught) {
      throw new Error('FAILED: Missing required parameters were not rejected!');
    }

    // Clean disconnect
    console.log('\n[Step 7] Closing transport cleanly...');
    await transport.close();
    console.log('[Step 7 PASS] Transport closed.');

    console.log('\n================================================================');
    console.log('ALL TESTS PASSED: First Real Alexa+ Capability (Calendar) Verified!');
    console.log('================================================================');
  } catch (error) {
    console.error('\n[TEST FAILURE]:', error);
    try {
      await transport.close();
    } catch {}
    process.exit(1);
  }
}

runCalendarEndToEndTest();
