import { describe, expect, it } from "vitest";
import { clampPage, getTotalPages, parsePageParam } from "@/lib/pagination";

describe("parsePageParam", () => {
  it("parses a valid numeric string", () => {
    expect(parsePageParam("3")).toBe(3);
  });

  it("takes the first value when given an array", () => {
    expect(parsePageParam(["2", "5"])).toBe(2);
  });

  it("defaults to 1 for undefined, non-numeric, zero, negative, or fractional input", () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-2")).toBe(1);
    expect(parsePageParam("1.5")).toBe(1);
  });
});

describe("getTotalPages", () => {
  it("rounds up to the next whole page", () => {
    expect(getTotalPages(22, 21)).toBe(2);
    expect(getTotalPages(21, 21)).toBe(1);
  });

  it("returns at least 1 page even when there are no items", () => {
    expect(getTotalPages(0, 21)).toBe(1);
  });
});

describe("clampPage", () => {
  it("clamps below 1 up to 1", () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(-3, 5)).toBe(1);
  });

  it("clamps above totalPages down to totalPages", () => {
    expect(clampPage(9, 5)).toBe(5);
  });

  it("leaves an in-range page untouched", () => {
    expect(clampPage(3, 5)).toBe(3);
  });
});
