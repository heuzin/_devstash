import Link from "next/link";
import { CollectionsGrid } from "@/components/dashboard/collections-grid";
import { ItemList } from "@/components/dashboard/item-list";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ITEMS } from "@/lib/mock-data";

const pinnedItems = ITEMS.filter((item) => item.isPinned).sort(
  (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
);

const recentItems = [...ITEMS]
  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  .slice(0, 10);

export default function DashboardPage() {
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
        <CollectionsGrid />
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
