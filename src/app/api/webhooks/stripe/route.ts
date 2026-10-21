import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { handleStripeEvent } from "@/lib/billing";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ success: false, error: "Missing signature" }, { status: 400 });
  }

  // Verify against the raw body; parsing it as JSON first would break the signature.
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (error) {
    // A 500 makes Stripe retry the event.
    console.error(`Stripe webhook handler failed for ${event.type} (${event.id})`, error);
    return NextResponse.json({ success: false, error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
