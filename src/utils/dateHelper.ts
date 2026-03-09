/**
 * Format a date object to ISO string (YYYY-MM-DDTHH:MM:SS)
 */
export const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Format a date string to readable format
 */
export const formatDateReadable = (dateString: string | undefined): string => {
  if (!dateString) return "No date";

  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("en-US", options);
  } catch {
    return dateString;
  }
};

/**
 * Get today's date in ISO format
 */
export const getTodayISO = (): string => {
  return formatDateToISO(new Date());
};

/**
 * Get tomorrow's date in ISO format
 */
export const getTomorrowISO = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateToISO(tomorrow);
};

/**
 * Get a date N days from now in ISO format
 */
export const getDateFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateToISO(date);
};

/**
 * Check if a date is in the past
 */
export const isInPast = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    return date < new Date();
  } catch {
    return false;
  }
};

/**
 * Get time difference in human readable format
 */
export const getTimeDifference = (startDate: Date, endDate: Date): string => {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  }
  if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""}`;
  }
  return "Just now";
};

/**
 * Format a date to YYYY-MM-DD string
 */
export const formatDateYYYYMMDD = (value: Date): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Format a date to HH:MM string
 */
export const formatTimeHHMM = (value: Date): string => {
  const hours = `${value.getHours()}`.padStart(2, "0");
  const minutes = `${value.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * Format a date to "Month Day" string (e.g., "March 10")
 */
export const formatDateMonthDay = (value: Date): string => {
  const month = value.toLocaleDateString("en-US", { month: "long" });
  const day = value.getDate();
  return `${month} ${day}`;
};

/**
 * Format a date for storage (ISO date only, no time)
 */
export const formatDateForStorage = (value: Date): string => {
  return value.toISOString().split("T")[0];
};

/**
 * Round a date to the nearest upcoming 15-minute interval
 * @returns A new Date object rounded to :00, :15, :30, or :45
 */
export const roundToNearestFifteenMinutes = (date?: Date): Date => {
  const now = date ? new Date(date) : new Date();
  const minutes = now.getMinutes();

  // Round up to nearest upcoming 15-minute interval
  if (minutes === 0) {
    // Already at :00
  } else if (minutes <= 15) {
    now.setMinutes(15, 0, 0);
  } else if (minutes <= 30) {
    now.setMinutes(30, 0, 0);
  } else if (minutes <= 45) {
    now.setMinutes(45, 0, 0);
  } else {
    now.setHours(now.getHours() + 1);
    now.setMinutes(0, 0, 0);
  }

  return now;
};
