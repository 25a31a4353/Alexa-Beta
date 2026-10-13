# Application REST & Streaming API Contracts

**Specification Version:** 1.0.0-LOCKED  
**API Engine:** Fastify / Express / Next.js Server Endpoints  
**Data Formats:** JSON (RFC 8259) & Server-Sent Events (SSE) event stream (`text/event-stream`, W3C / WHATWG HTML Standard)

---

## 1. Application REST Endpoint Catalog

### 1.1 Conversations & Missions

#### `POST /api/conversations`
* **Purpose:** Initializes a new conversation session.
* **Request Body:**
  ```json
  {
    "title": "Meeting Preparation",
    "modelId": "claude-3-5-sonnet"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "id": "conv-019a84b2",
    "title": "Meeting Preparation",
    "modelId": "claude-3-5-sonnet",
    "createdAt": "2026-10-12T20:12:00.000Z"
  }
  ```

#### `POST /api/missions`
* **Purpose:** Creates and dispatches a new mission from user prompt.
* **Request Body:**
  ```json
  {
    "conversationId": "conv-019a84b2",
    "goal": "I have an important meeting tomorrow. Check my calendar, understand what the meeting is about, find relevant documents, determine what I haven't prepared, prepare a checklist, and remind me what I need to do.",
    "modelId": "claude-3-5-sonnet",
    "mode": "deep_research"
  }
  ```
* **Response (202 Accepted):**
  ```json
  {
    "missionId": "msn-019a84c3",
    "status": "UNDERSTANDING",
    "streamUrl": "/api/missions/msn-019a84c3/stream"
  }
  ```

#### `GET /api/missions/:id`
* **Purpose:** Fetches complete persistent state of a mission (used on page refresh).
* **Response (200 OK):**
  ```json
  {
    "id": "msn-019a84c3",
    "conversationId": "conv-019a84b2",
    "title": "Meeting Preparation",
    "goal": "...",
    "status": "EXECUTING",
    "currentStepIndex": 5,
    "totalSteps": 7,
    "durationMs": 48200,
    "steps": [
      {
        "id": "step-01",
        "stepIndex": 1,
        "label": "Understanding your request and extracting key objectives...",
        "status": "COMPLETED",
        "durationMs": 12000
      },
      {
        "id": "step-05",
        "stepIndex": 5,
        "label": "Creating a prioritized checklist...",
        "status": "RUNNING",
        "durationMs": 3400
      }
    ],
    "plan": {
      "executionSteps": [
        "Check calendar and meeting details",
        "Gather and analyze relevant documents",
        "Identify missing preparation items",
        "Create prioritized checklist",
        "Set reminders"
      ]
    },
    "keyInformation": {
      "meetingTitle": "Product Roadmap Discussion",
      "time": "Tomorrow, 10:00 AM - 11:00 AM",
      "platform": "Google Meet"
    },
    "documentsFound": [
      { "id": "doc-01", "name": "Q4_Roadmap.pdf", "relevance": "High" }
    ]
  }
  ```

#### `GET /api/missions/:id/stream` (SSE Telemetry Stream)
* **Purpose:** Real-time push of step transitions, duration counters, tool execution payloads, and verification events.
* **Headers:** `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
* **Event Types:**
  * `event: step.update` $\rightarrow$ `{ stepId, status, durationMs, stepIndex }`
  * `event: tool.trace` $\rightarrow$ `{ toolName, status: "running" | "completed", input, output, durationMs }`
  * `event: approval.required` $\rightarrow$ `{ approvalId, action, reason, affectedResource }`
  * `event: mission.completed` $\rightarrow$ `{ summary, artifacts }`

---

### 1.2 Human Approvals

#### `POST /api/approvals/:id/sign`
* **Purpose:** Grants human approval to execute a pending consequential tool.
* **Request Body:**
  ```json
  {
    "userId": "usr-shanmukheswar",
    "decision": "APPROVE"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "approvalId": "appr-01",
    "status": "APPROVED",
    "executedAt": "2026-10-12T20:21:30.000Z"
  }
  ```

#### `POST /api/approvals/:id/reject`
* **Purpose:** Declines consequential action and triggers plan recovery.
* **Request Body:**
  ```json
  {
    "userId": "usr-shanmukheswar",
    "reason": "I will handle reminders manually."
  }
  ```

---

### 1.3 Knowledge & Documents

#### `GET /api/knowledge/documents`
* **Query Params:** `?category=all&query=`
* **Response (200 OK):** Returns list of documents matching category with metadata.

#### `GET /api/knowledge/documents/:id`
* **Response (200 OK):** Returns complete document details including summary, key insights array, action items array, and page count.

---

### 1.4 Tools & Integrations

#### `GET /api/tools`
* **Purpose:** Queries the MCP Client which interrogates the self-hosted MCP Server via `tools/list`.
* **Response (200 OK):** Returns list of 9 registered MCP tools with schema and category tags.

#### `GET /api/integrations`
* **Purpose:** Returns connection statuses for external services (Google Calendar, Drive, Gmail, Notion, Slack, etc.).

#### `POST /api/integrations/:id/toggle`
* **Purpose:** Connects or disconnects an integration.

---

### 1.5 Activity & Analytics

#### `GET /api/activity`
* **Query Params:** `?range=7d&category=all`
* **Response (200 OK):** Returns audit log array with metric counts (`totalActivities: 24`, `missions: 8`, `toolActions: 12`, `integrations: 3`).
