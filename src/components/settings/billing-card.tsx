"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { BillingInterval } from "@/lib/stripe";
import { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT } from "@/lib/plan-limits";
import { cn } from "@/lib/utils";

const PRO_PRICING: Record<BillingInterval, { amount: string; period: string }> = {
  monthly: { amount: "$8", period: "/month" },
  yearly: { amount: "$72", period: "/year" },
};

interface BillingCardProps {
  isPro: boolean;
  hasBillingAccount: boolean;
  enforced: boolean;
  usage: { items: number; collections: number };
}

export function BillingCard({ isPro, hasBillingAccount, enforced, usage }: BillingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Billing
          {isPro && <Badge>Pro</Badge>}
        </CardTitle>
        <CardDescription>
          {isPro ? "You're on DevStash Pro." : "You're on the Free plan."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isPro ? (
          <ProPlanDetails hasBillingAccount={hasBillingAccount} />
        ) : (
          <FreePlanDetails usage={usage} />
        )}
        {!enforced && (
          <p className="text-xs text-muted-foreground">
            Plan limits are not enforced in this environment.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ProPlanDetails({ hasBillingAccount }: { hasBillingAccount: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleManage() {
    startTransition(async () => {
      const result = await createPortalSession();
      if (!result.success) {
        toast.error(result.error ?? "Failed to open billing portal");
      }
    });
  }

  if (!hasBillingAccount) {
    return (
      <p className="text-sm text-muted-foreground">
        Your Pro access isn&apos;t linked to a Stripe subscription.
      </p>
    );
  }

  return (
    <Button variant="outline" onClick={handleManage} disabled={isPending}>
      {isPending ? "Opening…" : "Manage subscription"}
    </Button>
  );
}

function FreePlanDetails({ usage }: { usage: BillingCardProps["usage"] }) {
  const [interval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [isPending, startTransition] = useTransition();
  const yearly = interval === "yearly";
  const pricing = PRO_PRICING[interval];

  const periodLabelClass = (active: boolean) =>
    cn("transition-colors", active ? "text-foreground" : "text-muted-foreground");

  function handleUpgrade() {
    startTransition(async () => {
      const result = await createCheckoutSession(interval);
      if (!result.success) {
        toast.error(result.error ?? "Failed to start checkout");
      }
    });
  }

  return (
    <>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <UsageStat label="Items" used={usage.items} limit={FREE_ITEM_LIMIT} />
        <UsageStat label="Collections" used={usage.collections} limit={FREE_COLLECTION_LIMIT} />
      </dl>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          className={periodLabelClass(!yearly)}
          onClick={() => setBillingInterval("monthly")}
          disabled={isPending}
        >
          Monthly
        </button>
        <Switch
          checked={yearly}
          onCheckedChange={(checked) => setBillingInterval(checked ? "yearly" : "monthly")}
          disabled={isPending}
          aria-label="Yearly billing"
        />
        <button
          type="button"
          className={periodLabelClass(yearly)}
          onClick={() => setBillingInterval("yearly")}
          disabled={isPending}
        >
          Yearly
          <span className="ml-1.5 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-500">
            Save 25%
          </span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>
          <span className="text-2xl font-bold">{pricing.amount}</span>
          <span className="ml-1 text-sm text-muted-foreground">{pricing.period}</span>
        </p>
        <Button onClick={handleUpgrade} disabled={isPending}>
          {isPending ? "Redirecting…" : "Upgrade to Pro"}
        </Button>
      </div>
    </>
  );
}

function UsageStat({ label, used, limit }: { label: string; used: number; limit: number }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium", used >= limit && "text-destructive")}>
        {used} / {limit} {label.toLowerCase()}
      </dd>
    </div>
  );
}
