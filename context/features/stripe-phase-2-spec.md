# Stripe Integration — Phase 2: Integration & UI

## Overview

Build on Phase 1 (`src/lib/usage-limits.ts`, `src/lib/stripe.ts`, session `isPro`) to make DevStash Pro purchasable end to end: a Stripe webhook that keeps `User.isPro` in sync, Checkout and Customer Portal Server Actions, server-side feature gating on item/collection creation and uploads, and a Billing card on `/settings`. Everything here needs a Stripe test-mode account and the Stripe CLI (`stripe listen`) to verify.

Reference: `docs/stripe-integration-plan.md` (§2, §3, §4.3–§4.8, §5, §7, §8).

## Decisions

- **`past_due`** keeps Pro (already encoded in `PRO_SUBSCRIPTION_STATUSES`)
- **Billing location:** a Billing card at the top of `/settings`, not a separate `/settings/billing` route
- **Downgrade behavior:** block new creation beyond the free limits; never delete, hide, or make existing data read-only
- **No trial**
- Mark the "downgraded user's data" open question in `context/project-overview.md` as decided

## Requirements

### Webhooks

- `src/lib/billing.ts` holds the logic so it's unit-testable; the route stays thin (plan §4.3)
  - `isProStatus(status)` via `PRO_SUBSCRIPTION_STATUSES`
  - `syncSubscription(subscriptionId)` — **re-fetches** the subscription from Stripe (never trusts the event snapshot), finds the user by `stripeCustomerId` then falls back to `subscription.metadata.userId`, and writes `isPro`, `stripeCustomerId`, and `stripeSubscriptionId` (cleared to `null` when not Pro, to avoid a `@unique` collision on resubscribe). Logs and returns when no user is found
  - `handleCheckoutCompleted(session)` — ignores non-subscription sessions; links `stripeCustomerId` via `client_reference_id`, then calls `syncSubscription`
  - `handleStripeEvent(event)` — handles `checkout.session.completed` and `customer.subscription.created|updated|deleted`; ignores everything else
- `src/app/api/webhooks/stripe/route.ts` (plan §4.4)
  - Verifies with `stripe.webhooks.constructEvent(await request.text(), signature, STRIPE_WEBHOOK_SECRET)` — never `request.json()` first
  - `400` on missing/invalid signature, `500` on handler error (so Stripe retries), `200` otherwise (including ignored event types)
  - Not added to `proxy.ts` — Stripe calls it without a session

### Checkout & Portal — `src/actions/billing.ts`

Follows the existing Server Action pattern (`ActionResult`, validate → `auth()` → `try/catch`), with `redirect()` called **outside** the `try` (plan §4.5).

- `createCheckoutSession(interval)` — zod-validates `interval` against `BILLING_INTERVALS`; rejects unauthenticated users, a missing price ID ("Billing is not configured"), and users who are already Pro; gets or creates the Stripe Customer (saving `stripeCustomerId` **immediately** so opening Checkout twice reuses one customer); creates a `subscription`-mode session with `customer`, `client_reference_id`, `subscription_data.metadata.userId`, `allow_promotion_codes: true`, and `success_url`/`cancel_url` of `/settings?checkout=success|canceled` built with `getSiteUrl()`; redirects to the Checkout URL
- `createPortalSession()` — rejects unauthenticated users and users with no `stripeCustomerId`; redirects to a Billing Portal session with `return_url` `/settings`

### Feature Gating (server-side)

All checks use the Phase 1 `usage-limits` helpers and are no-ops while `ENFORCE_PLAN_LIMITS` is unset.

| Gate | Where |
| --- | --- |
| 50 items | `createItem` in `src/actions/items.ts` — `assertCanCreateItem(userId)` inside the existing `try`, before the query |
| File/image items | `createItem` in `src/lib/db/items.ts`, next to the existing upload-type branch (the `itemType` is already loaded there) — `assertCanUseProFeature(userId, "File and image uploads")` |
| 3 collections | `createCollection` in `src/actions/collections.ts` — `assertCanCreateCollection(userId)` inside the existing `try` |
| Uploads | `POST /api/upload` — after the auth check, read `isPro` from the DB; if `!canUsePro(...)` return `403` `{ success: false, error: "File and image uploads are a Pro feature" }` before touching R2 |

- **Not gated:** `updateItem`, `deleteItem`, favorite/pin toggles, collection edit/delete, and `GET /api/items/[id]/download` — downgraded users keep full access to existing data
- The existing `toast.error(result.error)` paths surface the friendly limit messages; no new client error handling needed
- Accept the small count-then-create race; no transactions or locking

### Account Deletion

- `deleteAccount` in `src/actions/profile.ts`: before deleting the user, if `stripeSubscriptionId` is set, call `stripe.subscriptions.cancel(id)` — best-effort, logged on failure (same pattern as the R2 cleanup in `deleteItem`), and never blocks the deletion

### UI

**`src/components/settings/billing-card.tsx` (client)** — first card on `/settings`

- Props: `isPro`, `hasBillingAccount`, `enforced`, `usage: { items: number; collections: number }`
- **Free:** usage against limits ("12 / 50 items", "2 / 3 collections"), a Monthly/Yearly toggle styled like the homepage `PricingCards` (shadcn `Switch`, "Save 25%" pill, $8/month vs. $72/year), and an "Upgrade to Pro" button calling `createCheckoutSession(interval)` inside `useTransition`, with `toast.error` on `{ success: false }`
- **Pro:** a "Pro" badge and a "Manage subscription" button calling `createPortalSession()`
- When `!enforced`, a muted note: "Plan limits are not enforced in this environment"
- Buttons disabled while pending

**`src/components/settings/checkout-status-toast.tsx` (client)**

- Reads `?checkout=success|canceled` via `useSearchParams` and fires a one-time Sonner toast
- `success`: "Welcome to Pro! It may take a few seconds to activate.", then `router.replace("/settings")` + `router.refresh()`; if still not Pro, refresh again after ~2–3s a few times to cover a late webhook
- `canceled`: "Checkout canceled."

**`src/app/(app)/settings/page.tsx`**

- Render `<BillingCard>` first, passing `user.isPro`, `user.hasBillingAccount`, `isPlanLimitEnforced()`, and usage from the existing `getItemStats` / `getCollectionStats`
- Mount `<CheckoutStatusToast />` inside `<Suspense>` (required by `useSearchParams`)

**`CreateItemDialog` (UX only, not security)**

- Pass `canUseProFeatures` down from `(app)/layout.tsx` through `CreateItemDialogProvider`; when false, disable the File and Image options in the type `Select` and show the sidebar's existing outline `PRO` badge next to them
- `AddTypeItemButton` on `/items/files` and `/items/images` stays visible; the server rejection + toast explains the limit

**Homepage**

- Leave `pricing-cards.tsx` CTAs pointing at `/register` — the homepage stays static and session-unaware; signed-in users upgrade from `/settings`

## Environment Variables

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from `stripe listen` locally; different secret in deployment
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
ENFORCE_PLAN_LIMITS=true          # locally, only while testing gating
```

## Stripe Setup (test mode)

1. Product "DevStash Pro" with two recurring USD prices: $8.00 monthly and $72.00 yearly → copy IDs into the env
2. Customer Portal: enable cancel (at period end), payment method updates, invoice history, and plan switching between both prices; return URL `/settings`; **save once** before `billingPortal.sessions.create` will work
3. Local webhooks:

   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe \
     --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted
   ```

Live-mode setup and the production webhook endpoint are out of scope for this phase.

## Out of Scope

- Live-mode product/prices/webhook and setting `ENFORCE_PLAN_LIMITS="true"` in production
- The optional `React.cache` session dedupe (plan §6)
- The optional subscription-detail migration (plan §3.6) — no "renews on" date on the Billing card
- Gating AI, export, and custom types (not built yet)

## Testing

### Unit tests

- `src/lib/billing.test.ts` — mock `@/lib/stripe` (`stripe.subscriptions.retrieve` as `vi.fn()`, real `PRO_SUBSCRIPTION_STATUSES`) and `@/lib/prisma`
  - `isProStatus` for every subscription status
  - `syncSubscription`: user found by customer ID; metadata `userId` fallback; no user → no update; cancelled subscription sets `isPro: false` and clears `stripeSubscriptionId`
  - `handleCheckoutCompleted`: non-subscription session ignored; links customer then syncs
  - `handleStripeEvent`: routes the four handled types; unknown types are no-ops
- `src/actions/billing.test.ts` — mock `@/auth`, `@/lib/stripe`, `@/lib/site-url`, and `next/navigation`'s `redirect`
  - Checkout: invalid interval, no session, missing price ID, already Pro, existing customer reused vs. new customer created and saved, `redirect` called with the Checkout URL
  - Portal: no session, no customer, success redirect
- `src/actions/items.test.ts` / `src/actions/collections.test.ts` — over-limit rejection returns the friendly error and the create query is not called (mock `@/lib/usage-limits`)
- `src/actions/profile.test.ts` — `deleteAccount` cancels an existing subscription, and still deletes the user when the cancel call fails

### Manual (Stripe CLI running, `ENFORCE_PLAN_LIMITS="true"`, dev DB)

- Free user at 50 items / 3 collections gets the limit toast on create; file/image item creation is rejected and a direct `POST /api/upload` returns `403`
- Existing file/image items still open and download for a free user
- `/settings` shows the Free card with usage; Upgrade (monthly) → Checkout → `4242 4242 4242 4242` → back on `/settings?checkout=success` with the toast, card flips to Pro, DB has `isPro=true` and both Stripe IDs
- Repeat with yearly (Checkout shows $72/year)
- Opening Checkout twice before paying creates only one Stripe Customer
- Pro lifts all limits (51st item, 4th collection, upload)
- "Manage subscription" opens the Portal; switching monthly ↔ yearly keeps Pro
- Portal cancel at period end keeps Pro; `stripe subscriptions cancel sub_…` sets `isPro=false`, clears `stripeSubscriptionId`, and limits apply again
- Declined (`4000 0000 0000 0341`) and 3DS (`4000 0025 0000 3155`) cards behave as expected
- Unsigned `curl -X POST /api/webhooks/stripe` returns `400`; `stripe trigger customer.subscription.updated` for an unknown customer logs and returns `200`; resending an event from the Dashboard is idempotent
- Deleting a Pro account cancels its Stripe subscription
- `npm run test`, `npm run lint`, and `npm run build` pass
- Restore the demo user to `isPro=false` with no Stripe IDs, and remove test accounts afterward
