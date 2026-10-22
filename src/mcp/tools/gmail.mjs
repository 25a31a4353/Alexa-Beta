import { z } from 'zod';
import { searchGmail, getGmailMessage } from '../../integrations/google.mjs';

/**
 * Register Gmail MCP tools onto an McpServer instance.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function registerGmailTools(server) {
  server.registerTool('gmail_search', {
    description: 'Search authenticated Gmail inbox for messages matching meeting titles, attendee emails, project keywords, or discussion topics.',
    inputSchema: {
      query: z.string().describe("Search keywords, sender email, or subject query (e.g. 'Product Roadmap' or 'from:alex@example.com')"),
      maxResults: z.number().optional().describe("Maximum number of messages to inspect (default: 5)")
    }
  }, async ({ query, maxResults }) => {
    try {
      const result = await searchGmail({ query, maxResults });
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
            error: 'GMAIL_QUERY_ERROR',
            message: err.message
          })
        }],
        isError: true
      };
    }
  });

  server.registerTool('gmail_get_message', {
    description: 'Retrieve detailed metadata and sanitized snippet of a specific Gmail message by ID.',
    inputSchema: {
      messageId: z.string().describe("Gmail message ID")
    }
  }, async ({ messageId }) => {
    try {
      const result = await getGmailMessage(messageId);
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
            error: 'GMAIL_GET_MESSAGE_ERROR',
            message: err.message
          })
        }],
        isError: true
      };
    }
  });
}
