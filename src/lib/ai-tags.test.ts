import { describe, expect, it } from "vitest";
import {
  AI_TAG_CONTENT_MAX_CHARS,
  AI_TAG_MAX_SUGGESTIONS,
  buildAutoTagInput,
  parseTagSuggestions,
} from "@/lib/ai-tags";

describe("parseTagSuggestions", () => {
  it("parses the {tags: [...]} shape", () => {
    expect(parseTagSuggestions('{"tags": ["react", "hooks"]}', [])).toEqual(["react", "hooks"]);
  });

  it("parses a bare array", () => {
    expect(parseTagSuggestions('["react", "hooks"]', [])).toEqual(["react", "hooks"]);
  });

  it("lowercases, trims, and dedupes tags", () => {
    expect(parseTagSuggestions('["React", " react ", "TypeScript"]', [])).toEqual([
      "react",
      "typescript",
    ]);
  });

  it("drops tags already on the item, case-insensitively", () => {
    expect(parseTagSuggestions('["react", "hooks"]', ["React"])).toEqual(["hooks"]);
  });

  it("drops non-strings, blanks, comma-containing, and overlong tags", () => {
    const text = JSON.stringify([42, "", "a,b", "x".repeat(31), "valid"]);
    expect(parseTagSuggestions(text, [])).toEqual(["valid"]);
  });

  it("caps the number of suggestions", () => {
    const text = JSON.stringify(["a", "b", "c", "d", "e", "f", "g"]);
    expect(parseTagSuggestions(text, [])).toHaveLength(AI_TAG_MAX_SUGGESTIONS);
  });

  it("returns an empty array for invalid JSON or unexpected shapes", () => {
    expect(parseTagSuggestions("not json", [])).toEqual([]);
    expect(parseTagSuggestions('{"labels": ["react"]}', [])).toEqual([]);
    expect(parseTagSuggestions("null", [])).toEqual([]);
  });
});

describe("buildAutoTagInput", () => {
  it("mentions JSON in the input, as json_object mode requires", () => {
    const input = buildAutoTagInput({ title: "Anything", existingTags: [] });
    expect(input.toLowerCase()).toContain("json");
  });

  it("truncates content to the max length", () => {
    const content = "a".repeat(AI_TAG_CONTENT_MAX_CHARS + 500);
    const input = buildAutoTagInput({ title: "Long", content, existingTags: [] });
    expect(input).toContain(`<content>${"a".repeat(AI_TAG_CONTENT_MAX_CHARS)}</content>`);
    expect(input).not.toContain("a".repeat(AI_TAG_CONTENT_MAX_CHARS + 1));
  });

  it("omits empty optional fields and includes existing tags", () => {
    const input = buildAutoTagInput({
      itemTypeName: "snippet",
      title: "useDebounce",
      existingTags: ["react", "hooks"],
    });
    expect(input).toContain('<item type="snippet">');
    expect(input).toContain("<existing-tags>react, hooks</existing-tags>");
    expect(input).not.toContain("<content>");
    expect(input).not.toContain("<url>");
    expect(input).not.toContain("<description>");
  });
});
