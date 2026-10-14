import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/prisma"); // picks up src/lib/__mocks__/prisma.ts

import { auth } from "@/auth";
import { prismaMock } from "@/lib/prisma-mock";
import { createCollection } from "./collections";

const authMock = vi.mocked(auth);

const USER_ID = "user_123";
const COLLECTION_ID = "col_123";

const DB_COLLECTION = {
  id: COLLECTION_ID,
  name: "React Patterns",
  description: "Reusable hooks and patterns",
  isFavorite: false,
  updatedAt: new Date("2026-01-02"),
};

beforeEach(() => {
  mockReset(prismaMock);
  authMock.mockReset();
});

describe("createCollection", () => {
  it("rejects an empty name before touching auth or the database", async () => {
    const result = await createCollection({ name: "   " });

    expect(result).toEqual({ success: false, error: "Name is required" });
    expect(authMock).not.toHaveBeenCalled();
    expect(prismaMock.collection.create).not.toHaveBeenCalled();
  });

  it("rejects when there is no signed-in user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue(null);

    const result = await createCollection({ name: "React Patterns" });

    expect(result).toEqual({ success: false, error: "You must be signed in to do this" });
    expect(prismaMock.collection.create).not.toHaveBeenCalled();
  });

  it("creates the collection scoped to the signed-in user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.collection.create.mockResolvedValue(DB_COLLECTION as never);

    const result = await createCollection({
      name: "React Patterns",
      description: "Reusable hooks and patterns",
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: COLLECTION_ID,
        name: "React Patterns",
        description: "Reusable hooks and patterns",
        isFavorite: false,
        itemCount: 0,
        accentColor: undefined,
        types: [],
        updatedAt: DB_COLLECTION.updatedAt,
      },
    });

    expect(prismaMock.collection.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, name: "React Patterns", description: "Reusable hooks and patterns" },
    });
  });

  it("defaults a missing description to null", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.collection.create.mockResolvedValue({
      ...DB_COLLECTION,
      description: null,
    } as never);

    await createCollection({ name: "React Patterns" });

    expect(prismaMock.collection.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, name: "React Patterns", description: null },
    });
  });
});
