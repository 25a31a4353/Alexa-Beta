# Agent Execution State Machine Specification

**Specification Version:** 1.0.0-LOCKED  
**State Machine Type:** Deterministic Finite State Machine (FSM) with Persistent Journaling  
**Engine:** Server-Side Orchestrator Engine

---

## 1. Formal State Definitions

The Alexa+ Agent Orchestrator operates across exactly **11 explicit states**. No unmapped, intermediate, or ad-hoc states are permitted.

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                   STATE MACHINE TOPOLOGY                              │
│                                                                                       │
│                                           ┌──────────────┐                            │
│                                           │     IDLE     │                            │
│                                           └──────┬───────┘                            │
│                                                  │ User submits objective             │
│                                                  ▼                                    │
│                                      ┌───────────────────────┐                        │
│                                      │     UNDERSTANDING     │                        │
│                                      └───────────┬───────────┘                        │
│                                                  │ Goal parsed & constraints extracted│
│                                                  ▼                                    │
│                                      ┌───────────────────────┐                        │
│                                      │       PLANNING        │                        │
│                                      └───────────┬───────────┘                        │
│                                                  │ DAG plan generated                 │
│                                                  ▼                                    │
│                                      ┌───────────────────────┐                        │
│                                      │   DISCOVERING_TOOLS   │                        │
│                                      └───────────┬───────────┘                        │
│                                                  │ Tools matched via MCP tools/list   │
│                                                  ▼                                    │
│                   ┌──────────────────►┌───────────────────────┐◄──────────────────┐   │
│                   │                   │       EXECUTING       │                   │   │
│                   │                   └─────┬─────┬─────┬─────┘                   │   │
│                   │                         │     │     │                         │   │
│                   │ Consequential action    │     │     │ Tool error / timeout    │   │
│                   │                         ▼     │     ▼                         │   │
│                   │   ┌────────────────────────┐  │  ┌────────────────────────┐   │   │
│                   │   │WAITING_FOR_CONFIRMATION│  │  │       RECOVERING       │   │   │
│                   │   └───────────┬────────────┘  │  └───────────┬────────────┘   │   │
│                   │               │ User approval │              │ Recovery plan  │   │
│                   │               │ or rejection  │              │ established    │   │
│                   └───────────────┘               │              └────────────────┘   │
│                                                   │ All tools executed                │
│                                                   ▼                                   │
│                                      ┌───────────────────────┐                        │
│                                      │       VERIFYING       │                        │
│                                      └───────────┬───────────┘                        │
│                                                  │ Verification passed                │
│                                                  ▼                                    │
│                                      ┌───────────────────────┐                        │
│                                      │      SYNTHESIZING     │                        │
│                                      └───────────┬───────────┘                        │
│                                                  │ Final results bundled              │
│                                                  ▼                                    │
│                                      ┌───────────────────────┐                        │
│                                      │       COMPLETED       │                        │
│                                      └───────────────────────┘                        │
│                                                                                       │
│          * Any unrecoverable exception or explicit abortion transitions to:           │
│                                      ┌───────────────────────┐                        │
│                                      │        FAILED         │                        │
│                                      └───────────────────────┘                        │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Transition Matrix & Rules

| Current State | Allowed Next States | Trigger / Condition |
| :--- | :--- | :--- |
| `IDLE` | `UNDERSTANDING` | User submits objective payload via API/UI. |
| `UNDERSTANDING` | `PLANNING`, `FAILED` | Constraints & intent successfully extracted; or unparseable input. |
| `PLANNING` | `DISCOVERING_TOOLS`, `FAILED` | Execution DAG compiled and persisted; or impossible constraints. |
| `DISCOVERING_TOOLS` | `EXECUTING`, `RECOVERING`, `FAILED` | MCP `tools/list` resolved matching capabilities; or missing critical tool. |
| `EXECUTING` | `WAITING_FOR_CONFIRMATION`, `RECOVERING`, `VERIFYING`, `FAILED` | Consequential action encountered (`requiresApproval`); tool failure; all steps executed; unrecoverable crash. |
| `WAITING_FOR_CONFIRMATION`| `EXECUTING`, `PLANNING`, `FAILED` | User grants approval token; user rejects action (triggers replan); or approval expires (timeout). |
| `RECOVERING` | `EXECUTING`, `PLANNING`, `FAILED` | Alternative tool selected; replan initiated; or recovery budget exhausted. |
| `VERIFYING` | `SYNTHESIZING`, `RECOVERING`, `FAILED` | Evidence satisfies criteria; verification gap detected; or irreconcilable contradiction. |
| `SYNTHESIZING` | `COMPLETED`, `FAILED` | Final outcome narrative, artifacts & checklist formatted; or storage write error. |
| `COMPLETED` | `IDLE` | New objective requested on same session. |
| `FAILED` | `IDLE`, `PLANNING` | User acknowledges failure; or requests retry with adjusted parameters. |

### Explicitly Forbidden Transitions
* `IDLE` $\rightarrow$ `EXECUTING` (Bypassing understanding and planning is strictly forbidden).
* `PLANNING` $\rightarrow$ `SYNTHESIZING` (Cannot synthesize results without tool execution).
* `WAITING_FOR_CONFIRMATION` $\rightarrow$ `COMPLETED` (Cannot mark complete while actions are pending user consent).
* `EXECUTING` $\rightarrow$ `COMPLETED` (Bypassing verification is strictly forbidden).

---

## 3. Persistence, Resumption & Reconnection Semantics

### Persistent Checkpointing
Every state change is wrapped in an atomic SQLite transaction updating the `missions` and `mission_steps` tables:
```sql
UPDATE missions 
SET status = :nextState, 
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') 
WHERE id = :missionId AND status = :currentState;
```
If the process terminates at any millisecond, the mission state is frozen at the exact transition point.

### Browser Refresh Behavior
* When the user reloads the browser, the frontend connects to `GET /api/missions/:id`.
* The server reads the current state and step index directly from SQLite.
* The frontend immediately resumes rendering at the exact state (`5/7 steps completed`, `In progress`, etc.) without losing context.

### Network Disconnect Behavior
* If the SSE stream between server and browser drops, the server-side Orchestrator **continues executing background tasks**.
* When the client re-establishes SSE connection (`GET /api/missions/:id/stream?lastEventId=...`), the server replays missed events from the persistent `activity_events` journal.

### Server Restart & Crash Recovery
* Upon server boot, the Orchestrator runs a recovery sweep:
  ```typescript
  SELECT id FROM missions WHERE status IN ('EXECUTING', 'PLANNING', 'DISCOVERING_TOOLS');
  ```
* For interrupted missions:
  1. If interrupted during a non-idempotent tool execution, the state transitions to `RECOVERING`.
  2. If interrupted during a read-only idempotent step, the step is re-queued in `EXECUTING`.
  3. If interrupted during `WAITING_FOR_CONFIRMATION`, the state remains `WAITING_FOR_CONFIRMATION` awaiting user action.
