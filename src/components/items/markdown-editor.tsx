"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { optimizePrompt } from "@/actions/ai";
import { AiHeaderButton } from "@/components/items/ai-header-button";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OptimizedPrompt } from "@/lib/ai-prompt-optimizer";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";

const MIN_HEIGHT = 100;
const MAX_HEIGHT = 400;

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  optimize?: MarkdownEditorOptimizeOptions;
}

interface MarkdownEditorOptimizeOptions {
  title: string;
  canUseProFeatures: boolean;
  onAccept: (content: string) => Promise<boolean>;
}

type OptimizeView = "original" | "optimized";

export function MarkdownEditor({ value, onChange, readOnly = false, placeholder, optimize }: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [suggestion, setSuggestion] = useState<OptimizedPrompt | null>(null);
  const [optimizeView, setOptimizeView] = useState<OptimizeView>("original");
  const [isOptimizing, startOptimizing] = useTransition();
  const [isAccepting, startAccepting] = useTransition();
  const { copied, copy } = useCopyToClipboard();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showOptimized = optimizeView === "optimized" && suggestion !== null;
  const displayedValue = showOptimized ? suggestion.optimized : value;

  function handleOptimize() {
    if (!optimize) return;
    startOptimizing(async () => {
      const result = await optimizePrompt({ itemTypeName: "prompt", title: optimize.title, content: value });
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Couldn't optimize this prompt");
        return;
      }
      if (!result.data.changed) {
        toast.success("This prompt already looks good. No changes suggested.");
        return;
      }
      setSuggestion(result.data);
      setOptimizeView("optimized");
    });
  }

  function handleDiscard() {
    setSuggestion(null);
    setOptimizeView("original");
  }

  function handleAccept() {
    if (!optimize || !suggestion) return;
    startAccepting(async () => {
      const saved = await optimize.onAccept(suggestion.optimized);
      if (saved) handleDiscard();
    });
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (!el || tab !== "write") return;
    el.style.height = "auto";
    el.style.height = `${Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, el.scrollHeight))}px`;
  }, [value, tab]);

  const copyButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
      onClick={() => copy(displayedValue)}
      aria-label={showOptimized ? "Copy optimized prompt" : "Copy markdown"}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );

  const preview = (
    <div
      className="markdown-preview overflow-y-auto px-3 py-2.5"
      style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
    >
      {displayedValue.trim() ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedValue}</ReactMarkdown>
      ) : (
        <p className="text-xs text-zinc-500">Nothing to preview</p>
      )}
    </div>
  );

  if (readOnly) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-[#1e1e1e]">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#2d2d2d] px-3 py-1.5">
          {suggestion ? (
            <Tabs value={optimizeView} onValueChange={(next) => next && setOptimizeView(next as OptimizeView)}>
              <TabsList variant="line" className="h-6 gap-1 bg-transparent p-0">
                <TabsTrigger value="original" className="h-6 px-2 text-xs text-zinc-400 data-active:text-zinc-100">
                  Original
                </TabsTrigger>
                <TabsTrigger value="optimized" className="h-6 px-2 text-xs text-zinc-400 data-active:text-zinc-100">
                  Optimized
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <span className="text-xs font-medium text-zinc-400">Preview</span>
          )}
          <div className="flex items-center gap-1.5">
            {optimize && (
              <AiHeaderButton
                label="Optimize"
                pendingLabel="Optimizing..."
                ariaLabel="Optimize prompt"
                canUseProFeatures={optimize.canUseProFeatures}
                isPending={isOptimizing}
                onClick={handleOptimize}
              />
            )}
            {copyButton}
          </div>
        </div>
        {preview}
        {suggestion && (
          <OptimizeReviewBar
            summary={suggestion.summary}
            isAccepting={isAccepting}
            onAccept={handleAccept}
            onDiscard={handleDiscard}
          />
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#1e1e1e]">
      <Tabs value={tab} onValueChange={(next) => next && setTab(next as "write" | "preview")}>
        <div className="flex items-center justify-between border-b border-white/10 bg-[#2d2d2d] px-3 py-1.5">
          <TabsList variant="line" className="h-7 gap-1 bg-transparent p-0">
            <TabsTrigger value="write" className="h-7 px-2 text-xs text-zinc-400 data-active:text-zinc-100">
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="h-7 px-2 text-xs text-zinc-400 data-active:text-zinc-100">
              Preview
            </TabsTrigger>
          </TabsList>
          {copyButton}
        </div>

        <TabsContent value="write" className="m-0">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent px-3 py-2.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          {preview}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface OptimizeReviewBarProps {
  summary: string | null;
  isAccepting: boolean;
  onAccept: () => void;
  onDiscard: () => void;
}

function OptimizeReviewBar({ summary, isAccepting, onAccept, onDiscard }: OptimizeReviewBarProps) {
  return (
    <div className="space-y-2 border-t border-white/10 bg-[#2d2d2d] px-3 py-2">
      <p className="text-xs text-zinc-400">
        {summary ?? "The AI suggested an optimized version of this prompt."} Use it?
      </p>
      <div className="flex justify-end gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
          onClick={onDiscard}
          disabled={isAccepting}
        >
          Discard
        </Button>
        <Button type="button" size="xs" onClick={onAccept} disabled={isAccepting}>
          {isAccepting ? "Saving..." : "Use optimized"}
        </Button>
      </div>
    </div>
  );
}
