import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";
import { Sidebar } from "@/components/dashboard/sidebar";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { CreateCollectionDialogProvider } from "@/components/collections/create-collection-dialog-provider";
import { CreateItemDialogProvider } from "@/components/items/create-item-dialog-provider";
import { ItemDrawerProvider } from "@/components/items/item-drawer-provider";
import { CommandPaletteProvider } from "@/components/search/command-palette-provider";
import { EditorPreferencesProvider } from "@/components/settings/editor-preferences-provider";
import {
  getCollectionOptions,
  getSearchCollections,
  getSidebarCollections,
} from "@/lib/db/collections";
import { getItemTypesWithCounts, getSearchItems } from "@/lib/db/items";
import { getCurrentUser, getEditorPreferences } from "@/lib/db/user";
import { isEmailVerificationEnabled } from "@/lib/email-verification";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [
    itemTypes,
    { favorites, recent },
    user,
    collections,
    searchItems,
    searchCollections,
    editorPreferences,
  ] = await Promise.all([
    getItemTypesWithCounts(),
    getSidebarCollections(),
    getCurrentUser(),
    getCollectionOptions(),
    getSearchItems(),
    getSearchCollections(),
    getEditorPreferences(),
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
    <EditorPreferencesProvider initialPreferences={editorPreferences}>
      <CreateCollectionDialogProvider>
        <CreateItemDialogProvider itemTypes={itemTypes} collections={collections}>
          <ItemDrawerProvider collections={collections}>
            <CommandPaletteProvider items={searchItems} collections={searchCollections}>
              <DashboardChrome sidebar={sidebar}>
                {isEmailVerificationEnabled() && user && !user.emailVerified && (
                  <VerifyEmailBanner />
                )}
                {children}
              </DashboardChrome>
            </CommandPaletteProvider>
          </ItemDrawerProvider>
        </CreateItemDialogProvider>
      </CreateCollectionDialogProvider>
    </EditorPreferencesProvider>
  );
}
