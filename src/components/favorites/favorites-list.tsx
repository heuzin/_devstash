"use client";

import { useState } from "react";
import { FavoriteCollectionRow } from "@/components/favorites/favorite-collection-row";
import { FavoriteItemRow } from "@/components/favorites/favorite-item-row";
import { FavoritesSection } from "@/components/favorites/favorites-section";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CollectionSummary } from "@/lib/db/collections";
import type { FavoriteItem } from "@/lib/db/items";
import {
  DEFAULT_FAVORITES_SORT,
  FAVORITES_SORT_OPTIONS,
  sortFavoriteCollections,
  sortFavoriteItems,
  type FavoritesSort,
} from "@/lib/favorites-sort";

interface FavoritesListProps {
  items: FavoriteItem[];
  collections: CollectionSummary[];
}

export function FavoritesList({ items, collections }: FavoritesListProps) {
  const [sort, setSort] = useState<FavoritesSort>(DEFAULT_FAVORITES_SORT);

  const sortedItems = sortFavoriteItems(items, sort);
  const sortedCollections = sortFavoriteCollections(collections, sort);
  const sortLabel = FAVORITES_SORT_OPTIONS.find((option) => option.value === sort)?.label;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Sort by</span>
        <Select value={sort} onValueChange={(value) => value && setSort(value as FavoritesSort)}>
          <SelectTrigger size="sm" className="w-28" aria-label="Sort favorites">
            <SelectValue>{() => sortLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {FAVORITES_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6 font-mono text-sm">
        <FavoritesSection title="Items" count={sortedItems.length}>
          {sortedItems.map((item) => (
            <FavoriteItemRow key={item.id} item={item} />
          ))}
        </FavoritesSection>
        <FavoritesSection title="Collections" count={sortedCollections.length}>
          {sortedCollections.map((collection) => (
            <FavoriteCollectionRow key={collection.id} collection={collection} />
          ))}
        </FavoritesSection>
      </div>
    </div>
  );
}
