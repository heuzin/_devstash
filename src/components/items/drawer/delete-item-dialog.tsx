"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteItem } from "@/actions/items";
import type { ItemDetail } from "@/lib/db/items";

interface DeleteItemDialogProps {
  item: ItemDetail;
  onDeleted: () => void;
}

export function DeleteItemDialog({ item, onDeleted }: DeleteItemDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    setIsDeleting(true);
    const result = await deleteItem(item.id);
    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to delete item");
      return;
    }

    setIsOpen(false);
    toast.success("Item deleted");
    router.refresh();
    onDeleted();
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            aria-label="Delete"
          />
        }
      >
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this item?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes &ldquo;{item.title}&rdquo;. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={handleConfirmDelete}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
