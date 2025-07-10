import { McpAgent, McpServer, StreamingResponse } from "@modelcontext/server";
import { z } from "zod";

/**
 * TimeMCP is an agent that provides tools for fetching the current time and date.
 */
export class TimeMCP extends McpAgent {
  // Initialize the MCP Server with a name and version
  server = new McpServer({
    name: "Time MCP Server",
    version: "1.2.0", // Incremented version for the new feature
  });

  constructor() {
    super();
    this.init();
  }

  /**
   * Initializes the agent and its tools.
   */
  async init() {
    // Define the tool for getting the current time and date
    this.server.tool(
      "get_current_time_and_date",
      "Fetches the current time and date for a specified timezone. Defaults to UTC if no timezone is provided.",
      {
        // Define the input schema using zod
        timezone: z.string().optional().describe(
          "Optional IANA timezone name (e.g., 'America/New_York', 'Europe/Paris'). Defaults to UTC."
        ),
      },
      async ({ timezone }) => {
        try {
          // Create a new Date object to get the current time
          const now = new Date();
          const effectiveTimezone = timezone || 'UTC'; // Default to UTC if not provided

          // Format the date and time
          const isoString = now.toISOString(); // Always provide the standard UTC time
          const readableString = now.toLocaleString("en-US", {
            timeZone: effectiveTimezone,
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZoneName: 'short'
          });

          // Structure the response payload
          const timeData = {
            success: true,
            timestamp_utc: isoString,
            requested_timezone: effectiveTimezone,
            readable_time: readableString,
            message: `Successfully fetched the current time for ${effectiveTimezone}.`,
          };

          // Return the data in the expected MCP content format
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(timeData, null, 2),
              },
            ],
          };
        } catch (error) {
          // Handle invalid timezone identifiers gracefully
          if (error instanceof RangeError) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `Invalid timezone provided: '${timezone}'. Please use a valid IANA timezone name.`,
                    timestamp_utc: new Date().toISOString()
                  }, null, 2),
                },
              ],
            };
          }

          // Handle other unexpected errors
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: "An unexpected error occurred.",
                  details: error instanceof Error ? error.message : "Unknown error",
                  timestamp_utc: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }
      },
    );
  }
}

// Default export for Cloudflare Workers
export default {
  // Mount the MCP Agent to handle requests at the specified path
  fetch: TimeMCP.mount("/mcp"),
};
