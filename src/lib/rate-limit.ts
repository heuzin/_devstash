import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

if (!redis) {
  console.warn(
    "UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set — auth rate limiting is disabled (failing open).",
  );
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

function createLimiter(requests: number, window: `${number} ${"s" | "m" | "h"}`, prefix: string) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `devstash:ratelimit:${prefix}`,
  });
}

export const loginRateLimit = createLimiter(5, "15 m", "login");
export const registerRateLimit = createLimiter(3, "1 h", "register");
export const forgotPasswordRateLimit = createLimiter(3, "1 h", "forgot-password");
export const resetPasswordRateLimit = createLimiter(5, "15 m", "reset-password");
export const resendVerificationRateLimit = createLimiter(3, "15 m", "resend-verification");

/**
 * Checks a rate limit for the given identifier. Fails open (allows the request)
 * if Upstash is not configured or unreachable, per the feature spec.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, remaining: Infinity, reset: 0 };
  }

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, reset };
  } catch (error) {
    console.error("Rate limit check failed, allowing request:", error);
    return { success: true, remaining: Infinity, reset: 0 };
  }
}

/** Extracts the caller's IP from forwarding headers set by Vercel/proxies. */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headerList.get("x-real-ip") ?? "unknown";
}

/** Seconds until the rate limit window resets, rounded up, for a Retry-After header. */
export function retryAfterSeconds(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

export function rateLimitMessage(reset: number): string {
  const minutes = Math.ceil(retryAfterSeconds(reset) / 60);
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
