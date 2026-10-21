# Devpost Submission Package: Alexa+ Track
### Autonomous Mission Execution Platform via Self-Hosted MCP (Streamable HTTP)

---

## 1. Devpost Form Submission Fields

### Project Title
**Autonomous Mission Execution Platform: An Alexa+-Inspired Assistant Powered by Self-Hosted MCP**

### Elevator Pitch (140 characters)
*An autonomous agentic assistant built for the Alexa+ track, using self-hosted MCP over Streamable HTTP to plan, execute, and verify real goals.*

### Project Description: What It Does
Most digital assistants are limited to answering simple questions or running one-off commands. When a user presents a high-level, complex objective—such as preparing for tomorrow's executive roadmap review, finding relevant background documents, identifying unresolved dependencies, and building an actionable checklist—standard chatbots either hallucinate or force the user to manually coordinate every step.

Our project builds an **autonomous, agentic assistant experience for the Alexa+ track**. Rather than hardcoding tool behaviors into the prompt, the agent coordinates with an independent, **self-hosted Model Context Protocol (MCP) Server** running over **Streamable HTTP**. 

When given a complex goal, the system executes an autonomous 5-stage lifecycle:
1. **Understand:** Analyzes the natural language prompt, extracts core objectives, and identifies constraints.
2. **Plan:** Decomposes the goal into a structured multi-step directed acyclic graph (DAG).
3. **Discover & Call MCP Tools:** Discovers available tools dynamically via `tools/list` and executes them via `tools/call` over Streamable HTTP (`:3001/mcp`).
4. **Verify:** Validates conclusions against real tool evidence.
5. **Synthesize:** Produces a structured briefing and actionable checklist grounded in facts.

All execution state is persisted in an authoritative SQLite database, and real-time telemetry is streamed to the browser via Server-Sent Events (SSE).

---

### How We Built It
- **Model Context Protocol (MCP):** Implemented a self-hosted MCP server using `@modelcontextprotocol/sdk` (`^1.32.1`) over **Streamable HTTP** (`:3001/mcp`, spec `2025-11-25+`), exposing `calendar_get_events`, `knowledge_search`, `document_analyze`, and `ping`.
- **Agent Orchestrator:** Dynamic capability discovery via `tools/list`, parameter validation via Zod schemas, step-by-step DAG execution, and self-correcting error handling.
- **Persistence & Audit Trail:** Relational SQLite database (`better-sqlite3`) tracking conversations, missions, tool execution logs, and lifecycle events.
- **Simulated Assistant Web UI:** React 19 + TypeScript + Tailwind CSS delivering a live Mission Workspace, interactive MCP Tool Runner, knowledge manager, and activity history.
- **Verification:** 14 automated test suites verifying end-to-end mission lifecycles, MCP parity, concurrency isolation, and failure recovery.

---

### Honest Capability Disclosure: What is Real vs. Simulated
- **Real:** Self-hosted MCP server, Streamable HTTP protocol handshake, dynamic `tools/list` discovery, `tools/call` execution, multi-step planning loop, SQLite persistence, SSE live streaming, and interactive developer tool runner.
- **Simulated/Local Data:** Calendar events and knowledge documents are stored in local SQLite tables reflecting enterprise meeting scenarios, rather than live third-party Google/Microsoft OAuth connections. The Integrations view honestly classifies integrations as `DEMO` or `NOT_CONNECTED`.

---

### Challenges We Ran Into
- Managing Streamable HTTP session lifecycles across long-lived SSE connections and client reconnects in Node.js.
- Ensuring zero cross-talk between concurrent agent missions executing simultaneously against the same MCP server instance.
- Designing an honest, transparent UI that clearly distinguishes between genuine connected capabilities and local demo datasets.

---

### Accomplishments We're Proud Of
- A 100% compliant, self-hosted MCP server running over the modern Streamable HTTP transport.
- The Interactive MCP Tool Runner, allowing judges to test raw MCP JSON-RPC calls with millisecond execution latency display.
- An autonomous multi-step planning loop that produces fact-grounded results without hallucinating tool outputs.
- 14 hostile automated test suites passing with a 100% success rate.

---

## 2. Under-3-Minute Video Demo Script (Word-for-Word Guide)

### Target Duration: ~2 Minutes 45 Seconds

---

#### Act I: The Problem & The Mission (0:00 – 0:35)
- **Screen:** Home Page (`http://127.0.0.1:5173/#/home`).
- **Visual:** Cursor hovers over the prompt box showing capability pills and execution mode selector.
- **Audio / Narration:**
  > *"Most assistants are good at answering simple questions. Our problem is different: real-world tasks require understanding a goal, coordinating multiple tools, tracking execution, and verifying the result.  
  > We built an agentic assistant experience for the Alexa+ track that does exactly that.  
  > Let's give it a real task:  
  > 'I have an important meeting tomorrow. Check my calendar, understand what the meeting is about, find relevant documents, determine what I haven't prepared, prepare a checklist, and tell me what I need to do.'  
  > We select Deep Research mode and submit."*

---

#### Act II: Autonomous Agent Execution (0:35 – 1:20)
- **Screen:** Live Mission Workspace (`#/missions/...`).
- **Visual:** Real-time SSE timeline steps through: Understand → Plan → Use Tools. Tool cards light up: `calendar_get_events` → `knowledge_search` → `document_analyze`.
- **Audio / Narration:**
  > *"The agent first understands the goal and decomposes it into a multi-step execution plan.  
  > Watch the tools stage: the agent connects to our self-hosted Model Context Protocol server over Streamable HTTP.  
  > It calls `calendar_get_events` to retrieve tomorrow's schedule and discovers a 'Product Roadmap Discussion'.  
  > Next, it calls `knowledge_search` to find internal specifications and the Q4 roadmap document.  
  > Finally, it invokes `document_analyze` to extract decisions, action items, and unaddressed risks."*

---

#### Act III: Technical Proof of Self-Hosted MCP (1:20 – 1:40)
- **Screen:** Tools Page (`#/tools`) → Click "Use" on `knowledge_search` to open the Interactive Tool Runner.
- **Visual:** Show the tool modal with JSON arguments, click "Execute Tool Now", show live execution terminal with ms latency.
- **Audio / Narration:**
  > *"These capabilities are not hardcoded into the browser. Let's look at the Tools page.  
  > The application discovers these tools dynamically from our self-hosted MCP server through `tools/list`, and executes them through `tools/call` over Streamable HTTP.  
  > Here in the interactive tool runner, we can execute any tool directly and see the raw JSON-RPC response in real time."*

---

#### Act IV: Verification & Grounded Results (1:40 – 2:15)
- **Screen:** Back to Mission Workspace → Verification Stage & Results Summary.
- **Visual:** Scroll through the verified preparation briefing and actionable checklist.
- **Audio / Narration:**
  > *"Back in our mission workspace, the agent enters the verification stage, validating every conclusion against the collected tool evidence before synthesizing the final result.  
  > Notice the output: it identifies the meeting topic, summarizes what we know from the Q4 roadmap, highlights what is missing—like finalized KPI numbers and implementation timelines—and delivers an actionable preparation checklist.  
  > This is actual value, not a superficial chat response."*

---

#### Act V: Architecture & Closing (2:15 – 2:45)
- **Screen:** Architecture Diagram / Activity Page showing SQLite audit log.
- **Visual:** Show the historical timeline of events, tool execution records, and clean architecture.
- **Audio / Narration:**
  > *"Under the hood, the browser talks only to our application API. The agent connects to our self-hosted MCP server over Streamable HTTP, dynamically discovers tools, executes them, and persists the complete execution trail in SQLite.  
  > The key difference is that this isn't a chatbot pretending to use tools. It's an actual agentic workflow built around the official MCP standard, with persistent execution, live telemetry, failure handling, and verification.  
  > Thank you."*

---

## 3. GitHub Repository Collaborator Invites (If Private)

If submitting the repository as a private repository on GitHub, open:  
**Repo Settings > Collaborators > Add people**  
and add the following required reviewers at the time of submission:

1. `testing@devpost.com`
2. `knmeiss` (Kourtney Meiss)
3. `giolaq` (Giovanni Laquidara)
4. `anishamalde` (Anisha Malde)
5. `mosesroth` (Moses Roth)
6. `emersonsklar` (Emerson Sklar)

*(Note: GitHub collaborator invitations expire after 7 days, so send invites at the time of final submission).*
