import { CollectionCard } from "@/components/collections/collection-card";
import type { CollectionSummary } from "@/lib/db/collections";

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
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  );
}
