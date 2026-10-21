# Open Source Mini-Challenge: Submission Details
### Companion Project: `mcp-session-reaper`

---

## 1. Submission Fields for Devpost

### Mini-Challenge Entered
**Open Source**

### Contribution / Project Name
**`mcp-session-reaper`** — Lightweight Session Lifecycle & Socket Reaper for Model Context Protocol (MCP) Streamable HTTP Servers

### Repository / Contribution URL
- **Primary Submission Repository:** `https://github.com/<your-username>/alexa-plus`
- **Companion Open-Source Project URL:** `https://github.com/<your-username>/mcp-session-reaper` (or located within [`packages/mcp-session-reaper`](../packages/mcp-session-reaper) under the MIT License)
- **GitHub Username:** `<your-github-username>`

---

## 2. Description: What We Did, How It Works, and Why It Matters

### What We Did
During the hackathon window, we encountered a fundamental friction point in the emerging **Model Context Protocol (MCP) Streamable HTTP** specification (`@modelcontextprotocol/sdk/server/streamableHttp.js`): when hosting MCP servers in Node.js/Express, network interruptions, dropped Server-Sent Events (SSE) connections, and browser reloads regularly lead to orphaned transport instances and memory bloat.

To solve this for ourselves and the broader developer ecosystem, we designed, implemented, tested, and published **`mcp-session-reaper`** as an open-source, zero-dependency companion package under the **MIT License**.

### How It Works
- **Response Socket Tracking:** Hooks into Node.js HTTP `res.on('close')` event listeners to monitor live chunked SSE connections in real time without interfering with Express request pipelines.
- **Configurable Idle Scavenging:** Runs a background reaper timer that evaluates session idle windows and gracefully calls `transport.close()` on inactive sessions before purging them from memory.
- **Drop-in Express Middleware:** Provides a clean `mcpSessionTracker()` middleware that works seamlessly alongside `@modelcontextprotocol/sdk`.

### Why It Matters
As the Model Context Protocol transitions from local stdio pipes to networked Streamable HTTP microservices, production server stability and connection resilience become paramount. `mcp-session-reaper` gives developers hosting autonomous agent backends a production-grade session hygiene tool with zero external dependencies.
