"use client";

import { Download, FileIcon, Pin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ItemSummary } from "@/lib/db/items";
import { FILE_EXTENSION_ICONS, getFileExtension } from "@/lib/file-extension-icons";
import { formatShortDateWithYear } from "@/lib/format-date";
import { useItemActivation } from "@/lib/hooks/use-item-activation";
import { formatFileSize } from "@/lib/upload-constraints";

export function FileListRow({ item }: { item: ItemSummary }) {
  const activation = useItemActivation(item.id);
  const Icon = FILE_EXTENSION_ICONS[getFileExtension(item.fileName)] ?? FileIcon;

  return (
    <div
      {...activation}
      className="flex cursor-pointer flex-col gap-2 border-b px-3 py-3 transition-colors last:border-b-0 hover:bg-accent/50 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Icon className="size-5 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">{item.title}</span>
        {item.isPinned && <Pin className="size-3.5 shrink-0 text-muted-foreground" />}
        {item.isFavorite && (
          <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
        )}
      </div>
      <div className="flex items-center justify-between gap-4 pl-8 text-sm text-muted-foreground sm:justify-end sm:gap-6 sm:pl-0">
        <span className="w-16 shrink-0 text-right">
          {item.fileSize !== null ? formatFileSize(item.fileSize) : "—"}
        </span>
        <span className="w-24 shrink-0 text-right">{formatShortDateWithYear(item.createdAt)}</span>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          onClick={(event) => event.stopPropagation()}
          nativeButton={false}
          render={<a href={`/api/items/${item.id}/download`} download={item.fileName ?? undefined} />}
        >
          <Download className="size-4" />
        </Button>
      </div>
    </div>
  );
}
