"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateItemDialog } from "@/components/items/create-item-dialog-provider";

interface AddTypeItemButtonProps {
  itemTypeId: string;
  label: string;
}

export function AddTypeItemButton({ itemTypeId, label }: AddTypeItemButtonProps) {
  const { open } = useCreateItemDialog();

  return (
    <Button onClick={() => open(itemTypeId)} className="ml-auto">
      <Plus className="size-4" />
      {label}
    </Button>
  );
}
