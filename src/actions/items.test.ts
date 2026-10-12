import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/prisma"); // picks up src/lib/__mocks__/prisma.ts

vi.mock("@/lib/r2", () => ({
  R2_PUBLIC_URL: "https://pub-test.r2.dev",
  deleteFromR2: vi.fn(),
  keyFromFileUrl: vi.fn((fileUrl: string) =>
    fileUrl.startsWith("https://pub-test.r2.dev/")
      ? fileUrl.slice("https://pub-test.r2.dev/".length)
      : null,
  ),
}));

import { auth } from "@/auth";
import { prismaMock } from "@/lib/prisma-mock";
import { R2_PUBLIC_URL, deleteFromR2 } from "@/lib/r2";
import { createItem, deleteItem, updateItem } from "./items";

const authMock = vi.mocked(auth);
const deleteFromR2Mock = vi.mocked(deleteFromR2);

const USER_ID = "user_123";
const ITEM_ID = "item_123";
const TYPE_ID = "type_1";

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
  itemType: { id: TYPE_ID, name: "snippet", slug: "snippets", icon: "Code", color: "#3b82f6" },
  collections: [{ collection: { id: "col_1", name: "React Patterns" } }],
};

beforeEach(() => {
  mockReset(prismaMock);
  authMock.mockReset();
  deleteFromR2Mock.mockReset();
  deleteFromR2Mock.mockResolvedValue(undefined);
});

describe("createItem", () => {
  const VALID_CREATE_INPUT = { ...VALID_INPUT, itemTypeId: TYPE_ID };

  it("rejects an empty title before touching auth or the database", async () => {
    const result = await createItem({ ...VALID_CREATE_INPUT, title: "   " });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(authMock).not.toHaveBeenCalled();
    expect(prismaMock.itemType.findFirst).not.toHaveBeenCalled();
  });

  it("rejects when there is no signed-in user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue(null);

    const result = await createItem(VALID_CREATE_INPUT);

    expect(result).toEqual({ success: false, error: "You must be signed in to do this" });
    expect(prismaMock.itemType.findFirst).not.toHaveBeenCalled();
  });

  it("returns an error for an invalid or non-creatable item type", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.itemType.findFirst.mockResolvedValue(null);

    const result = await createItem(VALID_CREATE_INPUT);

    expect(result).toEqual({ success: false, error: "Invalid item type" });
    expect(prismaMock.item.create).not.toHaveBeenCalled();
  });

  it("requires a URL for link items", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.itemType.findFirst.mockResolvedValue({
      id: TYPE_ID,
      name: "link",
      slug: "links",
      icon: "Link",
      color: "#10b981",
    } as never);

    const result = await createItem({ ...VALID_CREATE_INPUT, content: null, url: null });

    expect(result).toEqual({ success: false, error: "URL is required for links" });
    expect(prismaMock.item.create).not.toHaveBeenCalled();
  });

  it("requires a file upload for file/image items", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.itemType.findFirst.mockResolvedValue({
      id: TYPE_ID,
      name: "image",
      slug: "images",
      icon: "Image",
      color: "#ec4899",
    } as never);

    const result = await createItem({ ...VALID_CREATE_INPUT, content: null, url: null });

    expect(result).toEqual({ success: false, error: "A file upload is required for this type" });
    expect(prismaMock.item.create).not.toHaveBeenCalled();
  });

  it("rejects a fileUrl that didn't come from our R2 bucket", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.itemType.findFirst.mockResolvedValue({
      id: TYPE_ID,
      name: "file",
      slug: "files",
      icon: "File",
      color: "#6b7280",
    } as never);

    const result = await createItem({
      ...VALID_CREATE_INPUT,
      content: null,
      url: null,
      fileUrl: "https://evil.example.com/malware.pdf",
      fileName: "malware.pdf",
      fileSize: 100,
    });

    expect(result).toEqual({ success: false, error: "Invalid file upload" });
    expect(prismaMock.item.create).not.toHaveBeenCalled();
  });

  it("creates a file item with the uploaded file's metadata", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.itemType.findFirst.mockResolvedValue({
      id: TYPE_ID,
      name: "file",
      slug: "files",
      icon: "File",
      color: "#6b7280",
    } as never);
    prismaMock.item.create.mockResolvedValue({
      ...DB_ITEM,
      contentType: "FILE",
      content: null,
      fileUrl: `${R2_PUBLIC_URL}/user_123/abc-doc.pdf`,
      fileName: "doc.pdf",
      fileSize: 2048,
    } as never);

    const result = await createItem({
      ...VALID_CREATE_INPUT,
      content: null,
      url: null,
      fileUrl: `${R2_PUBLIC_URL}/user_123/abc-doc.pdf`,
      fileName: "doc.pdf",
      fileSize: 2048,
    });

    expect(result.success).toBe(true);
    const createArgs = prismaMock.item.create.mock.calls[0][0];
    expect(createArgs.data.contentType).toBe("FILE");
    expect(createArgs.data.content).toBeNull();
    expect(createArgs.data.fileUrl).toBe(`${R2_PUBLIC_URL}/user_123/abc-doc.pdf`);
    expect(createArgs.data.fileName).toBe("doc.pdf");
    expect(createArgs.data.fileSize).toBe(2048);
  });

  it("creates the item and connects tags", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.itemType.findFirst.mockResolvedValue({
      id: TYPE_ID,
      name: "snippet",
      slug: "snippets",
      icon: "Code",
      color: "#3b82f6",
    } as never);
    prismaMock.item.create.mockResolvedValue(DB_ITEM as never);

    const result = await createItem(VALID_CREATE_INPUT);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: ITEM_ID,
      title: "Updated title",
      tags: ["react", "hooks"],
      itemType: { slug: "snippets" },
    });

    const createArgs = prismaMock.item.create.mock.calls[0][0];
    expect(createArgs.data.itemTypeId).toBe(TYPE_ID);
    expect(createArgs.data.contentType).toBe("TEXT");
    expect(createArgs.data.tags).toEqual({
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

describe("deleteItem", () => {
  it("rejects when there is no signed-in user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue(null);

    const result = await deleteItem(ITEM_ID);

    expect(result).toEqual({ success: false, error: "You must be signed in to do this" });
    expect(prismaMock.item.findFirst).not.toHaveBeenCalled();
  });

  it("returns an error when the item doesn't exist or isn't owned by the user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.item.findFirst.mockResolvedValue(null);

    const result = await deleteItem(ITEM_ID);

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(prismaMock.item.delete).not.toHaveBeenCalled();
  });

  it("deletes the item when owned by the signed-in user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.item.findFirst.mockResolvedValue({
      id: ITEM_ID,
      contentType: "TEXT",
      fileUrl: null,
    } as never);

    const result = await deleteItem(ITEM_ID);

    expect(result).toEqual({ success: true });
    expect(prismaMock.item.findFirst).toHaveBeenCalledWith({
      where: { id: ITEM_ID, userId: USER_ID },
      select: { id: true, contentType: true, fileUrl: true },
    });
    expect(prismaMock.item.delete).toHaveBeenCalledWith({ where: { id: ITEM_ID } });
    expect(deleteFromR2Mock).not.toHaveBeenCalled();
  });

  it("also deletes the R2 object for a file item", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    const fileUrl = `${R2_PUBLIC_URL}/user_123/abc-test.pdf`;
    prismaMock.item.findFirst.mockResolvedValue({
      id: ITEM_ID,
      contentType: "FILE",
      fileUrl,
    } as never);

    const result = await deleteItem(ITEM_ID);

    expect(result).toEqual({ success: true });
    expect(deleteFromR2Mock).toHaveBeenCalledWith("user_123/abc-test.pdf");
  });
});
