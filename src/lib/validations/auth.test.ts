import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  signInSchema,
} from "./auth";

describe("signInSchema", () => {
  it("trims and lowercases the email", () => {
    const result = signInSchema.parse({ email: "  USER@Example.com  ", password: "secret" });
    expect(result.email).toBe("user@example.com");
  });

  it("rejects an invalid email", () => {
    const result = signInSchema.safeParse({ email: "not-an-email", password: "secret" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = signInSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "longenough",
    confirmPassword: "longenough",
  };

  it("accepts matching passwords of sufficient length", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...base, password: "short", confirmPassword: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords and flags confirmPassword", () => {
    const result = registerSchema.safeParse({ ...base, confirmPassword: "different" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });
});

describe("forgotPasswordSchema", () => {
  it("normalizes the email the same way signInSchema does", () => {
    const result = forgotPasswordSchema.parse({ email: "Someone@Example.COM" });
    expect(result.email).toBe("someone@example.com");
  });
});

describe("resetPasswordSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "longenough",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("accepts matching passwords of sufficient length", () => {
    const result = resetPasswordSchema.safeParse({
      password: "longenough",
      confirmPassword: "longenough",
    });
    expect(result.success).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  it("requires a non-empty current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "longenough",
      confirmNewPassword: "longenough",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched new passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "current",
      newPassword: "longenough",
      confirmNewPassword: "different",
    });
    expect(result.success).toBe(false);
  });
});
