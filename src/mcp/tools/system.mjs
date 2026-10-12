import { z } from 'zod';

/**
 * Register system diagnostic tools
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function registerSystemTools(server) {
  server.registerTool('ping', {
    description: 'Internal diagnostic tool to verify MCP protocol connectivity, latency, and transport health',
    inputSchema: {
      message: z.string().describe('Message to echo back for latency testing')
    }
  }, async ({ message }) => {
    return {
      content: [
        {
          type: 'text',
          text: `pong: ${message} (Received via Real Streamable HTTP MCP Server)`
        }
      ]
    };
  });
}
