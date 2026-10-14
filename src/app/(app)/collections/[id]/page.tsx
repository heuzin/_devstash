import { Star } from "lucide-react";
import { notFound } from "next/navigation";
import { FileList } from "@/components/items/file-list";
import { ImageThumbnailCard } from "@/components/items/image-thumbnail-card";
import { ItemGrid } from "@/components/items/item-grid";
import { getCollectionItems } from "@/lib/db/items";
import { FILE_TYPE_NAME, IMAGE_TYPE_NAME } from "@/lib/item-types";

export default async function CollectionDetailPage({ params }: PageProps<"/collections/[id]">) {
  const { id } = await params;

  const result = await getCollectionItems(id);
  if (!result) {
    notFound();
  }

  const { collection, items } = result;
  const imageItems = items.filter((item) => item.itemType.name === IMAGE_TYPE_NAME);
  const fileItems = items.filter((item) => item.itemType.name === FILE_TYPE_NAME);
  const otherItems = items.filter(
    (item) => item.itemType.name !== IMAGE_TYPE_NAME && item.itemType.name !== FILE_TYPE_NAME,
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-2xl font-semibold">{collection.name}</h1>
          {collection.isFavorite && (
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        {collection.description && (
          <p className="text-sm text-muted-foreground">{collection.description}</p>
        )}
        <p className="text-sm text-muted-foreground">{items.length} items</p>
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
    </div>
  );
}
