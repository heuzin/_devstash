import { Star } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { CollectionSummary } from "@/lib/db/collections";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";

interface CollectionsGridProps {
  collections: CollectionSummary[];
}

export function CollectionsGrid({ collections }: CollectionsGridProps) {
  if (collections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No collections yet. Create one to get started.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => (
        <Link key={collection.id} href={`/collections/${collection.id}`}>
          <Card
            className="h-full border-l-4 transition-colors hover:bg-accent/50"
            style={{ borderLeftColor: collection.accentColor }}
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
              {collection.description && (
                <p className="text-sm text-muted-foreground">{collection.description}</p>
              )}
              <div className="flex items-center gap-2 pt-1">
                {collection.types.map((type) => {
                  const Icon = ITEM_TYPE_ICONS[type.icon];
                  return (
                    Icon && (
                      <Icon
                        key={type.itemTypeId}
                        className="size-3.5"
                        style={{ color: type.color }}
                      />
                    )
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
