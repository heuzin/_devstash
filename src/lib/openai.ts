import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set; AI features are disabled.");
}

// Same reasoning as src/lib/stripe.ts: the SDK throws on a missing key at
// construction, so fall back to a placeholder to keep imports safe.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-unconfigured",
  maxRetries: 1,
  timeout: 30_000,
});

export const AI_MODEL = "gpt-5-nano";

export function isAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}
