import { describe, expect, it } from "vitest";
import { checkRateLimit, rateLimitMessage, retryAfterSeconds } from "./rate-limit";

// UPSTASH_REDIS_REST_URL/TOKEN are unset in the test environment, so every
// limiter in this module is `null` and checkRateLimit fails open — the same
// behavior it falls back to in production if Upstash is unreachable.
describe("checkRateLimit", () => {
  it("fails open (allows the request) when no limiter is configured", async () => {
    const result = await checkRateLimit(null, "some-identifier");
    expect(result).toEqual({ success: true, remaining: Infinity, reset: 0 });
  });
});

describe("retryAfterSeconds", () => {
  it("rounds up to the nearest second", () => {
    const reset = Date.now() + 1_500;
    expect(retryAfterSeconds(reset)).toBe(2);
  });

  it("never returns less than 1 second, even for a past reset time", () => {
    const reset = Date.now() - 10_000;
    expect(retryAfterSeconds(reset)).toBe(1);
  });
});

describe("rateLimitMessage", () => {
  it("pluralizes minutes correctly", () => {
    expect(rateLimitMessage(Date.now() + 61_000)).toBe("Too many attempts. Please try again in 2 minutes.");
  });

  it("uses singular minute when exactly one minute remains", () => {
    expect(rateLimitMessage(Date.now() + 1_000)).toBe("Too many attempts. Please try again in 1 minute.");
  });
});
