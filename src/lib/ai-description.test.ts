import { describe, expect, it } from "vitest";
import {
  AI_DESCRIPTION_CONTENT_MAX_CHARS,
  AI_DESCRIPTION_MAX_LENGTH,
  buildDescriptionInput,
  parseDescription,
} from "@/lib/ai-description";

describe("parseDescription", () => {
  it("returns trimmed plain text unchanged", () => {
    expect(parseDescription("  A React hook that debounces a value.  ")).toBe(
      "A React hook that debounces a value.",
    );
  });

  it("collapses whitespace and newlines into single spaces", () => {
    expect(parseDescription("First sentence.\n\nSecond   sentence.")).toBe(
      "First sentence. Second sentence.",
    );
  });

  it("strips wrapping quotes and a leading label", () => {
    expect(parseDescription('Description: "Debounces a value."')).toBe("Debounces a value.");
    expect(parseDescription("“Debounces a value.”")).toBe("Debounces a value.");
  });

  it("returns an empty string for blank output", () => {
    expect(parseDescription('  "" ')).toBe("");
  });

  it("caps overlong output at a word boundary with an ellipsis", () => {
    const result = parseDescription("word ".repeat(200));

    expect(result.length).toBeLessThanOrEqual(AI_DESCRIPTION_MAX_LENGTH + 1);
    expect(result.endsWith("word…")).toBe(true);
  });
});

describe("buildDescriptionInput", () => {
  it("includes only the fields that are present", () => {
    const input = buildDescriptionInput({
      itemTypeName: "image",
      title: "Architecture diagram",
      fileName: "arch.png",
      tags: [],
    });

    expect(input).toContain('<item type="image">');
    expect(input).toContain("<title>Architecture diagram</title>");
    expect(input).toContain("<file-name>arch.png</file-name>");
    expect(input).not.toContain("<content>");
    expect(input).not.toContain("<url>");
    expect(input).not.toContain("<tags>");
  });

  it("includes language, url, tags, and current description when given", () => {
    const input = buildDescriptionInput({
      itemTypeName: "snippet",
      title: "useDebounce",
      language: "typescript",
      url: "https://example.com",
      tags: ["react", "hooks"],
      description: "Old text",
    });

    expect(input).toContain("<language>typescript</language>");
    expect(input).toContain("<url>https://example.com</url>");
    expect(input).toContain("<tags>react, hooks</tags>");
    expect(input).toContain("<current-description>Old text</current-description>");
  });

  it("truncates long content", () => {
    const input = buildDescriptionInput({
      title: "Big note",
      content: "x".repeat(AI_DESCRIPTION_CONTENT_MAX_CHARS + 500),
      tags: [],
    });

    expect(input).toContain("x".repeat(AI_DESCRIPTION_CONTENT_MAX_CHARS));
    expect(input).not.toContain("x".repeat(AI_DESCRIPTION_CONTENT_MAX_CHARS + 1));
  });
});
