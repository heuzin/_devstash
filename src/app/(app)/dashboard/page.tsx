import Link from "next/link";
import { CollectionsGrid } from "@/components/dashboard/collections-grid";
import { ItemList } from "@/components/dashboard/item-list";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { getRecentCollections } from "@/lib/db/collections";
import { getDashboardItems } from "@/lib/db/items";

export default async function DashboardPage() {
  const [collections, { pinned: pinnedItems, recent: recentItems }] = await Promise.all([
    getRecentCollections(),
    getDashboardItems(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your developer knowledge hub</p>
      </div>

      <StatsCards />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Collections</h2>
          <Link href="/collections" className="text-sm text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>
        <CollectionsGrid collections={collections} />
      </section>

      {pinnedItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Pinned</h2>
          <ItemList items={pinnedItems} />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Recent Items</h2>
        <ItemList items={recentItems} />
      </section>
    </div>
  );
}
