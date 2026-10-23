"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/homepage/reveal";
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

function RegisterButton({ label, highlighted }: { label: string; highlighted?: boolean }) {
  return (
    <Button
      size="lg"
      variant={highlighted ? "default" : "outline"}
      className="h-10 w-full"
      nativeButton={false}
      render={<Link href="/register" />}
    >
      {label}
    </Button>
  );
}

export function PricingCards() {
  const [interval, setBillingInterval] = useState<BillingInterval>("monthly");

  return (
    <>
      <Reveal className="-mt-6 mb-10">
        <BillingIntervalToggle
          interval={interval}
          onChange={setBillingInterval}
          className="justify-center"
        />
      </Reveal>

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        <Reveal className="h-full">
          <PriceCard
            name="Free"
            {...FREE_PLAN_PRICING}
            features={FREE_PLAN_FEATURES}
            cta={<RegisterButton label="Get Started" />}
          />
        </Reveal>
        <Reveal className="h-full">
          <PriceCard
            name="Pro"
            {...PRO_PLAN_PRICING[interval]}
            features={PRO_PLAN_FEATURES}
            cta={<RegisterButton label="Upgrade to Pro" highlighted />}
            highlighted
          />
        </Reveal>
      </div>
    </>
  );
}
