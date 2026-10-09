import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";
import { Sidebar } from "@/components/dashboard/sidebar";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { CreateItemDialogProvider } from "@/components/items/create-item-dialog-provider";
import { ItemDrawerProvider } from "@/components/items/item-drawer-provider";
import { getSidebarCollections } from "@/lib/db/collections";
import { getItemTypesWithCounts } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import { isEmailVerificationEnabled } from "@/lib/email-verification";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <CreateItemDialogProvider itemTypes={itemTypes}>
      <DashboardChrome sidebar={sidebar}>
        <ItemDrawerProvider>
          {isEmailVerificationEnabled() && user && !user.emailVerified && <VerifyEmailBanner />}
          {children}
        </ItemDrawerProvider>
      </DashboardChrome>
    </CreateItemDialogProvider>
  );
}
