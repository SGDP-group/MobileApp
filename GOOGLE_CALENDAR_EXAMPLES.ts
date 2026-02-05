/**
 * Google Calendar Service - Usage Examples
 *
 * This file contains practical examples of how to use the googleCalendarService
 * in your components and screens.
 */

import {
    CalendarEvent,
    googleCalendarService,
} from "@services/googleCalendarService";
import { getDateFromNow } from "@utils/dateHelper";

// ============================================================================
// EXAMPLE 1: List Upcoming Events
// ============================================================================
export async function exampleListEvents() {
  try {
    // Get the next 10 upcoming events
    const events = await googleCalendarService.listEvents(10);

    events.forEach((event) => {
      console.log(`📅 ${event.summary}`);
      console.log(`   Time: ${event.start.dateTime}`);
      if (event.location) {
        console.log(`   Location: ${event.location}`);
      }
    });

    return events;
  } catch (error) {
    console.error("Failed to list events:", error);
  }
}

// ============================================================================
// EXAMPLE 2: Create a Simple Event
// ============================================================================
export async function exampleCreateSimpleEvent() {
  try {
    const now = new Date();
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(14, 0, 0); // 2 PM tomorrow

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(15, 0, 0); // 3 PM tomorrow

    const newEvent: CalendarEvent = {
      summary: "Team Standup",
      description: "Daily team synchronization",
      start: {
        dateTime: tomorrowStart.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: tomorrowEnd.toISOString(),
        timeZone: "UTC",
      },
      location: "Conference Room A",
    };

    const createdEvent = await googleCalendarService.createEvent(newEvent);
    console.log("✅ Event created:", createdEvent.id);
    return createdEvent;
  } catch (error) {
    console.error("Failed to create event:", error);
  }
}

// ============================================================================
// EXAMPLE 3: Create Event with Attendees and Reminders
// ============================================================================
export async function exampleCreateEventWithAttendees() {
  try {
    const meetingStart = new Date(getDateFromNow(3)); // 3 days from now
    meetingStart.setHours(10, 0, 0);

    const meetingEnd = new Date(meetingStart);
    meetingEnd.setHours(11, 30, 0);

    const eventWithAttendees: CalendarEvent = {
      summary: "Project Kickoff Meeting",
      description: "Discuss project scope, timeline, and deliverables",
      start: {
        dateTime: meetingStart.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: meetingEnd.toISOString(),
        timeZone: "UTC",
      },
      location: "Building 3, Room 202",
      attendees: [
        { email: "colleague1@company.com" },
        { email: "colleague2@company.com" },
        { email: "manager@company.com" },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // Email reminder 1 day before
          { method: "popup", minutes: 30 }, // Popup reminder 30 min before
        ],
      },
    };

    const event = await googleCalendarService.createEvent(eventWithAttendees);
    console.log("✅ Event with attendees created:", event.id);
    return event;
  } catch (error) {
    console.error("Failed to create event with attendees:", error);
  }
}

// ============================================================================
// EXAMPLE 4: Update an Event
// ============================================================================
export async function exampleUpdateEvent(eventId: string) {
  try {
    const updates = {
      summary: "Project Kickoff - RESCHEDULED",
      location: "Remote - Zoom",
      description:
        "Discuss project scope, timeline, and deliverables (Virtual)",
    };

    const updatedEvent = await googleCalendarService.updateEvent(
      eventId,
      updates,
    );
    console.log("✅ Event updated:", updatedEvent.id);
    return updatedEvent;
  } catch (error) {
    console.error("Failed to update event:", error);
  }
}

// ============================================================================
// EXAMPLE 5: Delete an Event
// ============================================================================
export async function exampleDeleteEvent(eventId: string) {
  try {
    await googleCalendarService.deleteEvent(eventId);
    console.log("✅ Event deleted successfully");
  } catch (error) {
    console.error("Failed to delete event:", error);
  }
}

// ============================================================================
// EXAMPLE 6: Get Events by Date Range (e.g., This Month)
// ============================================================================
export async function exampleGetMonthEvents() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthEvents = await googleCalendarService.getEventsByDateRange(
      monthStart,
      monthEnd,
    );

    console.log(`📊 Events in ${monthStart.toLocaleDateString()}:`);
    monthEvents.forEach((event) => {
      console.log(`  • ${event.summary}`);
    });

    return monthEvents;
  } catch (error) {
    console.error("Failed to get monthly events:", error);
  }
}

// ============================================================================
// EXAMPLE 7: Get Events for a Specific Week
// ============================================================================
export async function exampleGetWeekEvents() {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7); // End of week

    const weekEvents = await googleCalendarService.getEventsByDateRange(
      weekStart,
      weekEnd,
    );

    console.log("📅 Events this week:");
    weekEvents.forEach((event) => {
      const eventDate = new Date(event.start.dateTime || "");
      console.log(`  ${eventDate.toLocaleDateString()}: ${event.summary}`);
    });

    return weekEvents;
  } catch (error) {
    console.error("Failed to get week events:", error);
  }
}

// ============================================================================
// EXAMPLE 8: Search Events by Title
// ============================================================================
export async function exampleSearchEvents(query: string) {
  try {
    const results = await googleCalendarService.searchEvents(query);

    console.log(`🔍 Search results for "${query}":`);
    results.forEach((event) => {
      console.log(`  • ${event.summary} (${event.start.dateTime})`);
    });

    return results;
  } catch (error) {
    console.error("Failed to search events:", error);
  }
}

// ============================================================================
// EXAMPLE 9: Create Event Using Quick Add (Natural Language)
// ============================================================================
export async function exampleQuickAddEvent() {
  try {
    // Natural language like Google Calendar's quick add feature
    const event = await googleCalendarService.quickAddEvent(
      "Coffee with Sarah next Tuesday at 10am",
    );

    console.log("✅ Event created via quick add:", event.summary);
    return event;
  } catch (error) {
    console.error("Failed to quick add event:", error);
  }
}

// ============================================================================
// EXAMPLE 10: List All Calendars
// ============================================================================
export async function exampleListCalendars() {
  try {
    const calendars = await googleCalendarService.listCalendars();

    console.log("📚 Available calendars:");
    calendars.forEach((cal: any) => {
      console.log(`  • ${cal.summary} (${cal.id})`);
    });

    return calendars;
  } catch (error) {
    console.error("Failed to list calendars:", error);
  }
}

// ============================================================================
// EXAMPLE 11: Get a Specific Event
// ============================================================================
export async function exampleGetEvent(eventId: string) {
  try {
    const event = await googleCalendarService.getEvent(eventId);

    console.log("📋 Event details:");
    console.log(`  Title: ${event.summary}`);
    console.log(`  When: ${event.start.dateTime}`);
    console.log(`  Where: ${event.location || "Not specified"}`);
    console.log(`  Description: ${event.description || "None"}`);

    return event;
  } catch (error) {
    console.error("Failed to get event:", error);
  }
}

// ============================================================================
// EXAMPLE 12: Batch Operations - Create Multiple Events
// ============================================================================
export async function exampleCreateMultipleEvents() {
  try {
    const events = [];

    // Create 3 events for the next 3 weeks
    for (let i = 1; i <= 3; i++) {
      const eventDate = new Date(getDateFromNow(i * 7));
      eventDate.setHours(9, 0, 0);

      const eventEnd = new Date(eventDate);
      eventEnd.setHours(10, 0, 0);

      const event: CalendarEvent = {
        summary: `Weekly Status Report - Week ${i}`,
        description: `Status report for week ${i}`,
        start: {
          dateTime: eventDate.toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: eventEnd.toISOString(),
          timeZone: "UTC",
        },
      };

      const created = await googleCalendarService.createEvent(event);
      events.push(created);
      console.log(`✅ Created: ${created.summary}`);
    }

    return events;
  } catch (error) {
    console.error("Failed to create multiple events:", error);
  }
}

// ============================================================================
// EXAMPLE 13: React Component - Display Events in a List
// ============================================================================
/*
Example React Component:

import React, { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { googleCalendarService, CalendarEventResponse } from '@services/googleCalendarService';

export function EventListComponent() {
  const [events, setEvents] = useState<CalendarEventResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await googleCalendarService.listEvents(10);
        setEvents(data);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  if (loading) return <Text>Loading...</Text>;

  return (
    <FlatList
      data={events}
      renderItem={({ item }) => (
        <View>
          <Text>{item.summary}</Text>
          <Text>{item.start.dateTime}</Text>
        </View>
      )}
      keyExtractor={(item) => item.id}
    />
  );
}
*/

// ============================================================================
// EXAMPLE 14: Error Handling Best Practices
// ============================================================================
export async function exampleErrorHandling() {
  try {
    const events = await googleCalendarService.listEvents();
    return events;
  } catch (error) {
    // Type guard for error
    let errorMessage = "An unknown error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    console.error("Failed to fetch events:", errorMessage);

    // Return empty array or handle gracefully
    return [];
  }
}

// ============================================================================
// EXAMPLE 15: Real-world Use Case - Schedule a Recurring Meeting
// ============================================================================
/*
// Note: Google Calendar API doesn't support recurrence directly through
// the regular API (requires calendar syntax), but here's how you'd schedule
// individual meetings:

export async function scheduleWeeklyMeetings(
  title: string,
  weeksAhead: number = 4
) {
  const createdEvents = [];
  
  for (let week = 1; week <= weeksAhead; week++) {
    const meetingDate = new Date(getDateFromNow(week * 7));
    meetingDate.setHours(10, 0, 0); // 10 AM
    
    const endDate = new Date(meetingDate);
    endDate.setHours(11, 0, 0); // 1 hour duration
    
    const event: CalendarEvent = {
      summary: `${title} - Week ${week}`,
      start: {
        dateTime: meetingDate.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "UTC",
      },
    };
    
    const created = await googleCalendarService.createEvent(event);
    createdEvents.push(created);
  }
  
  return createdEvents;
}
*/
