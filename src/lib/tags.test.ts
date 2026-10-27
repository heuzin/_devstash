import { describe, expect, it } from "vitest";
import { addTagToInput, parseTagsInput } from "@/lib/tags";

describe("addTagToInput", () => {
  it("appends a tag to existing comma-separated tags", () => {
    expect(addTagToInput("react, hooks", "typescript")).toBe("react, hooks, typescript");
  });

  it("returns just the tag for an empty input", () => {
    expect(addTagToInput("  ", "react")).toBe("react");
  });

  it("skips case-insensitive duplicates", () => {
    expect(addTagToInput("React, hooks", "react")).toBe("React, hooks");
  });
});

describe("parseTagsInput", () => {
  it("splits comma-separated values and trims whitespace", () => {
    expect(parseTagsInput("react, hooks ,  typescript")).toEqual([
      "react",
      "hooks",
      "typescript",
    ]);
  });

  it("filters out empty entries from blank segments or trailing commas", () => {
    expect(parseTagsInput("react,,  ,typescript,")).toEqual(["react", "typescript"]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseTagsInput("")).toEqual([]);
    expect(parseTagsInput("   ")).toEqual([]);
  });
});
