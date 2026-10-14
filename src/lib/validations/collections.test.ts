import { describe, expect, it } from "vitest";
import { createCollectionSchema } from "./collections";

describe("createCollectionSchema", () => {
  it("accepts a name with no description", () => {
    const result = createCollectionSchema.safeParse({ name: "React Patterns" });
    expect(result.success).toBe(true);
  });

  it("trims the name", () => {
    const result = createCollectionSchema.parse({ name: "  React Patterns  " });
    expect(result.name).toBe("  React Patterns  ".trim());
  });

  it("rejects an empty name", () => {
    const result = createCollectionSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  it("accepts a null description", () => {
    const result = createCollectionSchema.safeParse({ name: "React Patterns", description: null });
    expect(result.success).toBe(true);
  });
});
