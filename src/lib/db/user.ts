import { auth } from "@/auth";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    name: session.user.name ?? session.user.email ?? "User",
    email: session.user.email ?? "",
    image: session.user.image ?? null,
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
