# Current Feature

<!-- Feature name and short description -->

## Status

<!-- Not Started | In Progress | Completed -->

## Goals

<!-- Goals and requirements -->

## Notes

<!-- Any extra notes -->

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
