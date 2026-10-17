"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Download, Pencil, Pin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteItemDialog } from "@/components/items/drawer/delete-item-dialog";
import { toggleItemFavorite } from "@/actions/items";
import type { ItemDetail } from "@/lib/db/items";

interface ItemActionBarProps {
  item: ItemDetail;
  onEdit: () => void;
  onUpdated: (item: ItemDetail) => void;
  onDeleted: () => void;
}

export function ItemActionBar({ item, onEdit, onUpdated, onDeleted }: ItemActionBarProps) {
  const router = useRouter();
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  async function handleToggleFavorite() {
    setIsTogglingFavorite(true);
    const result = await toggleItemFavorite(item.id);
    setIsTogglingFavorite(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? "Failed to update favorite");
      return;
    }

    toast.success(result.data.isFavorite ? "Added to favorites" : "Removed from favorites");
    onUpdated(result.data);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-y border-border py-2">
      <Button
        variant="ghost"
        size="sm"
        className={item.isFavorite ? "text-yellow-400" : "text-muted-foreground"}
        aria-pressed={item.isFavorite}
        disabled={isTogglingFavorite}
        onClick={handleToggleFavorite}
      >
        <Star className={item.isFavorite ? "size-4 fill-yellow-400" : "size-4"} />
        Favorite
      </Button>
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        <Pin className="size-4" />
        Pin
      </Button>
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        <Copy className="size-4" />
        Copy
      </Button>
      {item.itemType.name === "file" && item.fileUrl && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          nativeButton={false}
          render={<a href={`/api/items/${item.id}/download`} download={item.fileName ?? undefined} />}
        >
          <Download className="size-4" />
          Download
        </Button>
      )}
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onEdit}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <DeleteItemDialog item={item} onDeleted={onDeleted} />
      </div>
    </div>
  );
}
