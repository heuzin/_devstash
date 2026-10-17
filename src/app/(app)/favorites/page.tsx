import { Star } from "lucide-react";
import { FavoritesList } from "@/components/favorites/favorites-list";
import { getFavoriteCollections } from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";

export default async function FavoritesPage() {
  const [items, collections] = await Promise.all([getFavoriteItems(), getFavoriteCollections()]);
  const hasFavorites = items.length > 0 || collections.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Favorites</h1>
        <p className="text-sm text-muted-foreground">Your starred items and collections.</p>
      </div>

      {hasFavorites ? (
        <FavoritesList items={items} collections={collections} />
      ) : (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Star className="size-8" />
          <p className="text-sm">No favorites yet.</p>
          <p className="text-xs">Star items and collections to find them here.</p>
        </div>
      )}
    </div>
  );
}
