import { describe, expect, it } from "vitest";
import { resolveMonacoLanguage } from "./monaco-languages";

describe("resolveMonacoLanguage", () => {
  it("falls back when language is null, undefined, or empty", () => {
    expect(resolveMonacoLanguage(null, "plaintext")).toBe("plaintext");
    expect(resolveMonacoLanguage(undefined, "shell")).toBe("shell");
    expect(resolveMonacoLanguage("", "plaintext")).toBe("plaintext");
    expect(resolveMonacoLanguage("   ", "plaintext")).toBe("plaintext");
  });

  it("maps known aliases to their Monaco language id", () => {
    expect(resolveMonacoLanguage("ts", "plaintext")).toBe("typescript");
    expect(resolveMonacoLanguage("js", "plaintext")).toBe("javascript");
    expect(resolveMonacoLanguage("bash", "plaintext")).toBe("shell");
    expect(resolveMonacoLanguage("sh", "plaintext")).toBe("shell");
    expect(resolveMonacoLanguage("py", "plaintext")).toBe("python");
  });

  it("normalizes case and surrounding whitespace before resolving", () => {
    expect(resolveMonacoLanguage("  TS  ", "plaintext")).toBe("typescript");
    expect(resolveMonacoLanguage("Bash", "plaintext")).toBe("shell");
  });

  it("passes through languages with no known alias unchanged", () => {
    expect(resolveMonacoLanguage("typescript", "plaintext")).toBe("typescript");
    expect(resolveMonacoLanguage("kotlin", "plaintext")).toBe("kotlin");
  });
});
