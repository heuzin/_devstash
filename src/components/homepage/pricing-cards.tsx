"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Reveal } from "@/components/homepage/reveal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  "50 items",
  "3 collections",
  "Snippets, prompts, commands, notes & links",
  "Basic search",
  "Dark & light mode",
];

const PRO_FEATURES = [
  "Unlimited items & collections",
  "File & image uploads",
  "AI auto-tagging & summaries",
  "AI code explanation & prompt optimizer",
  "Export to JSON / ZIP",
  "Priority support",
];

const PRO_PRICING = {
  monthly: { amount: "$8", period: "/month", description: "Billed monthly. Cancel anytime." },
  yearly: { amount: "$72", period: "/year", description: "Just $6/month, billed yearly." },
};

interface PriceCardProps {
  name: string;
  amount: string;
  period: string;
  description: string;
  features: string[];
  ctaLabel: string;
  highlighted?: boolean;
}

function PriceCard({ name, amount, period, description, features, ctaLabel, highlighted }: PriceCardProps) {
  return (
    <Reveal className="h-full">
      <article
        className={cn(
          "relative flex h-full flex-col rounded-xl border border-border bg-card p-8",
          highlighted &&
            "border-type-snippet/60 bg-linear-to-b from-type-snippet/8 via-card to-card shadow-[0_0_0_1px_rgb(59_130_246/0.25),0_30px_60px_-30px_rgb(59_130_246/0.45)]",
        )}
      >
        {highlighted && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-type-snippet to-indigo-500 px-3 py-1 text-xs font-semibold whitespace-nowrap text-white">
            Most Popular
          </span>
        )}
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="mt-3.5">
          <span className="text-[44px] font-extrabold tracking-tight">{amount}</span>
          <span className="ml-1 text-muted-foreground">{period}</span>
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        <ul className="mt-7 mb-8 grid flex-1 content-start gap-3 text-[15px]">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <Check className="mt-1 size-4 shrink-0 text-type-snippet" strokeWidth={3} />
              {feature}
            </li>
          ))}
        </ul>
        <Button
          size="lg"
          variant={highlighted ? "default" : "outline"}
          className="h-10 w-full"
          nativeButton={false}
          render={<Link href="/register" />}
        >
          {ctaLabel}
        </Button>
      </article>
    </Reveal>
  );
}

export function PricingCards() {
  const [yearly, setYearly] = useState(false);
  const proPricing = yearly ? PRO_PRICING.yearly : PRO_PRICING.monthly;

  const periodLabelClass = (active: boolean) =>
    cn("transition-colors", active ? "text-foreground" : "text-muted-foreground");

  return (
    <>
      <Reveal className="-mt-6 mb-10 flex items-center justify-center gap-3 text-sm">
        <button type="button" className={periodLabelClass(!yearly)} onClick={() => setYearly(false)}>
          Monthly
        </button>
        <Switch checked={yearly} onCheckedChange={(checked) => setYearly(checked)} aria-label="Yearly billing" />
        <button type="button" className={periodLabelClass(yearly)} onClick={() => setYearly(true)}>
          Yearly
          <span className="ml-1.5 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-500">
            Save 25%
          </span>
        </button>
      </Reveal>

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        <PriceCard
          name="Free"
          amount="$0"
          period="/forever"
          description="Everything you need to get organized."
          features={FREE_FEATURES}
          ctaLabel="Get Started"
        />
        <PriceCard name="Pro" {...proPricing} features={PRO_FEATURES} ctaLabel="Upgrade to Pro" highlighted />
      </div>
    </>
  );
}
