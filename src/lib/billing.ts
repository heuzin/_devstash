import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { PRO_SUBSCRIPTION_STATUSES, stripe } from "@/lib/stripe";

export function isProStatus(status: Stripe.Subscription.Status): boolean {
  return PRO_SUBSCRIPTION_STATUSES.has(status);
}

function customerIdOf(customer: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  return typeof customer === "string" ? customer : customer.id;
}

async function findUserForSubscription(
  customerId: string,
  metadataUserId: string | undefined,
): Promise<{ id: string } | null> {
  const byCustomer = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  if (byCustomer || !metadataUserId) return byCustomer;

  return prisma.user.findUnique({ where: { id: metadataUserId }, select: { id: true } });
}

/** Re-fetches the subscription from Stripe and writes the derived state. Safe to call repeatedly. */
export async function syncSubscription(subscriptionId: string): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = customerIdOf(subscription.customer);
  const isPro = isProStatus(subscription.status);

  const user = await findUserForSubscription(customerId, subscription.metadata.userId);
  if (!user) {
    console.error(`Stripe sync: no user for customer ${customerId} / subscription ${subscriptionId}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPro,
      stripeCustomerId: customerId,
      // Cleared when not Pro so a later resubscribe can't collide on the @unique column.
      stripeSubscriptionId: isPro ? subscription.id : null,
    },
  });
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode !== "subscription" || !session.subscription) return;

  const userId = session.client_reference_id;
  const customerId = session.customer ? customerIdOf(session.customer) : null;
  if (userId && customerId) {
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
  }

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  await syncSubscription(subscriptionId);
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object.id);
      break;
    default:
      break;
  }
}
