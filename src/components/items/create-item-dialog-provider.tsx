"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CreateItemDialog } from "@/components/items/create-item-dialog";
import type { ItemTypeSummary } from "@/lib/db/items";

interface CreateItemDialogContextValue {
  open: () => void;
}

const CreateItemDialogContext = createContext<CreateItemDialogContextValue | null>(null);

export function useCreateItemDialog() {
  const context = useContext(CreateItemDialogContext);
  if (!context) {
    throw new Error("useCreateItemDialog must be used within a CreateItemDialogProvider");
  }
  return context;
}

export function CreateItemDialogProvider({
  itemTypes,
  children,
}: {
  itemTypes: ItemTypeSummary[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <CreateItemDialogContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <CreateItemDialog
        open={open}
        onOpenChange={setOpen}
        itemTypes={itemTypes}
        onCreated={() => router.refresh()}
      />
    </CreateItemDialogContext.Provider>
  );
}
