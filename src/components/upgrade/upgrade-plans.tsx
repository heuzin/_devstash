"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createCheckoutSession } from "@/actions/billing";
import { BillingIntervalToggle } from "@/components/pricing/billing-interval-toggle";
import { PriceCard } from "@/components/pricing/price-card";
import { Button } from "@/components/ui/button";
import {
  FREE_PLAN_FEATURES,
  FREE_PLAN_PRICING,
  PRO_PLAN_FEATURES,
  PRO_PLAN_PRICING,
} from "@/lib/pricing";
import type { BillingInterval } from "@/lib/stripe";

export function UpgradePlans() {
  const [interval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [isPending, startTransition] = useTransition();

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
      <BillingIntervalToggle
        interval={interval}
        onChange={setBillingInterval}
        disabled={isPending}
        className="justify-center"
      />

      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        <PriceCard
          name="Free"
          {...FREE_PLAN_PRICING}
          features={FREE_PLAN_FEATURES}
          cta={
            <Button size="lg" variant="outline" className="h-10 w-full" disabled>
              Current plan
            </Button>
          }
        />
        <PriceCard
          name="Pro"
          {...PRO_PLAN_PRICING[interval]}
          features={PRO_PLAN_FEATURES}
          cta={
            <Button size="lg" className="h-10 w-full" onClick={handleUpgrade} disabled={isPending}>
              {isPending
                ? "Redirecting…"
                : `Upgrade for ${PRO_PLAN_PRICING[interval].amount}${PRO_PLAN_PRICING[interval].period}`}
            </Button>
          }
          highlighted
        />
      </div>
    </>
  );
}
