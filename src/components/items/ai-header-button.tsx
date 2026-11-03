"use client";

import { Crown, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const BUTTON_CLASS = "h-6 gap-1 px-1.5 text-xs text-zinc-400 hover:bg-white/10 hover:text-zinc-100";

interface AiHeaderButtonProps {
  label: string;
  pendingLabel?: string;
  ariaLabel: string;
  canUseProFeatures: boolean;
  isPending: boolean;
  onClick: () => void;
}

export function AiHeaderButton({
  label,
  pendingLabel,
  ariaLabel,
  canUseProFeatures,
  isPending,
  onClick,
}: AiHeaderButtonProps) {
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
              aria-label={`${ariaLabel} (Pro)`}
            />
          }
        >
          <Crown className="size-3.5 text-amber-400" />
          {label}
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
      onClick={onClick}
      disabled={isPending}
      aria-label={`${ariaLabel} with AI`}
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
      {isPending && pendingLabel ? pendingLabel : label}
    </Button>
  );
}
