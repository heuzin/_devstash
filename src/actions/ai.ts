"use server";

import OpenAI from "openai";
import { auth } from "@/auth";
import { AUTO_TAG_INSTRUCTIONS, buildAutoTagInput, parseTagSuggestions } from "@/lib/ai-tags";
import { AI_MODEL, isAiConfigured, openai } from "@/lib/openai";
import { aiRateLimit, checkRateLimit, retryAfterSeconds } from "@/lib/rate-limit";
import { assertCanUseProFeature } from "@/lib/usage-limits";
import { generateAutoTagsSchema } from "@/lib/validations/ai";

interface AiActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class AiError extends Error {}

async function assertAiAllowed(userId: string) {
  await assertCanUseProFeature(userId, "AI features");
  if (!isAiConfigured()) throw new AiError("AI features are not configured.");

  const { success, reset } = await checkRateLimit(aiRateLimit, userId);
  if (!success) {
    const minutes = Math.ceil(retryAfterSeconds(reset) / 60);
    throw new AiError(
      `AI limit reached. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    );
  }
}

function toAiErrorMessage(error: unknown): string {
  if (error instanceof AiError) return error.message;
  if (error instanceof OpenAI.APIError) {
    console.error("OpenAI request failed", error.status, error.requestID);
    return "The AI service is unavailable right now. Please try again.";
  }
  if (error instanceof Error && error.message.includes("Pro feature")) return error.message;
  console.error("Unexpected AI error", error);
  return "Something went wrong. Please try again.";
}

export async function generateAutoTags(input: unknown): Promise<AiActionResult<string[]>> {
  const parsed = generateAutoTagsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do this" };
  }

  try {
    await assertAiAllowed(session.user.id);

    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions: AUTO_TAG_INSTRUCTIONS,
      input: buildAutoTagInput(parsed.data),
      reasoning: { effort: "minimal" },
      max_output_tokens: 500,
      text: { format: { type: "json_object" } },
    });

    const tags = parseTagSuggestions(response.output_text, parsed.data.existingTags);
    if (tags.length === 0) throw new AiError("The AI couldn't suggest any new tags for this item.");

    return { success: true, data: tags };
  } catch (error) {
    return { success: false, error: toAiErrorMessage(error) };
  }
}
