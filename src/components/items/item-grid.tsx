import type { ItemSummary } from "@/lib/db/items";
import { ItemCard } from "@/components/items/item-card";

export function ItemGrid({ items }: { items: ItemSummary[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No items yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
