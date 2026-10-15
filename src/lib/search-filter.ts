import { defaultFilter } from "cmdk";

// cmdk's default filter fuzzy-matches `keywords` the same loose way it fuzzy-matches
// the title, so a long content preview will subsequence-match almost any short query.
// Fuzzy-match only the title; require keywords to actually contain the search text.
export function filterPaletteItem(value: string, search: string, keywords?: string[]): number {
  const titleScore = defaultFilter(value, search);
  if (titleScore > 0) return titleScore;

  const normalizedSearch = search.trim().toLowerCase();
  if (normalizedSearch && keywords?.some((keyword) => keyword.toLowerCase().includes(normalizedSearch))) {
    return 0.1;
  }

  return 0;
}
