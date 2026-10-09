import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/prisma"); // picks up src/lib/__mocks__/prisma.ts

import { auth } from "@/auth";
import { prismaMock } from "@/lib/prisma-mock";
import { updateItem } from "./items";

const authMock = vi.mocked(auth);

const USER_ID = "user_123";
const ITEM_ID = "item_123";

const VALID_INPUT = {
  title: "Updated title",
  description: "Updated description",
  content: "console.log('updated')",
  language: "typescript",
  url: null,
  tags: ["react", "hooks"],
};

const DB_ITEM = {
  id: ITEM_ID,
  title: "Updated title",
  description: "Updated description",
  contentType: "TEXT",
  content: "console.log('updated')",
  language: "typescript",
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  isFavorite: false,
  isPinned: false,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-02"),
  tags: [{ name: "react" }, { name: "hooks" }],
  itemType: { id: "type_1", name: "snippet", slug: "snippets", icon: "Code", color: "#3b82f6" },
  collections: [{ collection: { id: "col_1", name: "React Patterns" } }],
};

beforeEach(() => {
  mockReset(prismaMock);
  authMock.mockReset();
});

describe("updateItem", () => {
  it("rejects an empty title before touching auth or the database", async () => {
    const result = await updateItem(ITEM_ID, { ...VALID_INPUT, title: "   " });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(authMock).not.toHaveBeenCalled();
    expect(prismaMock.item.findFirst).not.toHaveBeenCalled();
  });

  it("rejects an invalid URL", async () => {
    const result = await updateItem(ITEM_ID, { ...VALID_INPUT, url: "not-a-url" });

    expect(result.success).toBe(false);
    expect(authMock).not.toHaveBeenCalled();
  });

  it("rejects when there is no signed-in user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue(null);

    const result = await updateItem(ITEM_ID, VALID_INPUT);

    expect(result).toEqual({ success: false, error: "You must be signed in to do this" });
    expect(prismaMock.item.findFirst).not.toHaveBeenCalled();
  });

  it("returns an error when the item doesn't exist or isn't owned by the user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.item.findFirst.mockResolvedValue(null);

    const result = await updateItem(ITEM_ID, VALID_INPUT);

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(prismaMock.item.update).not.toHaveBeenCalled();
  });

  it("updates the item and resets tags via disconnect-all-then-connect-or-create", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.item.findFirst.mockResolvedValue({ id: ITEM_ID } as never);
    prismaMock.item.update.mockResolvedValue(DB_ITEM as never);

    const result = await updateItem(ITEM_ID, VALID_INPUT);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: ITEM_ID,
      title: "Updated title",
      tags: ["react", "hooks"],
      itemType: { slug: "snippets" },
      collections: [{ id: "col_1", name: "React Patterns" }],
    });

    expect(prismaMock.item.findFirst).toHaveBeenCalledWith({
      where: { id: ITEM_ID, userId: USER_ID },
      select: { id: true },
    });

    const updateArgs = prismaMock.item.update.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: ITEM_ID });
    expect(updateArgs.data.title).toBe("Updated title");
    expect(updateArgs.data.tags).toEqual({
      set: [],
      connectOrCreate: [
        {
          where: { userId_name: { userId: USER_ID, name: "react" } },
          create: { name: "react", userId: USER_ID },
        },
        {
          where: { userId_name: { userId: USER_ID, name: "hooks" } },
          create: { name: "hooks", userId: USER_ID },
        },
      ],
    });
  });
});
