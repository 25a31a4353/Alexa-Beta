import { registerCalendarTools } from './calendar.mjs';
import { registerGmailTools } from './gmail.mjs';
import { registerDriveTools } from './drive.mjs';
import { registerOutlookTools } from './outlook.mjs';
import { registerKnowledgeTools } from './knowledge.mjs';
import { registerSystemTools } from './system.mjs';

/**
 * Modular tool registry: registers all active domain tools onto an McpServer instance.
 * Dynamically discovered by AgentOrchestrator via tools/list.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function registerAllTools(server) {
  // Domain: External Services / Calendar (Google & Microsoft 365)
  registerCalendarTools(server);

  // Domain: Communication / Email (Gmail)
  registerGmailTools(server);

  // Domain: Knowledge & Cloud Storage (Google Drive)
  registerDriveTools(server);

  // Domain: Communication / Microsoft Outlook
  registerOutlookTools(server);

  // Domain: Knowledge & Document Intelligence (Local & Analyzers)
  registerKnowledgeTools(server);

  // Domain: System Diagnostics (ping)
  registerSystemTools(server);
}
