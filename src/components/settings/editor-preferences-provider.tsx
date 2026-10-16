"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { updateEditorPreferences } from "@/actions/editor-preferences";
import type { EditorPreferences } from "@/lib/editor-preferences";

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  updatePreferences: (changes: Partial<EditorPreferences>) => void;
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(null);

export function useEditorPreferences() {
  const context = useContext(EditorPreferencesContext);
  if (!context) {
    throw new Error("useEditorPreferences must be used within an EditorPreferencesProvider");
  }
  return context;
}

export function EditorPreferencesProvider({
  initialPreferences,
  children,
}: {
  initialPreferences: EditorPreferences;
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);

  function updatePreferences(changes: Partial<EditorPreferences>) {
    const previous = preferences;
    const next = { ...previous, ...changes };
    setPreferences(next);

    void updateEditorPreferences(next).then((result) => {
      if (!result.success) {
        setPreferences(previous);
        toast.error(result.error ?? "Failed to save editor preferences");
        return;
      }
      toast.success("Editor preferences saved");
    });
  }

  return (
    <EditorPreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}
