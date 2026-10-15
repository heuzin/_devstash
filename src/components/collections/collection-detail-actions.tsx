"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteCollectionDialog } from "@/components/collections/delete-collection-dialog";
import { EditCollectionDialog } from "@/components/collections/edit-collection-dialog";

interface CollectionDetailActionsProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
}

export function CollectionDetailActions({ collection }: CollectionDetailActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          className={collection.isFavorite ? "text-yellow-400" : "text-muted-foreground"}
          aria-label="Favorite"
        >
          <Star className={collection.isFavorite ? "size-4 fill-yellow-400" : "size-4"} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          aria-label="Edit collection"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive"
          aria-label="Delete collection"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

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
        onDeleted={() => router.push("/collections")}
      />
    </>
  );
}
