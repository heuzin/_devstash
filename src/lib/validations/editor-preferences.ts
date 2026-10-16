import { z } from "zod";
import {
  EDITOR_FONT_SIZE_OPTIONS,
  EDITOR_TAB_SIZE_OPTIONS,
  EDITOR_THEME_OPTIONS,
} from "@/lib/editor-preferences";

export const editorPreferencesSchema = z.object({
  fontSize: z
    .number()
    .refine((value) => (EDITOR_FONT_SIZE_OPTIONS as readonly number[]).includes(value), {
      message: "Invalid font size",
    }),
  tabSize: z
    .number()
    .refine((value) => (EDITOR_TAB_SIZE_OPTIONS as readonly number[]).includes(value), {
      message: "Invalid tab size",
    }),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEME_OPTIONS),
});

export type EditorPreferencesInput = z.infer<typeof editorPreferencesSchema>;
