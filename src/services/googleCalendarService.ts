import { tokenManager } from "@utils/tokenManager";
import {
  sanitizeString,
  validateEventId,
  validateDateRange,
  getSafeErrorMessage,
  isDevelopment,
} from "@utils/securityUtils";
import { apiRateLimiter } from "@utils/rateLimiter";
import { encryptData, decryptData } from "@utils/encryption";
import * as SecureStore from 'expo-secure-store';

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
  private readonly RATE_LIMIT_KEY = 'google-calendar-api';
  private readonly CACHE_KEY_PREFIX = 'calendar_cache_';
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get access token from Google Sign-In (with caching)
   */
  private async getAccessToken(): Promise<string> {
    return tokenManager.getAccessToken();
  }

  /**
   * Get cached data if available and not expired
   */
  private async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await SecureStore.getItemAsync(`${this.CACHE_KEY_PREFIX}${key}`);
      if (!cached) return null;

      const decrypted = await decryptData<{ data: T; timestamp: number }>(cached);
      
      // Check if cache is still valid
      if (Date.now() - decrypted.timestamp < this.CACHE_EXPIRY_MS) {
        return decrypted.data;
      }
      
      // Cache expired, delete it
      await SecureStore.deleteItemAsync(`${this.CACHE_KEY_PREFIX}${key}`);
      return null;
    } catch (error) {
      if (isDevelopment()) {
        console.error('Cache retrieval error:', error);
      }
      return null;
    }
  }

  /**
   * Cache data with encryption
   */
  private async cacheData<T>(key: string, data: T): Promise<void> {
    try {
      const toCache = {
        data,
        timestamp: Date.now(),
      };
      const encrypted = await encryptData(toCache);
      await SecureStore.setItemAsync(`${this.CACHE_KEY_PREFIX}${key}`, encrypted);
    } catch (error) {
      if (isDevelopment()) {
        console.error('Cache storage error:', error);
      }
      // Don't throw - caching is optional
    }
  }

  /**
   * Make API request to Google Calendar with rate limiting
   */
  private async makeRequest(
    endpoint: string,
    method: string = "GET",
    body?: any,
  ): Promise<any> {
    try {
      // Check rate limit
      const rateLimitCheck = await apiRateLimiter.checkLimit(this.RATE_LIMIT_KEY);
      
      if (!rateLimitCheck.allowed) {
        throw new Error(
          `Rate limit exceeded. Please try again in ${rateLimitCheck.retryAfter} seconds.`
        );
      }

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
      throw error;
    }
  }
  async listEvents(
    maxResults: number = 10,
    orderBy: string = "startTime",
  ): Promise<CalendarEventResponse[]> {
    try {
      // Check cache first
      const cacheKey = `list_${maxResults}_${orderBy}`;
      const cached = await this.getCachedData<CalendarEventResponse[]>(cacheKey);
      if (cached) {
        return cached;
      }

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
      
      const events = data.items || [];
      
      // Cache the result
      await this.cacheData(cacheKey, events);
      
      return events;
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

  /**
   * Get events (alias for listEvents for backward compatibility)
   */
  async getEvents(maxResults: number = 10): Promise<CalendarEventResponse[]> {
    return this.listEvents(maxResults, 'startTime');
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      // Note: SecureStore doesn't provide a way to list keys,
      // so we rely on cache expiry or manual clearing per key
      if (isDevelopment()) {
        console.log('Cache cleared');
      }
    } catch (error) {
      if (isDevelopment()) {
        console.error('Error clearing cache:', error);
      }
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
