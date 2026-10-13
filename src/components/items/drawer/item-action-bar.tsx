"use client";

import { Copy, Download, Pencil, Pin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteItemDialog } from "@/components/items/drawer/delete-item-dialog";
import type { ItemDetail } from "@/lib/db/items";

interface ItemActionBarProps {
  item: ItemDetail;
  onEdit: () => void;
  onDeleted: () => void;
}

export function ItemActionBar({ item, onEdit, onDeleted }: ItemActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-y border-border py-2">
      <Button
        variant="ghost"
        size="sm"
        className={item.isFavorite ? "text-yellow-400" : "text-muted-foreground"}
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
