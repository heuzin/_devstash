"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/items/code-editor";
import { createItem } from "@/actions/items";
import type { ItemTypeSummary } from "@/lib/db/items";
import {
  CODE_EDITOR_FALLBACK_LANGUAGE,
  CONTENT_TYPE_NAMES,
  CREATABLE_ITEM_TYPE_NAMES,
  LANGUAGE_TYPE_NAMES,
  URL_TYPE_NAMES,
} from "@/lib/item-types";

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const EMPTY_FORM = { title: "", description: "", content: "", language: "", url: "", tagsInput: "" };

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemTypes: ItemTypeSummary[];
  preselectedItemTypeId?: string;
  onCreated: () => void;
}

export function CreateItemDialog({
  open,
  onOpenChange,
  itemTypes,
  preselectedItemTypeId,
  onCreated,
}: CreateItemDialogProps) {
  const creatableTypes = itemTypes.filter((type) => CREATABLE_ITEM_TYPE_NAMES.has(type.name));

  const [itemTypeId, setItemTypeId] = useState(preselectedItemTypeId ?? creatableTypes[0]?.id ?? "");
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Reset the form to a fresh state (optionally preselecting a type) every
  // time the dialog opens, without the extra render an effect would cause.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setItemTypeId(preselectedItemTypeId ?? creatableTypes[0]?.id ?? "");
      setForm(EMPTY_FORM);
    }
  }

  const selectedType = creatableTypes.find((type) => type.id === itemTypeId);
  const showContent = selectedType ? CONTENT_TYPE_NAMES.has(selectedType.name) : false;
  const showLanguage = selectedType ? LANGUAGE_TYPE_NAMES.has(selectedType.name) : false;
  const showUrl = selectedType ? URL_TYPE_NAMES.has(selectedType.name) : false;
  const codeEditorFallbackLanguage = selectedType
    ? CODE_EDITOR_FALLBACK_LANGUAGE[selectedType.name]
    : undefined;

  const canSubmit =
    form.title.trim().length > 0 && itemTypeId.length > 0 && (!showUrl || form.url.trim().length > 0);

  async function handleSubmit() {
    const tags = form.tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    setIsSaving(true);
    const result = await createItem({
      itemTypeId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      content: showContent ? form.content || null : null,
      language: showLanguage ? form.language.trim() || null : null,
      url: showUrl ? form.url.trim() || null : null,
      tags,
    });
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to create item");
      return;
    }

    toast.success("Item created");
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-item-type">Type</Label>
            <Select value={itemTypeId} onValueChange={(value) => setItemTypeId(value ?? "")}>
              <SelectTrigger id="new-item-type" className="w-full">
                <SelectValue placeholder="Select a type">
                  {() => (selectedType ? capitalize(selectedType.name) : "Select a type")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {creatableTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {capitalize(type.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-item-title">Title</Label>
            <Input
              id="new-item-title"
              value={form.title}
              onChange={(event) => setForm((f) => ({ ...f, title: event.target.value }))}
              placeholder="Title"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-item-description">Description</Label>
            <Textarea
              id="new-item-description"
              value={form.description}
              onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))}
              rows={2}
            />
          </div>

          {showUrl && (
            <div className="space-y-1.5">
              <Label htmlFor="new-item-url">URL</Label>
              <Input
                id="new-item-url"
                type="url"
                value={form.url}
                onChange={(event) => setForm((f) => ({ ...f, url: event.target.value }))}
                placeholder="https://"
              />
            </div>
          )}

          {showContent && (
            <div className="space-y-1.5">
              <Label htmlFor="new-item-content">Content</Label>
              {codeEditorFallbackLanguage ? (
                <CodeEditor
                  value={form.content}
                  onChange={(content) => setForm((f) => ({ ...f, content }))}
                  language={form.language}
                  fallbackLanguage={codeEditorFallbackLanguage}
                />
              ) : (
                <Textarea
                  id="new-item-content"
                  value={form.content}
                  onChange={(event) => setForm((f) => ({ ...f, content: event.target.value }))}
                  rows={8}
                  className="font-mono text-xs"
                />
              )}
            </div>
          )}

          {showLanguage && (
            <div className="space-y-1.5">
              <Label htmlFor="new-item-language">Language</Label>
              <Input
                id="new-item-language"
                value={form.language}
                onChange={(event) => setForm((f) => ({ ...f, language: event.target.value }))}
                placeholder="e.g. typescript"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="new-item-tags">Tags</Label>
            <Input
              id="new-item-tags"
              value={form.tagsInput}
              onChange={(event) => setForm((f) => ({ ...f, tagsInput: event.target.value }))}
              placeholder="Comma-separated"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || !canSubmit}>
            {isSaving ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
