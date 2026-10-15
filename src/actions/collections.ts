"use server";

import { auth } from "@/auth";
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  updateCollection as updateCollectionQuery,
  type CollectionSummary,
} from "@/lib/db/collections";
import { createCollectionSchema, updateCollectionSchema } from "@/lib/validations/collections";

interface ActionResult {
  success: boolean;
  data?: CollectionSummary;
  error?: string;
}

interface DeleteActionResult {
  success: boolean;
  error?: string;
}

export async function createCollection(data: unknown): Promise<ActionResult> {
  const parsed = createCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do this" };
  }

  try {
    const created = await createCollectionQuery(session.user.id, parsed.data);
    return { success: true, data: created };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create collection",
    };
  }
}

export async function updateCollection(collectionId: string, data: unknown): Promise<ActionResult> {
  const parsed = updateCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do this" };
  }

  const updated = await updateCollectionQuery(session.user.id, collectionId, parsed.data);
  if (!updated) {
    return { success: false, error: "Collection not found" };
  }

  return { success: true, data: updated };
}

export async function deleteCollection(collectionId: string): Promise<DeleteActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do this" };
  }

  const deleted = await deleteCollectionQuery(session.user.id, collectionId);
  if (!deleted) {
    return { success: false, error: "Collection not found" };
  }

  return { success: true };
}
