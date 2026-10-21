"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import { BILLING_INTERVALS, STRIPE_PRICE_IDS, stripe } from "@/lib/stripe";

const checkoutIntervalSchema = z.enum(BILLING_INTERVALS);

interface ActionResult {
  success: boolean;
  error?: string;
}

async function getOrCreateCustomerId(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, name: true, stripeCustomerId: true },
  });
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId },
  });
  // Saved before Checkout opens so a second attempt reuses this customer.
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function createCheckoutSession(interval: unknown): Promise<ActionResult> {
  const parsed = checkoutIntervalSchema.safeParse(interval);
  if (!parsed.success) {
    return { success: false, error: "Invalid billing interval" };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do this" };
  }
  const userId = session.user.id;

  const priceId = STRIPE_PRICE_IDS[parsed.data];
  if (!priceId) {
    return { success: false, error: "Billing is not configured" };
  }

  let url: string | null;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPro: true } });
    if (user?.isPro) {
      return { success: false, error: "You already have Pro" };
    }

    const siteUrl = await getSiteUrl();
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: await getOrCreateCustomerId(userId),
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { userId } },
      allow_promotion_codes: true,
      success_url: `${siteUrl}/settings?checkout=success`,
      cancel_url: `${siteUrl}/settings?checkout=canceled`,
    });
    url = checkout.url;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start checkout",
    };
  }

  if (!url) {
    return { success: false, error: "Failed to start checkout" };
  }
  // Outside the try: redirect() throws by design.
  redirect(url);
}

export async function createPortalSession(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do this" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    return { success: false, error: "No billing account found" };
  }

  let url: string;
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${await getSiteUrl()}/settings`,
    });
    url = portal.url;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to open billing portal",
    };
  }

  redirect(url);
}
