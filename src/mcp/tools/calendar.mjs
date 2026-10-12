import { z } from 'zod';
import { getDatabase } from '../../db/index.mjs';

/**
 * Register the Calendar tool domain onto an McpServer instance
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function registerCalendarTools(server) {
  server.registerTool('calendar_get_events', {
    description: 'Retrieve upcoming meetings, calendar events, schedules, platforms, and attendee details from the connected calendar within an ISO 8601 time window.',
    inputSchema: {
      startDate: z.string().describe("ISO 8601 start timestamp filter (e.g. '2026-10-13T00:00:00.000Z')"),
      endDate: z.string().describe("ISO 8601 end timestamp filter (e.g. '2026-10-13T23:59:59.999Z')"),
      query: z.string().optional().describe("Optional search keyword to filter meeting title, description, or attendees")
    }
  }, async ({ startDate, endDate, query }) => {
    // 1. Validate temporal sanity
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();

    if (isNaN(startTime) || isNaN(endTime)) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'INVALID_TIMESTAMP',
              message: 'Both startDate and endDate must be valid ISO 8601 date strings.'
            })
          }
        ],
        isError: true
      };
    }

    if (startTime > endTime) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'INVALID_DATE_RANGE',
              message: `startDate (${startDate}) cannot be after endDate (${endDate}).`
            })
          }
        ],
        isError: true
      };
    }

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
        platform: row.platform,
        attendees: JSON.parse(row.attendees || '[]'),
        description: row.description,
        hasAgenda: Boolean(row.has_agenda)
      }));

      const resultPayload = {
        totalEvents: events.length,
        timeRange: {
          startDate: new Date(startTime).toISOString(),
          endDate: new Date(endTime).toISOString()
        },
        queryFilter: query || null,
        events
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(resultPayload, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'DATABASE_QUERY_ERROR',
              message: err.message
            })
          }
        ],
        isError: true
      };
    }
  });
}
