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
import { Textarea } from "@/components/ui/textarea";
import { updateCollection } from "@/actions/collections";

interface EditableCollection {
  id: string;
  name: string;
  description: string | null;
}

interface EditCollectionDialogProps {
  collection: EditableCollection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
  onUpdated,
}: EditCollectionDialogProps) {
  const [form, setForm] = useState({ name: collection.name, description: collection.description ?? "" });
  const [isSaving, setIsSaving] = useState(false);

  // Reset the form to the collection's current values every time the dialog
  // opens, without the extra render an effect would cause.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm({ name: collection.name, description: collection.description ?? "" });
    }
  }

  const canSubmit = form.name.trim().length > 0;

  async function handleSubmit() {
    setIsSaving(true);
    const result = await updateCollection(collection.id, {
      name: form.name.trim(),
      description: form.description.trim() || null,
    });
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to update collection");
      return;
    }

    toast.success("Collection updated");
    onOpenChange(false);
    onUpdated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-collection-name">Name</Label>
            <Input
              id="edit-collection-name"
              value={form.name}
              onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
              placeholder="Name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-collection-description">Description</Label>
            <Textarea
              id="edit-collection-description"
              value={form.description}
              onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || !canSubmit}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
