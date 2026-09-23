# Current Feature

Data-Fetching Cleanup: low-risk quick wins from the code-scanner audit — fix an N+1-style over-fetch in collection summaries, bound two unlimited queries, and add missing indexes. No auth/mutation work (not implemented yet).

## Status

In Progress

## Goals

- Fix N+1 in `queryCollectionSummaries` (`src/lib/db/collections.ts:61-70`, used by `getRecentCollections` and twice by `getSidebarCollections`): it `include`s full `Item` rows (content, url, fileUrl, etc.) just to compute item counts and per-type breakdowns. Fix using Prisma conventions only (no raw SQL) — switch to a `select` scoped to `itemType.{id,icon,color}`, or use Prisma's `groupBy`/`_count` aggregation.
- Add a `take` limit to the unbounded favorites query in `getSidebarCollections` (`src/lib/db/collections.ts:92`) and the unbounded pinned-items query in `getDashboardItems` (`src/lib/db/items.ts:50-54`), matching the `recentLimit` pattern already used elsewhere in those files.
- Add missing indexes in `prisma/schema.prisma` via a proper migration:
  - `Item`: `@@index([userId, createdAt])` — the dashboard's "Recent Items" query sorts by `createdAt`, but the existing index is on `[userId, lastUsedAt]` (added for a "recently used" feature that isn't wired up yet).
  - `Collection`: `@@index([userId, isFavorite])` — matches the `{ userId, isFavorite }` filter used in `getSidebarCollections` and `getCollectionStats`.

## Notes

Source: code-scanner audit findings #1-#3 (2026-09-23). Excluded from this pass: dead `src/lib/mock-data.ts` (leave as-is per instruction), inline dynamic-color styles (item #5, a style/architecture decision, not a quick fix), and the seeded demo password (item #7, auth-related — auth isn't implemented yet).

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
