import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/db/user";

export interface ItemSummary {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  tags: string[];
  itemType: {
    icon: string;
    color: string;
  };
}

function toItemSummary(item: {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  tags: { name: string }[];
  itemType: { icon: string; color: string };
}): ItemSummary {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    tags: item.tags.map((tag) => tag.name),
    itemType: { icon: item.itemType.icon, color: item.itemType.color },
  };
}

export interface DashboardItems {
  pinned: ItemSummary[];
  recent: ItemSummary[];
}

export async function getDashboardItems(recentLimit = 10): Promise<DashboardItems> {
  const userId = await getCurrentUserId();
  if (!userId) return { pinned: [], recent: [] };

  const [pinned, recent] = await Promise.all([
    prisma.item.findMany({
      where: { userId, isPinned: true },
      orderBy: { updatedAt: "desc" },
      include: { itemType: true, tags: true },
    }),
    prisma.item.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: recentLimit,
      include: { itemType: true, tags: true },
    }),
  ]);

  return {
    pinned: pinned.map(toItemSummary),
    recent: recent.map(toItemSummary),
  };
}

export interface ItemStats {
  total: number;
  favorites: number;
}

export async function getItemStats(): Promise<ItemStats> {
  const userId = await getCurrentUserId();
  if (!userId) return { total: 0, favorites: 0 };

  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
