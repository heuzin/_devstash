import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getSidebarCollections } from "@/lib/db/collections";
import { getItemTypesWithCounts } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const [itemTypes, { favorites, recent }, user] = await Promise.all([
    getItemTypesWithCounts(),
    getSidebarCollections(),
    getCurrentUser(),
  ]);

  const sidebar = (
    <Sidebar
      itemTypes={itemTypes}
      favoriteCollections={favorites}
      recentCollections={recent}
      user={user}
    />
  );

  return <DashboardChrome sidebar={sidebar}>{children}</DashboardChrome>;
}
