import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { getDatabase } from '../src/db/index.mjs';

const API_BASE = 'http://127.0.0.1:3000';
const MCP_URL = 'http://127.0.0.1:3001/mcp';

async function runTest() {
  console.log('========================================================================');
  console.log('STAGE 4: KNOWLEDGE PAGE REALITY & MCP RETRIEVAL TEST');
  console.log('========================================================================\n');

  // Step 1: Confirm real documents exist in SQLite
  console.log('[Step 1] Verifying persisted documents in SQLite database...');
  const db = getDatabase();
  const dbDocs = db.prepare('SELECT id, title, filename, file_type, category, summary, content FROM documents').all();
  assert(dbDocs.length >= 3, `Expected at least 3 documents in SQLite, found ${dbDocs.length}`);
  console.log(`[PASS] Found ${dbDocs.length} persisted documents in SQLite:`);
  dbDocs.forEach(d => console.log(`  - [${d.id}] "${d.title}" (${d.filename}, ${d.file_type}, Cat: ${d.category})`));

  // Step 2: Fetch all documents from Application API (GET /api/knowledge)
  console.log('\n[Step 2] Querying Application API: GET /api/knowledge...');
  const listRes = await fetch(`${API_BASE}/api/knowledge`);
  assert.equal(listRes.status, 200, 'GET /api/knowledge must return HTTP 200');
  const listData = await listRes.json();
  assert.equal(listData.total, dbDocs.length, `Expected ${dbDocs.length} documents from API`);
  assert.equal(listData.documents.length, dbDocs.length);
  console.log(`[PASS] Application API returned ${listData.total} documents matching SQLite count.`);

  // Step 3: Test Document Detail Inspector (GET /api/knowledge/:id)
  console.log('\n[Step 3] Querying Document Detail: GET /api/knowledge/doc-roadmap-01...');
  const docRes = await fetch(`${API_BASE}/api/knowledge/doc-roadmap-01`);
  assert.equal(docRes.status, 200, 'GET /api/knowledge/doc-roadmap-01 must return HTTP 200');
  const docDetail = await docRes.json();
  assert.equal(docDetail.id, 'doc-roadmap-01');
  assert.equal(docDetail.title, 'Q4 Product Roadmap');
  assert(Array.isArray(docDetail.key_insights), 'key_insights must be an array');
  assert(docDetail.key_insights.length > 0, 'key_insights must not be empty');
  assert(Array.isArray(docDetail.action_items), 'action_items must be an array');
  assert(typeof docDetail.content === 'string' && docDetail.content.length > 100, 'content must be present');
  console.log(`[PASS] Document detail verified: ${docDetail.key_insights.length} insights, ${docDetail.action_items.length} action items.`);

  // Step 4: Missing Document Error Handling (GET /api/knowledge/non-existent-999)
  console.log('\n[Step 4] Verifying 404 for non-existent document...');
  const missingRes = await fetch(`${API_BASE}/api/knowledge/doc-non-existent-999`);
  assert.equal(missingRes.status, 404, 'Missing document must return HTTP 404');
  const missingJson = await missingRes.json();
  assert.equal(missingJson.error?.code, 'DOCUMENT_NOT_FOUND');
  console.log(`[PASS] Missing document correctly returned 404: ${missingJson.error.message}`);

  // Step 5: Test real MCP knowledge_search tool directly on :3001
  console.log('\n[Step 5] Calling MCP Server (:3001) tool: knowledge_search...');
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  const mcpClient = new Client({ name: 'stage4-test-client', version: '1.0.0' }, { capabilities: {} });
  await mcpClient.connect(transport);

  const mcpSearchRes = await mcpClient.request(
    {
      method: 'tools/call',
      params: {
        name: 'knowledge_search',
        arguments: {
          query: 'Roadmap',
          category: 'all',
          limit: 5
        }
      }
    },
    CallToolResultSchema
  );
  await transport.close();

  const mcpParsed = JSON.parse(mcpSearchRes.content[0].text);
  assert(mcpParsed.totalFound >= 1, 'MCP knowledge_search should find at least 1 document for "Roadmap"');
  assert(mcpParsed.documents.some(d => d.title.includes('Roadmap')), 'Search results must include Roadmap');
  console.log(`[PASS] Direct MCP knowledge_search returned ${mcpParsed.totalFound} documents.`);
  mcpParsed.documents.forEach(d => {
    console.log(`  - Match: "${d.title}" | Relevance: ${d.relevance} (${d.relevanceScore})`);
  });

  // Step 6: Test Application API knowledge search delegation (GET /api/knowledge?query=Roadmap)
  console.log('\n[Step 6] Testing Application API MCP search delegation: GET /api/knowledge?query=Roadmap...');
  const apiSearchRes = await fetch(`${API_BASE}/api/knowledge?query=Roadmap`);
  assert.equal(apiSearchRes.status, 200, 'Search should return HTTP 200');
  const apiSearchData = await apiSearchRes.json();
  assert(apiSearchData.total >= 1, 'API search should find at least 1 document');
  assert(apiSearchData.documents[0].relevance, 'API search documents must contain relevance metadata from MCP');
  console.log(`[PASS] API search returned ${apiSearchData.total} documents with MCP relevance.`);

  // Step 7: Execute real mission using knowledge_search and verify Activity & SQLite trail
  console.log('\n[Step 7] Executing real Mission requiring knowledge_search...');
  const missionGoal = 'Find project roadmap and specification documents in knowledge repository, extract strategic priorities, and summarize recommendations.';
  const missionRes = await fetch(`${API_BASE}/api/missions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal: missionGoal, sync: true })
  });
  assert(missionRes.status === 200 || missionRes.status === 201, `Mission creation should return HTTP 200 or 201, got ${missionRes.status}`);
  const payload = await missionRes.json();
  const mission = payload.mission || payload;
  assert.equal(mission.status, 'COMPLETED', `Mission must complete, got ${mission.status}`);
  console.log(`[PASS] Mission completed: ${mission.id} in ${mission.duration_ms}ms.`);

  // Step 8: Confirm knowledge_search tool execution was recorded
  console.log('\n[Step 8] Verifying tool execution in SQLite tool_executions table...');
  const toolExecs = db.prepare('SELECT tool_name, status, duration_ms, arguments, output FROM tool_executions WHERE mission_id = ?').all(mission.id);
  const knowledgeExec = toolExecs.find(t => t.tool_name === 'knowledge_search');
  assert(knowledgeExec, 'knowledge_search tool execution must be recorded for this mission');
  assert.equal(knowledgeExec.status, 'COMPLETED', 'knowledge_search execution status must be COMPLETED');
  console.log(`[PASS] Tool execution recorded: tool="${knowledgeExec.tool_name}", status="${knowledgeExec.status}", duration=${knowledgeExec.duration_ms}ms.`);

  // Step 9: Confirm knowledge lifecycle events exist in Activity
  console.log('\n[Step 9] Verifying activity events for knowledge mission in GET /api/activity...');
  const actRes = await fetch(`${API_BASE}/api/activity?limit=30`);
  assert.equal(actRes.status, 200);
  const actData = await actRes.json();
  const missionEvents = actData.events.filter(e => e.mission_id === mission.id);
  assert(missionEvents.length >= 4, `Expected at least 4 activity events for mission, got ${missionEvents.length}`);
  const toolEvent = missionEvents.find(e => e.event_type === 'tool.completed' && e.title.includes('knowledge_search'));
  assert(toolEvent, 'Activity events must include tool.completed for knowledge_search');
  console.log(`[PASS] Activity event logged: "${toolEvent.title}" (${toolEvent.event_type}) at ${toolEvent.created_at}.`);

  console.log('\n========================================================================');
  console.log('ALL STAGE 4 KNOWLEDGE & MCP RETRIEVAL TESTS PASSED (100%)');
  console.log('========================================================================\n');
}

runTest().catch(err => {
  console.error('\n[TEST FAILURE]:', err);
  process.exit(1);
});
