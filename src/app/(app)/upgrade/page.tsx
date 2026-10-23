import { redirect } from "next/navigation";
import { UpgradePlans } from "@/components/upgrade/upgrade-plans";
import { getCurrentUser } from "@/lib/db/user";

export default async function UpgradePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  if (user.isPro) {
    redirect("/settings");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Upgrade to DevStash Pro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unlimited storage, file uploads, and AI features. Pick the plan that suits you.
        </p>
      </div>
      <UpgradePlans />
    </div>
  );
}
