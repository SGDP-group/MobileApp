import {
    getSafeErrorMessage,
    isDevelopment,
    sanitizeString,
    validateDateRange,
    validateEventId,
} from "../../src/utils/securityUtils";

describe("securityUtils", () => {
  it("sanitizes and trims text with max length", () => {
    expect(sanitizeString("   hello world   ")).toBe("hello world");
    expect(sanitizeString("abcdef", 3)).toBe("abc");
  });

  it("throws for invalid or empty strings", () => {
    expect(() => sanitizeString("   ")).toThrow("Input cannot be empty");
    expect(() => sanitizeString(null as unknown as string)).toThrow(
      "Invalid input: must be a non-empty string",
    );
  });

  it("validates event ids", () => {
    expect(() => validateEventId("abc_123-XYZ")).not.toThrow();
    expect(() => validateEventId("bad id!")).toThrow("Invalid event ID format");
  });

  it("validates date ranges", () => {
    const now = new Date();
    const later = new Date(now.getTime() + 60_000);

    expect(() => validateDateRange(now, later)).not.toThrow();
    expect(() => validateDateRange(later, now)).toThrow(
      "Start date must be before end date",
    );
  });

  it("maps internal errors to safe messages", () => {
    expect(getSafeErrorMessage(new Error("401 Unauthorized"))).toBe(
      "Your session has expired. Please sign in again.",
    );
    expect(getSafeErrorMessage(new Error("403 Forbidden"))).toBe(
      "Permission denied. Please check your calendar permissions.",
    );
    expect(getSafeErrorMessage(new Error("404"))).toBe("Event not found.");
    expect(getSafeErrorMessage(new Error("rate limit exceeded"))).toBe(
      "Too many requests. Please try again later.",
    );
    expect(getSafeErrorMessage(new Error("something else"))).toBe(
      "An error occurred. Please try again.",
    );
  });

  it("detects development mode", () => {
    const previous = process.env.NODE_ENV;

    process.env.NODE_ENV = "development";
    expect(isDevelopment()).toBe(true);

    process.env.NODE_ENV = "production";
    (global as any).__DEV__ = false;
    expect(isDevelopment()).toBe(false);

    process.env.NODE_ENV = previous;
  });
});
