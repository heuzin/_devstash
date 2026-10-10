"use client";

import { useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveMonacoLanguage } from "@/lib/monaco-languages";

const MIN_HEIGHT = 100;
const MAX_HEIGHT = 400;

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
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

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
    monaco.editor.setTheme("devstash-dark");

    syncHeight(editor);
    editor.onDidContentSizeChange(() => syncHeight(editor));
  };

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

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
            onClick={handleCopy}
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
        theme="vs-dark"
        options={{
          readOnly,
          domReadOnly: readOnly,
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
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
