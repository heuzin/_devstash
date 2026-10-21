# Stripe Integration — Phase 1: Core Infrastructure

## Overview

Lay the groundwork for DevStash Pro ($8/month or $72/year) without any user-facing billing yet: install the Stripe SDK, add the Stripe client singleton and price config, add the `usage-limits` module that every Pro check will go through, and surface `isPro` on the session and `getCurrentUser`. Nothing is wired into actions, routes, or the UI in this phase, so behavior is unchanged for every user.

Reference: `docs/stripe-integration-plan.md` (§1, §4.1, §4.2, §5, §5.1, §5.2).

## Requirements

- `npm install stripe`
- No migration — `User.isPro`, `stripeCustomerId`, and `stripeSubscriptionId` already exist in `prisma/schema.prisma`
- With `ENFORCE_PLAN_LIMITS` unset, every user (including the demo user, who is already over the free collection limit) can still do everything
- Server-side gating must read `isPro` from the DB, not the session; the session value is a convenience only

## Files to Create

### `src/lib/usage-limits.ts`

The gating foundation (the plan's `src/lib/plan.ts`, renamed). Follows the `src/lib/email-verification.ts` pattern: the env flag is read once at module load and exposed via a getter.

- `ENFORCE_PLAN_LIMITS = process.env.ENFORCE_PLAN_LIMITS === "true"` (defaults to **not** enforced)
- Constants: `FREE_ITEM_LIMIT = 50`, `FREE_COLLECTION_LIMIT = 3`
- `isPlanLimitEnforced(): boolean`
- `canUsePro(user: { isPro: boolean }): boolean` — `!ENFORCE_PLAN_LIMITS || user.isPro`
- `assertCanUseProFeature(userId, feature)` — throws `"<feature> is a Pro feature. Upgrade in Settings to unlock it."`
- `assertCanCreateItem(userId)` — Pro/unenforced bypass; otherwise throws `"Free plan is limited to 50 items. Upgrade to Pro for unlimited items."` when `prisma.item.count({ where: { userId } }) >= FREE_ITEM_LIMIT`
- `assertCanCreateCollection(userId)` — same shape, `prisma.collection.count`, `FREE_COLLECTION_LIMIT`
- A private `getIsPro(userId)` helper (`findUnique` selecting only `isPro`, `false` if the user isn't found)
- Skip the count query entirely when the user can use Pro

### `src/lib/stripe.ts`

Module singleton, matching `src/lib/resend.ts` / `src/lib/r2.ts`.

- `console.warn` once if `STRIPE_SECRET_KEY` is missing ("billing is disabled"), but don't throw — the app must still build and run without Stripe configured
- `export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")` — **don't** pass `apiVersion`; let the SDK pin its own
- `BILLING_INTERVALS = ["monthly", "yearly"] as const` and `BillingInterval` type
- `STRIPE_PRICE_IDS: Record<BillingInterval, string | undefined>` from `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`
- `PRO_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"])` — `past_due` keeps Pro during Stripe's dunning retry window

### `src/lib/usage-limits.test.ts`

See Testing below.

## Files to Modify

| File | Change |
| --- | --- |
| `package.json` | Add `stripe` |
| `.env.example` | Add `ENFORCE_PLAN_LIMITS=""`. Keep the existing `STRIPE_*` entries (`STRIPE_PUBLISHABLE_KEY` is unused by hosted Checkout but kept for future Stripe.js use) |
| `src/types/next-auth.d.ts` | Add `isPro: boolean` to `Session.user`; augment `next-auth/jwt`'s `JWT` with `id?: string` and `isPro?: boolean` (plan §5.1) |
| `src/auth.ts` | Make the `jwt` callback async and always re-read `isPro` from the DB on every call, using `token.id` (falling back to `token.sub`); the `session` callback copies `token.isPro ?? false` onto `session.user.isPro` (plan §5.2). Do **not** add callbacks to `auth.config.ts` — the edge proxy must never hit Prisma |
| `src/lib/db/user.ts` | Add `isPro` and `stripeCustomerId` to `getCurrentUser`'s `select`; expose `isPro: boolean` and `hasBillingAccount: boolean` (`!!stripeCustomerId`) on `CurrentUser` without leaking the raw customer ID |

## Environment Variables

```
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID_MONTHLY=
STRIPE_PRICE_ID_YEARLY=
ENFORCE_PLAN_LIMITS=
```

`STRIPE_WEBHOOK_SECRET` is only needed in Phase 2. Phase 1 works with all of these empty.

## Out of Scope (Phase 2)

- Calling the `usage-limits` asserts from `createItem`, `createCollection`, or `POST /api/upload`
- Webhook route, `src/lib/billing.ts`, Checkout/Portal Server Actions
- Billing card, checkout toast, and any Pro UI in `CreateItemDialog`
- Cancelling the subscription on account deletion
- The optional `React.cache` session dedupe and subscription-detail migration

## Testing

### Unit tests — `src/lib/usage-limits.test.ts`

Mock `@/lib/prisma` (`vi.mock("@/lib/prisma")` + `prismaMock`, `mockReset` in `beforeEach`). Because the flag is read at module load, use `vi.stubEnv("ENFORCE_PLAN_LIMITS", …)` + `vi.resetModules()` + dynamic `import()`, the same way `src/lib/email-verification.test.ts` does, and `vi.unstubAllEnvs()` in `afterEach`.

- `isPlanLimitEnforced`: `"true"` → true; unset, `"false"`, and wrong-case `"TRUE"` → false
- `canUsePro`: flag off → true for free and Pro; flag on → true only for Pro
- `assertCanCreateItem` (flag on, free user): 49 items resolves; 50 rejects with the friendly 50-item message; 51 rejects
- `assertCanCreateCollection` (flag on, free user): 2 resolves; 3 rejects with the friendly 3-collection message
- Pro bypass (flag on, `isPro: true`): both asserts resolve and `prisma.item.count` / `prisma.collection.count` are **not** called
- Flag off: both asserts resolve without querying `isPro` or counts
- User not found (flag on): treated as free, so the count check applies
- `assertCanUseProFeature`: flag on + free rejects with a message containing the feature name; flag on + Pro resolves; flag off resolves

### Verification

- `npm run test`, `npm run lint`, and `npm run build` pass (the build must succeed with `STRIPE_SECRET_KEY` unset)
- Session sync (Playwright or manual, dev DB): sign in as the demo user, flip `isPro` to `true` directly in the dev DB, reload — `auth()` reflects `isPro: true` without signing out; flip it back to `false` afterward
- Creating items/collections still works for the demo user with `ENFORCE_PLAN_LIMITS` unset (no regression)
