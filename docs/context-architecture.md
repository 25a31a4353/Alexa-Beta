# Context Architecture & Memory Tier Specification

**Specification Version:** 1.0.0-LOCKED  
**Storage Architecture:** Tiered Ephemeral & Relational Context Model  
**Datastore:** SQLite with FTS5 (Full-Text Search) In-Process Storage

---

## 1. Six-Tier Context Hierarchy

To avoid context pollution, token exhaustion, and latency degradation, the agent segregates information into **six distinct context tiers**. Information flows strictly through explicit boundaries rather than dumping raw history into prompt windows.

```
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 1: PERSISTED LONG-TERM CONTEXT (Storage: SQLite Database)         │
│ - User profile (Shanmukheswar, Pro Builder, preferences, language)     │
│ - Historical mission summaries, completed checklists                   │
│ - Connected integration states & token metadata                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Hydrates on session init
┌───────────────────────────────────▼────────────────────────────────────┐
│ TIER 2: RECENT CONVERSATION CONTEXT (Storage: SQLite / Memory Cache)   │
│ - Last 10 turns of active dialogue in the current thread               │
│ - User queries, clarifications, and assistant responses                │
│ - Stripped of raw tool payloads (only semantic summaries kept)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Seeds objective decomposition
┌───────────────────────────────────▼────────────────────────────────────┐
│ TIER 3: MISSION CONTEXT (Storage: Mission State Record)                │
│ - Root objective text & extracted constraints                          │
│ - High-level execution plan (list of 5–7 numbered steps)               │
│ - Extracted entity store (e.g. "Meeting: Product Roadmap Discussion")  │
│ - Overall mission status, start time, cumulative duration              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Scopes step execution
┌───────────────────────────────────▼────────────────────────────────────┐
│ TIER 4: WORKING CONTEXT (Storage: In-Memory Orchestrator Session)      │
│ - Intermediate extracted findings across executed steps                │
│ - Key topics, identified risks, action item accumulators               │
│ - Discovered document IDs and citation pointers                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Passes to active task node
┌───────────────────────────────────▼────────────────────────────────────┐
│ TIER 5: TASK CONTEXT (Storage: Active Step Record)                     │
│ - Target capability requirement & assigned MCP tool                    │
│ - Filtered input parameters computed from ancestor task outputs        │
│ - Retry count, timeout limits, and approval status                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Transmitted over Streamable HTTP
┌───────────────────────────────────▼────────────────────────────────────┐
│ TIER 6: TOOL EXECUTION CONTEXT (Storage: Transient Protocol Frame)     │
│ - Raw JSON-RPC input payload transmitted to MCP Server                 │
│ - Raw JSON-RPC output payload received from MCP Server                 │
│ - Isolated to MCP execution sandbox; logged to `tool_executions` table │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Knowledge Retrieval Design (Pragmatic vs Bloated RAG)

### Architectural Anti-Pattern Rejected
We explicitly reject setting up an external vector database (Pinecone, Weaviate, Qdrant) or complex semantic chunking pipelines for a desktop/hackathon assistant. Such systems add points of failure, cold-start latency, and external API cost while distracting from real agentic orchestration.

### Pragmatic Knowledge Engine
1. **Relational + Lexical Storage:** Documents (`Q4_Roadmap.pdf`, `Competitor_Analysis.docx`) are ingested into SQLite with structured extraction:
   * Metadata (file type, page count, size, category).
   * Structured Sections (Document Summary, Key Insights, Action Items).
   * Full text indexed via SQLite `FTS5` virtual table.
2. **Deterministic Lookup:** When the agent runs `knowledge_search`, it executes high-speed BM25/FTS5 queries against title, categories, and extracted summaries.
3. **Targeted Extraction:** `document_analyze` receives exact targeted sections or summaries rather than thousands of uncompressed raw pages, preserving LLM attention and token budget.
