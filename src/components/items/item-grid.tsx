import type { ItemSummary } from "@/lib/db/items";
import { ItemCard } from "@/components/items/item-card";

export function ItemGrid({ items }: { items: ItemSummary[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No items yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
