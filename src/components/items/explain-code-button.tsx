"use client";

import { AiHeaderButton } from "@/components/items/ai-header-button";

interface ExplainCodeButtonProps {
  canUseProFeatures: boolean;
  isPending: boolean;
  onExplain: () => void;
}

export function ExplainCodeButton({ canUseProFeatures, isPending, onExplain }: ExplainCodeButtonProps) {
  return (
    <AiHeaderButton
      label="Explain"
      ariaLabel="Explain code"
      canUseProFeatures={canUseProFeatures}
      isPending={isPending}
      onClick={onExplain}
    />
  );
}
