import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import type { Prisma } from "@/generated/prisma/client";

export interface CollectionTypeSummary {
  itemTypeId: string;
  icon: string;
  color: string;
  count: number;
}

export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  accentColor: string | undefined;
  types: CollectionTypeSummary[];
  updatedAt: Date;
}

type CollectionWithItems = Prisma.CollectionGetPayload<{
  include: { items: { include: { item: { include: { itemType: true } } } } };
}>;

function toCollectionSummary(collection: CollectionWithItems): CollectionSummary {
  const typeCounts = new Map<string, CollectionTypeSummary>();
  for (const { item } of collection.items) {
    const existing = typeCounts.get(item.itemType.id);
    if (existing) {
      existing.count += 1;
    } else {
      typeCounts.set(item.itemType.id, {
        itemTypeId: item.itemType.id,
        icon: item.itemType.icon,
        color: item.itemType.color,
        count: 1,
      });
    }
  }

  const sortedTypes = [...typeCounts.values()].sort((a, b) => b.count - a.count);

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: collection.items.length,
    accentColor: sortedTypes[0]?.color,
    types: sortedTypes,
    updatedAt: collection.updatedAt,
  };
}

async function queryCollectionSummaries(
  where: Prisma.CollectionWhereInput,
  take?: number,
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take,
    include: {
      items: {
        include: { item: { include: { itemType: true } } },
      },
    },
  });

  return collections.map(toCollectionSummary);
}

export async function getRecentCollections(limit = 6): Promise<CollectionSummary[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  return queryCollectionSummaries({ userId }, limit);
}

export interface SidebarCollections {
  favorites: CollectionSummary[];
  recent: CollectionSummary[];
}

export async function getSidebarCollections(recentLimit = 5): Promise<SidebarCollections> {
  const userId = await getCurrentUserId();
  if (!userId) return { favorites: [], recent: [] };

  const [favorites, recent] = await Promise.all([
    queryCollectionSummaries({ userId, isFavorite: true }),
    queryCollectionSummaries({ userId, isFavorite: false }, recentLimit),
  ]);

  return { favorites, recent };
}

export interface CollectionStats {
  total: number;
  favorites: number;
}

export async function getCollectionStats(): Promise<CollectionStats> {
  const userId = await getCurrentUserId();
  if (!userId) return { total: 0, favorites: 0 };

  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
