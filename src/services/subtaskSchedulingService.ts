import { apiClient } from "./apiClient";

export interface ScheduledSubtaskRequest {
  description: string;
  estimatedTime: number; // in minutes
  preferredDate: string; // YYYY-MM-DD
  preferredStartTime?: string; // HH:mm (optional)
}

export interface ConflictInfo {
  subtaskId?: number;
  description: string;
  endTime: string;
}

export interface ScheduledSubtaskResult {
  description: string;
  estimatedTime: number;
  startTime: string;
  endTime: string;
  conflictDetected: boolean;
  conflictWith: ConflictInfo | null;
}

export interface ScheduleSubtasksResponse {
  success: boolean;
  message: string;
  scheduledSubtasks: ScheduledSubtaskResult[];
  conflictSummary: Array<{
    subtaskIndex: number;
    subtaskDescription: string;
    originalTime: string;
    rescheduledTime: string;
    conflictWith: ConflictInfo;
    timeShift: string;
  }>;
  summary?: {
    totalRequested: number;
    totalScheduled: number;
    conflictsDetected: number;
    resolvedConflicts: number;
    failedToResolve: number;
  };
}

export async function scheduleSubtasksWithConflictDetection(
  userId: number,
  subtasks: ScheduledSubtaskRequest[],
): Promise<ScheduleSubtasksResponse> {
  return apiClient.post<ScheduleSubtasksResponse>("/subtasks/schedule-subtasks", {
    userId,
    subtasks,
  });
}

export function formatTimeFromDate(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatDateFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function calculateEndTime(
  startTime: string,
  durationMinutes: number,
): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
}
