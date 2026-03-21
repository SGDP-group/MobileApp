/**
 * Event and task handlers for calendar operations
 */

import {
  CalendarEventResponse,
  googleCalendarService,
} from "@services/googleCalendarService";
import { TaskItem, googleTasksService } from "@services/googleTasksService";
import { Alert } from "react-native";
import { FormData } from "./types";

export const handleDeleteEvent = async (
  eventId: string,
  onSuccess: () => void,
) => {
  Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
    { text: "Cancel", onPress: () => {} },
    {
      text: "Delete",
      onPress: async () => {
        try {
          await googleCalendarService.deleteEvent(eventId);
          Alert.alert("Success", "Event deleted successfully");
          onSuccess();
        } catch (error) {
          console.error("Error deleting event:", error);
          Alert.alert("Error", "Failed to delete event");
        }
      },
      style: "destructive",
    },
  ]);
};

export const handleDeleteTask = async (
  taskId: string,
  onSuccess: () => void,
) => {
  Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
    { text: "Cancel", onPress: () => {} },
    {
      text: "Delete",
      onPress: async () => {
        try {
          await googleTasksService.deleteTask(taskId);
          Alert.alert("Success", "Task deleted successfully");
          onSuccess();
        } catch (error) {
          console.error("Error deleting task:", error);
          Alert.alert("Error", "Failed to delete task");
        }
      },
      style: "destructive",
    },
  ]);
};

export const validateFormData = (formData: FormData): boolean => {
  if (!formData.summary.trim()) {
    Alert.alert("Validation", "Title is required");
    return false;
  }

  if (!formData.startDateTime.trim()) {
    Alert.alert("Validation", "Date is required");
    return false;
  }

  return true;
};

export const saveEvent = async (
  formData: FormData,
  editingEvent: CalendarEventResponse | null,
): Promise<void> => {
  const now = new Date();
  const startDate = new Date(formData.startDateTime);
  const endDate = new Date(formData.endDateTime || formData.startDateTime);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    Alert.alert("Validation", "Please select valid date and time");
    throw new Error("VALIDATION_ERROR");
  }

  if (!editingEvent && startDate < now) {
    Alert.alert("Validation", "You cannot create an event before now");
    throw new Error("VALIDATION_ERROR");
  }

  if (endDate < startDate) {
    Alert.alert("Validation", "End date/time cannot be before start date/time");
    throw new Error("VALIDATION_ERROR");
  }

  const eventData = {
    summary: formData.summary,
    description: formData.description,
    location: formData.location,
    start: {
      dateTime: formData.startDateTime,
      timeZone: "UTC",
    },
    end: {
      dateTime: formData.endDateTime || formData.startDateTime,
      timeZone: "UTC",
    },
  };

  if (editingEvent) {
    await googleCalendarService.updateEvent(editingEvent.id, eventData);
    Alert.alert("Success", "Event updated successfully");
  } else {
    await googleCalendarService.createEvent(eventData);
    Alert.alert("Success", "Event created successfully");
  }
};

export const saveTask = async (
  formData: FormData,
  editingTask: TaskItem | null,
  isCreatingTask: boolean,
): Promise<void> => {
  const now = new Date();
  const dueDate = new Date(formData.startDateTime);

  if (Number.isNaN(dueDate.getTime())) {
    Alert.alert("Validation", "Please select a valid task date and time");
    throw new Error("VALIDATION_ERROR");
  }

  if (!editingTask && isCreatingTask && dueDate < now) {
    Alert.alert("Validation", "You cannot create a task before now");
    throw new Error("VALIDATION_ERROR");
  }

  if (editingTask) {
    await googleTasksService.updateTask(editingTask.id, {
      title: formData.summary,
      notes: formData.description,
      due: formData.startDateTime,
    });
    Alert.alert("Success", "Task updated successfully");
  } else if (isCreatingTask) {
    await googleTasksService.createTask(
      formData.summary,
      formData.description,
      formData.startDateTime,
    );
    Alert.alert("Success", "Task created successfully");
  }
};
