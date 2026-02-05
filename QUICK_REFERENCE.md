# 🚀 Google Calendar - Quick Reference

## Import Statement

```typescript
import { googleCalendarService } from "@services/googleCalendarService";
import {
  formatDateToISO,
  getTomorrowISO,
  getDateFromNow,
} from "@utils/dateHelper";
```

## Most Common Operations

### 1. View All Events

```typescript
const events = await googleCalendarService.listEvents(10);
```

### 2. Create An Event (Simple)

```typescript
await googleCalendarService.createEvent({
  summary: "My Event",
  start: { dateTime: "2024-02-10T14:00:00", timeZone: "UTC" },
  end: { dateTime: "2024-02-10T15:00:00", timeZone: "UTC" },
});
```

### 3. Create Event With All Details

```typescript
await googleCalendarService.createEvent({
  summary: "Team Meeting",
  description: "Quarterly planning session",
  start: { dateTime: "2024-02-10T14:00:00", timeZone: "UTC" },
  end: { dateTime: "2024-02-10T15:30:00", timeZone: "UTC" },
  location: "Zoom",
  attendees: [{ email: "alice@company.com" }, { email: "bob@company.com" }],
  reminders: {
    useDefault: false,
    overrides: [
      { method: "email", minutes: 24 * 60 },
      { method: "popup", minutes: 30 },
    ],
  },
});
```

### 4. Update Event

```typescript
await googleCalendarService.updateEvent("eventId123", {
  summary: "Team Meeting - RESCHEDULED",
  location: "Room 202",
});
```

### 5. Delete Event

```typescript
await googleCalendarService.deleteEvent("eventId123");
```

### 6. Get Events This Week

```typescript
const now = new Date();
const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const weekEvents = await googleCalendarService.getEventsByDateRange(
  now,
  weekEnd,
);
```

### 7. Search For Events

```typescript
const results = await googleCalendarService.searchEvents("budget");
```

### 8. Create Event From Natural Language

```typescript
const event = await googleCalendarService.quickAddEvent(
  "Meeting with John tomorrow at 3pm",
);
```

## Date Helpers Cheat Sheet

```typescript
// Get current date/time in ISO format
formatDateToISO(new Date()); // "2024-02-05T14:30:00"

// Get tomorrow's date
getTomorrowISO(); // "2024-02-06T00:00:00"

// Get date N days from now
getDateFromNow(7); // "2024-02-12T00:00:00"

// Check if date is in past
isInPast("2024-01-01T00:00:00"); // true

// Get time difference
getTimeDifference(startDate, endDate); // "2 hours"
```

## Typical React Hook Usage

```typescript
import { useEffect, useState } from 'react';
import { googleCalendarService } from '@services/googleCalendarService';

export function MyCalendarComponent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await googleCalendarService.listEvents(10);
        setEvents(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    // Your UI here
  );
}
```

## Event Object Structure

```typescript
{
  summary: string;           // "Team Meeting" (required)
  description?: string;      // "Quarterly planning"
  start: {
    dateTime: string;        // "2024-02-10T14:00:00" (ISO format)
    timeZone: string;        // "UTC"
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;         // "Room 202"
  attendees?: Array<{
    email: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;        // "email" or "popup"
      minutes: number;       // 30, 60, 1440
    }>;
  };
}
```

## Error Handling Pattern

```typescript
try {
  const events = await googleCalendarService.listEvents();
  // Use events...
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    // Handle error
  }
}
```

## Navigation to Calendar Screen

```typescript
import { useNavigation } from "@react-navigation/native";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";

const navigation = useNavigation<RootNavigationProp>();
navigation.navigate("Calendar");
```

## Inline Date Formatting

```typescript
// Display date nicely
new Date("2024-02-10T14:00:00").toLocaleString();
// "2/10/2024, 2:00:00 PM"

// Other formats
date.toLocaleDateString(); // "2/10/2024"
date.toLocaleTimeString(); // "2:00:00 PM"
date.toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});
// "Sat, Feb 10"
```

## Creating Dates

```typescript
// Tomorrow at 9 AM
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(9, 0, 0);
tomorrow.toISOString();

// Next week
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);

// Specific date
new Date("2024-02-10T14:00:00").toISOString();
```

## Common Mistakes to Avoid

❌ **Wrong**: Entering date like "2024/02/10"
✅ **Right**: Use ISO format "2024-02-10T14:00:00"

❌ **Wrong**: Not including timezone
✅ **Right**: `{ dateTime: "2024-02-10T14:00:00", timeZone: "UTC" }`

❌ **Wrong**: Forgetting await on async calls
✅ **Right**: `const events = await googleCalendarService.listEvents();`

❌ **Wrong**: Creating events without start/end
✅ **Right**: Always include both start and end times

## Useful Links

- 📖 Full Docs: See `GOOGLE_CALENDAR_INTEGRATION.md`
- 💡 Examples: See `GOOGLE_CALENDAR_EXAMPLES.ts`
- ✅ Setup Guide: See `SETUP_CHECKLIST.md`
- 🎯 Summary: See `IMPLEMENTATION_SUMMARY.md`

---

**Quick Tip**: Copy the service methods above and modify with your data - they're production-ready! ✨
