import { prisma } from "@/lib/prisma";

// TODO: replace with the authenticated user's id once Auth.js is wired up.
const DEMO_USER_EMAIL = "demo@devstash.io";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (!user) return null;
  return { id: user.id, name: user.name ?? user.email, email: user.email };
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}
