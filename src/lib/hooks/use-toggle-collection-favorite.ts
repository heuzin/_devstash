"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleCollectionFavorite } from "@/actions/collections";

export function useToggleCollectionFavorite(collectionId: string) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);

  async function toggle() {
    setIsToggling(true);
    const result = await toggleCollectionFavorite(collectionId);
    setIsToggling(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? "Failed to update favorite");
      return;
    }

    toast.success(result.data.isFavorite ? "Added to favorites" : "Removed from favorites");
    router.refresh();
  }

  return { isToggling, toggle };
}
