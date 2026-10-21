import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.ALEXA_DB_PATH || path.resolve(__dirname, '../../alexa_plus.db');

let dbInstance = null;

function createConnection(dbPath) {
  try {
    const BetterSqlite = require('better-sqlite3');
    const db = new BetterSqlite(dbPath);
    return db;
  } catch (err) {
    // Graceful fallback to Node's built-in SQLite engine (zero native compiler dependency)
    const { DatabaseSync } = require('node:sqlite');
    const raw = new DatabaseSync(dbPath);
    return {
      exec: (sql) => raw.exec(sql),
      pragma: (str) => raw.exec(`PRAGMA ${str}`),
      prepare: (sql) => {
        const stmt = raw.prepare(sql);
        return {
          run: (...params) => stmt.run(...params),
          get: (...params) => stmt.get(...params),
          all: (...params) => stmt.all(...params)
        };
      }
    };
  }
}

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = createConnection(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db) {
  // 1. Calendar Events Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      platform TEXT NOT NULL,
      attendees TEXT NOT NULL,
      description TEXT,
      has_agenda INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  // Seed default calendar events if empty
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM calendar_events').get().count;
  if (eventCount === 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const start = new Date(tomorrow);
    start.setHours(10, 0, 0, 0);

    const end = new Date(tomorrow);
    end.setHours(11, 0, 0, 0);

    const insertStmt = db.prepare(`
      INSERT INTO calendar_events (id, title, start_time, end_time, platform, attendees, description, has_agenda)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      'evt-roadmap-01',
      'Product Roadmap Discussion',
      start.toISOString(),
      end.toISOString(),
      'Google Meet',
      JSON.stringify(['Shanmukheswar (Lead)', 'Product Manager', 'Engineering Stakeholders']),
      'Discuss Q4 product roadmap, feature prioritization, resource allocation, and alignment with stakeholder goals.',
      1
    );

    const afternoonStart = new Date(tomorrow);
    afternoonStart.setHours(14, 30, 0, 0);
    const afternoonEnd = new Date(tomorrow);
    afternoonEnd.setHours(15, 0, 0, 0);

    insertStmt.run(
      'evt-sync-02',
      'Team Architecture Sync',
      afternoonStart.toISOString(),
      afternoonEnd.toISOString(),
      'Amazon Chime',
      JSON.stringify(['Shanmukheswar (Lead)', 'AI Systems Engineer']),
      'Review MCP Streamable HTTP transport and agentic mission execution pipeline.',
      1
    );
  } else {
    // Keep seeded events aligned with tomorrow relative to current execution date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = new Date(tomorrow);
    start.setHours(10, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(11, 0, 0, 0);

    db.prepare(`UPDATE calendar_events SET start_time = ?, end_time = ? WHERE id = 'evt-roadmap-01'`)
      .run(start.toISOString(), end.toISOString());

    const afternoonStart = new Date(tomorrow);
    afternoonStart.setHours(14, 30, 0, 0);
    const afternoonEnd = new Date(tomorrow);
    afternoonEnd.setHours(15, 0, 0, 0);

    db.prepare(`UPDATE calendar_events SET start_time = ?, end_time = ? WHERE id = 'evt-sync-02'`)
      .run(afternoonStart.toISOString(), afternoonEnd.toISOString());
  }

  // 2. Documents & Knowledge Base Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      category TEXT NOT NULL,
      page_count INTEGER NOT NULL,
      size_mb REAL NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      key_insights TEXT NOT NULL,
      action_items TEXT NOT NULL,
      risks TEXT NOT NULL,
      decisions_needed TEXT NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  // Seed realistic documents if empty (matching UI reference: Screen 3, 4, 5)
  const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
  if (docCount === 0) {
    const insertDoc = db.prepare(`
      INSERT INTO documents (
        id, title, filename, file_type, category, page_count, size_mb,
        summary, content, key_insights, action_items, risks, decisions_needed, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Document 1: Q4 Product Roadmap (PDF)
    insertDoc.run(
      'doc-roadmap-01',
      'Q4 Product Roadmap',
      'Q4_Roadmap.pdf',
      'PDF',
      'Meeting',
      12,
      4.2,
      'This document outlines the Q4 product roadmap, focusing on new feature releases, market expansion, and strategic partnerships. It includes timelines, key milestones, resource allocation, and risk assessment.',
      `Q4 PRODUCT ROADMAP SPECIFICATION (2026)
1. Strategic Overview:
The primary objective of Q4 2026 is launching the Alexa+ agentic assistant track, expanding into international enterprise segments (APAC and Europe), and establishing strategic distribution partnerships.

2. Major Feature Releases:
- Agentic Mission Execution Engine (Autonomous DAG planning with MCP tool discovery)
- Streamable HTTP Transport Integration (conforming to MCP 2025-11-25 standards)
- Human-in-the-Loop Consequential Action Sign-off & Verification Subsystems

3. Resource Allocation & Timeline Dependencies:
- Backend AI Infrastructure team committed to core agent runtime delivery by Week 4.
- Integration dependencies: External Calendar and Knowledge connectors must pass compliance audits before production deployment.
- Timeline risk: International compliance certification in Europe may encounter regulatory delays without proactive legal review.

4. Open Decisions Needed for Tomorrow's Discussion:
- Decision 1: Final sign-off on resource allocation between APAC expansion and Core Agent optimization.
- Decision 2: Approval of budget increase for LLM inference token quotas.
- Decision 3: Prioritization of third-party integration connectors for enterprise launch.`,
      JSON.stringify([
        '3 major feature releases planned for Q4 2026',
        'Focus on AI-powered personalization, agentic workflows, and automation',
        'Expansion into international markets (APAC and Europe)',
        'Partnership opportunities with 5 key enterprise accounts',
        'Identified potential risks in timeline dependencies and regulatory compliance'
      ]),
      JSON.stringify([
        'Review and finalize feature specifications for Agentic Mission Engine',
        'Prepare market expansion strategy for APAC and European rollout',
        'Schedule technical alignment meetings with integration stakeholders',
        'Assess and mitigate identified timeline risks before budget review'
      ]),
      JSON.stringify([
        'Timeline dependency between core agent runtime and connector compliance',
        'Budget approval needed for expanded LLM inference capacity',
        'European regulatory compliance delay if audit is not initiated promptly'
      ]),
      JSON.stringify([
        'Resource allocation between APAC expansion and Core Agent optimization',
        'Budget approval for LLM infrastructure quotas',
        'Connector launch prioritization for Q4'
      ]),
      '2026-10-10T22:12:00.000Z'
    );

    // Document 2: Competitor Analysis (DOCX)
    insertDoc.run(
      'doc-competitor-02',
      'Competitor Analysis',
      'Competitor_Analysis.docx',
      'DOCX',
      'Research',
      8,
      2.1,
      'Comparative benchmarking of competing desktop AI agents and voice assistants, analyzing MCP adoption, autonomous execution capabilities, and enterprise privacy postures.',
      `COMPETITIVE LANDSCAPE & MARKET POSITIONING
Competitor analysis highlights that legacy voice assistants lack deterministic multi-step planning, real MCP tool discovery, and transparent human verification. By implementing official Streamable HTTP MCP and robust human approvals, Alexa+ establishes a defensible lead in trustworthy agentic task execution.`,
      JSON.stringify([
        'Competitors rely on proprietary closed tool protocols',
        'Lack of transparent human-in-the-loop verification in competing products',
        'Opportunity to dominate developer-friendly MCP ecosystem'
      ]),
      JSON.stringify([
        'Incorporate competitive benchmark graphs into executive summary',
        'Highlight security and approval advantages in product brief'
      ]),
      JSON.stringify([
        'Aggressive pricing from competing cloud assistants'
      ]),
      JSON.stringify([
        'Open vs closed ecosystem positioning'
      ]),
      '2026-10-09T18:00:00.000Z'
    );

    // Document 3: Market Trends 2026 (Sheet / Data)
    insertDoc.run(
      'doc-market-03',
      'Market Trends 2026',
      'Market_Trends_2026.xlsx',
      'Sheet',
      'Data',
      15,
      3.5,
      'Macro trends in agentic AI, enterprise productivity adoption, and autonomous workflow tooling.',
      `2026 MARKET TRENDS IN AGENTIC SYSTEMS
Enterprise demand for autonomous agents increased 340% year-over-year. Organizations demand mission-execution platforms rather than generic conversational chatbots. Core requirements are auditability, verification, and protocol-level tool interoperability.`,
      JSON.stringify([
        'Rapid shift from chat interfaces to mission dashboards',
        'Protocol standards like MCP becoming mandatory in enterprise RFPs'
      ]),
      JSON.stringify([
        'Align Alexa+ pitch deck with enterprise mission execution demand'
      ]),
      JSON.stringify([
        'Customer friction if agent actions cannot be verified'
      ]),
      JSON.stringify([]),
      '2026-10-08T14:30:00.000Z'
    );

    // Document 4: Investor Meeting Notes (PDF)
    insertDoc.run(
      'doc-investor-04',
      'Investor Meeting Notes',
      'Investor_Meeting_Notes.pdf',
      'PDF',
      'Notes',
      6,
      1.8,
      'Executive debrief on capital allocation, Series B timelines, and compute budget expansions.',
      `INVESTOR ALIGNMENT & CAPITAL RUNWAY
Strategic investors unanimously approved compute resource allocations for autonomous agentic tooling. Runway is secured through late 2027.`,
      JSON.stringify([
        'Extended runway through 2027 confirmed',
        'Strong investor support for open protocol-driven MCP strategy'
      ]),
      JSON.stringify([
        'Finalize investor deck for Series B review',
        'Schedule quarterly board audit'
      ]),
      JSON.stringify([
        'Macro market fluctuations in AI valuations'
      ]),
      JSON.stringify([
        'Compute quota budget caps'
      ]),
      '2026-10-07T11:00:00.000Z'
    );

    // Document 5: Product Requirements (DOCX)
    insertDoc.run(
      'doc-prd-05',
      'Product Requirements',
      'Product_Requirements.docx',
      'DOCX',
      'Planning',
      15,
      3.2,
      'Full technical requirements specification for Alexa+ autonomous multi-step execution platform.',
      `PRODUCT REQUIREMENTS SPECIFICATION
Comprehensive architecture for multi-tool orchestration, Streamable HTTP MCP connections, and audit telemetry.`,
      JSON.stringify([
        'Full conformance with official MCP 2025-11-25 specifications',
        'Human-in-the-loop verification required for sensitive actions'
      ]),
      JSON.stringify([
        'Review and finalize feature specifications',
        'Prepare market expansion strategy for APAC',
        'Schedule partnership discussions',
        'Assess and mitigate identified risks'
      ]),
      JSON.stringify([
        'High concurrency tool execution latency'
      ]),
      JSON.stringify([
        'Approval gate thresholds'
      ]),
      '2026-10-05T09:30:00.000Z'
    );
  }

  // 3. Conversations Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      model_id TEXT NOT NULL DEFAULT 'gpt-4o',
      status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'ARCHIVED')) DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  // 4. Missions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      goal TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN (
        'CREATED', 'UNDERSTANDING', 'PLANNING', 'EXECUTING', 'VERIFYING', 'COMPLETED', 'FAILED'
      )) DEFAULT 'CREATED',
      duration_ms INTEGER DEFAULT 0,
      result_summary TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_missions_conv ON missions(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
  `);

  // 5. Mission Steps Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mission_steps (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
      step_index INTEGER NOT NULL,
      label TEXT NOT NULL,
      domain TEXT NOT NULL DEFAULT 'SYSTEM',
      assigned_tool TEXT,
      status TEXT NOT NULL CHECK(status IN (
        'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
      )) DEFAULT 'PENDING',
      duration_ms INTEGER DEFAULT 0,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_steps_mission ON mission_steps(mission_id);
  `);

  // 6. Tool Executions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tool_executions (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
      step_id TEXT REFERENCES mission_steps(id) ON DELETE SET NULL,
      tool_name TEXT NOT NULL,
      arguments TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN (
        'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
      )) DEFAULT 'PENDING',
      output TEXT,
      error_message TEXT,
      duration_ms INTEGER DEFAULT 0,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tool_exec_mission ON tool_executions(mission_id);
  `);

  // 7. Activity Events Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      mission_id TEXT REFERENCES missions(id) ON DELETE CASCADE,
      conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      domain TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'INFO',
      metadata TEXT,
      is_synthetic INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_activity_mission ON activity_events(mission_id);
    CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_events(created_at);
  `);

  // 8. Integrations Table (Strict distinction between real vs demo data)
  db.exec(`
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN (
        'NOT_CONNECTED', 'AVAILABLE', 'DEMO', 'COMING_SOON', 'CONNECTED'
      )) DEFAULT 'NOT_CONNECTED',
      account_email TEXT,
      is_synthetic INTEGER NOT NULL DEFAULT 0,
      last_sync_at TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  // Seed standard integrations if empty
  const integrationCount = db.prepare('SELECT COUNT(*) as count FROM integrations').get().count;
  if (integrationCount === 0) {
    const insertIntegration = db.prepare(`
      INSERT INTO integrations (id, name, category, status, account_email, is_synthetic, last_sync_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Explicitly labeled DEMO/AVAILABLE states (NEVER fake genuine unauthenticated connection)
    insertIntegration.run('google-calendar', 'Google Calendar', 'Productivity', 'DEMO', 'shanmukheswaramedicharla@gmail.com', 1, new Date().toISOString());
    insertIntegration.run('google-drive', 'Google Drive', 'Knowledge', 'DEMO', 'shanmukheswaramedicharla@gmail.com', 1, new Date().toISOString());
    insertIntegration.run('gmail', 'Gmail', 'Communication', 'AVAILABLE', null, 1, null);
    insertIntegration.run('notion', 'Notion', 'Knowledge', 'AVAILABLE', null, 1, null);
    insertIntegration.run('slack', 'Slack', 'Communication', 'NOT_CONNECTED', null, 1, null);
    insertIntegration.run('github', 'GitHub', 'Development', 'NOT_CONNECTED', null, 1, null);
    insertIntegration.run('google-maps', 'Google Maps', 'Data', 'NOT_CONNECTED', null, 1, null);
    insertIntegration.run('outlook', 'Microsoft Outlook', 'Communication', 'NOT_CONNECTED', null, 1, null);
    insertIntegration.run('figma', 'Figma', 'Development', 'NOT_CONNECTED', null, 1, null);
  }
}

// =========================================================================
// REPOSITORY DATA ACCESS HELPERS
// =========================================================================

export function createConversation({ id, title, modelId = 'gpt-4o' }) {
  const db = getDatabase();
  const convId = id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  db.prepare(`
    INSERT INTO conversations (id, title, model_id, status)
    VALUES (?, ?, ?, 'ACTIVE')
  `).run(convId, title, modelId);
  return getConversation(convId);
}

export function getConversation(id) {
  if (!id) return null;
  const db = getDatabase();
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) || null;
}

export function listConversations() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC').all();
}

export function createMission({ id, conversationId, title, goal }) {
  const db = getDatabase();
  const missionId = id || `msn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  // Ensure conversation exists or create default
  let conv = getConversation(conversationId);
  if (!conv) {
    conv = createConversation({ id: conversationId, title: title || goal });
  }

  db.prepare(`
    INSERT INTO missions (id, conversation_id, title, goal, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'CREATED', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  `).run(missionId, conv.id, title || goal, goal);

  return getMission(missionId);
}

export function updateMission(id, updates) {
  const db = getDatabase();
  const fields = [];
  const values = [];

  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(val);
  }

  fields.push(`updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`);
  values.push(id);

  db.prepare(`UPDATE missions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getMission(id);
}

export function getMission(id) {
  if (!id) return null;
  const db = getDatabase();
  return db.prepare('SELECT * FROM missions WHERE id = ?').get(id) || null;
}

export function getMissionWithDetails(id) {
  if (!id) return null;
  const db = getDatabase();
  const mission = getMission(id);
  if (!mission) return null;

  const steps = db.prepare('SELECT * FROM mission_steps WHERE mission_id = ? ORDER BY step_index ASC').all(id);
  const toolExecutions = db.prepare('SELECT * FROM tool_executions WHERE mission_id = ? ORDER BY created_at ASC').all(id);
  const activityEvents = db.prepare('SELECT * FROM activity_events WHERE mission_id = ? ORDER BY created_at ASC').all(id);

  return {
    ...mission,
    steps,
    toolExecutions: toolExecutions.map(te => ({
      ...te,
      arguments: (() => { try { return JSON.parse(te.arguments); } catch { return te.arguments; } })(),
      output: (() => { try { return JSON.parse(te.output); } catch { return te.output; } })()
    })),
    activityEvents: activityEvents.map(ae => ({
      ...ae,
      metadata: (() => { try { return JSON.parse(ae.metadata); } catch { return ae.metadata; } })()
    }))
  };
}

export function createMissionStep({ id, missionId, stepIndex, label, domain = 'SYSTEM', assignedTool = null, status = 'PENDING' }) {
  const db = getDatabase();
  const stepId = id || `step_${missionId}_${stepIndex}`;
  db.prepare(`
    INSERT INTO mission_steps (id, mission_id, step_index, label, domain, assigned_tool, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  `).run(stepId, missionId, stepIndex, label, domain, assignedTool, status);

  return db.prepare('SELECT * FROM mission_steps WHERE id = ?').get(stepId);
}

export function updateMissionStep(id, updates) {
  const db = getDatabase();
  const fields = [];
  const values = [];

  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(val);
  }
  values.push(id);

  db.prepare(`UPDATE mission_steps SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM mission_steps WHERE id = ?').get(id);
}

export function recordToolExecution({ id, missionId, stepId = null, toolName, arguments: args, status = 'RUNNING', startedAt = new Date().toISOString() }) {
  const db = getDatabase();
  const execId = id || `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const argStr = typeof args === 'string' ? args : JSON.stringify(args);

  db.prepare(`
    INSERT INTO tool_executions (id, mission_id, step_id, tool_name, arguments, status, started_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  `).run(execId, missionId, stepId, toolName, argStr, status, startedAt);

  return db.prepare('SELECT * FROM tool_executions WHERE id = ?').get(execId);
}

export function updateToolExecution(id, updates) {
  const db = getDatabase();
  const fields = [];
  const values = [];

  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    if (key === 'output' && typeof val === 'object' && val !== null) {
      values.push(JSON.stringify(val));
    } else {
      values.push(val);
    }
  }
  values.push(id);

  db.prepare(`UPDATE tool_executions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM tool_executions WHERE id = ?').get(id);
}

export function recordActivityEvent({ id, missionId = null, conversationId = null, eventType, title, description, domain, status = 'INFO', metadata = null, isSynthetic = 0 }) {
  const db = getDatabase();
  const eventId = id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const metaStr = metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null;

  db.prepare(`
    INSERT INTO activity_events (id, mission_id, conversation_id, event_type, title, description, domain, status, metadata, is_synthetic, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  `).run(eventId, missionId, conversationId, eventType, title, description, domain, status, metaStr, isSynthetic ? 1 : 0);

  return db.prepare('SELECT * FROM activity_events WHERE id = ?').get(eventId);
}

export function getActivityEvents({ limit = 50, domain = null, isSynthetic = null } = {}) {
  const db = getDatabase();
  let sql = 'SELECT * FROM activity_events WHERE 1=1';
  const params = [];

  if (domain) {
    sql += ' AND domain = ?';
    params.push(domain);
  }
  if (isSynthetic !== null) {
    sql += ' AND is_synthetic = ?';
    params.push(isSynthetic ? 1 : 0);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  return db.prepare(sql).all(...params);
}

export function listIntegrations() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM integrations ORDER BY name ASC').all();
}

export function getIntegration(id) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM integrations WHERE id = ?').get(id) || null;
}
