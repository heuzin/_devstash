import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean;
    } & DefaultSession["user"];
  }
}

// next-auth/jwt re-exports JWT from @auth/core, so the augmentation has to
// target the declaring module.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    isPro?: boolean;
  }
}
