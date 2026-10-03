# Item CRUD Architecture (Design Doc)

**Status:** Nothing described here exists yet. `src/actions/items.ts`,
`src/app/items/[type]/`, and any item create/edit UI are all unbuilt — this doc proposes
a structure that follows the conventions already established by the auth and profile
features (`src/actions/profile.ts`, `src/actions/auth.ts`, `src/lib/db/collections.ts`,
`src/lib/db/items.ts`) and the rules in `context/coding-standards.md` /
`context/ai-interaction.md`.

Two source files named in the research prompt don't exist under those paths:
`docs/content-types.md` (the actual output of the prior item-types research is
[`docs/item-types.md`](item-types.md) — referenced below instead) and
`src/lib/constants.tsx` (the real icon lookup lives in
[`src/lib/item-type-icons.tsx`](../src/lib/item-type-icons.tsx)).

## Core Principle

One `Item` model serves all 7 types (`prisma/schema.prisma`). The 7 types differ only in
*which fields they populate* and *which `ContentType` they use* (`TEXT | URL | FILE` — see
`docs/item-types.md`). So the CRUD layer should be **type-agnostic**: one set of mutations,
one set of queries, one dynamic route — all operating on the generic `Item` shape. Anything
that needs to know "this is a snippet vs. a link vs. an image" is a **presentation**
concern and belongs in components, not in actions or `lib/db`.

## File Structure

```
src/
├── actions/
│   └── items.ts                  # createItem, updateItem, deleteItem, toggleFavorite, togglePinned
├── lib/
│   ├── db/
│   │   └── items.ts               # existing + getItemsByType, getItemById (extended)
│   ├── validations/
│   │   └── item.ts                # itemSchema (zod), keyed off contentType
│   └── item-type-icons.tsx        # existing — icon name → LucideIcon map
├── types/
│   └── item.ts                    # ItemFormValues, discriminated-union input types
├── app/
│   └── items/
│       └── [type]/
│           └── page.tsx           # one dynamic route for all 7 type list pages
└── components/
    └── items/
        ├── item-drawer.tsx         # shared shell: create/edit drawer, wraps ItemForm
        ├── item-form.tsx           # picks the right fields by contentType
        ├── item-fields-text.tsx    # Snippet/Prompt/Command/Note: content + language
        ├── item-fields-url.tsx     # Link: url + description
        ├── item-fields-file.tsx    # File/Image: upload widget
        └── item-card.tsx           # read-only row/card, reused by item-list.tsx
```

This matches `context/coding-standards.md`'s file-org rules directly: Server Actions in
`src/actions/[feature].ts`, queries in `src/lib/[utility].ts`/`src/lib/db/`, types in
`src/types/[feature].ts`, components in `src/components/[feature]/ComponentName.tsx`.

## Mutations: `src/actions/items.ts`

One file, following the exact pattern already used by `src/actions/profile.ts` and
`src/actions/auth.ts`:

- `"use server"` at the top of the file.
- Each action: zod-validate input first (`safeParse`), then `auth()` for the session,
  then an ownership check, then the Prisma call, wrapped in try/catch, returning
  `{ success, data?, error? }` (per `context/coding-standards.md`'s Error Handling rules).
- **No branching on item type.** `createItem`/`updateItem` take the full set of optional
  `Item` columns (`content`, `language`, `url`, `fileUrl`, `fileName`, `fileSize`) plus
  `itemTypeId`, and just write whatever the validated payload contains — the zod schema
  (below) is what enforces "a Link needs `url`," not the action body.

Proposed signatures:

```ts
"use server";

export async function createItem(input: ItemFormValues): Promise<ActionResult<{ id: string }>>;
export async function updateItem(itemId: string, input: ItemFormValues): Promise<ActionResult>;
export async function deleteItem(itemId: string): Promise<ActionResult>;
export async function toggleItemFavorite(itemId: string): Promise<ActionResult>;
export async function toggleItemPinned(itemId: string): Promise<ActionResult>;
```

Ownership check pattern (mirrors `changePassword`'s session check in `profile.ts`, extended
with a row-level check since items — unlike the user's own password — are a separate row):

```ts
const session = await auth();
if (!session?.user?.id) return { success: false, error: "You must be signed in to do this" };

const item = await prisma.item.findUnique({ where: { id: itemId }, select: { userId: true } });
if (!item || item.userId !== session.user.id) {
  return { success: false, error: "Item not found" };
}
```

Plan-limit checks (free-tier item/collection caps, File/Image Pro gating) go in
`createItem` only, via the existing `canUsePro()` helper described in
`context/project-overview.md`'s Monetization section — not duplicated per type.

## Queries: `src/lib/db/items.ts` (extended)

The file already exists with `getDashboardItems`, `getItemStats`, `getItemTypesWithCounts`
(all following the `getCurrentUserId()`-guarded, plain-`async function` pattern — no
`"use server"`, since these are called directly from server components per
`context/coding-standards.md`'s Data Fetching rule: "Server components fetch directly with
Prisma"). Two additions needed for the `/items/[type]` route:

```ts
export async function getItemsByTypeSlug(slug: string): Promise<ItemSummary[]>
export async function getItemById(id: string): Promise<ItemDetail | null>
```

`getItemsByTypeSlug` resolves `slug` → `ItemType` (`where: { slug, isSystem: true }` for
now, since custom types don't exist yet) then queries `Item.findMany({ where: { userId,
itemTypeId } })` — same shape as `queryCollectionSummaries` in `src/lib/db/collections.ts`,
which already has the "resolve a thing, then filter items by it" structure.

`getItemById` returns the *full* item (all nullable content/url/file columns), unlike
`ItemSummary` which only carries display fields — the drawer's edit form needs the raw
values.

## Routing: `/items/[type]`

One dynamic route (`src/app/items/[type]/page.tsx`, a server component) handles all 7 type
list pages (`/items/snippets`, `/items/prompts`, etc. — slugs already defined in
`SYSTEM_ITEM_TYPES`/seeded `ItemType.slug`):

1. Read `params.type` (the slug).
2. Look up the matching `ItemType` (404 via Next's `notFound()` if the slug doesn't match
   any system type).
3. If the resolved type is Pro-only (`files`/`images` — same `PRO_ITEM_TYPE_SLUGS` set
   currently duplicated in `src/components/dashboard/sidebar.tsx`, which should move to a
   shared constant, e.g. `src/lib/item-type-icons.tsx` or a new `src/lib/item-types.ts`,
   once this route exists) and `!canUsePro(user)`, show an upgrade prompt instead of the list.
4. Call `getItemsByTypeSlug(slug)` and render the list with the *same* `ItemCard`/`ItemList`
   components the dashboard already uses — no per-type page variants.

No `[type]/create` or `[type]/[id]` sub-routes: per `context/project-overview.md`'s UI/UX
section, items "open and are created in a **drawer**," so create/edit/view all happen via
the `ItemDrawer` client component layered over whichever page is active (dashboard,
`/items/[type]`, or `/collections/[id]`), not via navigation to a new route.

## Where Type-Specific Logic Lives

Strictly in components — never in actions or `lib/db`:

| Concern | Lives in | Keyed on |
|---|---|---|
| Which input fields to show (code editor vs. URL input vs. file picker) | `item-fields-text.tsx` / `-url.tsx` / `-file.tsx`, dispatched by `item-form.tsx` | `contentType` (`TEXT`/`URL`/`FILE`) — **not** the specific type name, since all 4 TEXT types share one form |
| Syntax highlighting language picker | `item-fields-text.tsx` | `contentType === "TEXT"`; only relevant for Snippet (and optionally Command) |
| Icon + accent color | `ITEM_TYPE_ICONS` map + `itemType.color`, read by `item-card.tsx` | `itemType.icon` / `itemType.name`, passed down as data — already the pattern in `item-list.tsx` and `collections-grid.tsx` |
| Pro-only upsell UI | `item-fields-file.tsx` / the `/items/[type]` page | `itemType.slug` via `PRO_ITEM_TYPE_SLUGS` |
| Markdown rendering vs. plain link preview | `item-card.tsx` detail view | `contentType` |

This is the same "adapt by data, not by a type switch per feature" shape already visible
in `collections-grid.tsx` (dominant-type accent color computed from `itemType.color` without
any item-type-specific component branching) and `sidebar.tsx` (one list of item types
rendered identically, with a `Badge` conditionally added by slug).

## Component Responsibilities

- **`ItemDrawer`** (client) — shadcn `Sheet`/`Drawer` shell. Owns open/closed state and
  create-vs-edit mode. Calls `createItem`/`updateItem` on submit, shows toasts
  (`context/coding-standards.md`: "Display user-friendly error messages via toast"), and
  does not know anything about individual item types itself.
- **`ItemForm`** (client) — given an `itemTypeId`/`contentType`, renders the matching
  `ItemFields*` subcomponent plus the shared fields every type has (title, description,
  tags, collections). Validates client-side with the same `itemSchema` used server-side,
  mirroring `sign-in-form.tsx`'s / `reset-password` form's existing zod-on-both-sides pattern.
- **`ItemFieldsText` / `ItemFieldsUrl` / `ItemFieldsFile`** (client) — pure field groups,
  no data fetching, no mutation calls. `ItemFieldsFile` is the only one needing an upload
  step (presigned URL from `/api/upload`, per the File Upload Flow sequence diagram in
  `context/project-overview.md` — this is why uploads go through an API route rather than
  a Server Action, per `context/coding-standards.md`'s "File uploads with progress tracking"
  exception).
- **`ItemCard`** (server or client, no mutations) — read-only rendering, reused by the
  dashboard's pinned/recent lists, `/items/[type]`, and `/collections/[id]`. Replaces/wraps
  the rendering currently inlined in `item-list.tsx`.

## Validation: `src/lib/validations/item.ts`

A single zod schema discriminated on `contentType`, following the existing
`src/lib/validations/auth.ts` convention of exporting schemas reused by both the client
form and the server action:

```ts
const baseItemFields = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  itemTypeId: z.string(),
  tagIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
});

export const itemSchema = z.discriminatedUnion("contentType", [
  baseItemFields.extend({ contentType: z.literal("TEXT"), content: z.string().min(1), language: z.string().optional() }),
  baseItemFields.extend({ contentType: z.literal("URL"), url: z.string().url(), content: z.undefined().optional() }),
  baseItemFields.extend({ contentType: z.literal("FILE"), fileUrl: z.string().url(), fileName: z.string(), fileSize: z.number().int().positive() }),
]);
```

This is what actually enforces "a Link needs a `url`, a Snippet needs `content`" — the
single schema change point that keeps `createItem`/`updateItem` generic.

## Summary

| Layer | Shared across all 7 types? | Type-aware part |
|---|---|---|
| `src/actions/items.ts` | Yes — one file, no per-type branching | Plan-limit check for Pro-only types |
| `src/lib/db/items.ts` | Yes — generic `Item` queries | Slug → `ItemType` lookup |
| `src/app/items/[type]/page.tsx` | Yes — one route | Resolves `type` param to filter + gate |
| `src/components/items/*` | Partially — `ItemDrawer`/`ItemForm` shell is shared | `ItemFields*` dispatch on `contentType`, icon/color dispatch on `itemType` |
| `src/lib/validations/item.ts` | One schema file | Discriminated union keyed on `contentType` |
