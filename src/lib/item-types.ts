// Item types selectable in the create-item dialog. File/image are excluded
// since they require the (not yet built) R2 upload flow.
export const CREATABLE_ITEM_TYPE_NAMES = new Set(["snippet", "prompt", "command", "note", "link"]);

export const CONTENT_TYPE_NAMES = new Set(["snippet", "prompt", "command", "note"]);
export const LANGUAGE_TYPE_NAMES = new Set(["snippet", "command"]);
export const URL_TYPE_NAMES = new Set(["link"]);
