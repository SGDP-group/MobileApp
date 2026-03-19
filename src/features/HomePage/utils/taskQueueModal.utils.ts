import type { HomeTask } from "../home.tasks";

type SubtaskStatus = {
  id?: number;
  name?: string;
};

export type HomeSubtask = NonNullable<HomeTask["subtasks"]>[number];

export const toSafeDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }

  const asDate = new Date(value.trim());
  if (!Number.isNaN(asDate.getTime())) {
    return asDate;
  }

  const timeMatch = value
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d{1,6})?)?$/);

  if (!timeMatch) {
    return null;
  }

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const seconds = Number(timeMatch[3] ?? "0");

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    Number.isNaN(seconds) ||
    hours > 23 ||
    minutes > 59 ||
    seconds > 59
  ) {
    return null;
  }

  const date = new Date();
  date.setHours(hours, minutes, seconds, 0);
  return date;
};

const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

export const formatDateTime = (value?: string): string => {
  const date = toSafeDate(value);
  if (!date) {
    return "Not set";
  }

  return date.toLocaleString([], DATE_TIME_FORMAT_OPTIONS);
};

export const formatDateObject = (value: Date | null): string => {
  if (!value) {
    return "Not set";
  }

  return value.toLocaleString([], DATE_TIME_FORMAT_OPTIONS);
};

export const formatDuration = (durationMinutes?: number): string => {
  if (!durationMinutes || durationMinutes <= 0) {
    return "Not set";
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};

export const getSubtaskDuration = (
  duration?: number,
  estimatedTime?: number,
): number => {
  if (typeof duration === "number" && duration > 0) {
    return duration;
  }

  if (typeof estimatedTime === "number" && estimatedTime > 0) {
    return estimatedTime;
  }

  return 0;
};

export const getStatusLabel = (
  status?: SubtaskStatus,
  completed?: boolean,
  fallbackStatusId?: number,
): string => {
  if (status?.name?.trim()) {
    return status.name;
  }

  const resolvedStatusId =
    typeof status?.id === "number" ? status.id : fallbackStatusId;

  if (resolvedStatusId === 2) {
    return "In Progress";
  }

  if (resolvedStatusId === 3) {
    return "Completed";
  }

  if (completed) {
    return "Completed";
  }

  return "Pending";
};
