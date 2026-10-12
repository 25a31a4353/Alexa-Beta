# System Architecture Specification: Alexa+ Mission Platform

**Specification Version:** 1.0.0-LOCKED  
**Target Environment:** Amazon Developer Hackathon 2026 — Alexa+ Track  
**Protocol Standard:** Model Context Protocol (MCP) 2025-11-25 (Streamable HTTP)

---

## 1. Executive Summary & Architectural Invariant

Alexa+ is a deterministic, verified mission-execution platform designed to decompose complex natural language objectives into verified multi-step real-world outcomes. The system rejects the generic "LLM chatbot" paradigm in favor of a strictly bounded, observable, human-supervised agentic orchestration architecture.

The core architectural invariant is the **Uncompromised Tool Execution Chain**:
```
USER OBJECTIVE
      │
      ▼
WEB APPLICATION (UI Shell & Visualizer)
      │
      ▼ (HTTP / SSE Application Telemetry)
APPLICATION SERVER & ORCHESTRATOR
      │
      ▼ (Protocol Session / Handshake)
REAL MCP CLIENT
      │
      ▼ (Modern Streamable HTTP: http://localhost:3001/mcp)
SELF-HOSTED MCP SERVER
      │
      ▼ (Zod Validation & Execution Sandbox)
DOMAIN TOOLS & SERVICE ADAPTERS
      │
      ▼ (Structured Tool Result JSON)
MCP SERVER ──► MCP CLIENT ──► ORCHESTRATOR
      │
      ▼
VERIFICATION ENGINE (Truth & Conflict Audit)
      │
      ▼
HUMAN-IN-THE-LOOP APPROVAL (Server-Side Enforced Gate)
      │
      ▼
CONSEQUENTIAL ACTION DISPATCH & RE-VERIFICATION
      │
      ▼
FINAL AUDITED MISSION RESULT
```

**Non-Negotiable Guarantees:**
1. **Zero Fake MCP:** Every tool call rendered in the UI originates from a genuine MCP protocol transaction between a compliant MCP Client and MCP Server over Streamable HTTP.
2. **Zero Direct Execution:** The Frontend Web Application has zero network access to domain tools. All execution routes through the Agent Orchestrator and MCP Client.
3. **Server-Side Security Gates:** Consequential actions (mutations, communications, external API writes) cannot be executed by the LLM or client directly; they require cryptographically signed or server-validated approval tokens.
4. **Resilient Persistence:** Every transition, step, tool payload, and approval request is written to an embedded ACID-compliant SQLite datastore before external execution commences.

---

## 2. High-Level Subsystem Boundaries

The system is decomposed into four discrete, loosely coupled subsystems with strict interface contracts:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. WEB APPLICATION (Client Interface & Telemetry Renderer)             │
│    - Global Invariant Shell (8 Sidebar items, Amazon Brand Topbar)    │
│    - Reactive State Consumers (SSE Client, TanStack Query)            │
│    - Interactive JSON Inspector & Telemetry Visualizer                 │
│    - Human Approval Modal & Action Sign-off UI                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Application REST / SSE Events
┌───────────────────────────────────▼────────────────────────────────────┐
│ 2. AGENT ORCHESTRATOR & APPLICATION SERVER                             │
│    - Objective Analyzer & Constraint Extractor                         │
│    - DAG Planner & Dependency Resolver                                 │
│    - Execution State Machine (11 Explicit States)                      │
│    - Verification Subsystem & Conflict Detector                        │
│    - Server-Side Approval Gate Enforcer                                │
│    - SQLite Persistence Engine (WAL Mode)                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ In-Process / HTTP Client Calls
┌───────────────────────────────────▼────────────────────────────────────┐
│ 3. REAL MCP CLIENT                                                     │
│    - Official @modelcontextprotocol/sdk Client Implementation          │
│    - Session Lifecycle & Keep-Alive Manager                            │
│    - Dynamic Tool Discovery (`tools/list`)                             │
│    - Tool Invocation Pipeline (`tools/call`)                           │
│    - Streamable HTTP Transport Client (`StreamableHTTPClientTransport`)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Modern Streamable HTTP Transport
                                    │ (http://localhost:3001/mcp)
┌───────────────────────────────────▼────────────────────────────────────┐
│ 4. SELF-HOSTED MCP SERVER                                              │
│    - Official @modelcontextprotocol/sdk Server Implementation          │
│    - Streamable HTTP Transport Server Adapter                          │
│    - Strict Zod Input/Output Schema Enforcers                          │
│    - Granular Domain Tool Handlers (Knowledge, Calendar, Data, etc.)   │
│    - Sandbox Execution Boundary & Telemetry Logger                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Subsystem Detailed Responsibilities

### Subsystem A: Web Application
* **Responsibilities:**
  * Renders the 9 mandatory visual screens defined in the specification.
  * Maintains the invariant sidebar navigation across all routes.
  * Consumes application-level Server-Sent Events (SSE) from `/api/missions/:id/stream` to update step badges, timers, and live JSON traces.
  * Displays the interactive Approval Modal when an approval is requested by the server.
  * Provides zero mock fallback; displays real network and server states.
* **Prohibitions:**
  * Must never hold the single source of truth for mission state.
  * Must never execute tools directly via local browser APIs.
  * Must never bypass approval checks or fabricate progress counters.

### Subsystem B: Agent Orchestrator & Application Server
* **Responsibilities:**
  * Receives user objectives via `POST /api/missions`.
  * Runs the LLM planning cycle to generate a typed Task Dependency Graph (DAG).
  * Queries the MCP Client to discover registered tools matching task requirements.
  * Executes the Task DAG sequentially or concurrently according to dependency constraints.
  * Halts execution and emits `approval.requested` events when encountering tools flagged with `requiresApproval: true`.
  * Passes all tool outputs through the Verification Engine prior to synthesis.
  * Streams real-time operational events to the UI via SSE.
* **Prohibitions:**
  * Must never invoke domain services directly; all tool interaction MUST traverse the MCP Client.
  * Must never proceed past an unapproved consequential action.

### Subsystem C: Real MCP Client
* **Responsibilities:**
  * Establishes protocol-level session handshakes with the MCP server using `StreamableHTTPClientTransport`.
  * Discovers tools dynamically using the standard `tools/list` RPC protocol method.
  * Transmits tool execution requests using `tools/call`.
  * Captures transport errors, server timeouts, and schema validation rejections.
  * Emits tool-level telemetry (latency, raw input JSON, raw output JSON) to the orchestrator.

### Subsystem D: Self-Hosted MCP Server
* **Responsibilities:**
  * Exposes an HTTP service listening on the configured MCP port (default: `3001`).
  * Implements the MCP 2025-11-25 Streamable HTTP specification supporting chunked SSE transport and message posting.
  * Registers all domain tools with explicit JSON schemas and metadata annotations.
  * Validates every inbound payload against strict Zod definitions before execution.
  * Executes domain capabilities against local data adapters and returns structured results.
