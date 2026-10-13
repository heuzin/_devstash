import { Calendar } from "lucide-react";
import type { ItemDetail } from "@/lib/db/items";
import { formatLongDate } from "@/lib/format-date";

export function ItemDetailsSection({ item }: { item: ItemDetail }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Calendar className="size-4" />
        Details
      </h3>
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Created</span>
          <span>{formatLongDate(item.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Updated</span>
          <span>{formatLongDate(item.updatedAt)}</span>
        </div>
      </div>
    </section>
  );
}
