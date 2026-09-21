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
