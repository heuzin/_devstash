import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { registerSchema } from "@/lib/validations/auth";
import { createVerificationToken } from "@/lib/auth/verification-token";
import { sendVerificationEmail } from "@/lib/email/send-verification-email";
import { isEmailVerificationEnabled } from "@/lib/email-verification";
import {
  checkRateLimit,
  getClientIp,
  rateLimitMessage,
  registerRateLimit,
  retryAfterSeconds,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(registerRateLimit, ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: rateLimitMessage(rateLimit.reset) },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds(rateLimit.reset)) },
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { success: false, error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const hashedPassword = await bcryptjs.hash(password, 12);

  try {
    const emailVerificationEnabled = isEmailVerificationEnabled();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Not required at signup, so treat it as already satisfied -- otherwise
        // re-enabling the flag later would retroactively flag this account as unverified.
        emailVerified: emailVerificationEnabled ? null : new Date(),
      },
    });

    if (emailVerificationEnabled) {
      try {
        const token = await createVerificationToken(email);
        const verifyUrl = new URL(`/verify-email?token=${token}`, request.url).toString();
        await sendVerificationEmail({ to: email, name, verifyUrl });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
    }

    return NextResponse.json(
      { success: true, data: { id: user.id, name: user.name, email: user.email } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 },
      );
    }
    throw error;
  }
}
