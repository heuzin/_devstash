"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEditorPreferences } from "@/components/settings/editor-preferences-provider";
import {
  EDITOR_FONT_SIZE_OPTIONS,
  EDITOR_TAB_SIZE_OPTIONS,
  EDITOR_THEME_LABELS,
  EDITOR_THEME_OPTIONS,
} from "@/lib/editor-preferences";

export function EditorPreferencesForm() {
  const { preferences, updatePreferences } = useEditorPreferences();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-font-size">Font size</Label>
        <Select
          value={String(preferences.fontSize)}
          onValueChange={(value) => updatePreferences({ fontSize: Number(value) })}
        >
          <SelectTrigger id="editor-font-size" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDITOR_FONT_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-tab-size">Tab size</Label>
        <Select
          value={String(preferences.tabSize)}
          onValueChange={(value) => updatePreferences({ tabSize: Number(value) })}
        >
          <SelectTrigger id="editor-tab-size" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDITOR_TAB_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} spaces
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-theme">Theme</Label>
        <Select
          value={preferences.theme}
          onValueChange={(value) =>
            updatePreferences({ theme: value as (typeof EDITOR_THEME_OPTIONS)[number] })
          }
        >
          <SelectTrigger id="editor-theme" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDITOR_THEME_OPTIONS.map((theme) => (
              <SelectItem key={theme} value={theme}>
                {EDITOR_THEME_LABELS[theme]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-word-wrap">Word wrap</Label>
        <Switch
          id="editor-word-wrap"
          checked={preferences.wordWrap}
          onCheckedChange={(checked) => updatePreferences({ wordWrap: checked })}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-minimap">Minimap</Label>
        <Switch
          id="editor-minimap"
          checked={preferences.minimap}
          onCheckedChange={(checked) => updatePreferences({ minimap: checked })}
        />
      </div>
    </div>
  );
}
