/**
 * Alexa+ Unified Production Entrypoint
 * 
 * Orchestrates the complete runtime for Render / Public Cloud deployment:
 * 1. Starts the internal Model Context Protocol (MCP) server on 127.0.0.1:3001
 * 2. Verifies internal MCP transport health via /health probe
 * 3. Starts the public Application API and Vite production frontend on 0.0.0.0:$PORT
 * 4. Ensures zero-downtime coordinated lifecycle & clean process teardown
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3001;
const HOST = process.env.HOST || '0.0.0.0';

console.log('========================================================================');
console.log('Starting Alexa+ Agentic Mission Platform');
console.log(`Public Target : http://${HOST}:${PORT}`);
console.log(`Internal MCP  : http://127.0.0.1:${MCP_PORT}/mcp (Streamable HTTP)`);
console.log('========================================================================');

let mcpProcess = null;
let apiProcess = null;
let isShuttingDown = false;

function cleanShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[Alexa+ Orchestrator] Received ${signal}. Coordinated shutdown initiated...`);

  if (apiProcess) {
    try { apiProcess.kill('SIGTERM'); } catch {}
  }
  if (mcpProcess) {
    try { mcpProcess.kill('SIGTERM'); } catch {}
  }

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

process.on('SIGTERM', () => cleanShutdown('SIGTERM'));
process.on('SIGINT', () => cleanShutdown('SIGINT'));

// Step 1: Start internal self-hosted MCP server
const mcpServerPath = path.resolve(__dirname, 'mcp/server.mjs');
mcpProcess = spawn(process.execPath, [mcpServerPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    MCP_PORT: String(MCP_PORT)
  }
});

mcpProcess.on('exit', (code, signal) => {
  if (!isShuttingDown) {
    console.error(`[MCP Server Process] Exited unexpectedly (code: ${code}, signal: ${signal})`);
    cleanShutdown('MCP_EXIT');
  }
});

// Step 2: Poll until MCP server reports healthy
async function waitForMcp(maxAttempts = 40) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${MCP_PORT}/health`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        console.log(`[Alexa+ Orchestrator] Internal MCP Server confirmed healthy on :${MCP_PORT}.`);
        return true;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Internal MCP Server failed to become healthy on port ${MCP_PORT} within timeout.`);
}

// Step 3: Start public Application API & Static Web Server
try {
  await waitForMcp();

  const apiServerPath = path.resolve(__dirname, 'api/server.mjs');
  apiProcess = spawn(process.execPath, [apiServerPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(PORT),
      HOST: HOST,
      MCP_SERVER_URL: `http://127.0.0.1:${MCP_PORT}/mcp`
    }
  });

  apiProcess.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      console.error(`[Application API Process] Exited unexpectedly (code: ${code}, signal: ${signal})`);
      cleanShutdown('API_EXIT');
    }
  });
} catch (err) {
  console.error('[Alexa+ Orchestrator] Fatal startup error:', err.message);
  cleanShutdown('STARTUP_ERROR');
}
