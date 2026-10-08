"use client";

import { Calendar, Copy, FolderOpen, Pencil, Pin, Star, Tag, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { ItemDetail } from "@/lib/db/items";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

interface ItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemDetail | null;
  loading: boolean;
  error: string | null;
}

export function ItemDrawer({ open, onOpenChange, item, loading, error }: ItemDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        <SheetTitle className="sr-only">{item?.title ?? "Item details"}</SheetTitle>
        <div className="flex h-full flex-col overflow-y-auto">
          {loading && <ItemDrawerSkeleton />}
          {!loading && error && <p className="p-4 text-sm text-muted-foreground">{error}</p>}
          {!loading && !error && item && <ItemDrawerBody item={item} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ItemDrawerSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function ItemDrawerBody({ item }: { item: ItemDetail }) {
  const Icon = ITEM_TYPE_ICONS[item.itemType.icon];

  return (
    <>
      <div className="space-y-3 p-4 pb-0">
        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${item.itemType.color}1a` }}
          >
            {Icon && <Icon className="size-5" style={{ color: item.itemType.color }} />}
          </div>
          <h2 className="pt-1.5 text-lg font-semibold">{item.title}</h2>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{capitalize(item.itemType.slug)}</Badge>
          {item.language && <Badge variant="secondary">{item.language}</Badge>}
        </div>

        <div className="flex flex-wrap items-center gap-1 border-y border-border py-2">
          <Button
            variant="ghost"
            size="sm"
            className={item.isFavorite ? "text-yellow-400" : "text-muted-foreground"}
          >
            <Star className={item.isFavorite ? "size-4 fill-yellow-400" : "size-4"} />
            Favorite
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Pin className="size-4" />
            Pin
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Copy className="size-4" />
            Copy
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive"
              aria-label="Delete"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-4">
        {item.description && (
          <section className="space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
            <p className="text-sm">{item.description}</p>
          </section>
        )}

        <ItemContentSection item={item} />

        {item.tags.length > 0 && (
          <section className="space-y-1.5">
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Tag className="size-4" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {item.collections.length > 0 && (
          <section className="space-y-1.5">
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <FolderOpen className="size-4" />
              Collections
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {item.collections.map((collection) => (
                <Badge key={collection.id} variant="secondary">
                  {collection.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Calendar className="size-4" />
            Details
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Updated</span>
              <span>{formatDate(item.updatedAt)}</span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function ItemContentSection({ item }: { item: ItemDetail }) {
  if (item.contentType === "URL" && item.url) {
    return (
      <section className="space-y-1.5">
        <h3 className="text-sm font-medium text-muted-foreground">URL</h3>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-sm text-primary hover:underline"
        >
          {item.url}
        </a>
      </section>
    );
  }

  if (item.contentType === "FILE") {
    return (
      <section className="space-y-1.5">
        <h3 className="text-sm font-medium text-muted-foreground">File</h3>
        <p className="text-sm text-muted-foreground">{item.fileName ?? "No file uploaded yet"}</p>
      </section>
    );
  }

  if (!item.content) return null;

  return (
    <section className="space-y-1.5">
      <h3 className="text-sm font-medium text-muted-foreground">Content</h3>
      <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap">
        {item.content}
      </pre>
    </section>
  );
}
