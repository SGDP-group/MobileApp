/**
 * Security utilities for input validation and sanitization
 */

/**
 * Validate and sanitize string input
 */
export function sanitizeString(
  input: string,
  maxLength: number = 1000,
): string {
  if (!input || typeof input !== "string") {
    throw new Error("Invalid input: must be a non-empty string");
  }

  // Trim and limit length
  const sanitized = input.trim().substring(0, maxLength);

  if (sanitized.length === 0) {
    throw new Error("Input cannot be empty");
  }

  return sanitized;
}

/**
 * Validate event ID format (alphanumeric + some special chars allowed by Google)
 */
export function validateEventId(eventId: string): void {
  if (!eventId || typeof eventId !== "string") {
    throw new Error("Invalid event ID");
  }

  // Google Calendar event IDs are alphanumeric with some special chars
  if (!/^[a-zA-Z0-9_-]+$/.test(eventId)) {
    throw new Error("Invalid event ID format");
  }
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: Date, endDate: Date): void {
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    throw new Error("Invalid date objects");
  }

  if (startDate >= endDate) {
    throw new Error("Start date must be before end date");
  }

  // Prevent dates extremely far in the future/past (e.g., beyond 10 years)
  const now = new Date();
  const maxRange = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years in ms

  if (startDate.getTime() < now.getTime() - maxRange) {
    throw new Error("Start date is too far in the past");
  }

  if (endDate.getTime() > now.getTime() + maxRange) {
    throw new Error("End date is too far in the future");
  }
}

/**
 * Safe error message extraction (doesn't expose sensitive details)
 */
export function getSafeErrorMessage(error: any): string {
  if (error?.message === "Failed to get access token") {
    return "Authentication failed. Please sign in again.";
  }

  if (
    error?.message?.includes("401") ||
    error?.message?.includes("Unauthorized")
  ) {
    return "Your session has expired. Please sign in again.";
  }

  if (
    error?.message?.includes("403") ||
    error?.message?.includes("Forbidden")
  ) {
    return "Permission denied. Please check your calendar permissions.";
  }

  if (error?.message?.includes("404")) {
    return "Event not found.";
  }

  if (error?.message?.includes("rate")) {
    return "Too many requests. Please try again later.";
  }

  // Generic message for unknown errors
  return "An error occurred. Please try again.";
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development" || __DEV__;
}
