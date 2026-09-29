import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Folder, Package } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";
import { getCurrentUser } from "@/lib/db/user";
import { getItemStats, getItemTypesWithCounts } from "@/lib/db/items";
import { getCollectionStats } from "@/lib/db/collections";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const [itemStats, collectionStats, itemTypes] = await Promise.all([
    getItemStats(),
    getCollectionStats(),
    getItemTypesWithCounts(),
  ]);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <UserAvatar name={user.name} image={user.image} size="lg" />
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">
              Member since{" "}
              {user.createdAt.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-foreground">
                <Package className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{itemStats.total}</p>
                <p className="text-xs text-muted-foreground">Items</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-foreground">
                <Folder className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{collectionStats.total}</p>
                <p className="text-xs text-muted-foreground">Collections</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-3 text-sm font-medium">By type</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {itemTypes.map((type) => {
                const Icon = ITEM_TYPE_ICONS[type.icon];
                return (
                  <div key={type.id} className="flex items-center gap-2 text-sm">
                    {Icon && (
                      <Icon className="size-4 shrink-0" style={{ color: type.color }} />
                    )}
                    <span className="capitalize text-muted-foreground">{type.name}s</span>
                    <span className="ml-auto font-medium">{type.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
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
