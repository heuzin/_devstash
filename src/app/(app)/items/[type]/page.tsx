import { notFound } from "next/navigation";
import { AddTypeItemButton } from "@/components/items/add-type-item-button";
import { FileList } from "@/components/items/file-list";
import { ItemGrid } from "@/components/items/item-grid";
import { getItemsByTypeSlug } from "@/lib/db/items";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { CREATABLE_ITEM_TYPE_NAMES, FILE_TYPE_NAME } from "@/lib/item-types";

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function ItemsByTypePage({ params }: PageProps<"/items/[type]">) {
  const { type } = await params;

  const result = await getItemsByTypeSlug(type);
  if (!result) {
    notFound();
  }

  const { itemType, items } = result;
  const Icon = ITEM_TYPE_ICONS[itemType.icon];
  const isCreatable = CREATABLE_ITEM_TYPE_NAMES.has(itemType.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-6" style={{ color: itemType.color }} />}
        <h1 className="text-2xl font-semibold">{capitalize(itemType.slug)}</h1>
        <span className="text-sm text-muted-foreground">{items.length} items</span>
        {isCreatable && (
          <AddTypeItemButton itemTypeId={itemType.id} label={`Add ${capitalize(itemType.name)}`} />
        )}
      </div>

      {itemType.name === FILE_TYPE_NAME ? <FileList items={items} /> : <ItemGrid items={items} />}
    </div>
  );
}
