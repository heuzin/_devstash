import { describe, expect, it } from "vitest";
import { editorPreferencesSchema } from "./editor-preferences";

const VALID_PREFERENCES = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark" as const,
};

describe("editorPreferencesSchema", () => {
  it("accepts a fully valid payload", () => {
    const result = editorPreferencesSchema.safeParse(VALID_PREFERENCES);
    expect(result.success).toBe(true);
  });

  it("rejects a font size outside the allowed options", () => {
    const result = editorPreferencesSchema.safeParse({ ...VALID_PREFERENCES, fontSize: 15 });
    expect(result.success).toBe(false);
  });

  it("rejects a tab size outside the allowed options", () => {
    const result = editorPreferencesSchema.safeParse({ ...VALID_PREFERENCES, tabSize: 3 });
    expect(result.success).toBe(false);
  });

  it("rejects a theme outside the allowed options", () => {
    const result = editorPreferencesSchema.safeParse({ ...VALID_PREFERENCES, theme: "solarized" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-boolean wordWrap", () => {
    const result = editorPreferencesSchema.safeParse({ ...VALID_PREFERENCES, wordWrap: "on" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-boolean minimap", () => {
    const result = editorPreferencesSchema.safeParse({ ...VALID_PREFERENCES, minimap: "off" });
    expect(result.success).toBe(false);
  });
});
