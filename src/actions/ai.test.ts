import { beforeEach, describe, expect, it, vi } from "vitest";
import OpenAI from "openai";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/openai", () => ({
  AI_MODEL: "gpt-5-nano",
  isAiConfigured: vi.fn(() => true),
  openai: { responses: { create: vi.fn() } },
}));

vi.mock("@/lib/rate-limit", () => ({
  aiRateLimit: null,
  checkRateLimit: vi.fn(),
  retryAfterSeconds: vi.fn(() => 600),
}));

vi.mock("@/lib/usage-limits", () => ({
  assertCanUseProFeature: vi.fn(),
}));

import { auth } from "@/auth";
import { isAiConfigured, openai } from "@/lib/openai";
import { checkRateLimit } from "@/lib/rate-limit";
import { assertCanUseProFeature } from "@/lib/usage-limits";
import { AI_TAG_CONTENT_MAX_CHARS } from "@/lib/ai-tags";
import { generateAutoTags, generateDescription } from "./ai";

const authMock = vi.mocked(auth);
const createMock = vi.mocked(openai.responses.create);
const isAiConfiguredMock = vi.mocked(isAiConfigured);
const checkRateLimitMock = vi.mocked(checkRateLimit);
const assertProMock = vi.mocked(assertCanUseProFeature);

const USER_ID = "user_123";

const VALID_INPUT = {
  itemTypeName: "snippet",
  title: "useDebounce hook",
  description: null,
  content: "export function useDebounce() {}",
  url: null,
  existingTags: ["react"],
};

function mockSession(userId: string | null) {
  authMock.mockResolvedValue((userId ? { user: { id: userId } } : null) as never);
}

function mockResponse(outputText: string) {
  createMock.mockResolvedValue({ output_text: outputText } as never);
}

describe("generateAutoTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAiConfiguredMock.mockReturnValue(true);
    assertProMock.mockResolvedValue(undefined);
    checkRateLimitMock.mockResolvedValue({ success: true, remaining: 19, reset: 0 });
  });

  it("rejects invalid input without calling auth or the AI", async () => {
    const result = await generateAutoTags({ ...VALID_INPUT, title: "  " });

    expect(result).toEqual({ success: false, error: "Add a title before suggesting tags" });
    expect(authMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated users", async () => {
    mockSession(null);

    const result = await generateAutoTags(VALID_INPUT);

    expect(result).toEqual({ success: false, error: "You must be signed in to do this" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns the Pro gating error for free users", async () => {
    mockSession(USER_ID);
    assertProMock.mockRejectedValue(
      new Error("AI features is a Pro feature. Upgrade in Settings to unlock it."),
    );

    const result = await generateAutoTags(VALID_INPUT);

    expect(assertProMock).toHaveBeenCalledWith(USER_ID, "AI features");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Pro feature");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns an error when AI is not configured", async () => {
    mockSession(USER_ID);
    isAiConfiguredMock.mockReturnValue(false);

    const result = await generateAutoTags(VALID_INPUT);

    expect(result).toEqual({ success: false, error: "AI features are not configured." });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns a rate limit error keyed by user id", async () => {
    mockSession(USER_ID);
    checkRateLimitMock.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() });

    const result = await generateAutoTags(VALID_INPUT);

    expect(checkRateLimitMock).toHaveBeenCalledWith(null, USER_ID);
    expect(result).toEqual({
      success: false,
      error: "AI limit reached. Please try again in 10 minutes.",
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("calls the Responses API with json_object format and truncated content", async () => {
    mockSession(USER_ID);
    mockResponse('{"tags": ["hooks"]}');
    const longContent = "x".repeat(AI_TAG_CONTENT_MAX_CHARS + 1000);

    await generateAutoTags({ ...VALID_INPUT, content: longContent });

    const params = createMock.mock.calls[0][0];
    expect(params).toMatchObject({
      model: "gpt-5-nano",
      text: { format: { type: "json_object" } },
    });
    expect(params.input).toContain("x".repeat(AI_TAG_CONTENT_MAX_CHARS));
    expect(params.input).not.toContain("x".repeat(AI_TAG_CONTENT_MAX_CHARS + 1));
  });

  it("returns normalized tags, excluding existing ones", async () => {
    mockSession(USER_ID);
    mockResponse('{"tags": ["React", "Hooks", "TypeScript"]}');

    const result = await generateAutoTags(VALID_INPUT);

    expect(result).toEqual({ success: true, data: ["hooks", "typescript"] });
  });

  it("handles a bare array response", async () => {
    mockSession(USER_ID);
    mockResponse('["debounce", "hooks"]');

    const result = await generateAutoTags(VALID_INPUT);

    expect(result).toEqual({ success: true, data: ["debounce", "hooks"] });
  });

  it("returns an error when the AI suggests nothing usable", async () => {
    mockSession(USER_ID);
    mockResponse("not json");

    const result = await generateAutoTags(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: "The AI couldn't suggest any new tags for this item.",
    });
  });

  it("maps OpenAI API errors to a friendly message", async () => {
    mockSession(USER_ID);
    vi.spyOn(console, "error").mockImplementation(() => {});
    createMock.mockRejectedValue(
      new OpenAI.APIError(500, undefined, "Internal error", new Headers()),
    );

    const result = await generateAutoTags(VALID_INPUT);

    expect(result).toEqual({
      success: false,
      error: "The AI service is unavailable right now. Please try again.",
    });
  });
});

describe("generateDescription", () => {
  const DESCRIPTION_INPUT = {
    itemTypeName: "snippet",
    title: "useDebounce hook",
    content: "export function useDebounce() {}",
    language: "typescript",
    url: null,
    fileName: null,
    tags: ["react"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    isAiConfiguredMock.mockReturnValue(true);
    assertProMock.mockResolvedValue(undefined);
    checkRateLimitMock.mockResolvedValue({ success: true, remaining: 19, reset: 0 });
  });

  it("rejects input without a title before calling auth or the AI", async () => {
    const result = await generateDescription({ ...DESCRIPTION_INPUT, title: " " });

    expect(result).toEqual({
      success: false,
      error: "Add a title before generating a description",
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated users", async () => {
    mockSession(null);

    const result = await generateDescription(DESCRIPTION_INPUT);

    expect(result).toEqual({ success: false, error: "You must be signed in to do this" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns the Pro gating error for free users", async () => {
    mockSession(USER_ID);
    assertProMock.mockRejectedValue(
      new Error("AI features is a Pro feature. Upgrade in Settings to unlock it."),
    );

    const result = await generateDescription(DESCRIPTION_INPUT);

    expect(assertProMock).toHaveBeenCalledWith(USER_ID, "AI features");
    expect(result.error).toContain("Pro feature");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns a rate limit error without calling the AI", async () => {
    mockSession(USER_ID);
    checkRateLimitMock.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() });

    const result = await generateDescription(DESCRIPTION_INPUT);

    expect(result.success).toBe(false);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("calls the Responses API with plain-text output and returns the normalized description", async () => {
    mockSession(USER_ID);
    mockResponse('  "A React hook that debounces a changing value."  ');

    const result = await generateDescription({ ...DESCRIPTION_INPUT, fileName: "hook.ts" });

    const params = createMock.mock.calls[0][0];
    expect(params).toMatchObject({ model: "gpt-5-nano", reasoning: { effort: "minimal" } });
    expect(params).not.toHaveProperty("text");
    expect(params.input).toContain("<language>typescript</language>");
    expect(params.input).toContain("<file-name>hook.ts</file-name>");
    expect(result).toEqual({
      success: true,
      data: "A React hook that debounces a changing value.",
    });
  });

  it("returns an error when the AI output is empty", async () => {
    mockSession(USER_ID);
    mockResponse("   ");

    const result = await generateDescription(DESCRIPTION_INPUT);

    expect(result).toEqual({
      success: false,
      error: "The AI couldn't write a description for this item.",
    });
  });

  it("maps OpenAI API errors to a friendly message", async () => {
    mockSession(USER_ID);
    vi.spyOn(console, "error").mockImplementation(() => {});
    createMock.mockRejectedValue(
      new OpenAI.APIError(500, undefined, "Internal error", new Headers()),
    );

    const result = await generateDescription(DESCRIPTION_INPUT);

    expect(result).toEqual({
      success: false,
      error: "The AI service is unavailable right now. Please try again.",
    });
  });
});
