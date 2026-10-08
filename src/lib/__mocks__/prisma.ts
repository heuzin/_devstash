// Auto-mock for `@/lib/prisma`, used by `vi.mock("@/lib/prisma")`.
// Vitest picks this up automatically from the adjacent `__mocks__` folder,
// so no factory function needs to be passed to `vi.mock`.
import { mockDeep } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";

export const prisma = mockDeep<PrismaClient>();
