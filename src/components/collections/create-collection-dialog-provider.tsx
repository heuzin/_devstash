"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CreateCollectionDialog } from "@/components/collections/create-collection-dialog";

interface CreateCollectionDialogContextValue {
  open: () => void;
}

const CreateCollectionDialogContext = createContext<CreateCollectionDialogContextValue | null>(null);

export function useCreateCollectionDialog() {
  const context = useContext(CreateCollectionDialogContext);
  if (!context) {
    throw new Error("useCreateCollectionDialog must be used within a CreateCollectionDialogProvider");
  }
  return context;
}

export function CreateCollectionDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <CreateCollectionDialogContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <CreateCollectionDialog open={open} onOpenChange={setOpen} onCreated={() => router.refresh()} />
    </CreateCollectionDialogContext.Provider>
  );
}
