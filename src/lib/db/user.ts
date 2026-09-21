import { prisma } from "@/lib/prisma";

// TODO: replace with the authenticated user's id once Auth.js is wired up.
const DEMO_USER_EMAIL = "demo@devstash.io";

export async function getCurrentUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  return user?.id ?? null;
}
