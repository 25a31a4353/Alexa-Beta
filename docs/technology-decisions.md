# Technology Decisions & Architectural Trade-off Analysis

**Specification Version:** 1.0.0-LOCKED  
**Decision Framework:** Principal Engineering Evaluation Matrix for Hackathon Reliability & Production Polish

---

## 1. Architectural Stack Selection Matrix

| Subsystem | Candidate Options | Selected Decision | Rationale & Trade-off Analysis |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) vs. **Vite + React 19 + TypeScript** | **Vite + React 19 + TypeScript** | Next.js App Router introduces server component streaming complexities, file-system route coupling, and SSR hydration mismatches with live SSE sockets. Vite + React 19 provides sub-second HMR, pure client-side control over SSE sockets and Canvas audio visualizers, and zero SSR hydration flickering. |
| **Backend & API Server** | Express vs. Next.js API Routes vs. **Node.js + Fastify / Express** | **Node.js (TypeScript) + Express / Fastify** | Next.js API routes have execution timeout limits and awkward long-running background worker lifecycles. A dedicated Node.js application server cleanly hosts long-running agent state machines, persistent SSE streams, and in-process MCP client connections without artificial serverless execution limits. |
| **MCP Implementation** | Ad-hoc JSON-RPC vs. **Official `@modelcontextprotocol/sdk`** | **Official `@modelcontextprotocol/sdk`** | Non-negotiable hackathon requirement. Using the official TypeScript SDK ensures 100% compliance with MCP 2025-11-25 specifications, standard schema validation, and official Streamable HTTP transport adapters. |
| **MCP Transport** | stdio vs. WebSocket vs. **Modern Streamable HTTP** | **Modern Streamable HTTP** | Non-negotiable hackathon requirement. Uses the official SDK's `StreamableHTTPServerTransport` and `StreamableHTTPClientTransport` over a single `/mcp` endpoint (`http://localhost:3001/mcp`) supporting JSON-RPC POST, SSE GET, and session tracking via `mcp-session-id`. |
| **Database & Persistence** | PostgreSQL / Redis / Prisma vs. **SQLite (WAL) + better-sqlite3** | **SQLite (WAL) + `better-sqlite3`** | Zero-dependency, file-based ACID storage. Eliminates Docker/Postgres daemon connection failures during live demos. WAL mode supports concurrent reads during active tool writes. Survives browser reloads and server restarts effortlessly. |
| **Schema Validation** | Joi / Yup vs. **Zod v3.24** | **Zod v3.24** | First-class TypeScript type inference, native compatibility with `@modelcontextprotocol/sdk`, and seamless JSON Schema conversion. |
| **LLM Provider Abstraction** | Hardcoded OpenAI / Anthropic vs. **Pluggable Provider Adapter** | **Pluggable Provider Adapter (Bedrock / Anthropic / Gemini / OpenAI)** | Decouples orchestration logic from specific model APIs. Supports Amazon Bedrock as first-class provider for Amazon Developer Hackathon while allowing local fallback or alternative keys without code rewrites. |
| **Styling & UI Kit** | Tailwind CSS vs. Raw CSS Modules | **Tailwind CSS + Custom CSS Variables** | Enables rapid, pixel-perfect reproduction of the 9 reference screens from the PDF (dark slate backgrounds, Amazon orange glow, Alexa cyan accents) with zero runtime styling overhead. |

---

## 2. Explicitly Rejected Technologies (What Must NOT Be Built)

1. **No External Vector Database (Pinecone / Weaviate / Qdrant):**
   * *Rejection Rationale:* Incur network latency, paid API dependencies, and failure modes. SQLite FTS5 provides instant, deterministic search over local knowledge assets.
2. **No Redis / Memcached:**
   * *Rejection Rationale:* Unnecessary infrastructure overhead. SQLite with WAL mode handles in-process caching, state persistence, and event journaling at sub-millisecond speeds.
3. **No Kubernetes / Microservice Explosion:**
   * *Rejection Rationale:* Running 6 separate microservices across Docker containers introduces container orchestration bugs and complex networking during a hackathon demo. The system operates as a unified, clean dual-process architecture:
     * Process 1: Application Server + MCP Client + UI static host (`localhost:3000`)
     * Process 2: Self-Hosted MCP Server (`localhost:3001`)
4. **No Proprietary Auth Infrastructure (Auth0 / AWS Cognito):**
   * *Rejection Rationale:* Creates friction during evaluation. A deterministic local session profile (`Shanmukheswar / Pro Builder`) ensures seamless immediate usage without login roadblocks.
