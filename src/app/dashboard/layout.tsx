import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";
import { Sidebar } from "@/components/dashboard/sidebar";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { getSidebarCollections } from "@/lib/db/collections";
import { getItemTypesWithCounts } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import { isEmailVerificationEnabled } from "@/lib/email-verification";

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

  return (
    <DashboardChrome sidebar={sidebar}>
      {isEmailVerificationEnabled() && user && !user.emailVerified && <VerifyEmailBanner />}
      {children}
    </DashboardChrome>
  );
}
