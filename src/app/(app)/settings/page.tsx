import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";
import { BillingCard } from "@/components/settings/billing-card";
import { CheckoutStatusToast } from "@/components/settings/checkout-status-toast";
import { EditorPreferencesForm } from "@/components/settings/editor-preferences-form";
import { getCollectionStats } from "@/lib/db/collections";
import { getItemStats } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import { isPlanLimitEnforced } from "@/lib/usage-limits";

export default async function SettingsPage() {
  const [user, itemStats, collectionStats] = await Promise.all([
    getCurrentUser(),
    getItemStats(),
    getCollectionStats(),
  ]);
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings.</p>
      </div>

      <Suspense>
        <CheckoutStatusToast isPro={user.isPro} />
      </Suspense>

      <BillingCard
        isPro={user.isPro}
        hasBillingAccount={user.hasBillingAccount}
        enforced={isPlanLimitEnforced()}
        usage={{ items: itemStats.total, collections: collectionStats.total }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Editor preferences</CardTitle>
          <CardDescription>Changes save automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditorPreferencesForm />
        </CardContent>
      </Card>

      {user.hasPassword && (
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>Permanently delete your account and all its data.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog />
        </CardContent>
      </Card>
    </div>
  );
}
