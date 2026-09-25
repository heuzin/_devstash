# DevStash

A developer knowledge hub fo snippets, commands, prompts, notes, files, images, links, and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Neon MCP

When using the Neon MCP tools (listing branches, running SQL, migrations, etc.):

- **Project:** always target the `devstash-dev` Neon project.
- **Branch:** always target the **development** branch by default.
- **Production is off-limits by default.** Never read from, write to, run SQL against, or run migrations on the production branch unless I explicitly say "production" (or name that branch directly) in the same request.
- If you're unsure which project or branch a Neon MCP call would hit, ask before running it rather than guessing.

## Commands

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint with ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next`)
