// Item types selectable in the create-item dialog.
export const CREATABLE_ITEM_TYPE_NAMES = new Set([
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
  "file",
  "image",
]);

export const CONTENT_TYPE_NAMES = new Set(["snippet", "prompt", "command", "note"]);
export const LANGUAGE_TYPE_NAMES = new Set(["snippet", "command"]);
export const URL_TYPE_NAMES = new Set(["link"]);

// Types backed by an R2-uploaded file, and which upload constraints (size,
// extensions, mime types) apply to each.
export const UPLOAD_TYPE_NAMES = new Set(["file", "image"]);

// Slugs of the type list pages that require Pro.
export const PRO_ITEM_TYPE_SLUGS = new Set(["files", "images"]);

// Types whose content renders in the Monaco-backed CodeEditor instead of a
// plain Textarea, and the language Monaco falls back to when none is set.
export const CODE_EDITOR_FALLBACK_LANGUAGE: Record<string, string> = {
  snippet: "plaintext",
  command: "shell",
};

// Types whose content renders in the MarkdownEditor (Write/Preview tabs)
// instead of a plain Textarea.
export const MARKDOWN_EDITOR_TYPE_NAMES = new Set(["note", "prompt"]);

// The type whose items render as an ImageThumbnailCard instead of ItemCard.
export const IMAGE_TYPE_NAME = "image";

// The type whose items render as a single-column FileList instead of ItemGrid.
export const FILE_TYPE_NAME = "file";
