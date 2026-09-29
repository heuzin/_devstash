import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  createdAt: Date;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true, password: true, createdAt: true },
  });
  if (!dbUser) return null;

  return {
    id: session.user.id,
    name: session.user.name ?? session.user.email ?? "User",
    email: session.user.email ?? "",
    image: session.user.image ?? null,
    emailVerified: dbUser.emailVerified != null,
    hasPassword: dbUser.password != null,
    createdAt: dbUser.createdAt,
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
