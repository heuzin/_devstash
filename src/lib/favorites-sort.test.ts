import { describe, expect, it } from "vitest";
import { sortFavoriteCollections, sortFavoriteItems } from "./favorites-sort";

function item(title: string, type: string, day: number) {
  return { title, itemType: { name: type }, updatedAt: new Date(2026, 0, day) };
}

function collection(name: string, day: number) {
  return { name, updatedAt: new Date(2026, 0, day) };
}

const ITEMS = [
  item("useDebounce", "snippet", 2),
  item("Docker cleanup", "command", 5),
  item("api docs", "link", 1),
  item("Zod schema", "snippet", 4),
  item("Refactor prompt", "prompt", 3),
];

const titles = (items: { title: string }[]) => items.map((i) => i.title);

describe("sortFavoriteItems", () => {
  it("sorts by date, newest first", () => {
    expect(titles(sortFavoriteItems(ITEMS, "date"))).toEqual([
      "Docker cleanup",
      "Zod schema",
      "Refactor prompt",
      "useDebounce",
      "api docs",
    ]);
  });

  it("sorts by name, case-insensitively", () => {
    expect(titles(sortFavoriteItems(ITEMS, "name"))).toEqual([
      "api docs",
      "Docker cleanup",
      "Refactor prompt",
      "useDebounce",
      "Zod schema",
    ]);
  });

  it("sorts by type, then by name within each type", () => {
    expect(titles(sortFavoriteItems(ITEMS, "type"))).toEqual([
      "Docker cleanup", // command
      "api docs", // link
      "Refactor prompt", // prompt
      "useDebounce", // snippet
      "Zod schema", // snippet
    ]);
  });

  it("does not mutate the input array", () => {
    const original = [...ITEMS];
    sortFavoriteItems(ITEMS, "name");
    expect(ITEMS).toEqual(original);
  });

  it("handles an empty list", () => {
    expect(sortFavoriteItems([], "type")).toEqual([]);
  });
});

describe("sortFavoriteCollections", () => {
  const COLLECTIONS = [
    collection("react Patterns", 1),
    collection("DevOps", 3),
    collection("AI Workflows", 2),
  ];
  const names = (cs: { name: string }[]) => cs.map((c) => c.name);

  it("sorts by date, newest first", () => {
    expect(names(sortFavoriteCollections(COLLECTIONS, "date"))).toEqual([
      "DevOps",
      "AI Workflows",
      "react Patterns",
    ]);
  });

  it("sorts by name, case-insensitively", () => {
    expect(names(sortFavoriteCollections(COLLECTIONS, "name"))).toEqual([
      "AI Workflows",
      "DevOps",
      "react Patterns",
    ]);
  });

  it("falls back to name order for type sort", () => {
    expect(sortFavoriteCollections(COLLECTIONS, "type")).toEqual(
      sortFavoriteCollections(COLLECTIONS, "name"),
    );
  });
});
