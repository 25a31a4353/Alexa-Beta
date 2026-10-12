import { registerCalendarTools } from './calendar.mjs';
import { registerKnowledgeTools } from './knowledge.mjs';
import { registerSystemTools } from './system.mjs';

/**
 * Modular tool registry: registers all active domain tools onto an McpServer instance
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function registerAllTools(server) {
  // Domain: External Services / Calendar
  registerCalendarTools(server);

  // Domain: Knowledge & Document Intelligence
  registerKnowledgeTools(server);

  // Domain: System Diagnostics (ping)
  registerSystemTools(server);
}
