"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CollectionPicker } from "@/components/items/collection-picker";
import { ItemContentField } from "@/components/items/drawer/item-content-field";
import { ItemDetailsSection } from "@/components/items/drawer/item-details-section";
import { updateItem } from "@/actions/items";
import type { CollectionOption } from "@/lib/db/collections";
import type { ItemDetail } from "@/lib/db/items";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { CONTENT_TYPE_NAMES, LANGUAGE_TYPE_NAMES, URL_TYPE_NAMES } from "@/lib/item-types";
import { parseTagsInput } from "@/lib/tags";
import { capitalize } from "@/lib/utils";

interface ItemEditViewProps {
  item: ItemDetail;
  collections: CollectionOption[];
  onCancel: () => void;
  onSaved: (item: ItemDetail) => void;
}

export function ItemEditView({ item, collections, onCancel, onSaved }: ItemEditViewProps) {
  const router = useRouter();
  const Icon = ITEM_TYPE_ICONS[item.itemType.icon];
  const typeName = item.itemType.name;
  const showContent = CONTENT_TYPE_NAMES.has(typeName);
  const showLanguage = LANGUAGE_TYPE_NAMES.has(typeName);
  const showUrl = URL_TYPE_NAMES.has(typeName);

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [content, setContent] = useState(item.content ?? "");
  const [language, setLanguage] = useState(item.language ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [tagsInput, setTagsInput] = useState(item.tags.join(", "));
  const [collectionIds, setCollectionIds] = useState(item.collections.map((c) => c.id));
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    const result = await updateItem(item.id, {
      title: title.trim(),
      description: description.trim() || null,
      content: showContent ? content || null : null,
      language: showLanguage ? language.trim() || null : null,
      url: showUrl ? url.trim() || null : null,
      tags: parseTagsInput(tagsInput),
      collectionIds,
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
            <ItemContentField
              typeName={typeName}
              value={content}
              onChange={setContent}
              language={language}
              textareaId="item-content"
              rows={10}
            />
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

        <CollectionPicker
          collections={collections}
          selectedIds={collectionIds}
          onChange={setCollectionIds}
        />

        <ItemDetailsSection item={item} />
      </div>
    </>
  );
}
