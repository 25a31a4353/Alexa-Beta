# Alexa+ Track Submission: Autonomous Mission Execution Platform
### An Alexa+-Inspired Agentic Assistant Powered by a Self-Hosted MCP Server over Streamable HTTP

> **Submission for the Amazon Alexa+ Hackathon Track**  
> **Repository:** Public Open Source under the [MIT License](LICENSE)  
> **Primary Technology:** Self-Hosted Model Context Protocol (MCP) Server (Spec 2025-11-25+, Streamable HTTP) + Autonomous Multi-Step Agent Orchestrator + SQLite State Persistence + Live SSE Telemetry

---

## 1. What is It & What Problem Does It Solve?

Most conversational assistants are limited to single-turn question-answering or isolated command execution. When given a complex, multi-faceted goal—such as preparing for a critical meeting tomorrow, cross-referencing company roadmaps, and producing an actionable preparation checklist—standard chatbots either hallucinate answers or require the user to manually coordinate every step.

This project delivers an **autonomous, mission-oriented assistant experience built for the Alexa+ track**. Instead of treating tool use as a prompt trick, the system treats tools as first-class capabilities exposed through an official **self-hosted Model Context Protocol (MCP) Server** operating over **Streamable HTTP**.

When given a goal, the system executes an autonomous 5-stage lifecycle:
$$\text{Understand} \longrightarrow \text{Plan} \longrightarrow \text{Discover \& Call MCP Tools} \longrightarrow \text{Verify} \longrightarrow \text{Synthesize}$$

---

## 2. System Architecture

The application strictly separates user-facing interaction, agent decision orchestration, and tool execution boundaries:

```
                            USER
                             │
                             ▼
               SIMULATED ASSISTANT WEB APP
           (React 19 + TypeScript + Tailwind)
                             │
                     HTTP / SSE Streaming
                             │
                             ▼
                    APPLICATION API SERVER
                     (Express on :3000)
                             │
                             ▼
                     AGENT ORCHESTRATOR
                ┌────────────┼────────────┐
                │            │            │
            Understand     Plan        Verify
                │            │            │
                └────────────┼────────────┘
                             │
                      MCP CLIENT LAYER
                             │
                 Streamable HTTP Transport
                      POST /mcp (SSE)
                             │
                             ▼
                    SELF-HOSTED MCP SERVER
                 (:3001/mcp - Spec 2025-11-25+)
                ┌────────────┼────────────┐
                ▼            ▼            ▼
          calendar_get   knowledge_   document_
             events        search      analyze
                │            │            │
                └────────────┼────────────┘
                             │
                             ▼
                     LOCAL PERSISTENCE
               (SQLite: data/alexa_plus.db)
```

- **Browser Layer:** Communicates *only* with the Application API (`:3000`). It never touches SQLite or the MCP Server directly.
- **Orchestrator Layer:** Executes multi-step missions, formulates DAG execution steps, and coordinates state transitions.
- **MCP Server Layer (`:3001/mcp`):** Independent, self-hosted service implementing `@modelcontextprotocol/sdk` (`^1.32.1`) using `StreamableHTTPServerTransport`.
- **Persistence Store (`alexa_plus.db`):** Authoritative SQLite relational database storing missions, execution steps, tool call traces, document indexes, and audit logs.

---

## 3. Where MCP is Actually Used in Code

This repository contains real, production-grade MCP implementation code rather than surface-level mentions:

| Component | File Path | MCP Protocol Function |
| :--- | :--- | :--- |
| **Self-Hosted MCP Server** | [`src/mcp/server.mjs`](src/mcp/server.mjs) | Mounts `StreamableHTTPServerTransport` at `/mcp`, handles protocol initialization handshakes, generates session IDs, and handles JSON-RPC 2.0 requests. |
| **Tool Declarations & Schema** | [`src/mcp/tools/index.mjs`](src/mcp/tools/index.mjs)<br>[`src/mcp/tools/calendar.mjs`](src/mcp/tools/calendar.mjs)<br>[`src/mcp/tools/knowledge.mjs`](src/mcp/tools/knowledge.mjs)<br>[`src/mcp/tools/system.mjs`](src/mcp/tools/system.mjs) | Registers tools on the `McpServer` instance using strict Zod schemas for input validation. |
| **Dynamic MCP Client Discovery** | [`src/agent/orchestrator.mjs`](src/agent/orchestrator.mjs) | Discovers executable capabilities at runtime via JSON-RPC `tools/list` over Streamable HTTP. |
| **MCP Tool Execution Loop** | [`src/agent/orchestrator.mjs`](src/agent/orchestrator.mjs) | Dispatches tool calls via JSON-RPC `tools/call`, logs duration metrics, captures evidence, and feeds output into the next planning step. |
| **Interactive Tool Runner** | [`src/web/pages/ToolsPage.tsx`](src/web/pages/ToolsPage.tsx)<br>[`src/api/server.mjs`](src/api/server.mjs) | In-browser developer surface allowing direct manual testing and execution of MCP tools with live JSON-RPC latency and response payload display. |

---

## 4. Executable MCP Tools Catalog

The self-hosted MCP server exposes four registered, executable tools:

1. **`calendar_get_events`**
   - **Domain:** External Services
   - **Capability:** Retrieves upcoming meetings, agenda summaries, platforms, and attendee rosters within an ISO 8601 temporal window.
   - **Arguments:** `{ startDate: string, endDate: string, query?: string }`
2. **`knowledge_search`**
   - **Domain:** Knowledge Base
   - **Capability:** Searches indexed technical specifications, roadmap documents, and strategy notes using keyword and conceptual matching.
   - **Arguments:** `{ query: string, category?: string, limit?: number }`
3. **`document_analyze`**
   - **Domain:** Knowledge Base
   - **Capability:** Deeply inspects specified document IDs to extract decisions, action items, dependency risks, and meeting preparation gaps.
   - **Arguments:** `{ documentIds: string[], analysisType?: string, focus?: string[] }`
4. **`ping`**
   - **Domain:** System Diagnostics
   - **Capability:** Verifies MCP transport health, roundtrip JSON-RPC connectivity, and server timestamp.
   - **Arguments:** `{ message?: string }`

---

## 5. Honest Capability Model: Real vs. Simulated

To preserve technical integrity and ensure judges have complete transparency into the runtime:

- **100% Real & Production Grounded:**
  - Self-hosted MCP Server (`spec 2025-11-25+`) operating over Streamable HTTP.
  - JSON-RPC 2.0 protocol exchange (`tools/list`, `tools/call`).
  - Dynamic discovery and autonomous execution by the Agent Orchestrator.
  - SQLite persistence schema (`missions`, `conversations`, `tool_executions`, `activity_events`, `documents`, `integrations`).
  - Server-Sent Events (SSE) streaming live progress events to the browser workspace.
  - Interactive MCP Tool Runner executing raw calls over `:3001/mcp`.
  - Document attachment and SQLite indexing engine.
- **Simulated / Local Datasets:**
  - **Calendar Data:** Uses a structured, local SQLite dataset reflecting enterprise meeting scenarios rather than live third-party Google/Microsoft OAuth connections.
  - **Knowledge Documents:** Technical roadmaps and specification documents are indexed in SQLite rather than connected via live Google Drive/Notion enterprise APIs.
  - **Status Classification:** The Integrations view explicitly labels integrations as `DEMO` or `NOT_CONNECTED`, maintaining full honesty without fabricating third-party connection states.

---

## 6. Quick Start & Verification

### Prerequisites
- Node.js (v20+ recommended)
- npm (v9+)

### Installation
```bash
# Clone the repository
git clone https://github.com/<your-username>/alexa-plus.git
cd alexa-plus

# Install dependencies
npm install
```

### Run Automated Test Suite (17 Test Suites)
Verify the entire backend, MCP server parity, persistence lifecycle, hostile stress tests, AWS Bedrock integration, and MCP session reaper:
```bash
npm test
```
*All 17 test suites run against the real MCP server and SQLite persistence with 100% pass verification.*

---

## 7. Production Deployment (Render Free Web Service)

The platform is engineered for single-command production deployment on cloud web services such as **Render**.

### Unified Production Architecture
In production, a single container hosts both the internal MCP server and the public Application API:
- **Public Express Server:** Listens on `0.0.0.0:$PORT` (automatically injected by Render) and serves both the compiled React/Vite web application and all API endpoints.
- **Internal MCP Server:** Listens privately on `127.0.0.1:3001/mcp` over Streamable HTTP. It is never exposed directly to the public internet.
- **Client Communication:** The browser communicates strictly with same-origin relative URLs (`/api/...`, `/health`, `/api/events/stream`).

### Render Configuration Values
| Parameter | Value |
| :--- | :--- |
| **Service Type** | Web Service |
| **Environment / Runtime** | Node (>= 20.x) |
| **Plan** | Free |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/health` |

A preconfigured [`render.yaml`](render.yaml) blueprint is included in the root directory for automated zero-configuration deployment.

### Single-Command Local Production Run
```bash
# 1. Compile TypeScript types & Vite web bundle
npm run build

# 2. Start unified production runtime
npm start
```
*Starts internal MCP on `127.0.0.1:3001` and public web application on `http://0.0.0.0:3000`.*

### Deployment Smoke Test
Verify a local or live cloud deployment with the non-destructive smoke suite:
```bash
# Verify local production instance
npm run test:smoke

# Verify public deployed instance
BASE_URL=https://your-alexa-plus.onrender.com npm run test:smoke
```

### Important Cloud Ephemeral Storage Disclosure
> [!IMPORTANT]
> **Ephemeral Filesystem on Render Free:** Render Free instances use an ephemeral filesystem that resets upon spin-down or redeployment. The platform is designed to be **100% reproducible**: when the SQLite database does not exist, `src/db/index.mjs` automatically generates the schema and seeds the complete demo knowledge base and tomorrow's calendar schedule relative to the current runtime date. No pre-existing local machine state or database files are required.

### Local Multi-Process Development Setup (Optional)
If you prefer developing with live Vite HMR across separate terminals:
```bash
# Terminal 1: Start Self-Hosted MCP Server (Port 3001)
npm run mcp:server

# Terminal 2: Start Application API & Agent Orchestrator (Port 3000)
npm run api:server

# Terminal 3: Start Vite Dev Server (Port 5173)
npm run dev
```

---

## 8. The Hero Demo Workflow

1. Navigate to **Home** (`http://127.0.0.1:5173/#/home`).
2. Select the **Deep Research** or **Autonomous** execution mode.
3. Submit the mission prompt:
   > *"I have an important meeting tomorrow. Check my calendar, understand what the meeting is about, find relevant documents, determine what I haven't prepared, prepare a checklist, and tell me what I need to do."*
4. Watch the live **Mission Workspace** execute in real time:
   - **Understand:** Objective and temporal constraints parsed.
   - **Plan:** 4-step execution DAG created.
   - **Use Tools:** Dynamically discovers tools from `:3001/mcp`, calls `calendar_get_events`, executes `knowledge_search`, and calls `document_analyze`.
   - **Verify:** Validates findings against evidence.
   - **Result:** Produces a structured executive preparation briefing and actionable checklist.
5. Click into the **Tools Page** (`#/tools`) to inspect the self-hosted MCP tools, or test raw execution via the **Interactive MCP Tool Runner**.

---

## 9. Hackathon Window Development Disclosure

All agent orchestration algorithms, Streamable HTTP MCP server modules, SQLite persistence schemas, SSE streaming pipelines, and React frontend views were designed and implemented specifically during the hackathon submission window.

---

## 10. Mini-Challenges Qualification

### A. AWS Builder Mini-Challenge (Amazon Bedrock)
- **Service Integrated:** **Amazon Bedrock** via `@aws-sdk/client-bedrock-runtime`.
- **Implementation:** [`src/agent/llm/bedrock.mjs`](src/agent/llm/bedrock.mjs) integrates the AWS Bedrock **`ConverseCommand`** structured tool-calling API, supporting **Anthropic Claude 3.5 Sonnet** (`anthropic.claude-3-5-sonnet-20241022-v2:0`) and **Amazon Nova Pro** (`amazon.nova-pro-v1:0`).
- **Resilient Fallback:** Automatically activates when AWS credentials are provided, and gracefully defaults to the local decision engine if unconfigured.
- **Documentation & Verification:** See [`docs/aws-builder-integration.md`](docs/aws-builder-integration.md) and run `npm run test:bedrock`.

### B. Open Source Mini-Challenge (`mcp-session-reaper`)
- **Open-Source Companion Project:** [`packages/mcp-session-reaper`](packages/mcp-session-reaper) published under the [MIT License](packages/mcp-session-reaper/LICENSE).
- **Problem Solved:** Standalone Express middleware and session scavenger that resolves SSE socket hanging and connection leakage in Streamable HTTP MCP servers.
- **Documentation & Tests:** Includes standalone test suite (`npm run test:reaper`) and full documentation in [`docs/open-source-submission.md`](docs/open-source-submission.md).

---

## 11. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
