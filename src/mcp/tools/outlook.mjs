import { z } from 'zod';
import { getOutlookMessages, getOutlookMessage } from '../../integrations/microsoft.mjs';

/**
 * Register Microsoft Outlook MCP tools onto an McpServer instance.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function registerOutlookTools(server) {
  server.registerTool('outlook_search', {
    description: 'Search authenticated Microsoft Outlook inbox for messages matching meeting agendas, sender addresses, or project keywords via Microsoft Graph.',
    inputSchema: {
      query: z.string().describe("Search keywords, sender, or subject query (e.g. 'Roadmap review')"),
      maxResults: z.number().optional().describe("Maximum messages to retrieve (default: 5)")
    }
  }, async ({ query, maxResults }) => {
    try {
      const result = await getOutlookMessages({ query, maxResults });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'OUTLOOK_QUERY_ERROR',
            message: err.message
          })
        }],
        isError: true
      };
    }
  });

  server.registerTool('outlook_get_message', {
    description: 'Retrieve detailed metadata and body preview of a specific Outlook email message by ID.',
    inputSchema: {
      messageId: z.string().describe("Microsoft Graph message ID")
    }
  }, async ({ messageId }) => {
    try {
      const result = await getOutlookMessage(messageId);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'OUTLOOK_GET_MESSAGE_ERROR',
            message: err.message
          })
        }],
        isError: true
      };
    }
  });
}
