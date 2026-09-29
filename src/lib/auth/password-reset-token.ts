import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function toIdentifier(email: string): string {
  return `reset-password:${email}`;
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const identifier = toIdentifier(email);
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: { identifier, token, expires: new Date(Date.now() + TOKEN_TTL_MS) },
  });

  return token;
}

export type ConsumePasswordResetTokenResult =
  | { success: true; email: string }
  | { success: false; error: "invalid" | "expired" };

export async function consumePasswordResetToken(
  token: string,
  newPasswordHash: string,
): Promise<ConsumePasswordResetTokenResult> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || !record.identifier.startsWith("reset-password:")) {
    return { success: false, error: "invalid" };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return { success: false, error: "expired" };
  }

  const email = record.identifier.slice("reset-password:".length);

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { password: newPasswordHash },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, error: "invalid" };
    }
    throw error;
  }

  return { success: true, email };
}
