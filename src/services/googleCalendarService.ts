import {
  isDevelopment,
  sanitizeString,
  validateDateRange,
  validateEventId
} from "@utils/securityUtils";
import { tokenManager } from "@utils/tokenManager";
import { deleteSubtask, getSubtasksByTask } from "./focusFrameSubtaskService";
import { getTasksByUser } from "./focusFrameTaskService";
import { getStoredUserId } from "./focusFrameUserService";

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

export interface CalendarEventResponse extends CalendarEvent {
  id: string;
  created: string;
  updated: string;
  htmlLink: string;
  status: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string;
      uri?: string;
    }>;
  };
}

class GoogleCalendarService {
  private baseUrl = "https://www.googleapis.com/calendar/v3";

  /**
   * Get access token from Google Sign-In (with caching)
   */
  private async getAccessToken(): Promise<string> {
    return tokenManager.getAccessToken();
  }

  /**
   * Make API request to Google Calendar
   */
  private async makeRequest(
    endpoint: string,
    method: string = "GET",
    body?: any,
  ): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `API error: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error: any) {
      // Only log detailed errors in development
      if (isDevelopment()) {
        console.error("API Request Error:", error);
      }
      // Trigger global logout if token error
      if (
        typeof error?.message === "string" &&
        error.message.includes("Failed to get access token. Please sign in again.")
      ) {
        // Dynamically import to avoid circular dependency
        const { triggerGlobalLogout } = await import("@utils/globalLogout");
        triggerGlobalLogout("Your Google session has expired. Please sign in again.");
      }
      throw error;
    }
  }
  async listEvents(
    maxResults: number = 10,
    orderBy: string = "startTime",
  ): Promise<CalendarEventResponse[]> {
    try {
      const now = new Date().toISOString();
      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        orderBy,
        singleEvents: "true",
        timeMin: now,
      });

      const data = await this.makeRequest(
        `/calendars/primary/events?${params.toString()}`,
      );
      return data.items || [];
    } catch (error) {
      console.error("Error listing events:", error);
      throw error;
    }
  }

  /**
   * GET: Get a specific event by ID
   */
  async getEvent(eventId: string): Promise<CalendarEventResponse> {
    try {
      validateEventId(eventId);
      const data = await this.makeRequest(
        `/calendars/primary/events/${eventId}`,
      );
      return data;
    } catch (error) {
      if (isDevelopment()) {
        console.error("Error getting event:", error);
      }
      throw error;
    }
  }

  /**
   * CREATE: Add a new event to the calendar
   */
  async createEvent(event: CalendarEvent): Promise<CalendarEventResponse> {
    try {
      const data = await this.makeRequest(
        "/calendars/primary/events",
        "POST",
        event,
      );
      return data;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  }

  /**
   * UPDATE: Modify an existing event
   */
  async updateEvent(
    eventId: string,
    updates: Partial<CalendarEvent>,
  ): Promise<CalendarEventResponse> {
    try {
      const data = await this.makeRequest(
        `/calendars/primary/events/${eventId}`,
        "PUT",
        updates,
      );
      return data;
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  }

  /**
   * DELETE: Remove an event from the calendar
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      validateEventId(eventId);
      await this.makeRequest(`/calendars/primary/events/${eventId}`, "DELETE");
    } catch (error) {
      if (isDevelopment()) {
        console.error("Error deleting event:", error);
      }
      throw error;
    }
  }

  /**
   * Get events for a specific date range
   */
  async getEventsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<CalendarEventResponse[]> {
    try {
      validateDateRange(startDate, endDate);

      const params = new URLSearchParams({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: "true",
        orderBy: "startTime",
      });

      const data = await this.makeRequest(
        `/calendars/primary/events?${params.toString()}`,
      );
      return data.items || [];
    } catch (error) {
      if (isDevelopment()) {
        console.error("Error getting events by date range:", error);
      }
      throw error;
    }
  }

  /**
   * Search for events by summary
   */
  async searchEvents(query: string): Promise<CalendarEventResponse[]> {
    try {
      // Validate and sanitize search query
      const sanitizedQuery = sanitizeString(query, 256);

      const params = new URLSearchParams({
        q: sanitizedQuery,
        singleEvents: "true",
      });

      const data = await this.makeRequest(
        `/calendars/primary/events?${params.toString()}`,
      );
      return data.items || [];
    } catch (error) {
      if (isDevelopment()) {
        console.error("Error searching events:", error);
      }
      throw error;
    }
  }

  /**
   * Quick add event using text (e.g., "Meeting tomorrow at 3pm")
   */
  async quickAddEvent(text: string): Promise<CalendarEventResponse> {
    try {
      // Validate and sanitize text input
      const sanitizedText = sanitizeString(text, 500);

      const data = await this.makeRequest(
        "/calendars/primary/events/quickAdd",
        "POST",
        { text: sanitizedText },
      );
      return data;
    } catch (error) {
      if (isDevelopment()) {
        console.error("Error quick adding event:", error);
      }
      throw error;
    }
  }

  /**
   * Get all calendars in the account
   */
  async listCalendars(): Promise<any[]> {
    try {
      const data = await this.makeRequest("/users/me/calendarList");
      return data.items || [];
    } catch (error) {
      console.error("Error listing calendars:", error);
      throw error;
    }
  }

  async getEvents(maxResults: number = 10): Promise<CalendarEventResponse[]> {
    try {
      const accessToken = await this.getAccessToken();

      const timeMin = new Date().toISOString();
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
          `maxResults=${maxResults}&` +
          `timeMin=${timeMin}&` +
          `orderBy=startTime&` +
          `singleEvents=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      throw error;
    }
  }

  /**
   * Delete all events from 2 weeks (Monday of this week to Sunday of next week)
   * Also deletes corresponding subtasks from the database
   * Automatically calculates the date range for current + next week
   */
  async deleteNextWeekEvents(): Promise<{ deleted: number; failed: number; dbDeleted: number; dbFailed: number }> {
    try {
      // Calculate 2 weeks date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find this week's Monday
      const dayOfWeek = today.getDay();
      const daysBackToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const thisMonday = new Date(today);
      thisMonday.setDate(today.getDate() - daysBackToMonday);
      
      // 2 weeks = Monday of this week to Sunday of next week (13 days later)
      const twoWeeksSunday = new Date(thisMonday);
      twoWeeksSunday.setDate(thisMonday.getDate() + 13);
      twoWeeksSunday.setHours(23, 59, 59, 999);

      console.log(`[deleteThisWeekEvents] Date range (2 weeks): ${thisMonday.toISOString()} to ${twoWeeksSunday.toISOString()}`);

      // Get all user's tasks and subtasks for 2 weeks
      let dbDeleted = 0;
      let dbFailed = 0;
      
      try {
        const userId = await getStoredUserId();
        if (userId) {
          const tasks = await getTasksByUser(userId);
          console.log(`[deleteThisWeekEvents] Found ${tasks.length} tasks for user`);

          for (const task of tasks) {
            try {
              const subtasks = await getSubtasksByTask(task.id);
              console.log(`[deleteThisWeekEvents] Task ${task.id} has ${subtasks.length} subtasks`);

              for (const subtask of subtasks) {
                // Check if subtask falls within 2 weeks
                if (!subtask.startTime) continue;
                const subtaskDate = new Date(subtask.startTime);
                if (subtaskDate >= thisMonday && subtaskDate <= twoWeeksSunday) {
                  try {
                    console.log(`[deleteThisWeekEvents] Deleting DB subtask: ${subtask.id} - ${subtask.name}`);
                    await deleteSubtask(subtask.id);
                    console.log(`[deleteThisWeekEvents] ✓ Successfully deleted DB subtask: ${subtask.id}`);
                    dbDeleted++;
                  } catch (error) {
                    console.error(`[deleteThisWeekEvents] ✗ Failed to delete DB subtask ${subtask.id}:`, error);
                    dbFailed++;
                  }
                }
              }
            } catch (error) {
              console.error(`[deleteThisWeekEvents] Error getting subtasks for task ${task.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error("[deleteThisWeekEvents] Error deleting database subtasks:", error);
      }

      // Fetch events for 2 weeks from Google Calendar
      const events = await this.getEventsByDateRange(thisMonday, twoWeeksSunday);
      console.log(`[deleteThisWeekEvents] Found ${events?.length || 0} Google Calendar events`);

      if (!events || events.length === 0) {
        console.log("No Google Calendar events found for 2 weeks");
        return { deleted: 0, failed: 0, dbDeleted, dbFailed };
      }

      // Delete each Google Calendar event
      let deleted = 0;
      let failed = 0;

      for (const event of events) {
        try {
          if (event.id) {
            console.log(`[deleteThisWeekEvents] Deleting Google Calendar event: ${event.id} - ${event.summary}`);
            await this.deleteEvent(event.id);
            console.log(`[deleteThisWeekEvents] ✓ Successfully deleted Google Calendar event: ${event.id}`);
            deleted++;
          }
        } catch (error) {
          console.error(`[deleteThisWeekEvents] ✗ Failed to delete Google Calendar event ${event.id}:`, error);
          failed++;
        }
      }

      console.log(`[deleteThisWeekEvents] RESULT: Deleted ${deleted} Google Calendar events, ${failed} failed | Deleted ${dbDeleted} DB subtasks, ${dbFailed} failed`);
      return { deleted, failed, dbDeleted, dbFailed };
    } catch (error) {
      console.error("[deleteThisWeekEvents] Error deleting this week events:", error);
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
