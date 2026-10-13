import { describe, expect, it } from "vitest";
import { capitalize } from "@/lib/utils";

describe("capitalize", () => {
  it("uppercases the first letter and leaves the rest unchanged", () => {
    expect(capitalize("snippet")).toBe("Snippet");
  });

  it("leaves an already-capitalized string unchanged", () => {
    expect(capitalize("Snippet")).toBe("Snippet");
  });

  it("returns an empty string unchanged", () => {
    expect(capitalize("")).toBe("");
  });
});
