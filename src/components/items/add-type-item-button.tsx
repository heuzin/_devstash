"use client";

import Link from "next/link";
import { Lock, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCreateItemDialog } from "@/components/items/create-item-dialog-provider";

interface AddTypeItemButtonProps {
  itemTypeId: string;
  label: string;
  requiresPro: boolean;
}

export function AddTypeItemButton({ itemTypeId, label, requiresPro }: AddTypeItemButtonProps) {
  const { open, canUseProFeatures } = useCreateItemDialog();

  if (requiresPro && !canUseProFeatures) {
    return (
      <Button
        variant="outline"
        className="ml-auto"
        nativeButton={false}
        render={<Link href="/settings" title="Upgrade to Pro to upload files and images" />}
      >
        <Lock className="size-4" />
        {label}
        <Badge variant="outline" className="text-[10px] uppercase">
          Pro
        </Badge>
      </Button>
    );
  }

  return (
    <Button onClick={() => open(itemTypeId)} className="ml-auto">
      <Plus className="size-4" />
      {label}
    </Button>
  );
}
