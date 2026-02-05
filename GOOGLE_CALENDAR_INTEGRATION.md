# Google Calendar Integration Guide

## Overview

This mobile app now includes full Google Calendar integration with complete CRUD (Create, Read, Update, Delete) functionality. Users can view, create, update, and delete calendar events directly from the app.

## Features

✅ **View Calendar Events**: List all upcoming events from the primary calendar
✅ **Create Events**: Add new calendar events with detailed information
✅ **Update Events**: Modify existing events
✅ **Delete Events**: Remove events from the calendar
✅ **Search Events**: Find events by title/summary
✅ **Date Range Queries**: Get events between specific dates
✅ **Quick Add**: Create events using natural language

## Architecture

### Key Files

#### Services

- **`src/services/googleCalendarService.ts`**: Main service with all CRUD operations
  - REST API calls to Google Calendar API v3
  - Access token management
  - Error handling

#### Screens & Components

- **`src/features/calendar/CalendarScreen.tsx`**: Main calendar UI
  - List view of events
  - Create/Edit modal
  - Delete confirmation

#### Utilities

- **`src/utils/dateHelper.ts`**: Date formatting and manipulation helpers

#### Navigation

- **`src/shared/navigation/RootNavigator.tsx`**: Updated with Calendar scopes and routing

## API Methods

### Service: `googleCalendarService`

#### 1. List Events

```typescript
listEvents(maxResults?: number, orderBy?: string): Promise<CalendarEventResponse[]>
```

- Fetches upcoming events from the primary calendar
- Default: 10 events, ordered by start time
- Automatically excludes past events

**Example:**

```typescript
const events = await googleCalendarService.listEvents(20);
```

#### 2. Get Event by ID

```typescript
getEvent(eventId: string): Promise<CalendarEventResponse>
```

- Retrieves a specific event with all details

**Example:**

```typescript
const event = await googleCalendarService.getEvent("event123");
```

#### 3. Create Event

```typescript
createEvent(event: CalendarEvent): Promise<CalendarEventResponse>
```

- Creates a new calendar event

**Example:**

```typescript
const newEvent = await googleCalendarService.createEvent({
  summary: "Team Meeting",
  description: "Quarterly planning",
  start: {
    dateTime: "2024-02-10T14:00:00",
    timeZone: "UTC",
  },
  end: {
    dateTime: "2024-02-10T15:00:00",
    timeZone: "UTC",
  },
  location: "Conference Room A",
  attendees: [{ email: "colleague@example.com" }],
});
```

#### 4. Update Event

```typescript
updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEventResponse>
```

- Updates specific fields of an existing event

**Example:**

```typescript
await googleCalendarService.updateEvent("event123", {
  summary: "Team Meeting - Updated",
  location: "Zoom",
});
```

#### 5. Delete Event

```typescript
deleteEvent(eventId: string): Promise<void>
```

- Deletes an event from the calendar

**Example:**

```typescript
await googleCalendarService.deleteEvent("event123");
```

#### 6. Get Events by Date Range

```typescript
getEventsByDateRange(startDate: Date, endDate: Date): Promise<CalendarEventResponse[]>
```

- Fetches all events within a specific date range

**Example:**

```typescript
const start = new Date(2024, 1, 1);
const end = new Date(2024, 1, 28);
const events = await googleCalendarService.getEventsByDateRange(start, end);
```

#### 7. Search Events

```typescript
searchEvents(query: string): Promise<CalendarEventResponse[]>
```

- Searches for events by title or summary

**Example:**

```typescript
const results = await googleCalendarService.searchEvents("budget planning");
```

#### 8. Quick Add Event

```typescript
quickAddEvent(text: string): Promise<CalendarEventResponse>
```

- Creates an event from natural language text

**Example:**

```typescript
const event = await googleCalendarService.quickAddEvent(
  "Meeting with John tomorrow at 3pm",
);
```

#### 9. List All Calendars

```typescript
listCalendars(): Promise<any[]>
```

- Returns all calendars in the user's account

**Example:**

```typescript
const calendars = await googleCalendarService.listCalendars();
```

## Data Models

### CalendarEvent

```typescript
interface CalendarEvent {
  id?: string;
  summary: string; // Event title (required)
  description?: string; // Event description
  start: {
    dateTime?: string; // ISO format: 2024-02-05T10:00:00
    date?: string; // All-day: 2024-02-05
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
```

### CalendarEventResponse

Extends `CalendarEvent` with additional fields:

- `id`: Generated event ID
- `created`: Creation timestamp
- `updated`: Last modification timestamp
- `htmlLink`: Link to event in Google Calendar
- `status`: Event status (confirmed, tentative, cancelled)

## Date Helpers

### Available Utility Functions in `dateHelper.ts`

```typescript
// Format date to ISO string (YYYY-MM-DDTHH:MM:SS)
formatDateToISO(date: Date): string

// Format to readable format
formatDateReadable(dateString: string): string

// Get today's date in ISO format
getTodayISO(): string

// Get tomorrow's date in ISO format
getTomorrowISO(): string

// Get a date N days from now
getDateFromNow(days: number): string

// Check if date is in the past
isInPast(dateString: string): boolean

// Get human-readable time difference
getTimeDifference(startDate: Date, endDate: Date): string
```

## UI Components

### Calendar Screen

Main screen located at `src/features/calendar/CalendarScreen.tsx`

**Features:**

- List view of upcoming events with pagination
- Pull-to-refresh functionality
- Create new event modal
- Edit event functionality
- Delete event with confirmation dialog
- Empty state with CTA button

**Navigation:**
Access from Home screen by tapping "Google Calendar" card, or programmatically:

```typescript
navigation.navigate("Calendar");
```

## Authentication

### Scopes Required

The app requests the following Google OAuth scopes:

```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/drive.readonly
```

These scopes allow:

- Reading and modifying calendar events
- Creating and deleting events
- Accessing file information

### Configuration

Updated in `RootNavigator.tsx`:

```typescript
GoogleSignin.configure({
  webClientId: "YOUR_WEB_CLIENT_ID",
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/drive.readonly",
  ],
  offlineAccess: true,
  forceCodeForRefreshToken: true,
  // ... other config
});
```

## Error Handling

All service methods include error handling. Errors are caught and logged:

```typescript
try {
  const events = await googleCalendarService.listEvents();
} catch (error) {
  console.error("Error loading events:", error);
  Alert.alert("Error", "Failed to load calendar events");
}
```

## Common Use Cases

### Example 1: Display User's Events

```typescript
const events = await googleCalendarService.listEvents(10);
events.forEach((event) => {
  console.log(`${event.summary} - ${event.start.dateTime}`);
});
```

### Example 2: Create a Meeting

```typescript
const startTime = new Date();
startTime.setHours(startTime.getHours() + 2);

await googleCalendarService.createEvent({
  summary: "Product Review",
  description: "Q1 product review meeting",
  start: {
    dateTime: startTime.toISOString(),
    timeZone: "UTC",
  },
  end: {
    dateTime: new Date(startTime.getTime() + 3600000).toISOString(),
    timeZone: "UTC",
  },
  attendees: [{ email: "manager@company.com" }, { email: "team@company.com" }],
});
```

### Example 3: Update Event Location

```typescript
await googleCalendarService.updateEvent("event123", {
  location: "Remote - Zoom Link",
});
```

### Example 4: Get Week's Events

```typescript
const now = new Date();
const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const weekEvents = await googleCalendarService.getEventsByDateRange(
  now,
  weekEnd,
);
```

## Limitations & Notes

1. **Date Format**: Use ISO 8601 format for date/time: `YYYY-MM-DDTHH:MM:SS`
2. **Timezone**: Include timezone in requests for accurate conversions
3. **Offline Access**: With `offlineAccess: true`, access tokens refresh automatically
4. **Rate Limiting**: Google Calendar API has rate limits; implement retry logic for production
5. **All-Day Events**: Use `date` field instead of `dateTime` for all-day events

## Testing

To test the integration:

1. **Login**: Sign in with a Google account
2. **View Events**: Navigate to Calendar screen to see existing events
3. **Create Event**: Tap "+" button to create a new event
4. **Edit Event**: Tap pencil icon to edit an existing event
5. **Delete Event**: Tap trash icon to delete an event
6. **Refresh**: Pull down to refresh the event list

## Troubleshooting

### Access Denied Error

- Ensure the Google project has Calendar API enabled
- Verify OAuth 2.0 credentials are correct
- Check app scopes in GoogleSignin configuration

### Events Not Loading

- Verify user has calendar events in Google Calendar
- Check network connectivity
- Review console logs for API errors

### Date Formatting Issues

- Always use ISO 8601 format: `YYYY-MM-DDTHH:MM:SS`
- Include timezone for accurate conversions
- Test date parsing with `dateHelper` utilities

## Security Best Practices

1. ✅ Store access tokens securely using `expo-secure-store`
2. ✅ Validate user input in event creation forms
3. ✅ Use HTTPS for all API requests
4. ✅ Implement refresh token rotation
5. ✅ Log errors without exposing sensitive information

## Future Enhancements

Potential features for future versions:

- [ ] Multiple calendar support
- [ ] Event color coding
- [ ] Calendar notifications
- [ ] Event recurrence patterns
- [ ] Attendee availability checking
- [ ] Calendar sync with other services
- [ ] Offline event creation with sync

---

## Support

For issues or questions:

1. Check the error logs in the console
2. Review the data models and API docs above
3. Test with simple scenarios first
4. Verify Google API credentials and permissions
