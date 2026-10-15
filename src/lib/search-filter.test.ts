import { describe, expect, it } from "vitest";
import { filterPaletteItem } from "@/lib/search-filter";

describe("filterPaletteItem", () => {
  it("scores an exact title match highly", () => {
    expect(filterPaletteItem("Test command", "test")).toBeGreaterThan(0);
  });

  it("fuzzy-matches the title for a subsequence query", () => {
    expect(filterPaletteItem("useDebounce Hook", "dbnce")).toBeGreaterThan(0);
  });

  it("does not fuzzy-match an unrelated title", () => {
    expect(filterPaletteItem("Lucide Icons", "dbnce")).toBe(0);
  });

  it("matches a keyword that literally contains the search text", () => {
    expect(filterPaletteItem("Headset", "logitech", ["Logitech"])).toBeGreaterThan(0);
  });

  it("does not fuzzy-match a keyword that only contains the query as a scattered subsequence", () => {
    // Regression test: cmdk's default filter previously fuzzy-matched the long
    // content-preview keyword the same way it fuzzy-matches the title, so a short
    // query like "test" matched almost every item via subsequence matching across
    // the whole preview string instead of requiring the text to actually appear.
    const longPreview =
      "npm run build && npm run db:deploy && pm2 restart app with graceful shutdown";
    expect(filterPaletteItem("Deploy to Production", "test", [longPreview])).toBe(0);
  });

  it("returns a lower score for a keyword match than a title match", () => {
    const keywordScore = filterPaletteItem("Headset", "logitech", ["Logitech"]);
    const titleScore = filterPaletteItem("Logitech Headset", "logitech");
    expect(keywordScore).toBeLessThan(titleScore);
  });

  it("returns 0 when nothing matches", () => {
    expect(filterPaletteItem("Headset", "xyz", ["Logitech"])).toBe(0);
  });

  it("matches everything for an empty search, mirroring cmdk's own default behavior", () => {
    expect(filterPaletteItem("Headset", "", ["Logitech"])).toBeGreaterThan(0);
  });

  it("handles missing keywords gracefully", () => {
    expect(filterPaletteItem("Headset", "logitech")).toBe(0);
  });
});
