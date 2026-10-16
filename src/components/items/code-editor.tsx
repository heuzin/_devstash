"use client";

import { useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorPreferences } from "@/components/settings/editor-preferences-provider";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";
import type { EditorThemeId } from "@/lib/editor-preferences";
import { resolveMonacoLanguage } from "@/lib/monaco-languages";

const MIN_HEIGHT = 100;
const MAX_HEIGHT = 400;

const MONACO_THEME_NAMES: Record<EditorThemeId, string> = {
  "vs-dark": "devstash-dark",
  monokai: "devstash-monokai",
  "github-dark": "devstash-github-dark",
};

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string | null;
  fallbackLanguage: string;
  readOnly?: boolean;
  placeholder?: string;
}

export function CodeEditor({
  value,
  onChange,
  language,
  fallbackLanguage,
  readOnly = false,
  placeholder,
}: CodeEditorProps) {
  const [height, setHeight] = useState(MIN_HEIGHT);
  const { copied, copy } = useCopyToClipboard();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const { preferences } = useEditorPreferences();

  const monacoLanguage = resolveMonacoLanguage(language, fallbackLanguage);
  const languageLabel = language?.trim() || fallbackLanguage;

  function syncHeight(editor: Parameters<OnMount>[0]) {
    const contentHeight = editor.getContentHeight();
    setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, contentHeight)));
  }

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    monaco.editor.defineTheme("devstash-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#18181b",
        "editor.lineHighlightBackground": "#27272a",
        "editorLineNumber.foreground": "#52525b",
        "editorLineNumber.activeForeground": "#a1a1aa",
        "editorGutter.background": "#18181b",
        "scrollbarSlider.background": "#ffffff1f",
        "scrollbarSlider.hoverBackground": "#ffffff33",
        "scrollbarSlider.activeBackground": "#ffffff40",
      },
    });

    monaco.editor.defineTheme("devstash-monokai", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "75715e" },
        { token: "string", foreground: "e6db74" },
        { token: "keyword", foreground: "f92672" },
        { token: "number", foreground: "ae81ff" },
        { token: "type", foreground: "66d9ef", fontStyle: "italic" },
        { token: "function", foreground: "a6e22e" },
      ],
      colors: {
        "editor.background": "#272822",
        "editor.lineHighlightBackground": "#3e3d32",
        "editorLineNumber.foreground": "#90908a",
        "editorLineNumber.activeForeground": "#f8f8f2",
        "editorGutter.background": "#272822",
        "scrollbarSlider.background": "#ffffff1f",
        "scrollbarSlider.hoverBackground": "#ffffff33",
        "scrollbarSlider.activeBackground": "#ffffff40",
      },
    });

    monaco.editor.defineTheme("devstash-github-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "8b949e" },
        { token: "string", foreground: "a5d6ff" },
        { token: "keyword", foreground: "ff7b72" },
        { token: "number", foreground: "79c0ff" },
        { token: "type", foreground: "ffa657" },
        { token: "function", foreground: "d2a8ff" },
      ],
      colors: {
        "editor.background": "#0d1117",
        "editor.lineHighlightBackground": "#161b22",
        "editorLineNumber.foreground": "#6e7681",
        "editorLineNumber.activeForeground": "#c9d1d9",
        "editorGutter.background": "#0d1117",
        "scrollbarSlider.background": "#ffffff1f",
        "scrollbarSlider.hoverBackground": "#ffffff33",
        "scrollbarSlider.activeBackground": "#ffffff40",
      },
    });

    syncHeight(editor);
    editor.onDidContentSizeChange(() => syncHeight(editor));
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#18181b]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-400">{languageLabel}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
            onClick={() => copy(value)}
            aria-label="Copy code"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </Button>
        </div>
      </div>
      <Editor
        height={height}
        language={monacoLanguage}
        value={value}
        onChange={(next) => onChange?.(next ?? "")}
        onMount={handleMount}
        theme={MONACO_THEME_NAMES[preferences.theme]}
        options={{
          readOnly,
          domReadOnly: readOnly,
          automaticLayout: true,
          minimap: { enabled: preferences.minimap },
          scrollBeyondLastLine: false,
          fontSize: preferences.fontSize,
          tabSize: preferences.tabSize,
          wordWrap: preferences.wordWrap ? "on" : "off",
          lineNumbersMinChars: 3,
          folding: false,
          renderLineHighlight: readOnly ? "none" : "line",
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          placeholder,
        }}
      />
    </div>
  );
}
