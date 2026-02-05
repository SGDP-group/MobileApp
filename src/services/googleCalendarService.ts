import { GoogleSignin } from "@react-native-google-signin/google-signin";

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
}

class GoogleCalendarService {
  private baseUrl = "https://www.googleapis.com/calendar/v3";

  /**
   * Get access token from Google Sign-In
   */
  private async getAccessToken(): Promise<string> {
    try {
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch (error) {
      console.error("Error getting access token:", error);
      throw new Error("Failed to get access token");
    }
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
      console.error("API Request Error:", error);
      throw error;
    }
  }

  /**
   * GET: List all events in the primary calendar
   */
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
      const data = await this.makeRequest(
        `/calendars/primary/events/${eventId}`,
      );
      return data;
    } catch (error) {
      console.error("Error getting event:", error);
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
      await this.makeRequest(`/calendars/primary/events/${eventId}`, "DELETE");
    } catch (error) {
      console.error("Error deleting event:", error);
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
      console.error("Error getting events by date range:", error);
      throw error;
    }
  }

  /**
   * Search for events by summary
   */
  async searchEvents(query: string): Promise<CalendarEventResponse[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        singleEvents: "true",
      });

      const data = await this.makeRequest(
        `/calendars/primary/events?${params.toString()}`,
      );
      return data.items || [];
    } catch (error) {
      console.error("Error searching events:", error);
      throw error;
    }
  }

  /**
   * Quick add event using text (e.g., "Meeting tomorrow at 3pm")
   */
  async quickAddEvent(text: string): Promise<CalendarEventResponse> {
    try {
      const data = await this.makeRequest(
        "/calendars/primary/events/quickAdd",
        "POST",
        { text },
      );
      return data;
    } catch (error) {
      console.error("Error quick adding event:", error);
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
}

export const googleCalendarService = new GoogleCalendarService();
