"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { CollectionOption } from "@/lib/db/collections";

interface CollectionPickerProps {
  id?: string;
  collections: CollectionOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function CollectionPicker({ id, collections, selectedIds, onChange }: CollectionPickerProps) {
  function toggle(collectionId: string) {
    onChange(
      selectedIds.includes(collectionId)
        ? selectedIds.filter((selectedId) => selectedId !== collectionId)
        : [...selectedIds, collectionId],
    );
  }

  return (
    <div className="space-y-1.5">
      <Label id={id}>Collections</Label>
      {collections.length === 0 ? (
        <p className="text-sm text-muted-foreground">No collections yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {collections.map((collection) => {
            const selected = selectedIds.includes(collection.id);
            return (
              <Badge
                key={collection.id}
                variant={selected ? "default" : "outline"}
                className="cursor-pointer"
                render={
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle(collection.id)}
                  />
                }
              >
                {collection.name}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
