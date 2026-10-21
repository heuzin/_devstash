# Stripe Integration Plan — DevStash Pro

> Research output for `context/research/stripe-integration-research.md`.
> Scope: Stripe subscriptions for DevStash Pro at **$8/month** or **$72/year**, plus the plan-limit gating described in `context/project-overview.md`.
> Generated 2026-10-21 against `main` @ `70cea32`.

---

## 1. Current State Analysis

### 1.1 User model

`prisma/schema.prisma` already contains every billing field needed, so **no migration is needed for the basic integration**:

```prisma
model User {
  // ...
  // Billing
  isPro                Boolean   @default(false)
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  // ...
}
```

- `isPro` defaults to `false`. The seed (`prisma/seed.ts:56,63`) sets it explicitly to `false` for the demo user.
- Both Stripe IDs are `@unique`, so a webhook can look a user up with `findUnique({ where: { stripeCustomerId } })`.
- The schema does **not** store subscription status, price/interval, or period end. The plan below derives `isPro` from the subscription status at webhook time and reads the remaining details live from Stripe on the billing card. If the UI later needs "renews on X" or "cancels on X" without calling Stripe, an optional migration (§3.6) adds `stripeSubscriptionStatus`, `stripePriceId`, and `stripeCurrentPeriodEnd`.

### 1.2 NextAuth configuration and session handling

| File | Role |
| --- | --- |
| `src/auth.config.ts` | Edge-safe config: `pages.signIn = "/sign-in"`, GitHub provider, and a placeholder Credentials provider. **No callbacks.** |
| `src/auth.ts` | Full config: `PrismaAdapter`, `session: { strategy: "jwt" }`, the real Credentials `authorize`, and the `jwt`/`session` callbacks. |
| `src/proxy.ts` | Builds its own `NextAuth(authConfig)` (edge config only) and redirects unauthenticated users on `/dashboard`, `/profile`, `/items`, `/collections`, `/settings`, and `/favorites`. |
| `src/types/next-auth.d.ts` | Extends `Session.user` with `id` only. |

Current callbacks in `src/auth.ts`:

```ts
jwt({ token, user }) {
  if (user) token.id = user.id;
  return token;
},
session({ session, token }) {
  if (token.id) session.user.id = token.id as string;
  return session;
},
```

Things to know before applying the workaround in the research notes:

- The project stores the user ID in **`token.id`**, not `token.sub`. The research snippet uses `token.sub`. Use `token.id` to match the existing code, or fall back to `token.sub` (which the adapter also sets).
- The `jwt` callback is defined only in `src/auth.ts`, which runs on Node, so a Prisma query inside it is safe. `proxy.ts` uses `authConfig`, which has no callbacks, so the edge middleware never runs the DB query.
- With the JWT strategy, the `jwt` callback runs on **every `auth()` call**. Some pages call `auth()` several times per request (for example `getCurrentUser`, `getCurrentUserId`, `getEditorPreferences`, and the stats helpers in the `(app)` layout), so the always-sync approach adds one small indexed `SELECT isPro` per call. That cost is acceptable. See §6 for an optional `React.cache` dedupe.

### 1.3 How user data is accessed

- **Server components** use the helpers in `src/lib/db/user.ts`:
  - `getCurrentUser()` calls `auth()` and then `prisma.user.findUnique` with `select { emailVerified, password, createdAt }`. It already makes a DB round-trip, so `isPro` can be added to that `select` for free.
  - `getCurrentUserId()` reads `session.user.id` only.
- **Server Actions** (`src/actions/*.ts`) call `auth()` directly, check `session?.user?.id`, and then call a `src/lib/db/*` query function with `userId` as the first argument.
- **API routes** (`src/app/api/**/route.ts`) also call `auth()` directly and return `NextResponse.json({ success, error }, { status })`.
- **Client components** do not use `useSession()` anywhere. Data flows from server layouts into providers such as `CreateItemDialogProvider`, `ItemDrawerProvider`, and `EditorPreferencesProvider`. As a result, the session `isPro` value matters mostly for convenience. **Server-side gating should read `isPro` from the DB**, which is the source of truth.

### 1.4 Existing subscription or payment code

There is no Stripe code yet:

- `stripe` is **not** in `package.json`.
- `src/lib/plan.ts` (the `ENFORCE_PLAN_LIMITS` / `canUsePro` helper documented in the spec) **does not exist yet**.
- There is no `/api/webhooks/stripe` route, no `/settings/billing` route, and no billing UI.
- `.env.example` already lists `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, and `STRIPE_PRICE_ID_YEARLY`. `STRIPE_PUBLISHABLE_KEY` is not needed for hosted Checkout plus the Customer Portal, because no Stripe.js runs on the client.
- The homepage pricing (`src/components/homepage/pricing-cards.tsx`) shows $8/month and $72/year. Every CTA, including "Upgrade to Pro", links to `/register`.
- `src/lib/mock-data.ts` has an `isPro` field, but that file is dead mock data and is not used.

---

## 2. Feature Gating Analysis

### 2.1 Limits from the spec

| Limit | Free | Pro |
| --- | --- | --- |
| Items | 50 total | Unlimited |
| Collections | 3 | Unlimited |
| File and image uploads | ❌ | ✅ |
| AI features, custom types, export | ❌ (not built yet) | ✅ |

The spec says: *"build the Pro gating foundation, but let every user access all features"* during development, controlled by `ENFORCE_PLAN_LIMITS`. The plan keeps that flag, so gating can be merged without affecting dev or the demo user.

**Note on existing data:** the demo user already has about 16 items and 5–6 collections, which is over the free collection limit. The spec leaves downgrade behavior as an open question. This plan uses **"block new creation, never delete or hide"**: a downgraded user keeps everything but can't create beyond the limit.

### 2.2 Where checks belong

| Gate | Enforcement point (server) | Count source |
| --- | --- | --- |
| 50 items | `createItem` action (`src/actions/items.ts`) before `createItemQuery` | `prisma.item.count({ where: { userId } })` |
| 3 collections | `createCollection` action (`src/actions/collections.ts`) before `createCollectionQuery` | `prisma.collection.count({ where: { userId } })` |
| File/image items | `createItem` when the type is in `UPLOAD_TYPE_NAMES` (checked in `src/lib/db/items.ts:318`) | `isPro` |
| File/image uploads | `POST /api/upload` (`src/app/api/upload/route.ts`), before uploading to R2 | `isPro` |
| Export, AI, custom types | Not built. Wrap them in `canUsePro()` when they are. | `isPro` |

Not gated: `updateItem`, `deleteItem`, toggles, and `GET /api/items/[id]/download`. Downgraded users must still be able to view and download files they already uploaded.

Gating `POST /api/upload` as well as `createItem` matters. Otherwise a free user could still push objects into R2 without creating an item.

There is a small race between `count` and `create` (two parallel requests could reach 51 items). That is acceptable for a soft quota. Don't add transactions or locking for it.

### 2.3 Client-side UX (secondary, not security)

- `CreateItemDialog`: when not Pro, disable or label the File and Image options in the type `Select`, reusing the sidebar's existing `PRO` badge style from `src/components/dashboard/sidebar.tsx` (`PRO_ITEM_TYPE_SLUGS`).
- On a limit error, the existing `toast.error(result.error)` paths already show the server message. Make the message actionable, for example "Free plan is limited to 50 items. Upgrade to Pro in Settings."
- `AddTypeItemButton` on `/items/files` and `/items/images`: it can stay visible, because the server rejects the action and the toast explains why.

### 2.4 Settings page structure

`src/app/(app)/settings/page.tsx` is a server component that calls `getCurrentUser()` and renders stacked `Card`s inside `max-w-2xl`: **Editor preferences → Change password (credentials users only) → Danger zone**. A **Billing** card fits naturally as the first card. The spec's route table lists `/settings/billing`, but a card on `/settings` matches how Settings is already organized (the Profile Page and Settings Page features both consolidated cards onto one page). **Recommendation:** add a card on `/settings` and skip the separate route. Adding `/settings/billing` later costs nothing, because `/settings/:path*` is already protected by the proxy.

---

## 3. API and Webhook Patterns

### 3.1 API routes

- Pattern: `export async function POST(request: Request)` with `NextResponse.json({ success, data? , error? }, { status })`.
- Auth: `const session = await auth()`, then `401` if there is no `session.user.id`.
- Validation: zod `safeParse` returning `400` with `parsed.error.issues[0]?.message`.
- Rate limiting (where present): `checkRateLimit(...)` returning `429` with `Retry-After`.
- `proxy.ts` only matches page routes, so `/api/webhooks/stripe` is **not** intercepted by auth. That is correct, because Stripe calls it without a session.

### 3.2 Server Actions

- `"use server"`, a local `ActionResult { success; data?; error? }`, validation first, then `auth()`, then a `try/catch` around the DB call returning `error instanceof Error ? error.message : "Failed to …"`.
- Actions that redirect use `redirect()` or `signIn(..., { redirectTo })` (for example `signInWithGitHub` in `src/actions/auth.ts`, used as `<form action={...}>`). The Checkout and Portal actions follow that same pattern.

### 3.3 Environment variables

- Secrets live in `.env`, and `.env.example` lists the names with empty values.
- Feature flags are read once at module load in a tiny helper with a getter function. See `src/lib/email-verification.ts`:

  ```ts
  const EMAIL_VERIFICATION_ENABLED = process.env.EMAIL_VERIFICATION_ENABLED !== "false";
  export function isEmailVerificationEnabled() { return EMAIL_VERIFICATION_ENABLED; }
  ```

- Third-party clients are module singletons, as in `src/lib/resend.ts`, `src/lib/r2.ts`, and `src/lib/prisma.ts`.
- Absolute URLs are built from request headers by `getSiteUrl()` (`src/lib/site-url.ts`). Reuse it for Checkout `success_url`/`cancel_url` and the Portal `return_url`.

### 3.4 Webhook design

- **Raw body:** call `stripe.webhooks.constructEvent(await request.text(), signature, secret)`. Never call `request.json()` before verifying.
- **Events to handle:**
  - `checkout.session.completed`: links `stripeCustomerId` and `stripeSubscriptionId` to the user (identified by `client_reference_id`) and grants Pro.
  - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`: these are the source of truth for `isPro`.
  - Optional: `invoice.payment_failed`, for logging only. Status changes arrive via `subscription.updated` anyway.
- **Idempotency and ordering:** Stripe may deliver events out of order or more than once. Don't trust the event payload's snapshot. **Re-fetch the subscription** (`stripe.subscriptions.retrieve(id)`) and write the derived state. Every handler becomes "sync current state", which is naturally idempotent.
- **Pro status rule:** `isPro = ["active", "trialing", "past_due"].includes(subscription.status)`. Keeping `past_due` gives users the dunning grace period. Drop it if that isn't wanted. `canceled`, `unpaid`, `incomplete`, `incomplete_expired`, and `paused` all mean not Pro. A subscription with `cancel_at_period_end = true` stays `active` until the period ends and then emits `customer.subscription.deleted`, so no special handling is needed.
- **API-version note:** recent Stripe API versions moved `current_period_start` and `current_period_end` from the Subscription to **each subscription item** (`subscription.items.data[0].current_period_end`). Any "renews on" display must read it from the item.
- **Response:** return `200` once handled (including for ignored event types), `400` on signature failure, and `500` on handler errors so Stripe retries.

### 3.5 Linking Stripe customers to users

1. In `createCheckoutSession`, if `user.stripeCustomerId` is null, create a Stripe Customer (`email`, `name`, `metadata.userId`) and **save `stripeCustomerId` immediately**. This prevents duplicate customers when a user opens Checkout twice.
2. Pass `customer`, `client_reference_id: userId`, and `subscription_data.metadata.userId` to Checkout.
3. Subscription webhooks look the user up by `stripeCustomerId`, falling back to `subscription.metadata.userId`.

### 3.6 Optional migration (only if needed)

Skip this initially. Add it only if the Billing card should show renewal or cancellation dates without a live Stripe call:

```prisma
stripeSubscriptionStatus String?
stripePriceId            String?
stripeCurrentPeriodEnd   DateTime?
```

`npx prisma migrate dev --name add_user_stripe_subscription_details`. Remember the Node ≥ 22.12 requirement for the Prisma 7.10 CLI noted in the Editor Preferences history entry.

---

## 4. Files to Create

### 4.1 `src/lib/plan.ts`: gating foundation

```ts
import { prisma } from "@/lib/prisma";

const ENFORCE_PLAN_LIMITS = process.env.ENFORCE_PLAN_LIMITS === "true";

export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;

export function isPlanLimitEnforced() {
  return ENFORCE_PLAN_LIMITS;
}

export function canUsePro(user: { isPro: boolean }) {
  return !ENFORCE_PLAN_LIMITS || user.isPro;
}

async function getIsPro(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPro: true } });
  return user?.isPro ?? false;
}

export async function assertCanUseProFeature(userId: string, feature: string) {
  if (canUsePro({ isPro: await getIsPro(userId) })) return;
  throw new Error(`${feature} is a Pro feature. Upgrade in Settings to unlock it.`);
}

export async function assertCanCreateItem(userId: string) {
  if (canUsePro({ isPro: await getIsPro(userId) })) return;
  const count = await prisma.item.count({ where: { userId } });
  if (count >= FREE_ITEM_LIMIT) {
    throw new Error(`Free plan is limited to ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`);
  }
}

export async function assertCanCreateCollection(userId: string) {
  if (canUsePro({ isPro: await getIsPro(userId) })) return;
  const count = await prisma.collection.count({ where: { userId } });
  if (count >= FREE_COLLECTION_LIMIT) {
    throw new Error(
      `Free plan is limited to ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`,
    );
  }
}
```

> Because `ENFORCE_PLAN_LIMITS` is read at module load, tests should use `vi.stubEnv` with `vi.resetModules()` and a dynamic `import()`, the same approach as `src/lib/email-verification.test.ts`.

### 4.2 `src/lib/stripe.ts`: client singleton and price config

```ts
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set; billing is disabled.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const BILLING_INTERVALS = ["monthly", "yearly"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const STRIPE_PRICE_IDS: Record<BillingInterval, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  yearly: process.env.STRIPE_PRICE_ID_YEARLY,
};

export const PRO_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
]);
```

Don't pass `apiVersion`. Let the installed SDK pin its own version so its types match the payloads. Use the same API version for the webhook endpoint in the Dashboard.

### 4.3 `src/lib/billing.ts`: subscription → user sync (testable core)

Keep the webhook route thin and put the logic here, so it falls inside the project's unit-testing scope (`src/lib/*`).

```ts
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { PRO_SUBSCRIPTION_STATUSES, stripe } from "@/lib/stripe";

export function isProStatus(status: Stripe.Subscription.Status): boolean {
  return PRO_SUBSCRIPTION_STATUSES.has(status);
}

function customerIdOf(customer: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  return typeof customer === "string" ? customer : customer.id;
}

/** Re-fetches the subscription and writes the derived state. Safe to call repeatedly. */
export async function syncSubscription(subscriptionId: string): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = customerIdOf(subscription.customer);
  const isPro = isProStatus(subscription.status);

  const user =
    (await prisma.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } })) ??
    (subscription.metadata.userId
      ? await prisma.user.findUnique({ where: { id: subscription.metadata.userId }, select: { id: true } })
      : null);

  if (!user) {
    console.error(`Stripe sync: no user for customer ${customerId} / subscription ${subscriptionId}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPro,
      stripeCustomerId: customerId,
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
```

> Clearing `stripeSubscriptionId` when not Pro avoids a `@unique` collision if the same user later starts a new subscription. Keep `stripeCustomerId` so the customer and payment methods are reused.

### 4.4 `src/app/api/webhooks/stripe/route.ts`

```ts
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
    console.error(`Stripe webhook handler failed for ${event.type} (${event.id})`, error);
    return NextResponse.json({ success: false, error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

### 4.5 `src/actions/billing.ts`: Checkout and Portal Server Actions

```ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import { BILLING_INTERVALS, STRIPE_PRICE_IDS, stripe } from "@/lib/stripe";

const checkoutSchema = z.enum(BILLING_INTERVALS);

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
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function createCheckoutSession(interval: unknown): Promise<ActionResult> {
  const parsed = checkoutSchema.safeParse(interval);
  if (!parsed.success) return { success: false, error: "Invalid billing interval" };

  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in to do this" };

  const priceId = STRIPE_PRICE_IDS[parsed.data];
  if (!priceId) return { success: false, error: "Billing is not configured" };

  let url: string | null;
  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isPro: true } });
    if (user?.isPro) return { success: false, error: "You already have Pro" };

    const siteUrl = await getSiteUrl();
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: await getOrCreateCustomerId(session.user.id),
      client_reference_id: session.user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { userId: session.user.id } },
      allow_promotion_codes: true,
      success_url: `${siteUrl}/settings?checkout=success`,
      cancel_url: `${siteUrl}/settings?checkout=canceled`,
    });
    url = checkout.url;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to start checkout" };
  }

  if (!url) return { success: false, error: "Failed to start checkout" };
  redirect(url); // outside try/catch — redirect() throws by design
}

export async function createPortalSession(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in to do this" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) return { success: false, error: "No billing account found" };

  let url: string;
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${await getSiteUrl()}/settings`,
    });
    url = portal.url;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to open billing portal" };
  }

  redirect(url);
}
```

### 4.6 `src/components/settings/billing-card.tsx` (client)

Responsibilities:

- Props: `isPro: boolean`, `hasBillingAccount: boolean`, `enforced: boolean`, and optionally `usage: { items: number; collections: number }`.
- **Free:** show usage against the limits ("12 / 50 items", "2 / 3 collections") and a Monthly/Yearly toggle that reuses the homepage `PricingCards` look (shadcn `Switch`, "Save 25%" pill). Show an "Upgrade to Pro" button that calls `createCheckoutSession(interval)` inside `useTransition` and on `{ success: false }` shows `toast.error`.
- **Pro:** show a "Pro" badge and a "Manage subscription" button that calls `createPortalSession()`. The Portal handles cancel, plan switching, payment method, and invoices.
- When `!enforced`, show a muted note that "Plan limits are not enforced in this environment".

### 4.7 `src/components/settings/checkout-status-toast.tsx` (client, tiny)

This reads `?checkout=success|canceled` via `useSearchParams` and fires a one-time Sonner toast:

- **success:** "Welcome to Pro! It may take a few seconds to activate." Then call `router.replace("/settings")` and `router.refresh()`, so the server re-reads `isPro` once the webhook lands.
- **canceled:** "Checkout canceled."

Optional polish: if the user is still not Pro on `success`, call `router.refresh()` again after 2–3 seconds, a few times. That covers the case where the webhook arrives after the redirect.

### 4.8 Tests (colocated, per `context/coding-standards.md`)

- `src/lib/plan.test.ts`: `canUsePro` with the flag on and off; `assertCanCreateItem` and `assertCanCreateCollection` at 49/50 and 2/3 boundaries, for Pro bypass, and with the flag off; `assertCanUseProFeature`.
- `src/lib/billing.test.ts`: mock `@/lib/stripe` (`vi.mock("@/lib/stripe", () => ({ stripe: { subscriptions: { retrieve: vi.fn() } }, PRO_SUBSCRIPTION_STATUSES: … }))`) and `@/lib/prisma`. Cover `isProStatus` for every status; `syncSubscription` finding the user by customer ID, by metadata fallback, and with no user (no update); clearing `stripeSubscriptionId` on cancel; `handleCheckoutCompleted` ignoring non-subscription sessions; and `handleStripeEvent` ignoring unknown event types.
- `src/actions/billing.test.ts`: invalid interval, no session, missing price ID, already-Pro, an existing customer being reused vs. a new one being created and saved, and `redirect` called with the Checkout URL (mock `next/navigation`). Portal tests: no session, no customer, and success.
- Extend `src/actions/items.test.ts` and `src/actions/collections.test.ts` with an over-limit rejection case each. Mock `@/lib/plan` or stub the counts.

---

## 5. Files to Modify

| File | Change |
| --- | --- |
| `package.json` | `npm install stripe` |
| `.env.example` | Add `ENFORCE_PLAN_LIMITS=""`. Optionally drop `STRIPE_PUBLISHABLE_KEY`, which hosted Checkout doesn't need, or keep it for future Stripe.js use. |
| `src/types/next-auth.d.ts` | Add `isPro: boolean` to `Session.user`, and augment the JWT type (see below). |
| `src/auth.ts` | Make the `jwt` callback async and always sync `isPro` from the DB. Have the `session` callback copy it onto `session.user`. |
| `src/lib/db/user.ts` | Add `isPro` and `stripeCustomerId` to `getCurrentUser`'s `select` and to the `CurrentUser` interface (`isPro: boolean`, `hasBillingAccount: boolean`). |
| `src/actions/items.ts` | In `createItem`, inside the existing `try`, call `await assertCanCreateItem(userId)` before `createItemQuery`. For upload types, call `assertCanUseProFeature(userId, "File and image uploads")`. |
| `src/lib/db/items.ts` | No change needed if the upload-type check lives in the action. The action needs the type name, so either export a small `getItemTypeName(itemTypeId)` or do the Pro check inside `createItem` next to the existing `isUploadType` branch (line ~318). The second option is simpler, because `itemType` is already loaded there. |
| `src/actions/collections.ts` | In `createCollection`, inside the existing `try`, call `await assertCanCreateCollection(session.user.id)` before `createCollectionQuery`. |
| `src/app/api/upload/route.ts` | After the auth check: if `!canUsePro({ isPro })` (read from the DB), return `403` with `{ success: false, error: "File and image uploads are a Pro feature" }`. |
| `src/app/(app)/settings/page.tsx` | Render `<BillingCard>` as the first card, passing `user.isPro`, `user.hasBillingAccount`, `isPlanLimitEnforced()`, and the usage counts from the existing `getItemStats` and `getCollectionStats`. Mount `<CheckoutStatusToast />` wrapped in `<Suspense>`, which `useSearchParams` requires. |
| `src/components/items/create-item-dialog.tsx` (+ provider/layout plumbing) | Optional UX: pass `canUseProFeatures` down from `(app)/layout.tsx` and disable or badge the File and Image options when it's false. |
| `src/actions/profile.ts` (`deleteAccount`) | Before deleting the user, if `stripeSubscriptionId` is set, call `stripe.subscriptions.cancel(id)` (best-effort, logged on failure, like the R2 cleanup in `deleteItem`). Otherwise a deleted account keeps getting billed. |
| `src/components/homepage/pricing-cards.tsx` | Optional: keep "Upgrade to Pro" → `/register` for signed-out visitors. The homepage is statically prerendered and intentionally doesn't call `auth()`, so don't add session awareness there. Signed-in users upgrade from `/settings`. |
| `context/project-overview.md` | Mark the open question "downgraded user's data" as decided: block new creation, keep existing data. |

### 5.1 `src/types/next-auth.d.ts`

```ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isPro?: boolean;
  }
}
```

### 5.2 `src/auth.ts` callbacks (adapted from the research note to use `token.id`)

```ts
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
    }

    // Always sync isPro from the database so Stripe webhook updates show up
    // on the next request, without relying on `trigger === "update"`.
    const userId = (token.id as string | undefined) ?? token.sub;
    if (userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPro: true },
      });
      token.isPro = dbUser?.isPro ?? false;
    }

    return token;
  },
  session({ session, token }) {
    if (token.id) {
      session.user.id = token.id as string;
    }
    session.user.isPro = token.isPro ?? false;
    return session;
  },
},
```

Why this approach: `trigger === "update"` only runs when the client calls `update()` from `useSession()`. Nothing in this app uses `useSession()`, and a webhook can't trigger it anyway. Re-reading `isPro` on each validation means that after Checkout, a simple `router.refresh()` or page reload picks up Pro.

---

## 6. Optional: dedupe `auth()` per request

Because the `jwt` callback now hits the DB, consider wrapping the session lookup in `React.cache` so the multiple `auth()` calls within one server render share a single result:

```ts
// src/lib/db/session.ts
import { cache } from "react";
import { auth } from "@/auth";
export const getSession = cache(() => auth());
```

Then switch the `src/lib/db/*` helpers from `auth()` to `getSession()`. This is a pure optimization, so treat it as a separate follow-up. Server Actions and route handlers keep calling `auth()` directly.

---

## 7. Stripe Dashboard Setup

All steps happen in **Test mode** first.

1. **Product:** Products → Add product → Name "DevStash Pro" with the description "Unlimited items and collections, file and image uploads, AI features, export."
2. **Prices** (both on the same product, recurring, USD):
   - Monthly: **$8.00**, billing period monthly → copy the ID into `STRIPE_PRICE_ID_MONTHLY`.
   - Yearly: **$72.00**, billing period yearly → copy the ID into `STRIPE_PRICE_ID_YEARLY`.
3. **API keys:** Developers → API keys → copy the secret key (`sk_test_…`) into `STRIPE_SECRET_KEY`.
4. **Customer Portal:** Settings → Billing → Customer portal:
   - Enable: cancel subscriptions (at period end), update payment methods, view invoice history.
   - Enable **switch plans** and add both prices, so users can move between monthly and yearly.
   - Set the default return URL to `https://<prod-domain>/settings`.
   - Save. The portal has to be saved once in test mode before `billingPortal.sessions.create` works.
5. **Local webhooks** (Stripe CLI):

   ```bash
   brew install stripe/stripe-cli/stripe
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe \
     --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted
   ```

   Copy the printed `whsec_…` into `.env` as `STRIPE_WEBHOOK_SECRET`.
6. **Deployed webhooks:** Developers → Webhooks → Add endpoint `https://<domain>/api/webhooks/stripe` with the same four events. Copy its signing secret into the deployment env. Note that it differs from the CLI secret.
7. **Branding (optional):** Settings → Branding sets the logo and colors for the Checkout and Portal pages.
8. **Go live:** repeat steps 1–6 in Live mode (live product and prices, `sk_live_…`, live webhook secret) and set `ENFORCE_PLAN_LIMITS="true"` in production.

---

## 8. Testing Checklist

### Automated (`npm run test`)
- [ ] `plan.test.ts`: flag on/off, item and collection boundaries (49 allowed, 50 rejected; 2 allowed, 3 rejected), Pro bypass.
- [ ] `billing.test.ts`: status → isPro mapping, user lookup by customer and by metadata fallback, missing user is a no-op, cancel clears `stripeSubscriptionId`, non-subscription checkout ignored, unknown events ignored.
- [ ] `actions/billing.test.ts`: validation, auth, missing price, already Pro, customer reuse vs. creation, redirect URL.
- [ ] Items and collections action tests: over-limit rejection returns the friendly error and doesn't call `create`.
- [ ] `npm run lint` and `npm run build` pass.

### Manual (test mode, `stripe listen` running, `ENFORCE_PLAN_LIMITS="true"` locally)
- [ ] A free user with 50 items gets the "limited to 50 items" toast on create. With 3 collections, the 4th is rejected.
- [ ] A free user creating a file or image item is rejected, and a direct `POST /api/upload` returns `403`.
- [ ] Existing file/image items still open and download for a free (downgraded) user.
- [ ] Settings shows the Free card with usage. Upgrade (monthly) redirects to Stripe Checkout. Pay with `4242 4242 4242 4242`. Back on `/settings?checkout=success`, the success toast shows, the card flips to Pro after the refresh, and the DB has `isPro=true` with both Stripe IDs set.
- [ ] Repeat with **yearly**. Checkout shows $72/year.
- [ ] Opening Checkout twice before paying reuses the same Stripe Customer (one customer in the Dashboard).
- [ ] Limits are lifted for Pro: 51st item, 4th collection, and file upload all succeed.
- [ ] "Manage subscription" opens the Portal. Switching monthly → yearly keeps Pro (`subscription.updated`).
- [ ] Portal cancel (at period end): still Pro. Then `stripe subscriptions cancel sub_…` (or a test clock advance) sends `subscription.deleted`, which sets `isPro=false` and clears `stripeSubscriptionId`, and the limits apply again.
- [ ] Declined card `4000 0000 0000 0341` (attach succeeds, charge fails): user not upgraded or later goes `past_due` per the chosen rule.
- [ ] 3DS card `4000 0025 0000 3155` completes after authentication.
- [ ] Webhook with a bad signature (`curl -X POST` without a header) returns `400`. `stripe trigger customer.subscription.updated` for an unknown customer is logged and returns `200`.
- [ ] Resending the same event from the Dashboard (Webhooks → event → Resend) is idempotent.
- [ ] Session sync: flip `isPro` directly in the dev DB and reload, and the session and UI reflect it without signing out.
- [ ] Deleting a Pro account cancels the Stripe subscription.
- [ ] `/api/webhooks/stripe` is reachable without auth (not caught by `proxy.ts`).

---

## 9. Implementation Order

Each step builds and passes on its own, so the work can be split across feature branches.

1. **Gating foundation** (`feature/plan-limits`): `src/lib/plan.ts` and its tests; wire `assertCanCreateItem`, `assertCanCreateCollection`, and the upload Pro checks into `createItem`, `createCollection`, and `POST /api/upload`; add `ENFORCE_PLAN_LIMITS` to `.env.example`. With the flag unset nothing changes, so this is safe to merge first.
2. **Session `isPro`**: augment `next-auth.d.ts`, update the `src/auth.ts` callbacks, and add `isPro` and `hasBillingAccount` to `getCurrentUser`.
3. **Stripe core** (`feature/stripe-subscriptions`): `npm install stripe`, `src/lib/stripe.ts`, `src/lib/billing.ts` and its tests, and the webhook route. Verify with `stripe listen` and `stripe trigger`.
4. **Checkout and Portal actions**: `src/actions/billing.ts` and its tests. Complete the Dashboard steps (§7, 1–5).
5. **Billing UI**: `BillingCard` and `CheckoutStatusToast` on `/settings`. Run the full manual checklist end to end.
6. **Account deletion cleanup**: cancel the subscription in `deleteAccount`.
7. **UX polish** (optional): Pro badges and disabled File/Image options in `CreateItemDialog`, limit-aware messaging.
8. **Optional follow-ups**: the `React.cache` session dedupe (§6) and the subscription-detail migration (§3.6) if the Billing card needs renewal dates without a Stripe call.
9. **Production**: live-mode product, prices, and webhook; set the live env vars and `ENFORCE_PLAN_LIMITS="true"`.

---

## 10. Open Decisions for the Owner

- **`past_due` handling:** keep Pro during Stripe's retry window (recommended, as in this plan) or revoke immediately?
- **Billing location:** a card on `/settings` (recommended) or the spec's separate `/settings/billing` route?
- **Downgrade behavior:** block new creation and keep all existing data (this plan's assumption), or make data read-only?
- **Trial:** no trial is planned. Adding one is a single `subscription_data.trial_period_days` setting, and `trialing` already counts as Pro.
