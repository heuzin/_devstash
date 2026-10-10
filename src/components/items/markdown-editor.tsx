"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MIN_HEIGHT = 100;
const MAX_HEIGHT = 400;

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, readOnly = false, placeholder }: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el || tab !== "write") return;
    el.style.height = "auto";
    el.style.height = `${Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, el.scrollHeight))}px`;
  }, [value, tab]);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const copyButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
      onClick={handleCopy}
      aria-label="Copy markdown"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );

  const preview = (
    <div
      className="markdown-preview overflow-y-auto px-3 py-2.5"
      style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
    >
      {value.trim() ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
      ) : (
        <p className="text-xs text-zinc-500">Nothing to preview</p>
      )}
    </div>
  );

  if (readOnly) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-[#1e1e1e]">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#2d2d2d] px-3 py-1.5">
          <span className="text-xs font-medium text-zinc-400">Preview</span>
          {copyButton}
        </div>
        {preview}
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
