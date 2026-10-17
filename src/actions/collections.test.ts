import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/prisma"); // picks up src/lib/__mocks__/prisma.ts

import { auth } from "@/auth";
import { prismaMock } from "@/lib/prisma-mock";
import {
  createCollection,
  deleteCollection,
  toggleCollectionFavorite,
  updateCollection,
} from "./collections";

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

describe("updateCollection", () => {
  it("rejects an empty name before touching auth or the database", async () => {
    const result = await updateCollection(COLLECTION_ID, { name: "   " });

    expect(result).toEqual({ success: false, error: "Name is required" });
    expect(authMock).not.toHaveBeenCalled();
    expect(prismaMock.collection.findFirst).not.toHaveBeenCalled();
  });

  it("rejects when there is no signed-in user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue(null);

    const result = await updateCollection(COLLECTION_ID, { name: "React Patterns" });

    expect(result).toEqual({ success: false, error: "You must be signed in to do this" });
    expect(prismaMock.collection.findFirst).not.toHaveBeenCalled();
  });

  it("returns an error when the collection doesn't exist or isn't owned by the user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.collection.findFirst.mockResolvedValue(null);

    const result = await updateCollection(COLLECTION_ID, { name: "React Patterns" });

    expect(result).toEqual({ success: false, error: "Collection not found" });
    expect(prismaMock.collection.update).not.toHaveBeenCalled();
  });

  it("updates the collection when owned by the signed-in user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.collection.findFirst.mockResolvedValue({ id: COLLECTION_ID } as never);
    prismaMock.collection.update.mockResolvedValue({
      ...DB_COLLECTION,
      name: "Updated Name",
      description: "Updated description",
      items: [],
    } as never);

    const result = await updateCollection(COLLECTION_ID, {
      name: "Updated Name",
      description: "Updated description",
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: COLLECTION_ID,
        name: "Updated Name",
        description: "Updated description",
        isFavorite: false,
        itemCount: 0,
        accentColor: undefined,
        types: [],
        updatedAt: DB_COLLECTION.updatedAt,
      },
    });
    expect(prismaMock.collection.findFirst).toHaveBeenCalledWith({
      where: { id: COLLECTION_ID, userId: USER_ID },
      select: { id: true },
    });
    expect(prismaMock.collection.update).toHaveBeenCalledWith({
      where: { id: COLLECTION_ID },
      data: { name: "Updated Name", description: "Updated description" },
      select: expect.any(Object),
    });
  });
});

describe("deleteCollection", () => {
  it("rejects when there is no signed-in user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue(null);

    const result = await deleteCollection(COLLECTION_ID);

    expect(result).toEqual({ success: false, error: "You must be signed in to do this" });
    expect(prismaMock.collection.findFirst).not.toHaveBeenCalled();
  });

  it("returns an error when the collection doesn't exist or isn't owned by the user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.collection.findFirst.mockResolvedValue(null);

    const result = await deleteCollection(COLLECTION_ID);

    expect(result).toEqual({ success: false, error: "Collection not found" });
    expect(prismaMock.collection.delete).not.toHaveBeenCalled();
  });

  it("deletes the collection when owned by the signed-in user, leaving items untouched", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.collection.findFirst.mockResolvedValue({ id: COLLECTION_ID } as never);

    const result = await deleteCollection(COLLECTION_ID);

    expect(result).toEqual({ success: true });
    expect(prismaMock.collection.findFirst).toHaveBeenCalledWith({
      where: { id: COLLECTION_ID, userId: USER_ID },
      select: { id: true },
    });
    expect(prismaMock.collection.delete).toHaveBeenCalledWith({ where: { id: COLLECTION_ID } });
    expect(prismaMock.item.delete).not.toHaveBeenCalled();
    expect(prismaMock.item.deleteMany).not.toHaveBeenCalled();
  });
});

describe("toggleCollectionFavorite", () => {
  it("rejects when there is no signed-in user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue(null);

    const result = await toggleCollectionFavorite(COLLECTION_ID);

    expect(result).toEqual({ success: false, error: "You must be signed in to do this" });
    expect(prismaMock.collection.findFirst).not.toHaveBeenCalled();
  });

  it("returns an error when the collection doesn't exist or isn't owned by the user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.collection.findFirst.mockResolvedValue(null);

    const result = await toggleCollectionFavorite(COLLECTION_ID);

    expect(result).toEqual({ success: false, error: "Collection not found" });
    expect(prismaMock.collection.update).not.toHaveBeenCalled();
  });

  it.each([
    [false, true],
    [true, false],
  ])("flips isFavorite from %s to %s for an owned collection", async (current, next) => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.collection.findFirst.mockResolvedValue({ isFavorite: current } as never);
    prismaMock.collection.update.mockResolvedValue({
      ...DB_COLLECTION,
      isFavorite: next,
      items: [],
    } as never);

    const result = await toggleCollectionFavorite(COLLECTION_ID);

    expect(result.success).toBe(true);
    expect(result.data?.isFavorite).toBe(next);
    expect(prismaMock.collection.findFirst).toHaveBeenCalledWith({
      where: { id: COLLECTION_ID, userId: USER_ID },
      select: { isFavorite: true },
    });
    expect(prismaMock.collection.update).toHaveBeenCalledWith({
      where: { id: COLLECTION_ID },
      data: { isFavorite: next },
      select: expect.any(Object),
    });
  });
});
