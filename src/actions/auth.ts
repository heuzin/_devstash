"use server";

import bcryptjs from "bcryptjs";
import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/auth/verification-token";
import { createPasswordResetToken, consumePasswordResetToken } from "@/lib/auth/password-reset-token";
import { sendVerificationEmail } from "@/lib/email/send-verification-email";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset-email";
import { getSiteUrl } from "@/lib/site-url";
import { isEmailVerificationEnabled } from "@/lib/email-verification";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import {
  checkRateLimit,
  forgotPasswordRateLimit,
  getClientIp,
  rateLimitMessage,
  resendVerificationRateLimit,
  resetPasswordRateLimit,
} from "@/lib/rate-limit";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function signInWithGitHub(): Promise<void> {
  await signIn("github", { redirectTo: "/dashboard" });
}

export async function resendVerificationEmail(): Promise<ActionResult> {
  if (!isEmailVerificationEnabled()) {
    return { success: false, error: "Email verification is currently disabled" };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do this" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, emailVerified: true },
  });
  if (!user) {
    return { success: false, error: "User not found" };
  }
  if (user.emailVerified) {
    return { success: false, error: "Your email is already verified" };
  }

  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(resendVerificationRateLimit, `${ip}:${user.email}`);
  if (!rateLimit.success) {
    return { success: false, error: rateLimitMessage(rateLimit.reset) };
  }

  try {
    const token = await createVerificationToken(user.email);
    const verifyUrl = new URL(`/verify-email?token=${token}`, await getSiteUrl()).toString();
    await sendVerificationEmail({ to: user.email, name: user.name ?? "there", verifyUrl });
  } catch (error) {
    console.error("Failed to resend verification email:", error);
    return { success: false, error: "Could not send verification email. Please try again." };
  }

  return { success: true };
}

const GENERIC_RESET_MESSAGE =
  "If an account with that email exists, we've sent a password reset link.";

export async function requestPasswordReset(
  email: string,
): Promise<{ success: boolean; message: string }> {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(forgotPasswordRateLimit, ip);
  if (!rateLimit.success) {
    return { success: false, message: rateLimitMessage(rateLimit.reset) };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { email: true, name: true, password: true },
  });

  if (user?.password) {
    try {
      const token = await createPasswordResetToken(user.email);
      const resetUrl = new URL(`/reset-password?token=${token}`, await getSiteUrl()).toString();
      await sendPasswordResetEmail({ to: user.email, name: user.name ?? "there", resetUrl });
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }
  }

  return { success: true, message: GENERIC_RESET_MESSAGE };
}

export async function resetPassword(
  token: string,
  password: string,
  confirmPassword: string,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(resetPasswordRateLimit, ip);
  if (!rateLimit.success) {
    return { success: false, error: rateLimitMessage(rateLimit.reset) };
  }

  const passwordHash = await bcryptjs.hash(parsed.data.password, 12);
  const result = await consumePasswordResetToken(token, passwordHash);

  if (!result.success) {
    return {
      success: false,
      error:
        result.error === "expired"
          ? "This reset link has expired"
          : "This reset link is invalid",
    };
  }

  return { success: true };
}
