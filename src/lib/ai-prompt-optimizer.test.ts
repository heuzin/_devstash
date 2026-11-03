import { describe, expect, it } from "vitest";
import {
  AI_OPTIMIZE_CONTENT_MAX_CHARS,
  buildOptimizeInput,
  parseOptimizedPrompt,
} from "./ai-prompt-optimizer";

describe("buildOptimizeInput", () => {
  it("wraps the prompt in <item> tags and mentions JSON", () => {
    const input = buildOptimizeInput({ title: "Code review", content: "Review my code" });

    expect(input).toContain("JSON");
    expect(input).toContain('<item type="prompt">');
    expect(input).toContain("<title>Code review</title>");
    expect(input).toContain("<content>Review my code</content>");
  });

  it("truncates long content", () => {
    const input = buildOptimizeInput({
      title: "Long",
      content: "x".repeat(AI_OPTIMIZE_CONTENT_MAX_CHARS + 50),
    });

    expect(input).toContain("x".repeat(AI_OPTIMIZE_CONTENT_MAX_CHARS));
    expect(input).not.toContain("x".repeat(AI_OPTIMIZE_CONTENT_MAX_CHARS + 1));
  });
});

describe("parseOptimizedPrompt", () => {
  const ORIGINAL = "Review my code";

  it("returns a trimmed optimized prompt with its summary", () => {
    const result = parseOptimizedPrompt(
      JSON.stringify({
        optimized: "  You are a senior engineer. Review the code below.  ",
        changed: true,
        summary: " Added a role and clearer task. ",
      }),
      ORIGINAL,
    );

    expect(result).toEqual({
      optimized: "You are a senior engineer. Review the code below.",
      changed: true,
      summary: "Added a role and clearer task.",
    });
  });

  it("reports no change when the model says so", () => {
    const result = parseOptimizedPrompt(
      JSON.stringify({ optimized: "Review my code, please", changed: false }),
      ORIGINAL,
    );

    expect(result?.changed).toBe(false);
  });

  it("reports no change when the text only differs by whitespace", () => {
    const result = parseOptimizedPrompt(
      JSON.stringify({ optimized: "Review   my\ncode", changed: true }),
      ORIGINAL,
    );

    expect(result?.changed).toBe(false);
  });

  it("treats a missing changed flag as changed when the text differs", () => {
    const result = parseOptimizedPrompt(JSON.stringify({ optimized: "Review this code" }), ORIGINAL);

    expect(result).toEqual({ optimized: "Review this code", changed: true, summary: null });
  });

  it("caps long summaries", () => {
    const result = parseOptimizedPrompt(
      JSON.stringify({ optimized: "Better", summary: "s".repeat(500) }),
      ORIGINAL,
    );

    expect(result?.summary).toHaveLength(300);
  });

  it("returns null for invalid JSON, non-objects, or an empty optimized prompt", () => {
    expect(parseOptimizedPrompt("not json", ORIGINAL)).toBeNull();
    expect(parseOptimizedPrompt("null", ORIGINAL)).toBeNull();
    expect(parseOptimizedPrompt(JSON.stringify({ optimized: "  " }), ORIGINAL)).toBeNull();
    expect(parseOptimizedPrompt(JSON.stringify({ optimized: 42 }), ORIGINAL)).toBeNull();
  });
});
