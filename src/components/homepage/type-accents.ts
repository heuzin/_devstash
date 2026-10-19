// Sets `--type-accent` so children can use `bg-(--type-accent)`, `text-(--type-accent)`, etc.
// Colors live in `globals.css` as `--color-type-*` and match the seeded system item types.
export const TYPE_ACCENTS = {
  snippet: "[--type-accent:var(--color-type-snippet)]",
  prompt: "[--type-accent:var(--color-type-prompt)]",
  command: "[--type-accent:var(--color-type-command)]",
  note: "[--type-accent:var(--color-type-note)]",
  file: "[--type-accent:var(--color-type-file)]",
  image: "[--type-accent:var(--color-type-image)]",
  link: "[--type-accent:var(--color-type-link)]",
} as const;

export type TypeAccent = keyof typeof TYPE_ACCENTS;

export const TYPE_ACCENT_ORDER: TypeAccent[] = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];
