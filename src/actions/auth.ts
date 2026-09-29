"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/auth/verification-token";
import { sendVerificationEmail } from "@/lib/email/send-verification-email";
import { getSiteUrl } from "@/lib/site-url";
import { isEmailVerificationEnabled } from "@/lib/email-verification";

interface ActionResult {
  success: boolean;
  error?: string;
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
