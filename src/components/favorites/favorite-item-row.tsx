"use client";

import { Badge } from "@/components/ui/badge";
import type { FavoriteItem } from "@/lib/db/items";
import { formatShortDateWithYear } from "@/lib/format-date";
import { useItemActivation } from "@/lib/hooks/use-item-activation";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";

export function FavoriteItemRow({ item }: { item: FavoriteItem }) {
  const activation = useItemActivation(item.id);
  const Icon = ITEM_TYPE_ICONS[item.itemType.icon];

  return (
    <li
      {...activation}
      className="flex cursor-pointer items-center gap-3 px-2 py-1.5 transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none"
    >
      {Icon && <Icon className="size-4 shrink-0" style={{ color: item.itemType.color }} />}
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      <Badge variant="outline" className="shrink-0 font-mono text-[11px] lowercase">
        {item.itemType.name}
      </Badge>
      <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground sm:block">
        {formatShortDateWithYear(item.updatedAt)}
      </span>
    </li>
  );
}
