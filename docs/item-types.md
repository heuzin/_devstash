# Item Types

DevStash ships 7 **system** item types. They're seeded into the `ItemType` table
(`isSystem: true`, `userId: null`) by `prisma/seed.ts` and cannot be edited or deleted
by users. Custom user-defined types are a planned Pro feature, not yet implemented.

## Reference Table

| Type    | Name (`ItemType.name`) | Slug (`ItemType.slug`) | Icon (Lucide)        | Color      | Content Type | Plan |
| ------- | ----------------------- | ----------------------- | --------------------- | ---------- | ------------- | ---- |
| Snippet | `snippet`                | `snippets`               | `Code`                 | `#3b82f6`  | `TEXT`        | Free |
| Prompt  | `prompt`                 | `prompts`                | `Sparkles`             | `#8b5cf6`  | `TEXT`        | Free |
| Command | `command`                | `commands`               | `Terminal`             | `#f97316`  | `TEXT`        | Free |
| Note    | `note`                   | `notes`                  | `StickyNote`           | `#fde047`  | `TEXT`        | Free |
| File    | `file`                   | `files`                  | `File`                 | `#6b7280`  | `FILE`        | Pro  |
| Image   | `image`                  | `images`                 | `Image`                | `#ec4899`  | `FILE`        | Pro  |
| Link    | `link`                   | `links`                  | `Link`                 | `#10b981`  | `URL`         | Free |

Row order above matches `SYSTEM_TYPE_ORDER` in [`src/lib/db/items.ts`](../src/lib/db/items.ts),
which is the canonical display order (sidebar, type lists) since `ItemType` has no
timestamp column to sort by.

Icon names are Lucide component names as strings (stored in `ItemType.icon`), resolved
at render time via the `ITEM_TYPE_ICONS` lookup map in
[`src/lib/item-type-icons.tsx`](../src/lib/item-type-icons.tsx):

```tsx
export const ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File: FileIcon,
  Image: ImageIcon,
  Link: LinkIcon,
};
```

(`File` and `Image` are aliased to `FileIcon`/`ImageIcon` since Lucide's plain `File`/`Image`
exports collide with DOM globals.)

Free vs. Pro gating for the two file-backed types is enforced today only in the sidebar's
`PRO_ITEM_TYPE_SLUGS` display badge (`src/components/dashboard/sidebar.tsx`), not yet via
`canUsePro()` limit checks on item creation — see `ENFORCE_PLAN_LIMITS` in
[`context/project-overview.md`](../context/project-overview.md).

## Per-Type Purpose & Key Fields

All types share the base `Item` columns (`title`, `description`, `isFavorite`, `isPinned`,
`lastUsedAt`, `tags`, `collections`, `userId`, `itemTypeId`, `createdAt`/`updatedAt`). The
columns below are the ones each type actually populates.

### Snippet
- **Purpose:** reusable blocks of code (hooks, utilities, config, boilerplate).
- **Key fields:** `content` (the code), `language` (drives syntax highlighting).
- **Example from seed data:** "useDebounce Hook" — `language: "typescript"`.

### Prompt
- **Purpose:** reusable AI prompts/templates, often with `{{placeholder}}` slots.
- **Key fields:** `content` only. `language` is left unset (prompts are plain Markdown/text,
  not source code).
- **Example from seed data:** "Code Review Prompt".

### Command
- **Purpose:** one-liner or short shell/terminal commands worth remembering.
- **Key fields:** `content` (the command string). `language` is left unset in seed data,
  though nothing in the schema prevents setting it (e.g. `bash`) for highlighting.
- **Example from seed data:** "Undo Last Git Commit" → `git reset --soft HEAD~1`.

### Note
- **Purpose:** free-form Markdown notes (no seed data exists yet for this type, but it
  follows the same shape as Snippet/Prompt/Command).
- **Key fields:** `content`.

### Link
- **Purpose:** a bookmarked URL with an optional description.
- **Key fields:** `url` (required for this type), `description` (shown as the link's
  summary). `content`/`language` are unused.
- **`contentType`:** `URL` — the only type that sets this value, both in the seed script
  (`contentType: typeName === "link" ? "URL" : "TEXT"`) and conceptually per the schema.

### File
- **Purpose:** arbitrary uploaded files, stored in Cloudflare R2. Pro-only.
- **Key fields:** `fileUrl`, `fileName`, `fileSize` (bytes). `content`/`url` are unused.
- **Status:** no seed data or upload flow implemented yet — `/api/upload` and the R2
  integration are still on the roadmap per `context/project-overview.md`.

### Image
- **Purpose:** uploaded images (screenshots, diagrams, assets), stored in Cloudflare R2.
  Pro-only.
- **Key fields:** same as File (`fileUrl`, `fileName`, `fileSize`).
- **Status:** same as File — not yet implemented.

## Classification: TEXT vs. URL vs. FILE

`Item.contentType` (`ContentType` enum: `TEXT | URL | FILE`) is the structural
classification that determines which fields are meaningful for a given item,
independent of its specific `ItemType`:

| `contentType` | Item types using it    | Fields that matter          | Editor/display                                  |
| -------------- | ----------------------- | ---------------------------- | ------------------------------------------------- |
| `TEXT`         | Snippet, Prompt, Command, Note | `content`, `language`   | Markdown editor; syntax highlighting when `language` is set (per `context/project-overview.md`) |
| `URL`          | Link                     | `url`, `description`         | URL input + optional description field            |
| `FILE`         | File, Image              | `fileUrl`, `fileName`, `fileSize` | File upload UI → R2; image types get a preview/thumbnail |

**Note on current implementation vs. spec:** the schema's `ContentType` default is `TEXT`,
and the seed script only ever sets `URL` (for links) or `TEXT` (everything else) — it never
produces `FILE` rows, since File/Image items aren't created anywhere yet. The project overview
flags this as a deliberate change from the original notes, which only listed `text | file` for
this field before `URL` was split out as its own case.

## Shared Properties (all types)

- **Ownership & auth:** every `Item` belongs to exactly one `User` (`userId`, cascade delete).
- **Organization:** optional `tags` (many-to-many, scoped per user) and `collections`
  (many-to-many via `ItemCollection`, with `addedAt`).
- **UI state:** `isFavorite`, `isPinned` (pinned items sort first:
  `orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }]`), `lastUsedAt` (powers "Recently used").
- **Display identity:** every type contributes its `icon` + `color` from `ItemType`, used
  consistently as:
  - a colored icon swatch (`backgroundColor: ${color}1a`, icon tinted with `color`) in lists
    like `ItemList` (`src/components/dashboard/item-list.tsx`)
  - a left border accent (`border-l-4`, `borderLeftColor: color`) on item rows
  - the dominant-type accent color on collection cards (`src/lib/db/collections.ts`)

## Display Differences (current implementation)

As of this research, the actual rendered UI (`ItemList`) does **not** yet branch on
`contentType` — it renders every item the same way (icon swatch, title, optional
description/tags, date), regardless of whether it's a snippet, link, or file. The
type-specific editors/viewers described in `context/project-overview.md`
(Markdown editor for `TEXT`, URL+description field for `URL`, upload UI for `FILE`) and the
per-type item list pages (`/items/[type]`) are planned but not yet built — there's no item
creation/detail drawer or `/items/[type]` route in the codebase yet. Only the dashboard's
pinned/recent lists and the sidebar's type counts are implemented so far.
