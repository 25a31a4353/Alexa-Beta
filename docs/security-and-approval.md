# Security Architecture & Server-Side Human Approval Gate

**Specification Version:** 1.0.0-LOCKED  
**Security Model:** Dual-Boundary Enforcement (Server-Side Gate + Cryptographic Approval Tokens)  
**Standard:** Least-Privilege Agentic Consequentiality Framework

---

## 1. The Consequential Action Principle

An autonomous agent operating with tool access must never have unilateral authority to execute state-mutating, irreversible, or externally visible actions. The system enforces the **Seven-Stage Consequentiality Pipeline**:

```
READ  ──►  ANALYZE  ──►  PROPOSE  ──►  EXPLAIN  ──►  REQUEST APPROVAL  ──►  EXECUTE  ──►  VERIFY
```

### Classification of Actions
* **Non-Consequential (Autonomous):**
  * Read operations: `calendar_get_events`, `knowledge_search`, `knowledge_retrieve_document`, `data_query`.
  * Local computation: `document_analyze`, `data_analyze`, `detect_conflict`, `verify_action`.
  * Internal plan state updates: `plan_create`, `task_create`, `task_update`.
* **Consequential (Human Approval Mandatory):**
  * External messaging & notification dispatch: `notifications_create`.
  * Calendar modifications: Creating, editing, or deleting calendar invites.
  * External data mutation: Modifying Notion pages, Slack messages, or GitHub repositories.
  * System-level actions: Deleting local documents, modifying user credentials.

---

## 2. Server-Side Enforcement (Defense-in-Depth)

Relying solely on a UI button or client-side prompt dialog is a critical security vulnerability. If a rogue agent prompt, race condition, or API bypass attempts to call a consequential tool directly, the **MCP Server itself blocks execution**.

### Architectural Defense Mechanisms:
1. **Tool Schema Annotation:** Consequential tools are registered with `requiresApproval: true` in their MCP metadata.
2. **Approval Challenge Token:** The MCP Server requires an input argument `approvalToken: string`.
   * If `approvalToken` is missing or invalid: The MCP Server throws an immediate `E_APPROVAL_REQUIRED` error and halts execution.
3. **Cryptographic Token Issuance:**
   * When the Orchestrator identifies a consequential step, it creates a persistent record in the `approvals` table.
   * It generates a cryptographically signed HMAC token (`approvalToken = HMAC_SHA256(approvalId + missionId + toolName + expiresAt, SERVER_SECRET)`).
   * The token is NOT given to the LLM. It is stored server-side in SQLite with status `PENDING`.

```
                    CONSEQUENTIAL TOOL INVOCATION FLOW
                                    │
                                    ▼
                Task flagged with requiresApproval: true
                                    │
                                    ▼
                 Generate Approval Record & Secret Token
                                    │
                                    ▼
                  Emit SSE: approval.requested to UI
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
          User Clicks [Approve]               User Clicks [Reject]
                  │                                   │
                  ▼                                   ▼
         POST /api/approvals/sign            POST /api/approvals/reject
                  │                                   │
                  ▼                                   ▼
        Verify Signature & User ID          Mark Status = REJECTED
                  │                                   │
                  ▼                                   ▼
         Mark Status = APPROVED              Transition to RECOVERING
                  │                           (Replan without action)
                  ▼
         Dispatch Tool via MCP 
      (Injecting validated approvalToken)
                  │
                  ▼
        MCP Server Validates Token 
            & Executes Action
```

---

## 3. Formal Approval Entity Contract

Every consequential action produces a complete, auditable approval entity in the database:

```typescript
interface HumanApprovalRecord {
  approvalId: string;               // UUIDv4 (e.g. "appr-8821a9c4")
  missionId: string;                // Parent mission reference
  stepId: string;                   // Specific task node in execution DAG
  toolName: string;                 // Target MCP tool (e.g. "notifications_create")
  proposedAction: string;           // "Send 3 meeting preparation reminders to desktop"
  affectedResource: string;         // "Notification Center / Shanmukheswar"
  reason: string;                   // "Ensure action items are reviewed before 10:00 AM meeting"
  riskLevel: "low" | "medium" | "high"; // "high"
  payload: Record<string, any>;     // Exact arguments intended for tool call
  expectedEffect: string;           // "3 notifications scheduled for 8:00 AM, 9:00 AM, 9:45 AM"
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "EXECUTED";
  tokenHash: string;                // SHA-256 hash of server secret token
  createdAt: string;                // ISO 8601
  expiresAt: string;                // ISO 8601 (default: 15 minutes TTL)
  actedAt?: string;                 // ISO 8601 timestamp of user sign-off
  actedByUserId?: string;           // "usr-shanmukheswar"
  verificationState: "PENDING" | "VERIFIED" | "FAILED";
}
```

---

## 4. Rejection & Expiration Handling
* **User Rejection:** If the user clicks `[Reject]` in the UI, the state machine transitions to `RECOVERING`. The orchestrator informs the planning model: *"User declined action: [Reason]. Adjust the plan to achieve the objective without executing this action."*
* **Token Expiration:** Approvals expire after 15 minutes. An expired token cannot be redeemed; the task node transitions to `FAILED` or prompts for re-confirmation.
