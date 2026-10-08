"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ItemDrawer } from "@/components/items/item-drawer";
import type { ItemDetail } from "@/lib/db/items";

interface ItemDrawerContextValue {
  openItem: (id: string) => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useItemDrawer() {
  const context = useContext(ItemDrawerContext);
  if (!context) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }
  return context;
}

export function ItemDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openItem = useCallback((id: string) => {
    setItemId(id);
    setItem(null);
    setError(null);
    setLoading(true);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!itemId) return;

    const controller = new AbortController();

    fetch(`/api/items/${itemId}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load item"))))
      .then((body: { data: ItemDetail }) => setItem(body.data))
      .catch((fetchError: Error) => {
        if (fetchError.name !== "AbortError") {
          setError("Couldn't load this item. Please try again.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [itemId]);

  return (
    <ItemDrawerContext.Provider value={{ openItem }}>
      {children}
      <ItemDrawer open={open} onOpenChange={setOpen} item={item} loading={loading} error={error} />
    </ItemDrawerContext.Provider>
  );
}
