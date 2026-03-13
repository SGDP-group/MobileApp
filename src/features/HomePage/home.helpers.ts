import type { Task } from "@/src/types/api";

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

export const formatTaskLead = (task: Task): string => {
  const createdAt = toSafeDate(task.createdAt);
  if (!createdAt) return "TASK";

  const diffMs = Date.now() - createdAt.getTime();
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));

  if (diffHours < 1) return "JUST ADDED";
  if (diffHours < 24) return `ADDED ${diffHours}H AGO`;
  return "RECENT TASK";
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