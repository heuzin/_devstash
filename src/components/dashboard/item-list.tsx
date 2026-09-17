import { Pin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { ITEM_TYPES, type Item } from "@/lib/mock-data";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ItemList({ items }: { items: Item[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const type = ITEM_TYPES.find((t) => t.id === item.itemTypeId);
        const Icon = type && ITEM_TYPE_ICONS[type.icon];

        return (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-lg border-l-4 bg-card p-3"
            style={{ borderLeftColor: type?.color }}
          >
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: type ? `${type.color}1a` : undefined }}
            >
              {Icon && <Icon className="size-4" style={{ color: type?.color }} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium">{item.title}</span>
                {item.isPinned && <Pin className="size-3.5 shrink-0 text-muted-foreground" />}
                {item.isFavorite && (
                  <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                )}
              </div>
              <p className="truncate text-sm text-muted-foreground">{item.description}</p>
              {item.tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDate(item.createdAt)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
