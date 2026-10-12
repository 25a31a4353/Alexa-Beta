# Failure Recovery & Error Classification Architecture

**Specification Version:** 1.0.0-LOCKED  
**Recovery Paradigm:** Deterministic Fail-Safe Escalation with Truth Preservation  
**Invariant:** Under no circumstances may the system fabricate synthetic success to mask execution failures.

---

## 1. Unified Recovery Cycle: The 8-Stage Protocol

Whenever an exception, rejection, or anomaly occurs during mission processing, it is routed through the standard **8-Stage Recovery Protocol**:

```
1. DETECT
   └── Trap exception, HTTP status, MCP error frame, or verification mismatch.
2. CLASSIFY
   └── Map error into one of the 13 formal Failure Classes with idempotency check.
3. RETRY IF SAFE
   └── If error is transient & tool is idempotent, execute up to maxRetries with backoff.
4. ALTERNATIVE STRATEGY
   └── If retry fails or is unsafe, swap capability provider (e.g. lexical fallback).
5. CONTINUE UNAFFECTED TASKS
   └── In parallel DAG, keep non-dependent sibling tasks progressing.
6. REQUEST USER INPUT IF NECESSARY
   └── If ambiguity or permission is blocking, prompt user with explicit options.
7. VERIFY
   └── Subject the recovered outcome to the standard Verification Subsystem.
8. REPORT HONESTLY
   └── Present factual execution state; clearly highlight unresolved gaps.
```

---

## 2. Comprehensive Failure Classification & Policy Matrix

| # | Failure Class | Detection Signal | Retry Policy | Alternative Strategy | Honest Reporting Behavior |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Invalid Input** | LLM unparseable prompt or malformed JSON | None | Prompt user with structured clarification questions. | Explain ambiguity and request missing parameters. |
| **2** | **Schema Validation Failure** | MCP Server returns `isError: true` with Zod schema issues | 1 retry with schema correction injected into prompt | Fallback to default parameter values if non-critical. | Log exact rejected schema fields in tool inspector. |
| **3** | **MCP Transport Failure** | SSE stream breaks, TCP reset, ECONNRESET | Up to 3 retries (1s, 2s, 4s backoff) | Re-initialize MCP session handshake via `/mcp/sse`. | Display "Re-establishing connection to tool server..." |
| **4** | **MCP Server Unavailable** | HTTP 502 / 503 / connection refused on port 3001 | 3 retries with 2s interval | Alert server watchdog daemon to restart MCP service. | Mark step `BLOCKED` with "Tool server offline". |
| **5** | **Tool Timeout** | Execution exceeds tool contract `timeout` limit | 1 retry if `retryable: true` | Attempt narrower query (e.g., reduce date window). | Display "Tool exceeded 30s timeout threshold". |
| **6** | **Tool Execution Failure** | Domain adapter throws runtime exception | 1 retry if idempotent | Route to fallback tool or degrade to cached data. | Record stack trace in `tool_executions`, show error badge. |
| **7** | **External Service Unavailable** | 3rd party API (Google/Notion) returns 401/429/500 | 1 retry with exponential backoff | Fall back to local synced knowledge cache if available. | Mark integration warning; note cached data used. |
| **8** | **Conflicting Information** | `detect_conflict` identifies contradictory facts | None (re-reading won't resolve reality) | Present conflict to user with source citations. | Explicitly display conflicting claims in mission view. |
| **9** | **Missing Information** | Document or event does not exist in store | None | Query alternative category or broaden search scope. | Explicitly report "Document not found: [Name]". |
| **10**| **Ambiguous User Request** | Multiple viable interpretations of goal | None | Ask 1 targeted clarifying question via chat interface. | State assumptions made pending confirmation. |
| **11**| **Approval Rejection** | User clicks `[Reject]` on approval modal | None (human decision is final) | Remove consequential step; formulate plan without it. | Note "Action cancelled by user: Reminders not set". |
| **12**| **Verification Failure** | `validate_result` returns incomplete goals | 1 recovery pass targeting missing goal | Spawn dedicated remedial sub-task in DAG. | Highlight specific missing goals in final checklist. |
| **13**| **Dependency Failure** | Parent task fails and cannot recover | None | Mark dependent descendant tasks as `BLOCKED`. | Show affected branch in execution graph as blocked. |

---

## 3. Truth Preservation: The Anti-Fabrication Guarantee

A fatal vulnerability in synthetic agent systems is generating plausibly sounding responses when underlying tool calls fail (e.g., claiming a calendar event was checked when the calendar API threw a 500).

**Alexa+ Enforces Cryptographic & Relational Proof:**
1. A tool step cannot transition to `COMPLETED` unless a matching record exists in `tool_executions` with `is_error = 0`.
2. The final synthesis engine receives *only* verified tool outputs from `mission_steps.output_payload`.
3. If a tool fails and cannot recover, the synthesizer prompt explicitly contains:
   ```
   SYSTEM DIRECTIVE: The following steps failed: [Step 2: Calendar Query]. 
   Do NOT invent meeting details. Report that calendar access was unavailable.
   ```
