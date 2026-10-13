"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemEditView } from "@/components/items/drawer/item-edit-view";
import { ItemViewBody } from "@/components/items/drawer/item-view-body";
import type { ItemDetail } from "@/lib/db/items";

interface ItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemDetail | null;
  loading: boolean;
  error: string | null;
  onItemUpdated: (item: ItemDetail) => void;
}

export function ItemDrawer({
  open,
  onOpenChange,
  item,
  loading,
  error,
  onItemUpdated,
}: ItemDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        <SheetTitle className="sr-only">{item?.title ?? "Item details"}</SheetTitle>
        <div className="flex h-full flex-col overflow-y-auto">
          {loading && <ItemDrawerSkeleton />}
          {!loading && error && <p className="p-4 text-sm text-muted-foreground">{error}</p>}
          {!loading && !error && item && (
            <ItemDrawerBody
              key={item.id}
              item={item}
              onItemUpdated={onItemUpdated}
              onItemDeleted={() => onOpenChange(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ItemDrawerSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function ItemDrawerBody({
  item,
  onItemUpdated,
  onItemDeleted,
}: {
  item: ItemDetail;
  onItemUpdated: (item: ItemDetail) => void;
  onItemDeleted: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");

  if (mode === "edit") {
    return (
      <ItemEditView
        item={item}
        onCancel={() => setMode("view")}
        onSaved={(updated) => {
          onItemUpdated(updated);
          setMode("view");
        }}
      />
    );
  }

  return <ItemViewBody item={item} onEdit={() => setMode("edit")} onDeleted={onItemDeleted} />;
}
