import { prisma } from "@/lib/prisma";

const ENFORCE_PLAN_LIMITS = process.env.ENFORCE_PLAN_LIMITS === "true";

export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;

export function isPlanLimitEnforced() {
  return ENFORCE_PLAN_LIMITS;
}

export function canUsePro(user: { isPro: boolean }) {
  return !ENFORCE_PLAN_LIMITS || user.isPro;
}

async function getIsPro(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPro: true } });
  return user?.isPro ?? false;
}

async function userCanUsePro(userId: string): Promise<boolean> {
  if (!ENFORCE_PLAN_LIMITS) return true;
  return canUsePro({ isPro: await getIsPro(userId) });
}

export async function assertCanUseProFeature(userId: string, feature: string) {
  if (await userCanUsePro(userId)) return;
  throw new Error(`${feature} is a Pro feature. Upgrade in Settings to unlock it.`);
}

export async function assertCanCreateItem(userId: string) {
  if (await userCanUsePro(userId)) return;
  const count = await prisma.item.count({ where: { userId } });
  if (count >= FREE_ITEM_LIMIT) {
    throw new Error(
      `Free plan is limited to ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`,
    );
  }
}

export async function assertCanCreateCollection(userId: string) {
  if (await userCanUsePro(userId)) return;
  const count = await prisma.collection.count({ where: { userId } });
  if (count >= FREE_COLLECTION_LIMIT) {
    throw new Error(
      `Free plan is limited to ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`,
    );
  }
}
