/**
 * State initialization and data loading logic
 */

import {
    CalendarEventResponse,
    googleCalendarService,
} from "@services/googleCalendarService";
import { TaskItem, googleTasksService } from "@services/googleTasksService";
import { Alert } from "react-native";
import { CombinedItem } from "./types";

export const loadItems = async (): Promise<CombinedItem[]> => {
  try {
    const [calendarEvents, tasks] = await Promise.all([
      googleCalendarService.listEvents(20),
      googleTasksService.getTasks(20),
    ]);

    const combinedItems: CombinedItem[] = [
      ...calendarEvents,
      ...tasks.map((task) => ({ ...task, isTask: true as const })),
    ];

    // Sort by start date/time or due date
    combinedItems.sort((a, b) => {
      const dateA =
        (a as CalendarEventResponse).start?.dateTime ||
        (a as TaskItem & { isTask: true }).due ||
        "";
      const dateB =
        (b as CalendarEventResponse).start?.dateTime ||
        (b as TaskItem & { isTask: true }).due ||
        "";
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    return combinedItems;
  } catch (error) {
    console.error("Error loading items:", error);
    Alert.alert("Error", "Failed to load calendar events and tasks");
    return [];
  }
};
