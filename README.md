# Alexa+: Autonomous Mission Execution Platform
### An Alexa+-Inspired Agentic Assistant Powered by Self-Hosted Model Context Protocol (MCP) over Streamable HTTP

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP Spec](https://img.shields.io/badge/MCP%20Spec-2025--11--25%2B%20Streamable%20HTTP-orange)](https://modelcontextprotocol.io)
[![AWS Bedrock](https://img.shields.io/badge/AWS%20Bedrock-Converse%20API-yellow)](https://aws.amazon.com/bedrock/)
[![Test Suite](https://img.shields.io/badge/Tests-17%20Passed%20(100%25)-brightgreen)](tests/)

> **Submission for the Amazon Alexa+ Track**  
> *Build, Ship, Shape: Amazon Developer Hackathon (Devpost)*  
> **Live Production URL:** [https://alexa-beta.onrender.com](https://alexa-beta.onrender.com)  
> **Repository:** [https://github.com/25a31a4353/Alexa-Beta](https://github.com/25a31a4353/Alexa-Beta)  

---

## 1. Executive Summary & Core Narrative

Most conversational assistants are limited to single-turn question-answering or isolated command execution. When presented with a high-level, complex objective—such as preparing for tomorrow's executive product review, locating relevant emails, extracting crucial roadmap documents, identifying unprepared topics, and compiling an actionable checklist—standard chatbots either fabricate information or force the user to manually coordinate every service.

**We built an agentic mission system that turns a high-level objective into a verified sequence of actions across multiple services.**

The Model Context Protocol (MCP) is the underlying enablement mechanism that makes this multi-service orchestration possible. Rather than hardcoding tool behaviors into prompt templates, our autonomous agent dynamically discovers and executes tools exposed by an independent, **self-hosted Model Context Protocol (MCP) Server** operating over **Streamable HTTP** (`:3001/mcp`).

```
"Prepare me for tomorrow's product review."
                      │
                      ▼
            AGENT DETERMINES NEEDS
        [ Calendar + Email + Documents ]
                      │
                      ▼
         INDEPENDENT MCP EXECUTION
  Calendar ──► Gmail ──► Drive ──► Document Analysis
                      │
                      ▼
         SYNTHESIZED MISSION RESULT
 [ Preparation Brief + Decisions + Risks + Action Items + Preparation Gaps ]
```

**The result is grounded in evidence retrieved through the executed MCP tools.**

---

## 2. Dual-Mode Architecture: Live Cloud & Frictionless Evaluation

To accommodate both live cloud integration and frictionless evaluator testing without requiring external API keys, the platform operates in two seamless modes:

```
                           ┌─────────────────────────┐
                           │   AGENT ORCHESTRATOR    │
                           └────────────┬────────────┘
                                        │
                                 POST /mcp (SSE)
                                        │
                                        ▼
                           ┌─────────────────────────┐
                           │  SELF-HOSTED MCP SERVER │
                           │       (:3001/mcp)       │
                           └────────────┬────────────┘
                                        │
                  ┌─────────────────────┴─────────────────────┐
                  │                                           │
         [OAuth Configured?]                         [No External Keys?]
                  │                                           │
                  ▼                                           ▼
       ENTERPRISE LIVE MODE                        TRANSPARENT EVALUATION MODE
  • Google Calendar (Live OAuth)              • Local SQLite Meeting Dataset
  • Gmail Search (Live OAuth)                 • Local Knowledge Documents
  • Google Drive Search (Live OAuth)          • Transparent Source Labeling:
  • Google Docs Text Export (Live OAuth)        "Local MCP Dataset (Unauthenticated)"
  • AES-256-GCM Encrypted Token Storage       • 100% Autonomous Functionality
```

1. **Enterprise Live Mode:**
   - Full OAuth 2.0 authorization with Google Cloud APIs (`Calendar`, `Gmail`, `Drive`).
   - Executes real-time event discovery, mailbox search, Google Drive file search, and live Google Doc body export via Google's `exportView` endpoint.
   - Tokens are secured with AES-256-GCM encryption at rest.

2. **Transparent Evaluation Mode (Zero-Key Frictionless Review):**
   - When external OAuth tokens are not configured, the self-hosted MCP server gracefully falls back to structured local SQLite datasets.
   - Transparently labels evidence sources as `Local MCP Dataset (Unauthenticated Local Fallback)`, preventing any ambiguity or deception.
   - Evaluators can test every single feature, UI workflow, and MCP protocol handshake out-of-the-box without configuring Google or AWS credentials.

---

## 3. System Architecture

```
                             USER
                              │
                              ▼
                ASSISTANT MISSION WORKSPACE
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
          ┌──────────────┼──────────────┼──────────────┐
          ▼              ▼              ▼              ▼
     calendar_get     gmail_         drive_        document_
        events        search         search         analyze
          │              │              │              │
          └──────────────┴──────┬───────┴──────────────┘
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
       LIVE GOOGLE WORKSPACE             LOCAL SQLITE STORE
    (Calendar, Gmail, Drive)             (data/alexa_plus.db)
```

- **Browser Layer:** Communicates strictly with the Application API (`:3000`) via standard HTTP and Server-Sent Events (SSE). It never touches the database or the internal MCP server directly.
- **Agent Orchestrator:** Manages the autonomous 5-stage lifecycle: **Understand $\rightarrow$ Plan $\rightarrow$ Execute MCP Tools $\rightarrow$ Verify $\rightarrow$ Synthesize**.
- **Self-Hosted MCP Server (`:3001/mcp`):** An independent Node.js microservice implementing `@modelcontextprotocol/sdk` (`^1.32.1`) using `StreamableHTTPServerTransport` over modern HTTP.
- **Relational Persistence Store:** Authoritative SQLite database (`better-sqlite3`) tracking conversations, missions, execution traces, document indices, and audit events.

---

## 4. Multi-Service Executable Tool Chain (11 Registered MCP Tools)

The self-hosted MCP server exposes **11 registered domain tools** discovered dynamically via `tools/list`:

| Tool Name | Domain | Capability & Behavior |
| :--- | :--- | :--- |
| **`calendar_get_events`** | Schedule | Retrieves upcoming meetings, agenda summaries, platforms, and attendee rosters within an ISO 8601 temporal window. (Google Calendar — Live OAuth or Local Fallback). |
| **`outlook_calendar_get_events`** | Schedule | Retrieves scheduled meetings and agendas from Microsoft Outlook Calendar via Graph API. |
| **`gmail_search`** | Communication | Searches authenticated inbox threads by query, extracting sender, subject, date, and email snippets. |
| **`gmail_get_message`** | Communication | Fetches specific email body content and metadata for identified thread IDs. |
| **`drive_search`** | Storage | Searches Google Drive for documents matching keywords and file types, returning file metadata and web links. |
| **`drive_get_file`** | Ingestion | Fetches full file content or exports Google Docs (`application/vnd.google-apps.document`) as plain text via the Drive API. |
| **`outlook_search`** | Communication | Searches Microsoft Outlook mailbox messages via Microsoft Graph API. |
| **`outlook_get_message`** | Communication | Fetches specific Outlook email content and thread details. |
| **`document_analyze`** | Analysis | Deeply parses document text to extract key themes, decisions needed, unresolved dependency risks, and preparation gaps. |
| **`knowledge_search`** | Internal Base | Performs keyword and conceptual search across indexed local specification documents and notes. |
| **`ping`** | Diagnostics | Verifies MCP transport health, roundtrip JSON-RPC latency, and server timestamp. |

#### Hero Mission Execution Chain (5 Sequential Operations)
During the hero review mission, the agent independently determines required service domains and executes 5 operations in sequence:
$$\text{calendar\_get\_events} \longrightarrow \text{gmail\_search} \longrightarrow \text{drive\_search} \longrightarrow \text{drive\_get\_file} \longrightarrow \text{document\_analyze}$$

---

## 5. Where MCP is Implemented in Code

This repository contains real, production-grade MCP implementation code:

- [`src/mcp/server.mjs`](src/mcp/server.mjs): Mounts `StreamableHTTPServerTransport` at `/mcp`, handles protocol initialization handshakes, session token generation, and JSON-RPC 2.0 requests.
- [`src/mcp/tools/index.mjs`](src/mcp/tools/index.mjs): Registers tools on the `McpServer` instance using strict Zod schemas for input validation.
- [`src/agent/orchestrator.mjs`](src/agent/orchestrator.mjs): Discovers executable tools dynamically at runtime via `tools/list` over Streamable HTTP and dispatches calls via `tools/call`.
- [`src/web/pages/ToolsPage.tsx`](src/web/pages/ToolsPage.tsx): Interactive in-browser developer surface allowing direct manual testing and execution of raw MCP tools with millisecond latency measurement.
- [`packages/mcp-session-reaper`](packages/mcp-session-reaper): Standalone open-source companion library preventing SSE socket hanging and connection leakage.

---

## 6. Quick Start & Local Reproduction

### Prerequisites
- Node.js (v20+ recommended)
- npm (v9+)

### Installation
```bash
# Clone the repository
git clone https://github.com/25a31a4353/Alexa-Beta.git
cd Alexa-Beta

# Install dependencies
npm install
```

### Run Automated Test Suite (17 Test Suites)
Verify the entire backend, MCP server parity, persistence lifecycle, security controls, AWS Bedrock integration, and session reaper:
```bash
npm test
```
*All 17 test suites execute against the real MCP server and SQLite persistence with 100% pass verification.*

### Single-Command Local Production Server
```bash
# 1. Build TypeScript and Vite web assets
npm run build

# 2. Start unified production runtime
npm start
```
*Access the web application at `http://127.0.0.1:3000` (internal MCP runs on `127.0.0.1:3001/mcp`).*

### Non-Destructive Smoke Verification
```bash
# Verify local production instance
npm run test:smoke

# Or verify live cloud deployment
BASE_URL=https://alexa-beta.onrender.com npm run test:smoke
```

---

## 7. The Hero Demo Workflow

1. Navigate to **Home** (`http://127.0.0.1:3000/#/home` or [Live Deployment](https://alexa-beta.onrender.com)).
2. Submit the mission prompt:
   > *"Prepare me for my Alexa+ product review tomorrow. Check my calendar, find the relevant emails, locate the relevant documents in Drive, identify what I haven't prepared, and create a preparation checklist."*
3. Observe the live **Mission Workspace**:
   - **Understand:** Core objective and temporal scope identified.
   - **Plan:** Dynamic multi-service execution DAG generated.
   - **Use Tools:** Dynamically discovers tools from `:3001/mcp`, executes `calendar_get_events` $\rightarrow$ `gmail_search` $\rightarrow$ `drive_search` $\rightarrow$ `drive_get_file` $\rightarrow$ `document_analyze`.
   - **Verify:** Fuses evidence across calendar, email, and document body text.
   - **Synthesize:** Delivers a complete **Meeting Preparation Brief**, **Decisions Needed**, **Technical Risks**, **Action Items**, and **Preparation Gaps**.
4. Visit the **Tools Page** (`#/tools`) to inspect the self-hosted MCP tools, or test raw execution via the **Interactive MCP Tool Runner**.

---

## 8. Mini-Challenges Qualification

### A. AWS Builder Mini-Challenge (Amazon Bedrock)
- **Service Integrated:** **Amazon Bedrock** via `@aws-sdk/client-bedrock-runtime`.
- **Implementation:** [`src/agent/llm/bedrock.mjs`](src/agent/llm/bedrock.mjs) integrates the AWS Bedrock **`ConverseCommand`** structured tool-calling API, supporting **Anthropic Claude 3.5 Sonnet** (`anthropic.claude-3-5-sonnet-20241022-v2:0`) and **Amazon Nova Pro** (`amazon.nova-pro-v1:0`).
- **Resilient Fallback:** Automatically activates when AWS credentials are provided, and gracefully defaults to the local decision engine if unconfigured.
- **Documentation & Verification:** See [`docs/aws-builder-integration.md`](docs/aws-builder-integration.md) and run `npm run test:bedrock`.

### B. Open Source Mini-Challenge (`mcp-session-reaper`)
- **Standalone Open-Source Project:** [`https://github.com/25a31a4353/mcp-session-reaper`](https://github.com/25a31a4353/mcp-session-reaper) (also packaged locally in [`packages/mcp-session-reaper`](packages/mcp-session-reaper)).
- **License:** Permissive [MIT License](https://github.com/25a31a4353/mcp-session-reaper/blob/main/LICENSE).
- **Problem Solved:** Standalone Express middleware and session scavenger that resolves SSE socket hanging and connection leakage in Streamable HTTP MCP servers.
- **Documentation & Tests:** Includes standalone test suite (`npm run test:reaper`) and full documentation in [`docs/open-source-submission.md`](docs/open-source-submission.md).

---

## 9. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
