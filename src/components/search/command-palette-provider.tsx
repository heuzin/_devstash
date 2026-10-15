"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CommandPalette } from "@/components/search/command-palette";
import type { SearchCollection } from "@/lib/db/collections";
import type { SearchItem } from "@/lib/db/items";

interface CommandPaletteContextValue {
  open: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error("useCommandPalette must be used within a CommandPaletteProvider");
  }
  return context;
}

export function CommandPaletteProvider({
  items,
  collections,
  children,
}: {
  items: SearchItem[];
  collections: SearchCollection[];
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((open) => !open);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      <CommandPalette open={isOpen} onOpenChange={setIsOpen} items={items} collections={collections} />
    </CommandPaletteContext.Provider>
  );
}
