# Model Context Protocol (MCP) Architecture & Transport Specification

**Specification Version:** 2.1.0-LOCKED  
**Target Specification:** Modern Streamable HTTP Transport (MCP 2025-11-25 or later)  
**SDK Package & Version:** Official `@modelcontextprotocol/sdk@1.32.1` (TypeScript)  
**Transport Implementation:** `StreamableHTTPServerTransport` & `StreamableHTTPClientTransport`

---

## 1. Architectural Distinction: Protocol Transport vs. UI Telemetry

A strict architectural separation is enforced between **Protocol Transport** and **Application Telemetry**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ CHANNEL 1: MODERN MCP STREAMABLE HTTP (Internal Protocol Network)      │
│ Target: Process 1 (MCP Client) ◄──► Process 2 (Self-Hosted MCP Server) │
│ Transport: Official StreamableHTTPClientTransport / ServerTransport    │
│ Endpoint: http://localhost:3001/mcp (Single Unified Endpoint)          │
│ Methods: POST /mcp (RPC & init), GET /mcp (SSE stream), DELETE /mcp    │
│ Header: mcp-session-id (Session tracking & resume)                     │
│ Purpose: Protocol-level tool discovery (tools/list) & execution        │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ CHANNEL 2: APPLICATION TELEMETRY SSE (User Presentation Layer)         │
│ Target: Process 1 (Application Server) ◄──► Web Browser (React UI)     │
│ Protocol: Standard HTTP Server-Sent Events (text/event-stream)         │
│ Endpoint: http://localhost:3000/api/missions/:id/stream                │
│ Purpose: Live UI step updates, timers, execution progress, JSON diffs  │
└────────────────────────────────────────────────────────────────────────┘
```

### Critical Protocol Classification: Modern Streamable HTTP vs Legacy HTTP+SSE
* **Legacy HTTP+SSE (Pre-2025):** Required two ad-hoc decoupled endpoints: `GET /sse` (which emitted an endpoint event) and `POST /message?sessionId=...`.
* **Modern Streamable HTTP (2025-11-25 Specification):** Uses a **single unified endpoint** (`/mcp`) managed directly by the official SDK transport abstractions (`StreamableHTTPServerTransport` and `StreamableHTTPClientTransport`). It natively handles initialization, message dispatching, streaming responses, and session deletion on that single endpoint.

---

## 2. Process 2: Self-Hosted MCP Server Architecture

The MCP Server is hosted on **Process 2** as an independent Node.js service (default port: `3001` or `process.env.MCP_PORT`).

### Server Core Architecture
1. **Official Server Factory:** Built using `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`.
2. **Unified Endpoint Routing:**
   The server mounts the official `StreamableHTTPServerTransport` on the single `/mcp` route:
   ```typescript
   import express from 'express';
   import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
   import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

   const app = express();
   app.use(express.json());

   const sessions = new Map<string, StreamableHTTPServerTransport>();

   // POST /mcp: Handles initialization and JSON-RPC message calls
   app.post('/mcp', async (req, res) => {
     const sessionId = req.headers['mcp-session-id'] as string;
     let transport = sessionId ? sessions.get(sessionId) : undefined;

     if (!transport && isInitializeRequest(req.body)) {
       transport = new StreamableHTTPServerTransport({
         sessionIdGenerator: () => randomUUID(),
         onsessioninitialized: (sid) => sessions.set(sid, transport!),
       });
       transport.onclose = () => {
         if (transport?.sessionId) sessions.delete(transport.sessionId);
       };
       await mcpServer.connect(transport);
     } else if (!transport) {
       return res.status(404).json({ jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null });
     }

     await transport.handleRequest(req, res, req.body);
   });

   // GET /mcp: Handles optional long-lived SSE streams for notifications
   app.get('/mcp', async (req, res) => {
     const sessionId = req.headers['mcp-session-id'] as string;
     const transport = sessions.get(sessionId);
     if (!transport) return res.status(400).send('Invalid or missing session ID');
     await transport.handleRequest(req, res);
   });

   // DELETE /mcp: Handles explicit session termination
   app.delete('/mcp', async (req, res) => {
     const sessionId = req.headers['mcp-session-id'] as string;
     const transport = sessions.get(sessionId);
     if (transport) {
       await transport.handleRequest(req, res);
       sessions.delete(sessionId);
     }
   });
   ```

---

## 3. Process 1: Real MCP Client Architecture

The MCP Client resides in **Process 1** (alongside the Application API and Agent Orchestrator).

### Client Connection & Protocol Handshake
* **SDK Transport Class:** `StreamableHTTPClientTransport` from `@modelcontextprotocol/sdk/client/streamableHttp.js`.
* **Client Class:** `Client` from `@modelcontextprotocol/sdk/client/index.js`.
* **Initialization Flow:**
  ```typescript
  import { Client } from '@modelcontextprotocol/sdk/client/index.js';
  import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

  const mcpServerUrl = new URL(process.env.MCP_SERVER_URL || 'http://localhost:3001/mcp');
  const transport = new StreamableHTTPClientTransport(mcpServerUrl);

  const client = new Client(
    { name: 'alexa-plus-orchestrator', version: '1.0.0' },
    { capabilities: { roots: {}, sampling: {} } }
  );

  await client.connect(transport);
  ```

---

## 4. Runtime Tool Discovery & Invocation Flow

To ensure dynamic discovery rather than hardcoded client tool definitions:
1. **Dynamic Capability Discovery (`tools/list`):**
   * Upon startup or orchestrator cycle, the MCP Client invokes:
     ```typescript
     const { tools } = await client.request({ method: 'tools/list', params: {} }, ListToolsResultSchema);
     ```
   * The returned tool schemas, descriptions, and annotations populate the in-memory **Runtime Capability Catalog**.
   * The Agent Orchestrator matches sub-tasks in the DAG against this runtime catalog.
2. **Tool Execution Dispatch (`tools/call`):**
   * The Orchestrator issues tool requests via:
     ```typescript
     const result = await client.request({
       method: 'tools/call',
       params: { name: selectedToolName, arguments: computedArguments }
     }, CallToolResultSchema);
     ```
   * Raw JSON payloads, latency, and outputs are captured and logged to the SQLite `tool_executions` journal.

---

## 5. Transport Resilience & Failure Policies

| Anomaly Class | SDK Behavior | Orchestrator Recovery Action |
| :--- | :--- | :--- |
| **Session Expiration** | Server returns HTTP 404 (`-32001`) | Client creates a fresh `StreamableHTTPClientTransport` session; replays active task without failing the overall mission. |
| **Network Interruption** | Connection reset / timeout | Client retries connection with exponential backoff (1s, 2s, 4s). Mission enters `RECOVERING` state. |
| **Schema Validation Error** | Server returns `isError: true` with Zod issues | Error is passed to the Orchestrator for structured self-repair. |
| **Consequential Action Block** | Server rejects unapproved tool (`E_APPROVAL_REQUIRED`) | Orchestrator halts execution, sets step to `AWAITING_APPROVAL`, and emits approval request to UI. |
