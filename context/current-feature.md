# Current Feature: Email Verification on Register

<!-- Feature name and short description -->

Send a verification email when a user registers via the credentials (email/password) flow. The user clicks a link in that email to verify their account. Unverified users can still sign in but see a banner prompting them to verify, with a resend option.

## Status

In Progress

## Goals

- On successful registration (`POST /api/auth/register`), send a verification email to the new user via Resend
- Email contains a unique link the user clicks to verify their email address
- Clicking the link marks the user's email as verified (`User.emailVerified` already exists in the Prisma schema) and confirms this to the user
- Verification tokens are single-use and expire after 24 hours
- Handle already-verified and expired/invalid token cases gracefully with clear user-facing messages
- Signed-in users with an unverified email see a dismissible banner (e.g. on the dashboard) prompting them to verify, with a "resend verification email" action
- Unverified users are NOT blocked from signing in or using the app

## Notes

<!-- Additional context, constraints, or details from spec -->

- Email provider: [Resend](https://resend.com/docs) — `RESEND_API_KEY` already present in `.env`
- Prisma schema already has `VerificationToken` (identifier, token, expires) and `User.emailVerified` — likely reusable for this flow instead of a new model, but confirm shape fits (NextAuth's `VerificationToken` model is normally used for magic-link/passwordless sign-in, not registration verification — may need adjustment or a dedicated token model)
- GitHub OAuth users already have `emailVerified` implicitly (trusted from provider) — this flow is specifically for the credentials/email-password registration path
- Decisions:
  - Unverified users CAN sign in; dashboard shows a dismissible banner prompting verification (no route gating)
  - Verification token expires after 24 hours
  - Send from Resend's shared test domain (`onboarding@resend.dev`) for now
  - Include a "resend verification email" action (e.g. button in the banner) in this feature

## History

<!-- Keep this updated. Earliest to latest -->

- Initial setup of Next.js (Create Next App scaffold with TypeScript, Tailwind CSS v4, and ESLint)
- Dashboard UI Phase 1: ShadCN UI setup, /dashboard route, dark mode by default, top bar with logo, centered search, New Collection and New Item buttons, and Sidebar/Main placeholders
- Dashboard UI Phase 2: collapsible sidebar with item type links and counts, favorite/recent collections, user avatar area pinned to the bottom, and a mobile drawer via the same toggle icon
- Dashboard UI Phase 3: main dashboard area with stats cards (items, collections, favorite items, favorite collections), recent/pinned collections grid, pinned items, and 10 recent items; also made the sidebar's user settings block position fixed to the bottom-left
- Prisma + Neon PostgreSQL Setup: Prisma 7 schema (User/Account/Session/VerificationToken for NextAuth, Item, ItemType, Collection, ItemCollection, Tag) with the new `prisma-client` generator and `prisma.config.ts`, `@prisma/adapter-pg` driver adapter, initial migration applied and seeded against the Neon dev branch, plus `scripts/test-db.ts` for a quick connectivity check
- Seed Data: rewrote prisma/seed.ts to seed the demo user (demo@devstash.io, bcryptjs-hashed password at 12 rounds), 7 system item types, and 5 collections with 18 items (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources); made idempotent via delete-then-recreate of the demo user's data, and updated scripts/test-db.ts to fetch and display the seeded demo data
- Dashboard Collections: replaced dummy collection data in the dashboard's main area with real data from Neon via Prisma; added `src/lib/db/collections.ts` (`getRecentCollections`) computing item count and dominant-type accent color per collection, updated `CollectionsGrid` to take collections as a prop, and made the dashboard page fetch collections server-side
- Dashboard Items: replaced dummy pinned/recent item data with real data from Neon via Prisma; added `src/lib/db/user.ts` (`getCurrentUserId`, shared with collections), `src/lib/db/items.ts` (`getDashboardItems`, `getItemStats`), and `getCollectionStats` in collections.ts; updated `ItemList` to use real item summaries and made `StatsCards` an async server component pulling real item/collection counts
- Stats & Sidebar: replaced the mock-data-driven sidebar with real database data — added `getCurrentUser` to `src/lib/db/user.ts`, `getItemTypesWithCounts` to `src/lib/db/items.ts`, and `getSidebarCollections` to `src/lib/db/collections.ts` (favorites and recents split out, since the existing `getRecentCollections` mixed both under one limit); `Sidebar` is now a presentational component fed by these, linking item types to `/items/[slug]` and collections to `/collections/[id]`, with a "View all collections" link and a dominant-type colored dot on recent collections; extracted the interactive header/toggle/Sheet chrome into a new `DashboardChrome` client component so `dashboard/layout.tsx` could become an async server component that fetches sidebar data once; favorites section is hidden entirely when there are no favorite collections
- Add Pro Badge to Sidebar: added a `PRO_ITEM_TYPE_SLUGS` set (`files`, `images`) in `src/components/dashboard/sidebar.tsx` and rendered a subtle outline-variant ShadCN `Badge` with uppercase "PRO" text next to those two item type entries in the sidebar's Types list
- Data-Fetching Cleanup: fixed the N+1-style over-fetch in `queryCollectionSummaries` (`src/lib/db/collections.ts`) by switching its `include` of full `Item` rows to a `select` scoped to `itemType.{id,icon,color}`; added `take` limits to the previously unbounded favorites query in `getSidebarCollections` and pinned-items query in `getDashboardItems`; added `Item.@@index([userId, createdAt])` and `Collection.@@index([userId, isFavorite])` via migration `20260923211358_add_item_created_at_and_collection_favorite_indexes`
- Auth Setup - NextAuth + GitHub Provider: installed `next-auth@beta` and `@auth/prisma-adapter`; added the split edge-compatible config pattern (`src/auth.config.ts` for providers, `src/auth.ts` for the Prisma adapter + JWT session strategy, reusing the existing `src/lib/prisma.ts` singleton), the NextAuth route handler at `src/app/api/auth/[...nextauth]/route.ts`, `src/proxy.ts` protecting `/dashboard/:path*` with a redirect to NextAuth's default sign-in page (`/api/auth/signin?callbackUrl=...`), and `src/types/next-auth.d.ts` extending `Session.user` with `id`; verified end-to-end with Playwright (redirect on unauthenticated `/dashboard` access, GitHub OAuth authorize redirect)
- Auth Credentials - Email/Password Provider: added a Credentials provider for email/password authentication alongside the existing GitHub OAuth provider, following the split config pattern (`auth.config.ts` gets an edge-safe `authorize: () => null` placeholder; `auth.ts` overrides it with real bcrypt validation against Prisma, filtering the placeholder out of `authConfig.providers` and normalizing email casing); added `POST /api/auth/register` validated with zod (name, email, password, confirmPassword), checking for existing users, hashing passwords with bcryptjs at 12 rounds, and handling the duplicate-email race with a `P2002` catch; verified end-to-end with curl (registration success/duplicate/validation errors, credentials sign-in with mixed-case email, session, `/dashboard` redirect, and GitHub OAuth authorize redirect still working); `User.password` already existed in the schema so no migration was needed
- Auth UI - Sign In, Register & Sign Out: replaced NextAuth's default sign-in page with a custom `/sign-in` page (email/password + GitHub button, zod-validated, error display) and a custom `/register` page (name/email/password/confirm, redirects to sign-in on success via Sonner toast); added a reusable `UserAvatar` component (GitHub image or name-initials fallback) and a sidebar `UserMenu` dropdown (Profile/Sign out) backed by the real session through `getCurrentUser`/`getCurrentUserId`; added shadcn `dropdown-menu`, `label`, and `sonner` components, an inline `GithubIcon` (lucide-react v1 dropped brand icons), and shared `signInSchema`/`registerSchema` validations reused by both the client forms and the register API route; `proxy.ts` now points unauthenticated redirects at `/sign-in` and also protects `/profile`; verified end-to-end with Playwright (custom sign-in/register UI, credentials and GitHub flows, avatar/dropdown, sign-out, password-mismatch validation) and cleaned up the test account from the Neon dev branch afterward
