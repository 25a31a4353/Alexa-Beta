import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMCPClient } from '../src/api/server.mjs';
import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMcpToolsParityTest() {
  console.log('========================================================================');
  console.log('STAGE 2: REAL MCP TOOLS PARITY & CONTRACT VERIFICATION TEST');
  console.log('========================================================================');

  const API_PORT = 3000;
  const baseUrl = `http://127.0.0.1:${API_PORT}`;

  // ---------------------------------------------------------------------------
  // STEP 1: Interrogate Real MCP Server directly via tools/list
  // ---------------------------------------------------------------------------
  console.log('\n[Step 1] Interrogating MCP Server (:3001) directly via tools/list...');
  let clientSession = null;
  let directMcpTools = [];
  try {
    clientSession = await createMCPClient();
    const result = await clientSession.client.request(
      { method: 'tools/list', params: {} },
      ListToolsResultSchema
    );
    directMcpTools = result.tools || [];
  } finally {
    if (clientSession?.transport) {
      try { await clientSession.transport.close(); } catch {}
    }
  }

  console.log(`[PASS] MCP Server returned ${directMcpTools.length} authoritative tools:`);
  directMcpTools.forEach(t => console.log(`  - ${t.name}: ${t.description.substring(0, 70)}...`));

  // ---------------------------------------------------------------------------
  // STEP 2: Fetch Tools from Application API (GET /api/tools)
  // ---------------------------------------------------------------------------
  console.log('\n[Step 2] Fetching tools from Application API (GET /api/tools)...');
  const apiRes = await fetch(`${baseUrl}/api/tools`);
  if (!apiRes.ok) throw new Error(`GET /api/tools failed: HTTP ${apiRes.status}`);
  const apiData = await apiRes.json();

  console.log(`[PASS] Application API returned ${apiData.total} tools:`);
  apiData.tools.forEach(t => console.log(`  - [${t.domain}] ${t.name}`));

  // ---------------------------------------------------------------------------
  // STEP 3: Verify 1-to-1 Parity between Direct MCP and API
  // ---------------------------------------------------------------------------
  console.log('\n[Step 3] Verifying exact 1-to-1 parity between MCP and API...');
  if (directMcpTools.length !== apiData.tools.length) {
    throw new Error(`[FAIL] Tool count mismatch: MCP has ${directMcpTools.length}, API returned ${apiData.tools.length}`);
  }

  const directNames = directMcpTools.map(t => t.name).sort();
  const apiNames = apiData.tools.map(t => t.name).sort();

  for (let i = 0; i < directNames.length; i++) {
    if (directNames[i] !== apiNames[i]) {
      throw new Error(`[FAIL] Tool mismatch at index ${i}: MCP="${directNames[i]}" vs API="${apiNames[i]}"`);
    }
  }
  console.log(`[PASS] Perfect tool parity confirmed: [${apiNames.join(', ')}]`);

  // ---------------------------------------------------------------------------
  // STEP 4: Code Audit — Verify ToolsPage.tsx contains NO hardcoded ALL_TOOLS
  // ---------------------------------------------------------------------------
  console.log('\n[Step 4] Auditing src/web/pages/ToolsPage.tsx for static authoritative tools...');
  const toolsPagePath = path.resolve(__dirname, '../src/web/pages/ToolsPage.tsx');
  const toolsPageContent = fs.readFileSync(toolsPagePath, 'utf8');

  if (toolsPageContent.includes('ALL_TOOLS')) {
    throw new Error('[FAIL] ToolsPage.tsx still contains static ALL_TOOLS array!');
  }
  if (!toolsPageContent.includes('listTools()') && !toolsPageContent.includes('listTools')) {
    throw new Error('[FAIL] ToolsPage.tsx does not call listTools() API client!');
  }
  console.log('[PASS] Verified: ToolsPage.tsx uses dynamic listTools() and has no ALL_TOOLS array.');

  // ---------------------------------------------------------------------------
  // STEP 5: Verify Authoritative Tools Exist dynamically
  // ---------------------------------------------------------------------------
  console.log('\n[Step 5] Checking authoritative tool registry...');
  const expectedTools = [
    'calendar_get_events',
    'outlook_calendar_get_events',
    'gmail_search',
    'gmail_get_message',
    'drive_search',
    'drive_get_file',
    'outlook_search',
    'outlook_get_message',
    'knowledge_search',
    'document_analyze',
    'ping'
  ];
  for (const expected of expectedTools) {
    if (!apiNames.includes(expected)) {
      throw new Error(`[FAIL] Expected MCP tool missing: "${expected}"`);
    }
  }
  if (apiNames.length < 11) {
    throw new Error(`[FAIL] Expected at least 11 executable tools, got: ${apiNames.length}`);
  }
  console.log(`[PASS] All ${apiNames.length} authoritative tools registered and verified.`);

  console.log('\n========================================================================');
  console.log('ALL MCP TOOLS PARITY TESTS PASSED (100%)');
  console.log('========================================================================');
}

runMcpToolsParityTest().catch((err) => {
  console.error('\n[MCP TOOLS PARITY TEST FAILED]:', err);
  process.exit(1);
});
