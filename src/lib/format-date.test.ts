import { describe, expect, it } from "vitest";
import { formatLongDate, formatShortDate, formatShortDateWithYear } from "@/lib/format-date";

const date = new Date("2026-03-05T12:00:00Z");

describe("formatShortDate", () => {
  it("formats as abbreviated month and day, no year", () => {
    expect(formatShortDate(date)).toBe("Mar 5");
  });
});

describe("formatShortDateWithYear", () => {
  it("formats as abbreviated month, day, and year", () => {
    expect(formatShortDateWithYear(date)).toBe("Mar 5, 2026");
  });
});

describe("formatLongDate", () => {
  it("formats as full month name, day, and year", () => {
    expect(formatLongDate(date)).toBe("March 5, 2026");
  });

  it("accepts a date string", () => {
    expect(formatLongDate("2026-03-05T12:00:00Z")).toBe("March 5, 2026");
  });
});
