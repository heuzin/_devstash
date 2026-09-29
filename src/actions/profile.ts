"use server";

import bcryptjs from "bcryptjs";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations/auth";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string,
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword,
    newPassword,
    confirmNewPassword,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do this" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user?.password) {
    return { success: false, error: "This account does not use a password" };
  }

  const isValid = await bcryptjs.compare(parsed.data.currentPassword, user.password);
  if (!isValid) {
    return { success: false, error: "Current password is incorrect" };
  }

  const passwordHash = await bcryptjs.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: passwordHash },
  });

  return { success: true };
}

export async function deleteAccount(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do this" };
  }

  await prisma.user.delete({ where: { id: session.user.id } });
  await signOut({ redirectTo: "/" });

  return { success: true };
}
