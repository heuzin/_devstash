"use server";

import { auth } from "@/auth";
import { updateItem as updateItemQuery, type ItemDetail } from "@/lib/db/items";
import { updateItemSchema } from "@/lib/validations/items";

interface ActionResult {
  success: boolean;
  data?: ItemDetail;
  error?: string;
}

export async function updateItem(itemId: string, data: unknown): Promise<ActionResult> {
  const parsed = updateItemSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do this" };
  }

  const updated = await updateItemQuery(session.user.id, itemId, parsed.data);
  if (!updated) {
    return { success: false, error: "Item not found" };
  }

  return { success: true, data: updated };
}
