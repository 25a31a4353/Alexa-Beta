import { z } from 'zod';
import { searchGoogleDrive, getGoogleDriveFile } from '../../integrations/google.mjs';

/**
 * Register Google Drive MCP tools onto an McpServer instance.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function registerDriveTools(server) {
  server.registerTool('drive_search', {
    description: 'Search authenticated Google Drive for specifications, meeting briefs, slide decks, and project roadmaps.',
    inputSchema: {
      query: z.string().describe("Filename, keyword, or topic query (e.g. 'Q4 Roadmap' or 'Architecture Specs')"),
      pageSize: z.number().optional().describe("Maximum files to retrieve (default: 5)")
    }
  }, async ({ query, pageSize }) => {
    try {
      const result = await searchGoogleDrive({ query, pageSize });
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
            error: 'DRIVE_QUERY_ERROR',
            message: err.message
          })
        }],
        isError: true
      };
    }
  });

  server.registerTool('drive_get_file', {
    description: 'Retrieve metadata and file information for a specific authorized Google Drive document by ID.',
    inputSchema: {
      fileId: z.string().describe("Google Drive file ID")
    }
  }, async ({ fileId }) => {
    try {
      const result = await getGoogleDriveFile(fileId);
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
            error: 'DRIVE_GET_FILE_ERROR',
            message: err.message
          })
        }],
        isError: true
      };
    }
  });
}
