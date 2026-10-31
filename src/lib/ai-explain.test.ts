import { describe, expect, it } from "vitest";
import { AI_EXPLAIN_CONTENT_MAX_CHARS, buildExplainInput, parseExplanation } from "./ai-explain";

describe("buildExplainInput", () => {
  it("wraps the item in <item> tags with its language", () => {
    const input = buildExplainInput({
      itemTypeName: "snippet",
      title: "useDebounce",
      content: "const x = 1;",
      language: "typescript",
    });

    expect(input).toContain("Explain this code.");
    expect(input).toContain('<item type="snippet">');
    expect(input).toContain("<language>typescript</language>");
    expect(input).toContain("<content>const x = 1;</content>");
  });

  it("asks to explain a command and omits a missing language", () => {
    const input = buildExplainInput({ itemTypeName: "command", title: "List", content: "ls -la" });

    expect(input).toContain("Explain this command.");
    expect(input).not.toContain("<language>");
  });

  it("truncates long content", () => {
    const input = buildExplainInput({
      itemTypeName: "snippet",
      title: "Long",
      content: "a".repeat(AI_EXPLAIN_CONTENT_MAX_CHARS + 50),
    });

    expect(input).toContain(`<content>${"a".repeat(AI_EXPLAIN_CONTENT_MAX_CHARS)}</content>`);
  });
});

describe("parseExplanation", () => {
  it("trims surrounding whitespace", () => {
    expect(parseExplanation("\n  Some **text**  \n")).toBe("Some **text**");
  });

  it("unwraps a reply fully enclosed in a markdown fence", () => {
    expect(parseExplanation("```markdown\n# Title\n\nBody\n```")).toBe("# Title\n\nBody");
  });

  it("keeps code fences that are only part of the reply", () => {
    const text = "Runs this:\n\n```ts\nfoo();\n```";
    expect(parseExplanation(text)).toBe(text);
  });

  it("returns an empty string for blank output", () => {
    expect(parseExplanation("   ")).toBe("");
  });
});
