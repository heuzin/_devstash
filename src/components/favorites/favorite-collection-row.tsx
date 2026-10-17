import Link from "next/link";
import { Folder } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CollectionSummary } from "@/lib/db/collections";
import { formatShortDateWithYear } from "@/lib/format-date";

export function FavoriteCollectionRow({ collection }: { collection: CollectionSummary }) {
  return (
    <li>
      <Link
        href={`/collections/${collection.id}`}
        className="flex items-center gap-3 px-2 py-1.5 transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none"
      >
        <Folder
          className="size-4 shrink-0 text-muted-foreground"
          style={collection.accentColor ? { color: collection.accentColor } : undefined}
        />
        <span className="min-w-0 flex-1 truncate">{collection.name}</span>
        <Badge variant="outline" className="shrink-0 font-mono text-[11px]">
          {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
        </Badge>
        <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground sm:block">
          {formatShortDateWithYear(collection.updatedAt)}
        </span>
      </Link>
    </li>
  );
}
