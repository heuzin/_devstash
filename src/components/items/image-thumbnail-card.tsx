"use client";

import { Pin, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ItemSummary } from "@/lib/db/items";
import { useItemActivation } from "@/lib/hooks/use-item-activation";

export function ImageThumbnailCard({ item }: { item: ItemSummary }) {
  const activation = useItemActivation(item.id);

  return (
    <Card
      {...activation}
      className="cursor-pointer transition-colors hover:bg-accent/50"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.fileUrl ?? undefined}
        alt={item.fileName ?? item.title}
        className="aspect-video w-full object-cover transition-transform duration-300 hover:scale-105"
      />
      <CardContent className="flex items-center gap-2">
        <span className="truncate text-sm font-medium">{item.title}</span>
        {item.isPinned && <Pin className="size-3.5 shrink-0 text-muted-foreground" />}
        {item.isFavorite && (
          <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
        )}
      </CardContent>
    </Card>
  );
}
