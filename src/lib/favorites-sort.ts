export const FAVORITES_SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
] as const;

export type FavoritesSort = (typeof FAVORITES_SORT_OPTIONS)[number]["value"];

export const DEFAULT_FAVORITES_SORT: FavoritesSort = "date";

interface SortableItem {
  title: string;
  updatedAt: Date;
  itemType: { name: string };
}

interface SortableCollection {
  name: string;
  updatedAt: Date;
}

function compareNames(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function compareNewestFirst(a: Date, b: Date) {
  return b.getTime() - a.getTime();
}

export function sortFavoriteItems<T extends SortableItem>(items: T[], sort: FavoritesSort): T[] {
  return [...items].sort((a, b) => {
    if (sort === "date") return compareNewestFirst(a.updatedAt, b.updatedAt);
    if (sort === "type") {
      return compareNames(a.itemType.name, b.itemType.name) || compareNames(a.title, b.title);
    }
    return compareNames(a.title, b.title);
  });
}

// Collections have no single item type, so "type" falls back to name order.
export function sortFavoriteCollections<T extends SortableCollection>(
  collections: T[],
  sort: FavoritesSort,
): T[] {
  return [...collections].sort((a, b) =>
    sort === "date" ? compareNewestFirst(a.updatedAt, b.updatedAt) : compareNames(a.name, b.name),
  );
}
