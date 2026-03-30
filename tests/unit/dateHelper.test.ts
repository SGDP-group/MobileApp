import {
    formatDateToISO,
    getTimeDifference,
    isInPast,
} from "../../src/utils/dateHelper";

describe("dateHelper", () => {
  it("formats date to ISO without timezone suffix", () => {
    const date = new Date(2026, 2, 23, 9, 5, 7);
    expect(formatDateToISO(date)).toBe("2026-03-23T09:05:07");
  });

  it("returns humanized time differences", () => {
    const start = new Date("2026-03-23T10:00:00");

    expect(getTimeDifference(start, new Date("2026-03-25T10:00:00"))).toBe(
      "2 days",
    );
    expect(getTimeDifference(start, new Date("2026-03-23T13:00:00"))).toBe(
      "3 hours",
    );
    expect(getTimeDifference(start, new Date("2026-03-23T10:45:00"))).toBe(
      "45 minutes",
    );
    expect(getTimeDifference(start, new Date("2026-03-23T10:00:10"))).toBe(
      "Just now",
    );
  });

  it("identifies whether a date is in the past", () => {
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const oneMinuteAhead = new Date(Date.now() + 60_000).toISOString();

    expect(isInPast(oneMinuteAgo)).toBe(true);
    expect(isInPast(oneMinuteAhead)).toBe(false);
  });
});
