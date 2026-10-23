# Definitive MCP Tool Registry & Schema Specification

**Specification Version:** 2.1.0-LOCKED  
**Architectural Model:** 9 Capability Domains containing 14 Granular Concrete MCP Tools  
**Protocol Standard:** Model Context Protocol (MCP) 2025-11-25 (Streamable HTTP)  
**Schema Engine:** Zod v3.24 / JSON Schema Draft 2020-12

---

> [!NOTE]
> **Implementation Reconciliation Note:** This document specifies the early architectural capability breakdown across 9 domains. In the production implementation, the self-hosted MCP server (`:3001/mcp`) implements and registers **11 concrete MCP tools** (`calendar_get_events`, `outlook_calendar_get_events`, `gmail_search`, `gmail_get_message`, `drive_search`, `drive_get_file`, `outlook_search`, `outlook_get_message`, `knowledge_search`, `document_analyze`, `ping`), with 5 executed sequentially in the hero mission.

---

## 1. Architectural Distinction: 9 Capability Domains vs. 14 Concrete Tools

In the Alexa+ UI and top-level architecture, user objectives are categorized into **9 Capability Domains**. Underneath, these domains are serviced by **14 Granular Concrete MCP Tools** exposed by the self-hosted MCP Server:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        9 CAPABILITY DOMAINS                            │
│                                                                        │
│ 1. KNOWLEDGE             ──► [knowledge_search,                        │
│                               knowledge_retrieve_document,             │
│                               document_analyze]                        │
│ 2. PLANNING              ──► [plan_create, task_update,                │
│                               task_get_status]                         │
│ 3. CONTEXT               ──► [context_get_conversation,                │
│                               context_save_memory]                     │
│ 4. DATA                  ──► [data_query, data_analyze]                │
│ 5. EXTERNAL_SERVICES     ──► [calendar_get_events,                     │
│                               notifications_create]                    │
│ 6. VERIFICATION          ──► [detect_conflict, validate_result]        │
│ 7. SYSTEM_EXECUTION      ──► Serviced via DAG Scheduler orchestrator   │
│ 8. INTEGRATIONS          ──► Serviced via External Auth adapters       │
│ 9. SECURITY_APPROVAL     ──► Serviced via Server-Side HMAC gate        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Definitive MCP Tool Registry Master Table

| # | Exact Tool Name | Capability Domain | Mode | Risk | Requires Approval | Idempotent | Retryable | Timeout | Required Data Source | Verification Strategy |
| :- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **1** | `knowledge_search` | KNOWLEDGE | Read-Only | Low | No | Yes | Yes | 15s | Local SQLite FTS5 | Result count & relevance score audit |
| **2** | `knowledge_retrieve_document` | KNOWLEDGE | Read-Only | Low | No | Yes | Yes | 10s | Local SQLite Documents | Document existence & non-empty content |
| **3** | `document_analyze` | KNOWLEDGE | Read-Only | Low | No | Yes | Yes | 30s | Document Text & Local Model | Schema conformance (key topics, risks) |
| **4** | `plan_create` | PLANNING | Mutating | Low | No | Yes | Yes | 10s | Orchestrator DAG Store | Topological validity & cycle absence |
| **5** | `task_update` | PLANNING | Mutating | Low | No | Yes | Yes | 10s | Orchestrator DAG Store | Status transition validation |
| **6** | `task_get_status` | PLANNING | Read-Only | Low | No | Yes | Yes | 5s | Orchestrator DAG Store | Dependency satisfaction check |
| **7** | `context_get_conversation` | CONTEXT | Read-Only | Low | No | Yes | Yes | 5s | Conversation DB | Turn count & message continuity check |
| **8** | `context_save_memory` | CONTEXT | Mutating | Low | No | Yes | Yes | 5s | Conversation DB | Entity deduplication check |
| **9** | `data_query` | DATA | Read-Only | Low | No | Yes | Yes | 15s | Local Relational Dataset | SQL syntax validation & bounded rows |
| **10**| `data_analyze` | DATA | Read-Only | Low | No | Yes | Yes | 25s | Data Tables & Analytics Engine | Numeric consistency & trend sanity |
| **11**| `calendar_get_events` | EXTERNAL_SERVICES | Read-Only | Low | No | Yes | Yes | 10s | Google Calendar Adapter | Temporal window & event integrity |
| **12**| `notifications_create` | EXTERNAL_SERVICES | **Mutating** | **High** | **Yes** | **No** | **No** | 10s | Notification System Adapter | Cryptographic HMAC Approval Token verification |
| **13**| `detect_conflict` | VERIFICATION | Read-Only | Low | No | Yes | Yes | 15s | Multi-Source Findings | Cross-source claim contradiction check |
| **14**| `validate_result` | VERIFICATION | Read-Only | Low | No | Yes | Yes | 15s | Complete Mission Artifacts | 100% initial objective coverage audit |

---

## 3. Detailed Specifications for the 14 Granular Tools

### 1. `knowledge_search`
* **Domain:** KNOWLEDGE
* **Description:** Performs lexical and semantic search across indexed documents, meeting transcripts, and project specifications.
* **Input Schema:**
  ```typescript
  z.object({
    query: z.string().min(1).describe("Search keywords or query string"),
    category: z.enum(["all", "documents", "notes", "meetings", "reports", "links"]).default("all"),
    limit: z.number().int().min(1).max(20).default(5)
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    totalFound: z.number(),
    results: z.array(z.object({
      documentId: z.string(),
      title: z.string(),
      fileType: z.string(),
      relevanceScore: z.number(),
      snippet: z.string(),
      date: z.string()
    }))
  })
  ```
* **Failure Modes:** FTS index corruption, empty query string, database lock timeout.

---

### 2. `knowledge_retrieve_document`
* **Domain:** KNOWLEDGE
* **Description:** Retrieves the complete structured content, metadata, page count, and sections of an ingested document.
* **Input Schema:**
  ```typescript
  z.object({
    documentId: z.string().min(1).describe("Unique identifier of the document to retrieve")
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    documentId: z.string(),
    title: z.string(),
    fileType: z.string(),
    pageCount: z.number(),
    sizeMb: z.number(),
    category: z.string(),
    summary: z.string(),
    content: z.string()
  })
  ```
* **Failure Modes:** `DOCUMENT_NOT_FOUND` (HTTP 404), corrupt binary payload.

---

### 3. `document_analyze`
* **Domain:** KNOWLEDGE
* **Description:** Deep analytical extraction from targeted document texts (extracts key topics, action items, risks, and gaps).
* **Input Schema:**
  ```typescript
  z.object({
    documents: z.array(z.string()).min(1).describe("List of document names or IDs to analyze"),
    analysis_type: z.enum(["key_points", "gap_analysis", "risk_assessment", "action_items"]),
    focus: z.array(z.string()).describe("Specific topics or criteria to extract")
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    key_topics: z.array(z.string()),
    action_items: z.array(z.string()),
    risks: z.array(z.string()),
    gap_summary: z.string().optional()
  })
  ```
* **Failure Modes:** Document text empty, token limit exceeded, analytical model timeout.

---

### 4. `plan_create`
* **Domain:** PLANNING
* **Description:** Formulates an initial directed acyclic task graph (DAG) with explicit dependency edges.
* **Input Schema:**
  ```typescript
  z.object({
    missionId: z.string(),
    tasks: z.array(z.object({
      stepIndex: z.number().int(),
      label: z.string(),
      domain: z.string(),
      requiredCapability: z.string(),
      dependsOn: z.array(z.string()),
      isConsequential: z.boolean()
    }))
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    planId: z.string(),
    taskCount: z.number(),
    isValidDag: z.boolean()
  })
  ```
* **Failure Modes:** Circular dependency detected, empty task array.

---

### 5. `task_update`
* **Domain:** PLANNING
* **Description:** Updates the execution state, duration, and output payload of a specific task node in the active DAG.
* **Input Schema:**
  ```typescript
  z.object({
    missionId: z.string(),
    stepId: z.string(),
    status: z.enum(["PENDING", "RUNNING", "COMPLETED", "BLOCKED", "AWAITING_APPROVAL", "FAILED", "SKIPPED"]),
    durationMs: z.number().optional(),
    outputPayload: z.record(z.any()).optional(),
    errorMessage: z.string().optional()
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    stepId: z.string(),
    updatedStatus: z.string(),
    unblockedTasks: z.array(z.string())
  })
  ```
* **Failure Modes:** Non-existent `stepId`, invalid state transition.

---

### 6. `task_get_status`
* **Domain:** PLANNING
* **Description:** Queries the current readiness and completion state of tasks within the active execution plan.
* **Input Schema:**
  ```typescript
  z.object({
    missionId: z.string()
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    completedSteps: z.number(),
    totalSteps: z.number(),
    activeStepId: z.string().optional(),
    readyTaskIds: z.array(z.string())
  })
  ```
* **Failure Modes:** Unknown `missionId`.

---

### 7. `context_get_conversation`
* **Domain:** CONTEXT
* **Description:** Retrieves recent conversational turns, user preferences, and session parameters.
* **Input Schema:**
  ```typescript
  z.object({
    conversationId: z.string(),
    turnLimit: z.number().int().default(10)
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    turns: z.array(z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      timestamp: z.string()
    }))
  })
  ```
* **Failure Modes:** Conversation ID not found.

---

### 8. `context_save_memory`
* **Domain:** CONTEXT
* **Description:** Persists key entity facts, extracted findings, or user preferences into long-term session context.
* **Input Schema:**
  ```typescript
  z.object({
    conversationId: z.string(),
    entityType: z.string(),
    key: z.string(),
    value: z.any()
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    persisted: z.boolean(),
    recordId: z.string()
  })
  ```
* **Failure Modes:** Storage failure.

---

### 9. `data_query`
* **Domain:** DATA
* **Description:** Executes read-only queries against local relational datasets and metric records.
* **Input Schema:**
  ```typescript
  z.object({
    dataset: z.string(),
    filters: z.record(z.any()).optional(),
    limit: z.number().int().default(50)
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    rowCount: z.number(),
    rows: z.array(z.record(z.any()))
  })
  ```
* **Failure Modes:** Dataset not found, query syntax violation.

---

### 10. `data_analyze`
* **Domain:** DATA
* **Description:** Performs statistical aggregation, trend identification, and risk evaluation across extracted data.
* **Input Schema:**
  ```typescript
  z.object({
    datasetName: z.string(),
    analysisTarget: z.string(),
    metrics: z.array(z.string())
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    trends: z.array(z.string()),
    keyMetrics: z.record(z.number()),
    anomalies: z.array(z.string())
  })
  ```
* **Failure Modes:** Insufficient data points.

---

### 11. `calendar_get_events`
* **Domain:** EXTERNAL_SERVICES
* **Description:** Retrieves upcoming meetings and calendar events within a specified time horizon.
* **Input Schema:**
  ```typescript
  z.object({
    startDate: z.string().describe("ISO 8601 start timestamp"),
    endDate: z.string().describe("ISO 8601 end timestamp"),
    query: z.string().optional()
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    events: z.array(z.object({
      eventId: z.string(),
      title: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      platform: z.string(),
      attendees: z.array(z.string()),
      description: z.string().optional()
    }))
  })
  ```
* **Failure Modes:** Calendar service unavailable, invalid ISO date format.

---

### 12. `notifications_create` (CONSEQUENTIAL — MANDATORY APPROVAL)
* **Domain:** EXTERNAL_SERVICES
* **Description:** Dispatches system notifications, desktop alarms, or calendar reminders to the user.
* **Input Schema:**
  ```typescript
  z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    scheduledTime: z.string().describe("ISO 8601 timestamp"),
    priority: z.enum(["low", "normal", "urgent"]).default("normal"),
    approvalToken: z.string().describe("Server-validated HMAC cryptographic approval token")
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    notificationId: z.string(),
    status: z.enum(["scheduled", "delivered"]),
    scheduledTime: z.string()
  })
  ```
* **Enforcement:** If `approvalToken` is missing or fails HMAC validation on the server, the tool aborts with `E_APPROVAL_REQUIRED`.
* **Failure Modes:** Invalid or expired token, notification daemon offline.

---

### 13. `detect_conflict`
* **Domain:** VERIFICATION
* **Description:** Identifies contradictory assertions across disparate data sources (timelines, attendees, versioning).
* **Input Schema:**
  ```typescript
  z.object({
    sources: z.array(z.object({
      sourceName: z.string(),
      claims: z.array(z.string())
    }))
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    hasConflicts: z.boolean(),
    conflicts: z.array(z.object({
      field: z.string(),
      discrepancy: z.string(),
      conflictingSources: z.array(z.string()),
      recommendedResolution: z.string()
    }))
  })
  ```
* **Failure Modes:** Malformed input format.

---

### 14. `validate_result`
* **Domain:** VERIFICATION
* **Description:** Audits final synthesis against all criteria in the user's initial objective.
* **Input Schema:**
  ```typescript
  z.object({
    originalObjective: z.string(),
    completedArtifacts: z.array(z.string()),
    executedSteps: z.array(z.string())
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    isComplete: z.boolean(),
    completenessRatio: z.number().min(0).max(1),
    missingGoals: z.array(z.string()),
    recommendation: z.enum(["accept", "refine_plan", "require_human_clarification"])
  })
  ```
* **Failure Modes:** None (deterministic heuristic/model evaluation).
