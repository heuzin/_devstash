// Item types selectable in the create-item dialog. File/image are excluded
// since they require the (not yet built) R2 upload flow.
export const CREATABLE_ITEM_TYPE_NAMES = new Set(["snippet", "prompt", "command", "note", "link"]);

export const CONTENT_TYPE_NAMES = new Set(["snippet", "prompt", "command", "note"]);
export const LANGUAGE_TYPE_NAMES = new Set(["snippet", "command"]);
export const URL_TYPE_NAMES = new Set(["link"]);

// Types whose content renders in the Monaco-backed CodeEditor instead of a
// plain Textarea, and the language Monaco falls back to when none is set.
export const CODE_EDITOR_FALLBACK_LANGUAGE: Record<string, string> = {
  snippet: "plaintext",
  command: "shell",
};

// Types whose content renders in the MarkdownEditor (Write/Preview tabs)
// instead of a plain Textarea.
export const MARKDOWN_EDITOR_TYPE_NAMES = new Set(["note", "prompt"]);
