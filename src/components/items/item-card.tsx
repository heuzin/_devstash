"use client";

import { useState } from "react";
import { Check, Copy, Pin, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useItemDrawer } from "@/components/items/item-drawer-provider";
import type { ItemDetail, ItemSummary } from "@/lib/db/items";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ItemCard({ item }: { item: ItemSummary }) {
  const Icon = ITEM_TYPE_ICONS[item.itemType.icon];
  const { openItem } = useItemDrawer();
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  async function handleCopy(event: React.MouseEvent) {
    event.stopPropagation();
    if (copying) return;

    setCopying(true);
    try {
      const res = await fetch(`/api/items/${item.id}`);
      if (!res.ok) throw new Error("Failed to load item");
      const body: { data: ItemDetail } = await res.json();
      const textToCopy = body.data.contentType === "URL" ? body.data.url : body.data.content;
      if (!textToCopy) throw new Error("Nothing to copy");

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy this item. Please try again.");
    } finally {
      setCopying(false);
    }
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => openItem(item.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openItem(item.id);
        }
      }}
      className="h-full cursor-pointer border-l-4 transition-colors hover:bg-accent/50"
      style={{ borderLeftColor: item.itemType.color }}
    >
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && (
              <Icon className="size-4 shrink-0" style={{ color: item.itemType.color }} />
            )}
            <span className="truncate font-medium">{item.title}</span>
            {item.isPinned && <Pin className="size-3.5 shrink-0 text-muted-foreground" />}
            {item.isFavorite && (
              <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={handleCopy}
              disabled={copying}
              aria-label="Copy to clipboard"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
          </div>
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
