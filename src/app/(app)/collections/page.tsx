import { CollectionsGrid } from "@/components/dashboard/collections-grid";
import { getAllCollections } from "@/lib/db/collections";

export default async function CollectionsPage() {
  const collections = await getAllCollections();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Collections</h1>
        <p className="text-sm text-muted-foreground">{collections.length} collections</p>
      </div>

      <CollectionsGrid collections={collections} />
    </div>
  );
}
