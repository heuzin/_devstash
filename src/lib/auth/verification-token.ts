import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function createVerificationToken(email: string): Promise<string> {
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires: new Date(Date.now() + TOKEN_TTL_MS) },
  });

  return token;
}

export type ConsumeVerificationTokenResult =
  | { success: true; email: string }
  | { success: false; error: "invalid" | "expired" };

export async function consumeVerificationToken(
  token: string,
): Promise<ConsumeVerificationTokenResult> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) {
    return { success: false, error: "invalid" };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return { success: false, error: "expired" };
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.identifier },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, error: "invalid" };
    }
    throw error;
  }

  return { success: true, email: record.identifier };
}
