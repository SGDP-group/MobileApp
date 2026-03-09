/**
 * Type definitions for calendar and task items
 */

import { CalendarEventResponse } from "@services/googleCalendarService";
import { TaskItem } from "@services/googleTasksService";
import { RecurrenceData } from "@shared/components/RepeatModal";

export type CombinedItem =
  | CalendarEventResponse
  | (TaskItem & { isTask: true });

export interface FormData {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  recurrence?: RecurrenceData;
}

export const emptyFormData: FormData = {
  summary: "",
  description: "",
  startDateTime: "",
  endDateTime: "",
  location: "",
};
