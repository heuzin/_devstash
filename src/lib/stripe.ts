import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set; billing is disabled.");
}

// The SDK throws on an empty key at construction time, so fall back to a
// placeholder: importing this module stays safe without Stripe configured, and
// any actual API call fails with Stripe's authentication error instead.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_unconfigured");

export const BILLING_INTERVALS = ["monthly", "yearly"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const STRIPE_PRICE_IDS: Record<BillingInterval, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  yearly: process.env.STRIPE_PRICE_ID_YEARLY,
};

// past_due keeps Pro during Stripe's dunning retry window.
export const PRO_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
]);
