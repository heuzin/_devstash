import { describe, expect, it } from "vitest";
import { createItemSchema, updateItemSchema } from "./items";

const VALID_INPUT = {
  title: "useDebounce Hook",
  description: "Delays a value",
  content: "export function useDebounce() {}",
  language: "typescript",
  url: null,
  tags: ["react", "hooks"],
};

describe("createItemSchema", () => {
  const VALID_CREATE_INPUT = { ...VALID_INPUT, itemTypeId: "type_1" };

  it("accepts a fully populated payload", () => {
    const result = createItemSchema.safeParse(VALID_CREATE_INPUT);
    expect(result.success).toBe(true);
  });

  it("requires an itemTypeId", () => {
    const result = createItemSchema.safeParse({ ...VALID_CREATE_INPUT, itemTypeId: "" });
    expect(result.success).toBe(false);
  });

  it("trims and requires a non-empty title", () => {
    const result = createItemSchema.safeParse({ ...VALID_CREATE_INPUT, title: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid URL", () => {
    const result = createItemSchema.safeParse({ ...VALID_CREATE_INPUT, url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts an empty tags array", () => {
    const result = createItemSchema.safeParse({ ...VALID_CREATE_INPUT, tags: [] });
    expect(result.success).toBe(true);
  });
});

describe("updateItemSchema", () => {
  it("accepts a fully populated payload", () => {
    const result = updateItemSchema.safeParse(VALID_INPUT);
    expect(result.success).toBe(true);
  });

  it("trims and requires a non-empty title", () => {
    const result = updateItemSchema.safeParse({ ...VALID_INPUT, title: "   " });
    expect(result.success).toBe(false);
  });

  it("accepts null for optional fields", () => {
    const result = updateItemSchema.safeParse({
      ...VALID_INPUT,
      description: null,
      content: null,
      language: null,
      url: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid URL", () => {
    const result = updateItemSchema.safeParse({ ...VALID_INPUT, url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid URL", () => {
    const result = updateItemSchema.safeParse({ ...VALID_INPUT, url: "https://example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects a tags array containing empty strings", () => {
    const result = updateItemSchema.safeParse({ ...VALID_INPUT, tags: ["react", ""] });
    expect(result.success).toBe(false);
  });

  it("accepts an empty tags array", () => {
    const result = updateItemSchema.safeParse({ ...VALID_INPUT, tags: [] });
    expect(result.success).toBe(true);
  });
});
