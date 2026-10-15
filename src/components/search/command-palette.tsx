"use client";

import { useRouter } from "next/navigation";
import { FolderClosed } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useItemDrawer } from "@/components/items/item-drawer-provider";
import type { SearchCollection } from "@/lib/db/collections";
import type { SearchItem } from "@/lib/db/items";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { filterPaletteItem } from "@/lib/search-filter";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SearchItem[];
  collections: SearchCollection[];
}

export function CommandPalette({ open, onOpenChange, items, collections }: CommandPaletteProps) {
  const router = useRouter();
  const { openItem } = useItemDrawer();

  function selectItem(id: string) {
    onOpenChange(false);
    openItem(id);
  }

  function selectCollection(id: string) {
    onOpenChange(false);
    router.push(`/collections/${id}`);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search items and collections"
    >
      <Command filter={filterPaletteItem}>
        <CommandInput placeholder="Search items and collections..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {items.length > 0 && (
            <CommandGroup heading="Items">
              {items.map((item) => {
                const Icon = ITEM_TYPE_ICONS[item.itemType.icon];
                return (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    keywords={item.contentPreview ? [item.contentPreview] : []}
                    onSelect={() => selectItem(item.id)}
                  >
                    {Icon && (
                      <Icon className="size-4 shrink-0" style={{ color: item.itemType.color }} />
                    )}
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{item.title}</span>
                      {item.contentPreview && (
                        <span className="truncate text-xs text-muted-foreground">
                          {item.contentPreview}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          {collections.length > 0 && (
            <CommandGroup heading="Collections">
              {collections.map((collection) => (
                <CommandItem
                  key={collection.id}
                  value={collection.name}
                  onSelect={() => selectCollection(collection.id)}
                >
                  <FolderClosed className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{collection.name}</span>
                  <CommandShortcut>
                    {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
