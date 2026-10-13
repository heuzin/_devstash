"use client";

import { FolderOpen, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ItemActionBar } from "@/components/items/drawer/item-action-bar";
import { ItemContentSection } from "@/components/items/drawer/item-content-section";
import { ItemDetailsSection } from "@/components/items/drawer/item-details-section";
import type { ItemDetail } from "@/lib/db/items";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { capitalize } from "@/lib/utils";

interface ItemViewBodyProps {
  item: ItemDetail;
  onEdit: () => void;
  onDeleted: () => void;
}

export function ItemViewBody({ item, onEdit, onDeleted }: ItemViewBodyProps) {
  const Icon = ITEM_TYPE_ICONS[item.itemType.icon];

  return (
    <>
      <div className="space-y-3 p-4 pb-0">
        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${item.itemType.color}1a` }}
          >
            {Icon && <Icon className="size-5" style={{ color: item.itemType.color }} />}
          </div>
          <h2 className="pt-1.5 text-lg font-semibold">{item.title}</h2>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{capitalize(item.itemType.slug)}</Badge>
          {item.language && <Badge variant="secondary">{item.language}</Badge>}
        </div>

        <ItemActionBar item={item} onEdit={onEdit} onDeleted={onDeleted} />
      </div>

      <div className="space-y-6 p-4">
        {item.description && (
          <section className="space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
            <p className="text-sm">{item.description}</p>
          </section>
        )}

        <ItemContentSection item={item} />

        {item.tags.length > 0 && (
          <section className="space-y-1.5">
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Tag className="size-4" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {item.collections.length > 0 && (
          <section className="space-y-1.5">
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <FolderOpen className="size-4" />
              Collections
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {item.collections.map((collection) => (
                <Badge key={collection.id} variant="secondary">
                  {collection.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <ItemDetailsSection item={item} />
      </div>
    </>
  );
}
