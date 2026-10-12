# Observability & Event Telemetry Specification

**Specification Version:** 1.0.0-LOCKED  
**Telemetry Model:** Structured Event Journaling (W3C Trace-Context Compatible)  
**UX Policy:** Clean Operational Telemetry (Zero Private Chain-of-Thought Leakage)

---

## 1. Core UX Policy: Operational Transparency vs. Chain-of-Thought

A critical failure mode of prototype AI systems is dumping raw, rambling LLM "chain-of-thought" scratchpads into the end-user interface. This creates visual clutter, exposes unvetted internal thoughts, and degrades the premium feel.

**Alexa+ Enforces Clean Operational Telemetry:**
* Internal reasoning remains in memory and is discarded after decision formulation.
* The UI displays crisp, deterministic, human-readable **Operational Status Summaries**:
  * ✅ *"Understanding your request and extracting key objectives..."*
  * ✅ *"Checking your calendar for upcoming meetings..."*
  * ✅ *"Finding and analyzing relevant documents..."*
  * ✅ *"Analyzing document content (roadmap.pdf, notes.docx)..."*
  * ✅ *"Detected conflicting timeline information between roadmap and calendar"*
  * ✅ *"Waiting for your approval to schedule reminders"*
  * ✅ *"Verified against 3 connected sources"*
* Raw JSON inputs and outputs are exposed exclusively inside the dedicated **Tool Inspector Panel** (Screen 4) for technical auditability.

---

## 2. Event Model Specification

All system transitions generate structured events stored in the SQLite `activity_events` table and dispatched over the Application SSE Stream (`/api/missions/:id/stream`).

### Standard Event Envelope Schema
```typescript
interface TelemetryEvent<T = Record<string, any>> {
  eventId: string;                   // UUIDv4 (e.g. "evt-019a84b2")
  missionId: string;                 // Associated mission
  stepId?: string;                   // Associated step node (if applicable)
  type: EventType;                   // Formal event type
  timestamp: string;                 // ISO 8601 with millisecond precision
  durationMs?: number;               // Elapsed time for completed actions
  summary: string;                   // Concise user-facing text
  payload: T;                        // Structured telemetry payload
}

type EventType =
  | "mission.created"
  | "understanding.completed"
  | "plan.created"
  | "tool.discovered"
  | "tool.selected"
  | "tool.started"
  | "tool.completed"
  | "tool.failed"
  | "approval.requested"
  | "approval.granted"
  | "approval.rejected"
  | "verification.started"
  | "verification.completed"
  | "mission.recovered"
  | "mission.completed"
  | "mission.failed";
```

---

## 3. Event Taxonomy & Payloads

| Event Type | User-Facing Summary Example | Payload Content |
| :--- | :--- | :--- |
| `mission.created` | "Started mission: Meeting Preparation" | `{ objective: string, model: string }` |
| `understanding.completed` | "Identified 4 objectives and 2 constraints" | `{ extractedGoals: string[], constraints: string[] }` |
| `plan.created` | "Generated 7-step execution plan" | `{ totalSteps: 7, stepTitles: string[] }` |
| `tool.discovered` | "Discovered 9 available MCP capabilities" | `{ toolNames: string[], transport: "Streamable HTTP" }` |
| `tool.selected` | "Selected Document Analysis for roadmap extraction"| `{ toolName: string, stepId: string, rationale: string }` |
| `tool.started` | "Executing Document Analysis..." | `{ toolName: string, inputArgs: Record<string, any> }` |
| `tool.completed` | "Analyzed Q4 Product Roadmap (28s)" | `{ toolName: string, durationMs: 28450, outputSummary: Record<string, any> }` |
| `tool.failed` | "Calendar connection timed out, retrying..." | `{ toolName: string, error: string, retryCount: number }` |
| `approval.requested` | "Waiting for your approval to set reminders" | `{ approvalId: string, action: string, riskLevel: "high" }` |
| `approval.granted` | "Approval granted by user" | `{ approvalId: string, actedAt: string }` |
| `approval.rejected` | "Action declined by user, replanning" | `{ approvalId: string, reason: string }` |
| `verification.started` | "Verifying results against original goals" | `{ checksPlanned: 3 }` |
| `verification.completed` | "All results verified successfully" | `{ verified: true, satisfiedCriteria: string[] }` |
| `mission.recovered` | "Recovered from document retrieval failure" | `{ strategy: "fallback_to_fts", recoveredStep: string }` |
| `mission.completed` | "Meeting Preparation completed successfully" | `{ totalDurationMs: 98200, artifactsCount: 3 }` |
| `mission.failed` | "Mission aborted: Critical resource unavailable" | `{ fatalError: string, completedSteps: number }` |

---

## 4. Reconstructability & Audit Guarantee
Every mission execution can be 100% reconstructed post-hoc by replaying the ordered stream from `activity_events WHERE mission_id = :id ORDER BY timestamp ASC`. This enables instant time-travel debugging, post-incident analysis, and deterministic audit compliance.
