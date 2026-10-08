import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The module reads EMAIL_VERIFICATION_ENABLED into a module-level constant at
// import time, so each scenario needs a fresh module instance — vi.resetModules()
// plus a dynamic import re-evaluates the module against the current env var.
describe("isEmailVerificationEnabled", () => {
  const originalValue = process.env.EMAIL_VERIFICATION_ENABLED;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.EMAIL_VERIFICATION_ENABLED = originalValue;
  });

  it("defaults to enabled when the env var is unset", async () => {
    delete process.env.EMAIL_VERIFICATION_ENABLED;
    const { isEmailVerificationEnabled } = await import("./email-verification");
    expect(isEmailVerificationEnabled()).toBe(true);
  });

  it("is disabled only when the env var is exactly \"false\"", async () => {
    process.env.EMAIL_VERIFICATION_ENABLED = "false";
    const { isEmailVerificationEnabled } = await import("./email-verification");
    expect(isEmailVerificationEnabled()).toBe(false);
  });

  it("treats any other value as enabled", async () => {
    process.env.EMAIL_VERIFICATION_ENABLED = "False";
    const { isEmailVerificationEnabled } = await import("./email-verification");
    expect(isEmailVerificationEnabled()).toBe(true);
  });
});
