import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ListToolsResultSchema, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

const MCP_URL = process.env.MCP_SERVER_URL || 'http://127.0.0.1:3001/mcp';

async function runMultiToolChainWorkflow() {
  console.log('================================================================');
  console.log('ALEXA+ WORKFLOW: PREPARE ME FOR PRODUCT ROADMAP DISCUSSION');
  console.log('MULTI-TOOL CHAIN: Calendar -> Knowledge Search -> Document Analysis');
  console.log('================================================================');
  console.log(`[MCP Client] Connecting to: ${MCP_URL}`);

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  const client = new Client(
    { name: 'alexa-plus-workflow-orchestrator', version: '1.0.0' },
    { capabilities: { roots: {} } }
  );

  try {
    // Step 0: Establish session and discover tools
    console.log('\n[Step 0] Initializing Streamable HTTP protocol session...');
    await client.connect(transport);
    console.log(`[Step 0 PASS] Protocol Session Active: ${transport.sessionId}`);

    console.log('[Step 0] Querying tools/list for available capabilities...');
    const toolsList = await client.request({ method: 'tools/list', params: {} }, ListToolsResultSchema);
    console.log(`[Step 0 PASS] Discovered ${toolsList.tools.length} tools:`);
    toolsList.tools.forEach(t => console.log(`  - ${t.name}: ${t.description}`));

    // =========================================================================
    // STEP 1: Query Calendar for Tomorrow's Schedule
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('[STEP 1: CALENDAR DISCOVERY]');
    console.log('Prompt Context: "Prepare me for my Product Roadmap Discussion tomorrow"');
    console.log('Action: Calling calendar_get_events to discover tomorrow\'s meeting details...');
    console.log('----------------------------------------------------------------');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startWindow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
    const endWindow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

    const calendarResponse = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'calendar_get_events',
          arguments: {
            startDate: startWindow.toISOString(),
            endDate: endWindow.toISOString(),
            query: 'Product Roadmap'
          }
        }
      },
      CallToolResultSchema
    );

    const calendarData = JSON.parse(calendarResponse.content[0].text);
    console.log('[Step 1 Output] Calendar Events Discovered:');
    console.log(JSON.stringify(calendarData, null, 2));

    const meeting = calendarData.events?.[0];
    if (!meeting) {
      throw new Error('FAILED: No meeting found matching "Product Roadmap"!');
    }

    console.log(`\n[Workflow State] Discovered Target Meeting:`);
    console.log(`  - Title: "${meeting.title}"`);
    console.log(`  - Time: ${meeting.startTime} to ${meeting.endTime}`);
    console.log(`  - Platform: ${meeting.platform}`);
    console.log(`  - Attendees: ${meeting.attendees.join(', ')}`);
    console.log(`  - Description: "${meeting.description}"`);

    // =========================================================================
    // STEP 2: Knowledge Search for Relevant Documents
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('[STEP 2: KNOWLEDGE SEARCH]');
    console.log(`Action: Calling knowledge_search with extracted topic "${meeting.title}"...`);
    console.log('----------------------------------------------------------------');

    const searchResponse = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'knowledge_search',
          arguments: {
            query: 'Product Roadmap',
            category: 'all',
            limit: 5
          }
        }
      },
      CallToolResultSchema
    );

    const searchData = JSON.parse(searchResponse.content[0].text);
    console.log('[Step 2 Output] Knowledge Search Results:');
    console.log(JSON.stringify(searchData, null, 2));

    if (!searchData.documents || searchData.documents.length === 0) {
      throw new Error('FAILED: No documents found for "Product Roadmap"!');
    }

    const primaryDoc = searchData.documents[0];
    console.log(`\n[Workflow State] Selected Primary Document:`);
    console.log(`  - Document ID: ${primaryDoc.documentId}`);
    console.log(`  - Title: ${primaryDoc.title} (${primaryDoc.filename})`);
    console.log(`  - Relevance: ${primaryDoc.relevance} (score: ${primaryDoc.relevanceScore})`);
    console.log(`  - Snippet: "${primaryDoc.snippet}"`);

    // =========================================================================
    // STEP 3: Deep Document Analysis
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('[STEP 3: DEEP DOCUMENT ANALYSIS]');
    console.log(`Action: Calling document_analyze for [${primaryDoc.documentId}] with focus on decisions, action items, risks...`);
    console.log('----------------------------------------------------------------');

    const analysisResponse = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'document_analyze',
          arguments: {
            documentIds: [primaryDoc.documentId],
            analysisType: 'all',
            focus: ['decisions', 'action_items', 'risks', 'preparation_gaps']
          }
        }
      },
      CallToolResultSchema
    );

    const analysisData = JSON.parse(analysisResponse.content[0].text);
    console.log('[Step 3 Output] Deep Document Analysis Results:');
    console.log(JSON.stringify(analysisData, null, 2));

    // Assert key analysis elements
    if (!analysisData.key_topics || analysisData.key_topics.length === 0) {
      throw new Error('FAILED: Missing key_topics in analysis!');
    }
    if (!analysisData.decisions_needed || analysisData.decisions_needed.length === 0) {
      throw new Error('FAILED: Missing decisions_needed in analysis!');
    }
    if (!analysisData.action_items || analysisData.action_items.length === 0) {
      throw new Error('FAILED: Missing action_items in analysis!');
    }
    if (!analysisData.risks || analysisData.risks.length === 0) {
      throw new Error('FAILED: Missing risks in analysis!');
    }

    // =========================================================================
    // FINAL SYNTHESIS: The Actionable Meeting Preparation Brief
    // =========================================================================
    console.log('\n================================================================');
    console.log('FINAL SYNTHESIS: ACTIONABLE MEETING PREPARATION BRIEF');
    console.log('================================================================');
    console.log(`MEETING: ${meeting.title}`);
    console.log(`SCHEDULE: Tomorrow at 10:00 AM via ${meeting.platform}`);
    console.log(`ATTENDEES: ${meeting.attendees.join(', ')}`);
    console.log(`PRIMARY SOURCE: ${primaryDoc.title} (${primaryDoc.filename})\n`);

    console.log('KEY TOPICS:');
    analysisData.key_topics.forEach(t => console.log(`  • ${t}`));

    console.log('\nDECISIONS YOU MUST PREPARE FOR:');
    analysisData.decisions_needed.forEach(d => console.log(`  ❓ ${d}`));

    console.log('\nIDENTIFIED RISKS:');
    analysisData.risks.forEach(r => console.log(`  ⚠️  ${r}`));

    console.log('\nPREPARATION RECOMMENDATIONS:');
    analysisData.recommendations_for_user.forEach(rec => console.log(`  ✅ ${rec}`));

    // Clean disconnect
    await transport.close();
    console.log('\n[PASS] Multi-tool chain successfully completed with real MCP protocol communication.');
    console.log('================================================================');
  } catch (error) {
    console.error('\n[WORKFLOW ERROR]:', error);
    try {
      await transport.close();
    } catch {}
    process.exit(1);
  }
}

runMultiToolChainWorkflow();
