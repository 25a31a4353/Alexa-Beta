# Open Source Mini-Challenge: Submission Details
### Companion Project: `mcp-session-reaper`

---

## 1. Submission Fields for Devpost

### Mini-Challenge Entered
**Open Source**

### Contribution / Project Name
**`mcp-session-reaper`** — Lightweight Session Lifecycle & Socket Scavenger for Model Context Protocol (MCP) Streamable HTTP Servers

### Repository / Contribution URL
- **Contribution URL (Standalone Open-Source Project):** [`https://github.com/25a31a4353/mcp-session-reaper`](https://github.com/25a31a4353/mcp-session-reaper)
- **Primary Hackathon Repository URL:** [`https://github.com/25a31a4353/Alexa-Beta`](https://github.com/25a31a4353/Alexa-Beta)
- **Monorepo Package Source:** [`packages/mcp-session-reaper`](../packages/mcp-session-reaper)
- **GitHub Username:** `25a31a4353`
- **License:** [MIT License](https://github.com/25a31a4353/mcp-session-reaper/blob/main/LICENSE) (Visible at repository root)

---

## 2. Description: What We Did, How It Works, and Why It Matters

### What We Did
During the hackathon window, we encountered a fundamental friction point in the emerging **Model Context Protocol (MCP) Streamable HTTP** specification (`@modelcontextprotocol/sdk/server/streamableHttp.js`): when hosting MCP servers in Node.js/Express, network interruptions, dropped Server-Sent Events (SSE) connections, and browser reloads regularly lead to orphaned transport instances and memory bloat.

To solve this for ourselves and the broader developer ecosystem, we designed, implemented, tested, and published **`mcp-session-reaper`** as an open-source, zero-dependency standalone companion package under the **MIT License**.

### How It Works
- **Response Socket Tracking:** Hooks into Node.js HTTP `res.on('close')` event listeners to monitor live chunked SSE connections in real time without interfering with Express request pipelines.
- **Configurable Idle Scavenging:** Runs a background reaper timer that evaluates session idle windows and gracefully calls `transport.close()` on inactive sessions before purging them from memory.
- **Drop-in Express Middleware:** Provides a clean `mcpSessionTracker()` middleware that works seamlessly alongside `@modelcontextprotocol/sdk`.

### Why It Matters
As the Model Context Protocol transitions from local stdio pipes to networked Streamable HTTP microservices, production server stability and connection resilience become paramount. `mcp-session-reaper` gives developers hosting autonomous agent backends a production-grade session hygiene tool with zero external dependencies.

---

## 3. Automated Test Verification
Verified by a dedicated standalone test suite included in the repository:
```bash
node test.js
```
```text
========================================================================
OPEN SOURCE MINI-CHALLENGE: mcp-session-reaper TEST SUITE
========================================================================

[Test 1] Initializing McpSessionRegistry with custom idle timeout... [PASS]
[Test 2] Registering and retrieving active MCP transport session... [PASS]
[Test 3] Tracking socket lifetime via response close listeners... [PASS]
[Test 4] Verifying Express middleware hook mcpSessionTracker... [PASS]
[Test 5] Verifying automated reaper eviction of stale idle sessions... [PASS]

========================================================================
ALL mcp-session-reaper TESTS PASSED WITH 100% SUCCESS
========================================================================
```
