"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { EditorPreferences } from "@/lib/editor-preferences";
import { editorPreferencesSchema } from "@/lib/validations/editor-preferences";

interface ActionResult {
  success: boolean;
  data?: EditorPreferences;
  error?: string;
}

export async function updateEditorPreferences(
  preferences: EditorPreferences,
): Promise<ActionResult> {
  const parsed = editorPreferencesSchema.safeParse(preferences);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do this" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { editorPreferences: parsed.data },
  });

  return { success: true, data: parsed.data };
}
