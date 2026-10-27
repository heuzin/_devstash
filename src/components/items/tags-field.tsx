"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateAutoTags } from "@/actions/ai";
import type { AutoTagItem } from "@/lib/ai-tags";
import { addTagToInput, parseTagsInput } from "@/lib/tags";

interface TagsFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  canSuggest: boolean;
  getSuggestionInput: () => Omit<AutoTagItem, "existingTags">;
}

export function TagsField({ id, value, onChange, canSuggest, getSuggestionInput }: TagsFieldProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleSuggest() {
    const input = getSuggestionInput();
    if (!input.title.trim()) {
      toast.error("Add a title before suggesting tags");
      return;
    }

    startTransition(async () => {
      const result = await generateAutoTags({ ...input, existingTags: parseTagsInput(value) });
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Couldn't suggest tags");
        return;
      }
      setSuggestions(result.data);
    });
  }

  function dismiss(tag: string) {
    setSuggestions((current) => current.filter((suggestion) => suggestion !== tag));
  }

  function accept(tag: string) {
    onChange(addTagToInput(value, tag));
    dismiss(tag);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>Tags</Label>
        {canSuggest && (
          <Button type="button" variant="ghost" size="xs" onClick={handleSuggest} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {isPending ? "Suggesting..." : "Suggest Tags"}
          </Button>
        )}
      </div>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Comma-separated"
      />
      {suggestions.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Suggested tags">
          {suggestions.map((tag) => (
            <li key={tag}>
              <Badge variant="outline" className="h-6 gap-1 pr-1">
                <Sparkles className="text-muted-foreground" />
                {tag}
                <button
                  type="button"
                  onClick={() => accept(tag)}
                  aria-label={`Accept tag ${tag}`}
                  className="rounded-sm p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Check className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => dismiss(tag)}
                  aria-label={`Reject tag ${tag}`}
                  className="rounded-sm p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
