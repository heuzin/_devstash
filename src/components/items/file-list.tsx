import type { ItemSummary } from "@/lib/db/items";
import { FileListRow } from "@/components/items/file-list-row";

export function FileList({ items }: { items: ItemSummary[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No items yet.</p>;
  }

  return (
    <div className="rounded-lg border">
      {items.map((item) => (
        <FileListRow key={item.id} item={item} />
      ))}
    </div>
  );
}
