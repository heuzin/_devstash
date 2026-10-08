import bcryptjs from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("@/lib/prisma"); // picks up src/lib/__mocks__/prisma.ts

import { auth, signOut } from "@/auth";
import { prismaMock } from "@/lib/prisma-mock";
import { changePassword, deleteAccount } from "./profile";

const authMock = vi.mocked(auth);
const signOutMock = vi.mocked(signOut);

const USER_ID = "user_123";
const CURRENT_PASSWORD = "correct-current-password";
// Hashed once up front — bcrypt at 12 rounds is slow, and the hash itself
// doesn't vary between tests.
const CURRENT_PASSWORD_HASH = bcryptjs.hashSync(CURRENT_PASSWORD, 12);

beforeEach(() => {
  mockReset(prismaMock);
  authMock.mockReset();
  signOutMock.mockReset();
});

describe("changePassword", () => {
  it("rejects when the new passwords don't match, before touching auth or the database", async () => {
    const result = await changePassword(CURRENT_PASSWORD, "newpassword1", "different");

    expect(result).toEqual({ success: false, error: "Passwords do not match" });
    expect(authMock).not.toHaveBeenCalled();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects when there is no signed-in user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue(null);

    const result = await changePassword(CURRENT_PASSWORD, "newpassword1", "newpassword1");

    expect(result).toEqual({ success: false, error: "You must be signed in to do this" });
  });

  it("rejects GitHub-only accounts that have no password set", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.user.findUnique.mockResolvedValue({ password: null } as never);

    const result = await changePassword(CURRENT_PASSWORD, "newpassword1", "newpassword1");

    expect(result).toEqual({ success: false, error: "This account does not use a password" });
  });

  it("rejects an incorrect current password", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.user.findUnique.mockResolvedValue({ password: CURRENT_PASSWORD_HASH } as never);

    const result = await changePassword("wrong-current-password", "newpassword1", "newpassword1");

    expect(result).toEqual({ success: false, error: "Current password is incorrect" });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("hashes and saves the new password when the current password is correct", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    prismaMock.user.findUnique.mockResolvedValue({ password: CURRENT_PASSWORD_HASH } as never);

    const result = await changePassword(CURRENT_PASSWORD, "newpassword1", "newpassword1");

    expect(result).toEqual({ success: true });
    expect(prismaMock.user.update).toHaveBeenCalledTimes(1);

    const updateArgs = prismaMock.user.update.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: USER_ID });
    expect(updateArgs.data.password).not.toBe(CURRENT_PASSWORD_HASH);
    await expect(bcryptjs.compare("newpassword1", updateArgs.data.password as string)).resolves.toBe(
      true,
    );
  });
});

describe("deleteAccount", () => {
  it("rejects when there is no signed-in user", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue(null);

    const result = await deleteAccount();

    expect(result).toEqual({ success: false, error: "You must be signed in to do this" });
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it("deletes the user row and signs out when signed in", async () => {
    // @ts-expect-error -- only the fields the action reads are relevant here
    authMock.mockResolvedValue({ user: { id: USER_ID } });

    const result = await deleteAccount();

    expect(result).toEqual({ success: true });
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: USER_ID } });
    expect(signOutMock).toHaveBeenCalledWith({ redirectTo: "/" });
  });
});
