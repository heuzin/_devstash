import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    GitHub({}),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Real validation lives in auth.ts (needs bcryptjs + Prisma, not edge-safe).
      authorize: async () => null,
    }),
  ],
} satisfies NextAuthConfig;
