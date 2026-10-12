# Relational Persistence Schema & Data Model Specification

**Specification Version:** 1.0.0-LOCKED  
**Database Engine:** SQLite 3.45+ with Write-Ahead Logging (WAL) Mode  
**Integrity Guarantee:** Foreign Key Constraints Enabled (`PRAGMA foreign_keys = ON;`)

---

## 1. Entity Relationship Overview

The storage engine persists all conversational history, mission plans, tool traces, human approvals, and knowledge assets in an embedded SQLite database (`alexa_plus.db`).

```
  ┌──────────────────┐
  │  conversations   │
  └────────┬─────────┘
           │ 1:N
           ▼
  ┌──────────────────┐       1:1       ┌──────────────────┐
  │     missions     ├────────────────►│      plans       │
  └────────┬─────────┘                 └──────────────────┘
           │ 1:N
           ├───────────────────────────┬───────────────────────────┐
           ▼                           ▼                           ▼
  ┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
  │  mission_steps   │        │ activity_events  │        │  verifications   │
  └────────┬─────────┘        └──────────────────┘        └──────────────────┘
           │ 1:N
           ├───────────────────────────┐
           ▼                           ▼
  ┌──────────────────┐        ┌──────────────────┐
  │ tool_executions  │        │    approvals     │
  └──────────────────┘        └──────────────────┘

  [Standalone Knowledge & External Domains]
  ┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
  │    documents     │◄───────┤knowledge_records │        │   integrations   │
  └──────────────────┘  1:N   └──────────────────┘        └──────────────────┘
```

---

## 2. Table Definitions (DDL)

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,                       -- UUIDv4 (e.g. "conv-01")
  title TEXT NOT NULL,                      -- "Meeting Preparation"
  model_id TEXT NOT NULL DEFAULT 'claude-3-5-sonnet',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'ARCHIVED')) DEFAULT 'ACTIVE'
);

-- 2. MISSIONS
CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,                       -- UUIDv4 (e.g. "msn-01")
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                      -- "Meeting Preparation"
  goal TEXT NOT NULL,                       -- Natural language user request
  current_step_index INTEGER NOT NULL DEFAULT 1,
  total_steps INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK(status IN (
    'IDLE', 'UNDERSTANDING', 'PLANNING', 'DISCOVERING_TOOLS',
    'EXECUTING', 'WAITING_FOR_CONFIRMATION', 'RECOVERING',
    'VERIFYING', 'SYNTHESIZING', 'COMPLETED', 'FAILED'
  )) DEFAULT 'IDLE',
  duration_ms INTEGER DEFAULT 0,
  result_summary TEXT,                      -- Final synthesized outcome
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 3. PLANS
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,                       -- UUIDv4
  mission_id TEXT NOT NULL UNIQUE REFERENCES missions(id) ON DELETE CASCADE,
  dag_structure TEXT NOT NULL,              -- Serialized JSON representing TaskNode array
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 4. MISSION STEPS
CREATE TABLE IF NOT EXISTS mission_steps (
  id TEXT PRIMARY KEY,                       -- e.g. "step-01"
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,               -- 1..N
  label TEXT NOT NULL,                      -- "Finding and analyzing relevant documents..."
  description TEXT NOT NULL,
  domain TEXT NOT NULL,                      -- 'Knowledge', 'External Services', etc.
  assigned_tool TEXT,                        -- 'document_analyze'
  status TEXT NOT NULL CHECK(status IN (
    'PENDING', 'RUNNING', 'COMPLETED', 'BLOCKED', 'AWAITING_APPROVAL', 'FAILED', 'SKIPPED'
  )) DEFAULT 'PENDING',
  is_consequential INTEGER NOT NULL DEFAULT 0, -- Boolean 0 or 1
  duration_ms INTEGER DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 2,
  error_message TEXT,
  input_payload TEXT,                       -- JSON string
  output_payload TEXT,                      -- JSON string
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(mission_id, step_index)
);

-- 5. TOOL EXECUTIONS
CREATE TABLE IF NOT EXISTS tool_executions (
  id TEXT PRIMARY KEY,                       -- UUIDv4
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL REFERENCES mission_steps(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,                  -- 'document_analyze'
  protocol_session_id TEXT NOT NULL,        -- MCP Session UUID
  input_json TEXT NOT NULL,                 -- Full input arguments sent to MCP
  output_json TEXT,                         -- Full output received from MCP
  duration_ms INTEGER NOT NULL,
  is_error INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 6. APPROVALS
CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,                       -- e.g. "appr-01"
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL REFERENCES mission_steps(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  proposed_action TEXT NOT NULL,
  affected_resource TEXT NOT NULL,
  reason TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high')),
  payload TEXT NOT NULL,                    -- JSON string
  expected_effect TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN (
    'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'EXECUTED'
  )) DEFAULT 'PENDING',
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  acted_at TEXT,
  acted_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 7. VERIFICATIONS
CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK(verification_type IN ('ACTION', 'CONFLICT', 'RESULT')),
  target_id TEXT NOT NULL,                  -- step_id or mission_id
  verified INTEGER NOT NULL,                -- Boolean 1 or 0
  confidence REAL NOT NULL,
  findings_json TEXT NOT NULL,              -- JSON details
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 8. DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,                       -- e.g. "doc-roadmap-01"
  title TEXT NOT NULL,                      -- "Q4 Product Roadmap"
  file_type TEXT NOT NULL,                  -- "PDF", "DOCX", "Sheet"
  page_count INTEGER NOT NULL DEFAULT 1,
  size_mb REAL NOT NULL,
  category TEXT NOT NULL,                   -- "Meeting", "Research", "Data", "Notes", "Planning"
  summary TEXT NOT NULL,
  key_insights_json TEXT NOT NULL,          -- JSON array of strings
  action_items_json TEXT NOT NULL,          -- JSON array of strings
  raw_content TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 9. KNOWLEDGE RECORDS (FTS Index)
CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_records USING fts5(
  document_id UNINDEXED,
  title,
  category,
  content,
  summary
);

-- 10. INTEGRATIONS
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,                       -- "google-calendar", "google-drive", "gmail", etc.
  name TEXT NOT NULL,                       -- "Google Calendar"
  category TEXT NOT NULL,                   -- "Productivity", "Knowledge", "Communication", etc.
  status TEXT NOT NULL CHECK(status IN ('CONNECTED', 'NOT_CONNECTED')) DEFAULT 'NOT_CONNECTED',
  auth_config_json TEXT,                    -- Scopes, account name, token expiry
  last_synced_at TEXT
);

-- 11. ACTIVITY EVENTS (Audit Journal)
CREATE TABLE IF NOT EXISTS activity_events (
  id TEXT PRIMARY KEY,                       -- UUIDv4
  mission_id TEXT REFERENCES missions(id) ON DELETE SET NULL,
  type TEXT NOT NULL,                       -- "tool.completed", "mission.completed", etc.
  category TEXT NOT NULL CHECK(category IN ('Conversation', 'Tool', 'Integration', 'Mission', 'Knowledge')),
  title TEXT NOT NULL,                      -- "Document Analysis"
  description TEXT NOT NULL,                -- "Analyzed Q4 Product Roadmap.pdf"
  timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  duration_ms INTEGER,
  metadata_json TEXT
);
```
