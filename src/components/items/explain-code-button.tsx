"use client";

import { Crown, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const BUTTON_CLASS = "h-6 gap-1 px-1.5 text-xs text-zinc-400 hover:bg-white/10 hover:text-zinc-100";

interface ExplainCodeButtonProps {
  canUseProFeatures: boolean;
  isPending: boolean;
  onExplain: () => void;
}

export function ExplainCodeButton({ canUseProFeatures, isPending, onExplain }: ExplainCodeButtonProps) {
  if (!canUseProFeatures) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className={BUTTON_CLASS}
              aria-disabled="true"
              aria-label="Explain code (Pro)"
            />
          }
        >
          <Crown className="size-3.5 text-amber-400" />
          Explain
        </TooltipTrigger>
        <TooltipContent>AI features require Pro subscription</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      className={BUTTON_CLASS}
      onClick={onExplain}
      disabled={isPending}
      aria-label="Explain code with AI"
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
      Explain
    </Button>
  );
}
