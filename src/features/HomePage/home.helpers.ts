import type { Task } from "@/src/types/api";

type TaskWithSubtasks = Task & {
  subtasks?: Array<{
    taskOrder?: number;
    startTime?: string;
  }>;
};

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const toSafeDate = (value: string): Date | null => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const toSubtaskStartDate = (value: string): Date | null => {
  const asDate = toSafeDate(value.trim());
  if (asDate) {
    return asDate;
  }

  // Supports time-only strings like "14:30", "14:30:00", or "14:30:00.123456".
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

export const getGreeting = (value: Date): string => {
  const hour = value.getHours();
  if (hour < 5) return "Good Evening";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

export const getFormattedDate = (value: Date): string => {
  const dayName = DAYS[value.getDay()];
  const monthName = MONTHS[value.getMonth()];
  const day = value.getDate();

  return `${dayName}, ${monthName} ${day}`;
};

export const formatTaskLead = (task: TaskWithSubtasks): string => {
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];

  const firstSubtaskWithStart = [...subtasks]
    .sort((a, b) => {
      const orderA = a.taskOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.taskOrder ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    })
    .find((subtask) => Boolean(subtask.startTime));

  if (!firstSubtaskWithStart?.startTime) {
    return "NO START TIME";
  }

  const startDate = toSubtaskStartDate(firstSubtaskWithStart.startTime);
  if (!startDate) {
    return "NO START TIME";
  }

  const diffMinutes = Math.floor((startDate.getTime() - Date.now()) / (60 * 1000));
  const absMinutes = Math.abs(diffMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;

  const durationLabel = `${hours}H ${minutes}M`;

  if (diffMinutes >= 0) {
    return `STARTS IN ${durationLabel}`;
  }

  return `STARTED ${durationLabel} AGO`;
};

export const formatTaskTimestamp = (value: string): string => {
  const date = toSafeDate(value);
  if (!date) return "Unknown time";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};