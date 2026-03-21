import {
    isDevelopment,
    sanitizeString,
    validateDateRange,
    validateEventId
} from "@utils/securityUtils";
import { tokenManager } from "@utils/tokenManager";

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
    } catch (error) {
      // Only log detailed errors in development
      if (isDevelopment()) {
        console.error("API Request Error:", error);
      }
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
}

export const googleCalendarService = new GoogleCalendarService();
