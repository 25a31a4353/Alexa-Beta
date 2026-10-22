import { z } from 'zod';
import { getDatabase } from '../../db/index.mjs';
import { getGoogleCalendarEvents } from '../../integrations/google.mjs';
import { getMicrosoftCalendarEvents } from '../../integrations/microsoft.mjs';
import { getOAuthTokens } from '../../integrations/tokenStore.mjs';

/**
 * Register Calendar tools onto an McpServer instance.
 * Automatically leverages live Google Calendar or Microsoft Calendar if authenticated,
 * falling back transparently to the Local MCP Dataset if no cloud OAuth connection is active.
 *
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function registerCalendarTools(server) {
  // 1. Primary Unified Calendar Tool
  server.registerTool('calendar_get_events', {
    description: 'Retrieve upcoming meetings, calendar events, schedules, platforms, and attendee details. Automatically routes to connected Google Calendar or Microsoft 365 Calendar if authorized, or uses the Local MCP Dataset fallback.',
    inputSchema: {
      startDate: z.string().describe("ISO 8601 start timestamp filter (e.g. '2026-10-23T00:00:00.000Z')"),
      endDate: z.string().describe("ISO 8601 end timestamp filter (e.g. '2026-10-23T23:59:59.999Z')"),
      query: z.string().optional().describe("Optional search keyword to filter meeting title, description, or attendees")
    }
  }, async ({ startDate, endDate, query }) => {
    // 1. Validate temporal sanity
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();

    if (isNaN(startTime) || isNaN(endTime)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'INVALID_TIMESTAMP',
            message: 'Both startDate and endDate must be valid ISO 8601 date strings.'
          })
        }],
        isError: true
      };
    }

    if (startTime > endTime) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'INVALID_DATE_RANGE',
            message: `startDate (${startDate}) cannot be after endDate (${endDate}).`
          })
        }],
        isError: true
      };
    }

    // A. Priority 1: Real Google Calendar OAuth
    const googleTokens = getOAuthTokens('google');
    if (googleTokens && googleTokens.accessToken) {
      try {
        const liveGoogleEvents = await getGoogleCalendarEvents({ startDate, endDate, query });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(liveGoogleEvents, null, 2)
          }]
        };
      } catch (googleErr) {
        console.warn('[Calendar MCP] Google Calendar API call failed, falling back:', googleErr.message);
      }
    }

    // B. Priority 2: Real Microsoft 365 Calendar OAuth
    const msTokens = getOAuthTokens('microsoft');
    if (msTokens && msTokens.accessToken) {
      try {
        const liveMsEvents = await getMicrosoftCalendarEvents({ startDate, endDate, query });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(liveMsEvents, null, 2)
          }]
        };
      } catch (msErr) {
        console.warn('[Calendar MCP] Microsoft Calendar API call failed, falling back:', msErr.message);
      }
    }

    // C. Grounded Fallback: Local MCP Dataset
    try {
      const db = getDatabase();

      let sql = `
        SELECT id, title, start_time, end_time, platform, attendees, description, has_agenda
        FROM calendar_events
        WHERE start_time >= ? AND start_time <= ?
      `;
      const params = [new Date(startTime).toISOString(), new Date(endTime).toISOString()];

      if (query && query.trim().length > 0) {
        sql += ` AND (title LIKE ? OR description LIKE ? OR attendees LIKE ?)`;
        const wildcard = `%${query.trim()}%`;
        params.push(wildcard, wildcard, wildcard);
      }

      sql += ` ORDER BY start_time ASC`;

      const rows = db.prepare(sql).all(...params);

      const events = rows.map(row => ({
        eventId: row.id,
        title: row.title,
        startTime: row.start_time,
        endTime: row.end_time,
        timezone: 'UTC',
        platform: row.platform,
        location: null,
        attendees: JSON.parse(row.attendees || '[]'),
        organizer: null,
        description: row.description,
        source: 'Local MCP Dataset',
        provider: 'local_sqlite'
      }));

      const resultPayload = {
        totalEvents: events.length,
        timeRange: {
          startDate: new Date(startTime).toISOString(),
          endDate: new Date(endTime).toISOString()
        },
        queryFilter: query || null,
        source: 'Local MCP Dataset',
        provider: 'local_sqlite',
        events
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(resultPayload, null, 2)
        }]
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'CALENDAR_QUERY_ERROR',
            message: err.message
          })
        }],
        isError: true
      };
    }
  });

  // 2. Dedicated Microsoft 365 Calendar Tool
  server.registerTool('outlook_calendar_get_events', {
    description: 'Retrieve corporate calendar events directly from authenticated Microsoft 365 Calendar via Microsoft Graph API.',
    inputSchema: {
      startDate: z.string().describe("ISO 8601 start timestamp filter"),
      endDate: z.string().describe("ISO 8601 end timestamp filter"),
      query: z.string().optional().describe("Optional search keyword")
    }
  }, async ({ startDate, endDate, query }) => {
    try {
      const result = await getMicrosoftCalendarEvents({ startDate, endDate, query });
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
            error: 'MICROSOFT_CALENDAR_UNAVAILABLE',
            message: err.message
          })
        }],
        isError: true
      };
    }
  });
}
