import type { BillingInterval } from "@/lib/stripe";

export const FREE_PLAN_FEATURES = [
  "50 items",
  "3 collections",
  "Snippets, prompts, commands, notes & links",
  "Basic search",
  "Dark & light mode",
];

export const PRO_PLAN_FEATURES = [
  "Unlimited items & collections",
  "File & image uploads",
  "AI auto-tagging & summaries",
  "AI code explanation & prompt optimizer",
  "Export to JSON / ZIP",
  "Priority support",
];

export const FREE_PLAN_PRICING = {
  amount: "$0",
  period: "/forever",
  description: "Everything you need to get organized.",
};

export const PRO_PLAN_PRICING: Record<
  BillingInterval,
  { amount: string; period: string; description: string }
> = {
  monthly: { amount: "$8", period: "/month", description: "Billed monthly. Cancel anytime." },
  yearly: { amount: "$72", period: "/year", description: "Just $6/month, billed yearly." },
};
