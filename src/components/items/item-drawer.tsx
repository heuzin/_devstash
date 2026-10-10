"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, Copy, FolderOpen, Pencil, Pin, Star, Tag, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/items/code-editor";
import { deleteItem, updateItem } from "@/actions/items";
import type { ItemDetail } from "@/lib/db/items";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import {
  CODE_EDITOR_FALLBACK_LANGUAGE,
  CONTENT_TYPE_NAMES,
  LANGUAGE_TYPE_NAMES,
  URL_TYPE_NAMES,
} from "@/lib/item-types";

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
  onItemUpdated: (item: ItemDetail) => void;
}

export function ItemDrawer({
  open,
  onOpenChange,
  item,
  loading,
  error,
  onItemUpdated,
}: ItemDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        <SheetTitle className="sr-only">{item?.title ?? "Item details"}</SheetTitle>
        <div className="flex h-full flex-col overflow-y-auto">
          {loading && <ItemDrawerSkeleton />}
          {!loading && error && <p className="p-4 text-sm text-muted-foreground">{error}</p>}
          {!loading && !error && item && (
            <ItemDrawerBody
              key={item.id}
              item={item}
              onItemUpdated={onItemUpdated}
              onItemDeleted={() => onOpenChange(false)}
            />
          )}
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

function ItemDrawerBody({
  item,
  onItemUpdated,
  onItemDeleted,
}: {
  item: ItemDetail;
  onItemUpdated: (item: ItemDetail) => void;
  onItemDeleted: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");

  if (mode === "edit") {
    return (
      <ItemEditView
        item={item}
        onCancel={() => setMode("view")}
        onSaved={(updated) => {
          onItemUpdated(updated);
          setMode("view");
        }}
      />
    );
  }

  return (
    <ItemViewBody item={item} onEdit={() => setMode("edit")} onDeleted={onItemDeleted} />
  );
}

function ItemViewBody({
  item,
  onEdit,
  onDeleted,
}: {
  item: ItemDetail;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const Icon = ITEM_TYPE_ICONS[item.itemType.icon];
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    setIsDeleting(true);
    const result = await deleteItem(item.id);
    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to delete item");
      return;
    }

    setIsDeleteDialogOpen(false);
    toast.success("Item deleted");
    router.refresh();
    onDeleted();
  }

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
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onEdit}>
              <Pencil className="size-4" />
              Edit
            </Button>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    aria-label="Delete"
                  />
                }
              >
                <Trash2 className="size-4" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia>
                    <Trash2 className="text-destructive" />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes &ldquo;{item.title}&rdquo;. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={handleConfirmDelete}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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

        <ItemDetailsSection item={item} />
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

  const fallbackLanguage = CODE_EDITOR_FALLBACK_LANGUAGE[item.itemType.name];

  return (
    <section className="space-y-1.5">
      <h3 className="text-sm font-medium text-muted-foreground">Content</h3>
      {fallbackLanguage ? (
        <CodeEditor value={item.content} language={item.language} fallbackLanguage={fallbackLanguage} readOnly />
      ) : (
        <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap">
          {item.content}
        </pre>
      )}
    </section>
  );
}

function ItemDetailsSection({ item }: { item: ItemDetail }) {
  return (
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
  );
}

function ItemEditView({
  item,
  onCancel,
  onSaved,
}: {
  item: ItemDetail;
  onCancel: () => void;
  onSaved: (item: ItemDetail) => void;
}) {
  const router = useRouter();
  const Icon = ITEM_TYPE_ICONS[item.itemType.icon];
  const typeName = item.itemType.name;
  const showContent = CONTENT_TYPE_NAMES.has(typeName);
  const showLanguage = LANGUAGE_TYPE_NAMES.has(typeName);
  const showUrl = URL_TYPE_NAMES.has(typeName);
  const codeEditorFallbackLanguage = CODE_EDITOR_FALLBACK_LANGUAGE[typeName];

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [content, setContent] = useState(item.content ?? "");
  const [language, setLanguage] = useState(item.language ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [tagsInput, setTagsInput] = useState(item.tags.join(", "));
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    setIsSaving(true);
    const result = await updateItem(item.id, {
      title: title.trim(),
      description: description.trim() || null,
      content: showContent ? content || null : null,
      language: showLanguage ? language.trim() || null : null,
      url: showUrl ? url.trim() || null : null,
      tags,
    });
    setIsSaving(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? "Failed to update item");
      return;
    }

    toast.success("Item updated");
    onSaved(result.data);
    router.refresh();
  }

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
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="flex-1"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{capitalize(item.itemType.slug)}</Badge>
        </div>

        <div className="flex items-center justify-end gap-2 border-y border-border py-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || title.trim().length === 0}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-6 p-4">
        <section className="space-y-1.5">
          <Label htmlFor="item-description">Description</Label>
          <Textarea
            id="item-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
          />
        </section>

        {showContent && (
          <section className="space-y-1.5">
            <Label htmlFor="item-content">Content</Label>
            {codeEditorFallbackLanguage ? (
              <CodeEditor
                value={content}
                onChange={setContent}
                language={language}
                fallbackLanguage={codeEditorFallbackLanguage}
              />
            ) : (
              <Textarea
                id="item-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={10}
                className="font-mono text-xs"
              />
            )}
          </section>
        )}

        {showLanguage && (
          <section className="space-y-1.5">
            <Label htmlFor="item-language">Language</Label>
            <Input
              id="item-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            />
          </section>
        )}

        {showUrl && (
          <section className="space-y-1.5">
            <Label htmlFor="item-url">URL</Label>
            <Input
              id="item-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              type="url"
            />
          </section>
        )}

        <section className="space-y-1.5">
          <Label htmlFor="item-tags">Tags</Label>
          <Input
            id="item-tags"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="Comma-separated"
          />
        </section>

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

        <ItemDetailsSection item={item} />
      </div>
    </>
  );
}
