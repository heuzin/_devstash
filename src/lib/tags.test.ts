import { describe, expect, it } from "vitest";
import { parseTagsInput } from "@/lib/tags";

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
