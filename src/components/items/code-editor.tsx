"use client";

import { useRef, useState, useTransition } from "react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { explainCode } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExplainCodeButton } from "@/components/items/explain-code-button";
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
  explain?: CodeEditorExplainOptions;
}

interface CodeEditorExplainOptions {
  itemTypeName: string;
  title: string;
  canUseProFeatures: boolean;
}

type CodeEditorView = "code" | "explain";

export function CodeEditor({
  value,
  onChange,
  language,
  fallbackLanguage,
  readOnly = false,
  placeholder,
  explain,
}: CodeEditorProps) {
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [view, setView] = useState<CodeEditorView>("code");
  const [isExplaining, startExplaining] = useTransition();
  const { copied, copy } = useCopyToClipboard();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const { preferences } = useEditorPreferences();

  const monacoLanguage = resolveMonacoLanguage(language, fallbackLanguage);
  const languageLabel = language?.trim() || fallbackLanguage;
  const showExplanation = view === "explain" && explanation !== null;

  function handleExplain() {
    if (!explain) return;
    startExplaining(async () => {
      const result = await explainCode({
        itemTypeName: explain.itemTypeName,
        title: explain.title,
        content: value,
        language,
      });
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Couldn't explain this code");
        return;
      }
      setExplanation(result.data);
      setView("explain");
    });
  }

  function syncHeight(editor: Parameters<OnMount>[0]) {
    const contentHeight = editor.getContentHeight();
    setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, contentHeight)));
  }

  const handleBeforeMount: BeforeMount = (monaco) => {
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
  };

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    syncHeight(editor);
    editor.onDidContentSizeChange(() => syncHeight(editor));
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#18181b]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          {explanation !== null && (
            <Tabs value={view} onValueChange={(next) => next && setView(next as CodeEditorView)}>
              <TabsList variant="line" className="h-6 gap-1 bg-transparent p-0">
                <TabsTrigger value="code" className="h-6 px-2 text-xs text-zinc-400 data-active:text-zinc-100">
                  Code
                </TabsTrigger>
                <TabsTrigger value="explain" className="h-6 px-2 text-xs text-zinc-400 data-active:text-zinc-100">
                  Explain
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-400">{languageLabel}</span>
          {explain && (
            <ExplainCodeButton
              canUseProFeatures={explain.canUseProFeatures}
              isPending={isExplaining}
              onExplain={handleExplain}
            />
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
            onClick={() => copy(showExplanation ? explanation : value)}
            aria-label={showExplanation ? "Copy explanation" : "Copy code"}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </Button>
        </div>
      </div>
      {showExplanation && (
        <div
          className="markdown-preview overflow-y-auto px-3 py-2.5"
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
        </div>
      )}
      <div className={showExplanation ? "hidden" : undefined}>
        <Editor
          height={height}
          language={monacoLanguage}
          value={value}
          onChange={(next) => onChange?.(next ?? "")}
          beforeMount={handleBeforeMount}
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
    </div>
  );
}
