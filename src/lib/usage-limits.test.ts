import { afterEach, describe, expect, it, vi } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("@/lib/prisma"); // picks up src/lib/__mocks__/prisma.ts

const USER_ID = "user_123";

// The module reads ENFORCE_PLAN_LIMITS into a module-level constant at import
// time, so each scenario needs a fresh module instance. Resetting modules also
// re-creates the prisma mock, so it's imported alongside the module under test.
async function loadUsageLimits(enforce: string | undefined) {
  vi.stubEnv("ENFORCE_PLAN_LIMITS", enforce);
  vi.resetModules();
  const { prismaMock } = await import("@/lib/prisma-mock");
  mockReset(prismaMock);
  const usageLimits = await import("./usage-limits");
  return { prismaMock, ...usageLimits };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isPlanLimitEnforced", () => {
  it("is enforced only when the env var is exactly \"true\"", async () => {
    const { isPlanLimitEnforced } = await loadUsageLimits("true");
    expect(isPlanLimitEnforced()).toBe(true);
  });

  it.each([
    ["unset", undefined],
    ["\"false\"", "false"],
    ["wrong-case \"TRUE\"", "TRUE"],
  ])("is not enforced when the env var is %s", async (_label, value) => {
    const { isPlanLimitEnforced } = await loadUsageLimits(value);
    expect(isPlanLimitEnforced()).toBe(false);
  });
});

describe("canUsePro", () => {
  it("allows everyone when limits aren't enforced", async () => {
    const { canUsePro } = await loadUsageLimits(undefined);
    expect(canUsePro({ isPro: false })).toBe(true);
    expect(canUsePro({ isPro: true })).toBe(true);
  });

  it("allows only Pro users when limits are enforced", async () => {
    const { canUsePro } = await loadUsageLimits("true");
    expect(canUsePro({ isPro: false })).toBe(false);
    expect(canUsePro({ isPro: true })).toBe(true);
  });
});

describe("assertCanCreateItem", () => {
  it("allows a free user below the limit", async () => {
    const { assertCanCreateItem, prismaMock } = await loadUsageLimits("true");
    prismaMock.user.findUnique.mockResolvedValue({ isPro: false } as never);
    prismaMock.item.count.mockResolvedValue(49);

    await expect(assertCanCreateItem(USER_ID)).resolves.toBeUndefined();
    expect(prismaMock.item.count).toHaveBeenCalledWith({ where: { userId: USER_ID } });
  });

  it.each([50, 51])("rejects a free user with %i items", async (count) => {
    const { assertCanCreateItem, prismaMock } = await loadUsageLimits("true");
    prismaMock.user.findUnique.mockResolvedValue({ isPro: false } as never);
    prismaMock.item.count.mockResolvedValue(count);

    await expect(assertCanCreateItem(USER_ID)).rejects.toThrow(
      "Free plan is limited to 50 items. Upgrade to Pro for unlimited items.",
    );
  });

  it("treats a missing user as free", async () => {
    const { assertCanCreateItem, prismaMock } = await loadUsageLimits("true");
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.item.count.mockResolvedValue(50);

    await expect(assertCanCreateItem(USER_ID)).rejects.toThrow("limited to 50 items");
    expect(prismaMock.item.count).toHaveBeenCalled();
  });
});

describe("assertCanCreateCollection", () => {
  it("allows a free user below the limit", async () => {
    const { assertCanCreateCollection, prismaMock } = await loadUsageLimits("true");
    prismaMock.user.findUnique.mockResolvedValue({ isPro: false } as never);
    prismaMock.collection.count.mockResolvedValue(2);

    await expect(assertCanCreateCollection(USER_ID)).resolves.toBeUndefined();
    expect(prismaMock.collection.count).toHaveBeenCalledWith({ where: { userId: USER_ID } });
  });

  it("rejects a free user at the limit", async () => {
    const { assertCanCreateCollection, prismaMock } = await loadUsageLimits("true");
    prismaMock.user.findUnique.mockResolvedValue({ isPro: false } as never);
    prismaMock.collection.count.mockResolvedValue(3);

    await expect(assertCanCreateCollection(USER_ID)).rejects.toThrow(
      "Free plan is limited to 3 collections. Upgrade to Pro for unlimited collections.",
    );
  });
});

describe("Pro and unenforced bypass", () => {
  it("skips the count queries for a Pro user", async () => {
    const { assertCanCreateItem, assertCanCreateCollection, prismaMock } =
      await loadUsageLimits("true");
    prismaMock.user.findUnique.mockResolvedValue({ isPro: true } as never);

    await expect(assertCanCreateItem(USER_ID)).resolves.toBeUndefined();
    await expect(assertCanCreateCollection(USER_ID)).resolves.toBeUndefined();
    expect(prismaMock.item.count).not.toHaveBeenCalled();
    expect(prismaMock.collection.count).not.toHaveBeenCalled();
  });

  it("skips the isPro and count queries when limits aren't enforced", async () => {
    const { assertCanCreateItem, assertCanCreateCollection, prismaMock } =
      await loadUsageLimits(undefined);

    await expect(assertCanCreateItem(USER_ID)).resolves.toBeUndefined();
    await expect(assertCanCreateCollection(USER_ID)).resolves.toBeUndefined();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.item.count).not.toHaveBeenCalled();
    expect(prismaMock.collection.count).not.toHaveBeenCalled();
  });
});

describe("assertCanUseProFeature", () => {
  it("rejects a free user when limits are enforced, naming the feature", async () => {
    const { assertCanUseProFeature, prismaMock } = await loadUsageLimits("true");
    prismaMock.user.findUnique.mockResolvedValue({ isPro: false } as never);

    await expect(assertCanUseProFeature(USER_ID, "File uploads")).rejects.toThrow(
      "File uploads is a Pro feature. Upgrade in Settings to unlock it.",
    );
  });

  it("allows a Pro user when limits are enforced", async () => {
    const { assertCanUseProFeature, prismaMock } = await loadUsageLimits("true");
    prismaMock.user.findUnique.mockResolvedValue({ isPro: true } as never);

    await expect(assertCanUseProFeature(USER_ID, "File uploads")).resolves.toBeUndefined();
  });

  it("allows everyone when limits aren't enforced", async () => {
    const { assertCanUseProFeature, prismaMock } = await loadUsageLimits(undefined);

    await expect(assertCanUseProFeature(USER_ID, "File uploads")).resolves.toBeUndefined();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });
});
