import { notFound } from "next/navigation";
import { CollectionDetailActions } from "@/components/collections/collection-detail-actions";
import { FileList } from "@/components/items/file-list";
import { ImageThumbnailCard } from "@/components/items/image-thumbnail-card";
import { ItemGrid } from "@/components/items/item-grid";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { getCollectionItems } from "@/lib/db/items";
import { FILE_TYPE_NAME, IMAGE_TYPE_NAME } from "@/lib/item-types";
import { parsePageParam } from "@/lib/pagination";

export default async function CollectionDetailPage({
  params,
  searchParams,
}: PageProps<"/collections/[id]">) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const result = await getCollectionItems(id, page);
  if (!result) {
    notFound();
  }

  const { collection, items, pagination } = result;
  const imageItems = items.filter((item) => item.itemType.name === IMAGE_TYPE_NAME);
  const fileItems = items.filter((item) => item.itemType.name === FILE_TYPE_NAME);
  const otherItems = items.filter(
    (item) => item.itemType.name !== IMAGE_TYPE_NAME && item.itemType.name !== FILE_TYPE_NAME,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{collection.name}</h1>
          {collection.description && (
            <p className="text-sm text-muted-foreground">{collection.description}</p>
          )}
          <p className="text-sm text-muted-foreground">{pagination.totalCount} items</p>
        </div>
        <CollectionDetailActions collection={collection} />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items yet.</p>
      ) : (
        <div className="space-y-6">
          {otherItems.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-medium">Items</h2>
              <ItemGrid items={otherItems} />
            </section>
          )}

          {imageItems.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-medium">Images</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {imageItems.map((item) => (
                  <ImageThumbnailCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {fileItems.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-medium">Files</h2>
              <FileList items={fileItems} />
            </section>
          )}
        </div>
      )}

      <PaginationControls
        page={pagination.page}
        totalPages={pagination.totalPages}
        basePath={`/collections/${collection.id}`}
      />
    </div>
  );
}
