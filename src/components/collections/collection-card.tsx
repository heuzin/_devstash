"use client";

import { useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteCollectionDialog } from "@/components/collections/delete-collection-dialog";
import { EditCollectionDialog } from "@/components/collections/edit-collection-dialog";
import { useToggleCollectionFavorite } from "@/lib/hooks/use-toggle-collection-favorite";
import type { CollectionSummary } from "@/lib/db/collections";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";

interface CollectionCardProps {
  collection: CollectionSummary;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const favorite = useToggleCollectionFavorite(collection.id);

  function navigate() {
    router.push(`/collections/${collection.id}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate();
    }
  }

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={navigate}
        onKeyDown={handleKeyDown}
        className="h-full cursor-pointer border-l-4 transition-colors hover:bg-accent/50"
        style={{ borderLeftColor: collection.accentColor }}
      >
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 font-medium">
              <span className="truncate">{collection.name}</span>
              {collection.isFavorite && (
                <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
              )}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{collection.itemCount} items</span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label="Collection actions"
                    />
                  }
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreVertical className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem disabled={favorite.isToggling} onClick={favorite.toggle}>
                    {collection.isFavorite ? "Unfavorite" : "Favorite"}
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {collection.description && (
            <p className="text-sm text-muted-foreground">{collection.description}</p>
          )}
          <div className="flex items-center gap-2 pt-1">
            {collection.types.map((type) => {
              const Icon = ITEM_TYPE_ICONS[type.icon];
              return (
                Icon && <Icon key={type.itemTypeId} className="size-3.5" style={{ color: type.color }} />
              );
            })}
          </div>
        </CardContent>
      </Card>

      <EditCollectionDialog
        collection={collection}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={() => router.refresh()}
      />
      <DeleteCollectionDialog
        collection={collection}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.refresh()}
      />
    </>
  );
}
