import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.ALEXA_DB_PATH || path.resolve(__dirname, '../../alexa_plus.db');

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
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

    // Document 3: Market Trends 2026 (PDF)
    insertDoc.run(
      'doc-market-03',
      'Market Trends 2026',
      'Market_Trends_2026.pdf',
      'PDF',
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
  }
}
