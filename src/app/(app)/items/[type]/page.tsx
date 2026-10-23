import { notFound, redirect } from "next/navigation";
import { AddTypeItemButton } from "@/components/items/add-type-item-button";
import { FileList } from "@/components/items/file-list";
import { ItemGrid } from "@/components/items/item-grid";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { getItemsByTypeSlug } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { CREATABLE_ITEM_TYPE_NAMES, FILE_TYPE_NAME, PRO_ITEM_TYPE_SLUGS } from "@/lib/item-types";
import { parsePageParam } from "@/lib/pagination";
import { canUsePro } from "@/lib/usage-limits";

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function ItemsByTypePage({
  params,
  searchParams,
}: PageProps<"/items/[type]">) {
  const { type } = await params;
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  if (PRO_ITEM_TYPE_SLUGS.has(type)) {
    const user = await getCurrentUser();
    if (!canUsePro({ isPro: user?.isPro ?? false })) {
      redirect("/upgrade");
    }
  }

  const result = await getItemsByTypeSlug(type, page);
  if (!result) {
    notFound();
  }

  const { itemType, items, pagination } = result;
  const Icon = ITEM_TYPE_ICONS[itemType.icon];
  const isCreatable = CREATABLE_ITEM_TYPE_NAMES.has(itemType.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-6" style={{ color: itemType.color }} />}
        <h1 className="text-2xl font-semibold">{capitalize(itemType.slug)}</h1>
        <span className="text-sm text-muted-foreground">{pagination.totalCount} items</span>
        {isCreatable && (
          <AddTypeItemButton
            itemTypeId={itemType.id}
            label={`Add ${capitalize(itemType.name)}`}
          />
        )}
      </div>

      {itemType.name === FILE_TYPE_NAME ? <FileList items={items} /> : <ItemGrid items={items} />}

      <PaginationControls
        page={pagination.page}
        totalPages={pagination.totalPages}
        basePath={`/items/${itemType.slug}`}
      />
    </div>
  );
}
