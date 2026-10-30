"use client";

import { useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateDescription } from "@/actions/ai";
import type { DescriptionItem } from "@/lib/ai-description";

interface DescriptionFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  canGenerate: boolean;
  getGenerationInput: () => Omit<DescriptionItem, "description">;
}

export function DescriptionField({
  id,
  value,
  onChange,
  canGenerate,
  getGenerationInput,
}: DescriptionFieldProps) {
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    const input = getGenerationInput();
    if (!input.title.trim()) {
      toast.error("Add a title before generating a description");
      return;
    }

    startTransition(async () => {
      const result = await generateDescription({ ...input, description: value || null });
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Couldn't generate a description");
        return;
      }
      onChange(result.data);
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>Description</Label>
        {canGenerate && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleGenerate}
            disabled={isPending}
            title="Generate description with AI"
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {isPending ? "Describing..." : "Describe"}
          </Button>
        )}
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={2}
        disabled={isPending}
      />
    </div>
  );
}
