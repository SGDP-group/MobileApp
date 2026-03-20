import type { HomeTask as TaskWithSubtasks } from "../home.tasks";

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
  const subtasks = Array.isArray(task.subTasks)
    ? task.subTasks
    : Array.isArray(task.subtasks)
      ? task.subtasks
      : [];

  const leadIncomplete = subtasks.reduce<(typeof subtasks)[number] | undefined>(
    (best, current) => {
      // Ignore completed tasks or those without a start time
      if (current.completed || !current.startTime) return best;
      if (!best) return current;

      const currentOrder = current.taskOrder ?? Number.MAX_SAFE_INTEGER;
      const bestOrder = (best.taskOrder) ?? Number.MAX_SAFE_INTEGER;

      return currentOrder < bestOrder ? current : best;
    },
    undefined
  );

  const rawStartTime = leadIncomplete?.startTime;
  if (!rawStartTime) return "NO START TIME";

  // Ensure this returns a Date object, not a string
  const startDate = toSubtaskStartDate(rawStartTime);
  if (!startDate || !(startDate instanceof Date)) return "NO START TIME";

  const diffMs = startDate.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  
  // Calculate hours and minutes accurately
  const hours = Math.floor(absMs / (1000 * 60 * 60));
  const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
  
  const durationLabel = `${hours}H ${minutes}M`;

  // diffMs > 0 means the start time is in the future
  return diffMs >= 0 
    ? `STARTS IN ${durationLabel}` 
    : `LATE BY ${durationLabel}`; 
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