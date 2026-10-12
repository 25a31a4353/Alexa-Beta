import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

const MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3001;
const app = express();

app.use(cors());
app.use(express.json());

import { registerAllTools } from './tools/index.mjs';

// Factory to create configured McpServer instance per session
function createServer() {
  const server = new McpServer({
    name: 'alexa-plus-mcp-server',
    version: '1.0.0'
  });

  // Register modular tools across domains
  registerAllTools(server);

  return server;
}

// Track active sessions: sessionId -> { transport, server, open, lastActive }
const sessions = new Map();

const trackResponse = (session, res) => {
  if (!res.socket || res.destroyed) return;
  session.open++;
  res.on('close', () => {
    session.open--;
    session.lastActive = Date.now();
  });
};

// Periodic session cleanup
setInterval(() => {
  const cutoff = Date.now() - 30 * 60000;
  for (const [sid, { transport, open, lastActive }] of sessions.entries()) {
    if (open === 0 && lastActive < cutoff) {
      transport.close().catch(console.error);
      sessions.delete(sid);
    }
  }
}, 60000).unref();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'alexa-plus-mcp-server',
    port: MCP_PORT,
    endpoint: '/mcp',
    transport: 'Streamable HTTP',
    activeSessions: sessions.size,
    timestamp: new Date().toISOString()
  });
});

// MCP POST endpoint: Initialization and JSON-RPC calls
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  try {
    const session = sessionId ? sessions.get(sessionId) : undefined;
    let transport;

    if (session) {
      transport = session.transport;
      trackResponse(session, res);
    } else if (!sessionId && isInitializeRequest(req.body)) {
      const serverInstance = createServer();

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          console.log(`[MCP Server] Session initialized: ${sid}`);
          sessions.set(sid, {
            transport,
            server: serverInstance,
            open: 0,
            lastActive: Date.now()
          });
        }
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && sessions.has(sid)) {
          console.log(`[MCP Server] Session closed: ${sid}`);
          sessions.delete(sid);
        }
      };

      await serverInstance.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    } else if (sessionId) {
      res.status(404).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Session not found or expired' },
        id: null
      });
      return;
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
        id: null
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('[MCP Server] Error handling POST request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal MCP server error' },
        id: null
      });
    }
  }
});

// MCP GET endpoint: Server-Sent Events stream
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId) {
    res.status(400).send('Missing mcp-session-id header');
    return;
  }
  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Session not found' },
      id: null
    });
    return;
  }
  trackResponse(session, res);
  await session.transport.handleRequest(req, res);
});

// MCP DELETE endpoint: Session termination
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId) {
    res.status(400).send('Missing mcp-session-id header');
    return;
  }
  const session = sessions.get(sessionId);
  if (session) {
    await session.transport.handleRequest(req, res);
    sessions.delete(sessionId);
    res.status(200).send('Session terminated');
  } else {
    res.status(404).send('Session not found');
  }
});

// Start listening
const httpServer = app.listen(MCP_PORT, '127.0.0.1', () => {
  console.log(`[MCP Server] Real Self-Hosted MCP Server running on http://127.0.0.1:${MCP_PORT}/mcp`);
  console.log(`[MCP Server] Health check available at http://127.0.0.1:${MCP_PORT}/health`);
});

// Clean shutdown
process.on('SIGINT', async () => {
  console.log('\n[MCP Server] Shutting down...');
  for (const [sid, { transport }] of sessions) {
    try {
      await transport.close();
    } catch {}
  }
  sessions.clear();
  httpServer.close(() => {
    console.log('[MCP Server] Server stopped cleanly.');
    process.exit(0);
  });
});
