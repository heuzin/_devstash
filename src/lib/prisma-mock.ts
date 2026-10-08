// Typed access to the mocked Prisma client for tests.
//
// Usage in a test file:
//
//   vi.mock("@/lib/prisma"); // picks up src/lib/__mocks__/prisma.ts
//   import { prismaMock } from "@/lib/prisma-mock";
//
//   beforeEach(() => mockReset(prismaMock));
//
// `vi.mock` calls are hoisted above imports, so by the time this module's
// `import { prisma } from "@/lib/prisma"` runs, it already resolves to the
// mock — this file just gives it back the `DeepMockProxy` type.
import type { DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
