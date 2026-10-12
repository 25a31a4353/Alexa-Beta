# Mission Execution & Directed Acyclic Graph (DAG) Model

**Specification Version:** 1.0.0-LOCKED  
**Model Type:** Declarative Dependency Task Graph with Dynamic Plan Adaptation  
**Engine:** Orchestrator Task Scheduler

---

## 1. The Anti-Chatbot Paradigm: Mission Lifecycle

Alexa+ rejects single-turn chat completion (`Prompt -> LLM -> Text`). Instead, real-world execution is modeled as a verified lifecycle pipeline:

```
                   OBJECTIVE (Natural Language User Goal)
                             │
                             ▼
                    UNDERSTANDING & ANALYSIS
                             │
                             ▼
                   CONSTRAINT EXTRACTION
           (Time horizons, permissions, dependencies, criteria)
                             │
                             ▼
                    TASK DECOMPOSITION
              (Atomic sub-tasks with typed inputs/outputs)
                             │
                             ▼
           DEPENDENCY GRAPH COMPILATION (DAG Plan)
                             │
                             ▼
                 REAL MCP TOOL DISCOVERY
              (Query tools/list on active MCP Server)
                             │
                             ▼
           TOOL MATCHING & CAPABILITY MAPPING
                             │
                             ▼
                   DAG TASK EXECUTION
            ┌────────────────┴────────────────┐
            │                                 │
     Independent Tasks (Parallel)       Dependent Tasks (Sequential)
            │                                 │
            └────────────────┬────────────────┘
                             ▼
                   OUTPUT OBSERVATION
                             │
                 ┌───────────┴───────────┐
                 │ Failure detected?     │
                 ├───────────┬───────────┤
                 │ YES       │ NO        │
                 ▼           │           ▼
           RECOVERY CYCLE    │      PRE-ACTION VERIFICATION
        (Retry/Alt Tool)     │           │
                 │           │           ▼
                 └───────────┼────► CONSEQUENTIAL ACTION?
                             │           │
                             │    ┌──────┴──────┐
                             │    │ YES         │ NO
                             │    ▼             ▼
                             │  HUMAN APPROVAL  EXECUTE ACTION
                             │  (Server Gate)        │
                             │    │                  │
                             │    └────────┬─────────┘
                             │             ▼
                             │     POST-ACTION VERIFICATION
                             │             │
                             └─────────────┼────────┐
                                           │ Passed │ Failed
                                           ▼        ▼
                                     FINAL SYNTHESIS  RECOVER
```

---

## 2. Directed Acyclic Graph (DAG) Execution Model

A Mission is represented as a directed graph $G = (V, E)$ where:
* $V$ is the set of atomic **Task Nodes** ($v_1, v_2, \dots, v_n$).
* $E$ is the set of directed **Dependency Edges** $(v_i, v_j)$, meaning $v_j$ cannot start until $v_i$ completes successfully.

### Task Node Specification
```typescript
interface TaskNode {
  id: string;                      // Unique step ID (e.g. "step-01")
  stepIndex: number;               // 1-based display sequence (1..7)
  label: string;                   // Human-readable title
  description: string;             // Detailed objective
  domain: string;                  // Knowledge, Planning, External Services, etc.
  requiredCapability: string;      // e.g. "calendar.query", "document.analyze"
  assignedTool?: string;           // Matched MCP tool name (e.g. "calendar_get_events")
  dependsOn: string[];             // List of parent step IDs that must succeed first
  status: "PENDING" | "RUNNING" | "COMPLETED" | "BLOCKED" | "AWAITING_APPROVAL" | "FAILED" | "SKIPPED";
  isConsequential: boolean;        // Requires human sign-off
  inputTransform: (context: MissionContext) => Record<string, any>;
  output?: Record<string, any>;
  durationMs?: number;
  retryCount: number;
  maxRetries: number;
}
```

### Execution Scheduling Rules
1. **Ready Queue:** At any execution cycle, the scheduler evaluates all nodes:
   $$\text{Ready} = \{ v \in V \mid v.\text{status} = \text{PENDING} \land \forall u \in v.\text{dependsOn}, u.\text{status} = \text{COMPLETED} \}$$
2. **Parallel Dispatch:** Nodes in $\text{Ready}$ with no mutual dependencies execute concurrently up to a concurrency limit of 3 workers.
3. **Context Injection:** When node $v$ executes, outputs from all ancestor nodes in $v.\text{dependsOn}$ are merged and injected into its MCP tool input payload.
4. **Conditional Branching:** If a node output indicates absence of data (e.g. "No calendar event found"), dependent nodes evaluate conditional guards (`skipIf`, `branchTo`) rather than failing blindly.

---

## 3. Plan Resilience: Partial Completion & Interruption

* **Partial Completion:** If Step 6 fails after Steps 1–5 have succeeded, the outputs of Steps 1–5 are preserved in SQLite. The agent does not restart from Step 1.
* **Blocked Tasks:** If an ancestor fails and has no alternative recovery path, dependent descendant tasks transition to `BLOCKED`.
* **Human-in-the-Loop Interruption:**
  * When a task with `isConsequential: true` is dequeued, the scheduler freezes its thread, sets task status to `AWAITING_APPROVAL`, and sets mission state to `WAITING_FOR_CONFIRMATION`.
  * The rest of the non-dependent tasks (if any) continue executing.
* **Resumed Missions:** Upon receiving approval, the scheduler unfreezes the specific node, dispatches the tool call to the MCP Client, and proceeds normally.
