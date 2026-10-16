export const EDITOR_FONT_SIZE_OPTIONS = [12, 13, 14, 16, 18, 20] as const;
export const EDITOR_TAB_SIZE_OPTIONS = [2, 4, 8] as const;
export const EDITOR_THEME_OPTIONS = ["vs-dark", "monokai", "github-dark"] as const;

export const EDITOR_THEME_LABELS: Record<EditorThemeId, string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

export type EditorThemeId = (typeof EDITOR_THEME_OPTIONS)[number];

export interface EditorPreferences {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  theme: EditorThemeId;
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};
