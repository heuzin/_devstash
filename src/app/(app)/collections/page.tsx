import { CollectionsGrid } from "@/components/dashboard/collections-grid";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { getAllCollections } from "@/lib/db/collections";
import { parsePageParam } from "@/lib/pagination";

export default async function CollectionsPage({ searchParams }: PageProps<"/collections">) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const { collections, pagination } = await getAllCollections(page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Collections</h1>
        <p className="text-sm text-muted-foreground">{pagination.totalCount} collections</p>
      </div>

      <CollectionsGrid collections={collections} />

      <PaginationControls
        page={pagination.page}
        totalPages={pagination.totalPages}
        basePath="/collections"
      />
    </div>
  );
}
