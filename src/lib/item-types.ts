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

// Types whose content renders in the Monaco-backed CodeEditor instead of a
// plain Textarea, and the language Monaco falls back to when none is set.
export const CODE_EDITOR_FALLBACK_LANGUAGE: Record<string, string> = {
  snippet: "plaintext",
  command: "shell",
};

// Types whose content renders in the MarkdownEditor (Write/Preview tabs)
// instead of a plain Textarea.
export const MARKDOWN_EDITOR_TYPE_NAMES = new Set(["note", "prompt"]);
