import { Star } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { COLLECTIONS, ITEM_TYPES, ITEMS, type Collection } from "@/lib/mock-data";

const recentCollections = [...COLLECTIONS].sort(
  (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
);

function getCollectionTypeIds(collection: Collection) {
  return [
    ...new Set(
      ITEMS.filter((item) => item.collectionIds.includes(collection.id)).map(
        (item) => item.itemTypeId,
      ),
    ),
  ];
}

function getDominantTypeColor(collection: Collection) {
  const typeIds = getCollectionTypeIds(collection);
  if (typeIds.length === 0) return undefined;

  const counts = new Map<string, number>();
  for (const item of ITEMS) {
    if (!item.collectionIds.includes(collection.id)) continue;
    counts.set(item.itemTypeId, (counts.get(item.itemTypeId) ?? 0) + 1);
  }
  const dominantTypeId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return ITEM_TYPES.find((type) => type.id === dominantTypeId)?.color;
}

export function CollectionsGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recentCollections.map((collection) => {
        const typeIds = getCollectionTypeIds(collection);
        const accentColor = getDominantTypeColor(collection);

        return (
          <Link key={collection.id} href={`/collections/${collection.id}`}>
            <Card
              className="h-full border-l-4 transition-colors hover:bg-accent/50"
              style={{ borderLeftColor: accentColor }}
            >
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    {collection.name}
                    {collection.isFavorite && (
                      <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {collection.itemCount} items
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{collection.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  {typeIds.map((typeId) => {
                    const type = ITEM_TYPES.find((t) => t.id === typeId);
                    if (!type) return null;
                    const Icon = ITEM_TYPE_ICONS[type.icon];
                    return (
                      Icon && (
                        <Icon key={typeId} className="size-3.5" style={{ color: type.color }} />
                      )
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
