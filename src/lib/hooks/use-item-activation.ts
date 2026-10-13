"use client";

import type { KeyboardEvent } from "react";
import { useItemDrawer } from "@/components/items/item-drawer-provider";

export function useItemActivation(itemId: string) {
  const { openItem } = useItemDrawer();

  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: () => openItem(itemId),
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openItem(itemId);
      }
    },
  };
}
