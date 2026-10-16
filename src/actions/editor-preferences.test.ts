import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/prisma"); // picks up src/lib/__mocks__/prisma.ts

import { auth } from "@/auth";
import { prismaMock } from "@/lib/prisma-mock";
import { updateEditorPreferences } from "./editor-preferences";

const authMock = vi.mocked(auth);

const USER_ID = "user_123";

const VALID_PREFERENCES = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark" as const,
};

beforeEach(() => {
  mockReset(prismaMock);
  authMock.mockReset();
});

describe("updateEditorPreferences", () => {
  it("rejects an invalid payload before touching auth or the database", async () => {
    const result = await updateEditorPreferences({ ...VALID_PREFERENCES, fontSize: 999 });

    expect(result).toEqual({ success: false, error: "Invalid font size" });
    expect(authMock).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects when there is no signed-in user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue(null);

    const result = await updateEditorPreferences(VALID_PREFERENCES);

    expect(result).toEqual({ success: false, error: "You must be signed in to do this" });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("saves the preferences for the signed-in user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.user.update.mockResolvedValue({} as never);

    const result = await updateEditorPreferences(VALID_PREFERENCES);

    expect(result).toEqual({ success: true, data: VALID_PREFERENCES });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { editorPreferences: VALID_PREFERENCES },
    });
  });
});
