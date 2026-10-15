import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import type { Prisma } from "@/generated/prisma/client";
import type { CreateCollectionInput, UpdateCollectionInput } from "@/lib/validations/collections";

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

type CollectionWithItemTypes = Prisma.CollectionGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    isFavorite: true;
    updatedAt: true;
    items: { select: { item: { select: { itemType: { select: { id: true; icon: true; color: true } } } } } };
  };
}>;

function toCollectionSummary(collection: CollectionWithItemTypes): CollectionSummary {
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
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      updatedAt: true,
      items: {
        select: { item: { select: { itemType: { select: { id: true, icon: true, color: true } } } } },
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

export async function getAllCollections(): Promise<CollectionSummary[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  return queryCollectionSummaries({ userId });
}

export interface SidebarCollections {
  favorites: CollectionSummary[];
  recent: CollectionSummary[];
}

export async function getSidebarCollections(
  recentLimit = 5,
  favoritesLimit = 10,
): Promise<SidebarCollections> {
  const userId = await getCurrentUserId();
  if (!userId) return { favorites: [], recent: [] };

  const [favorites, recent] = await Promise.all([
    queryCollectionSummaries({ userId, isFavorite: true }, favoritesLimit),
    queryCollectionSummaries({ userId, isFavorite: false }, recentLimit),
  ]);

  return { favorites, recent };
}

export interface CollectionOption {
  id: string;
  name: string;
}

export async function getCollectionOptions(): Promise<CollectionOption[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
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

export async function createCollection(
  userId: string,
  data: CreateCollectionInput,
): Promise<CollectionSummary> {
  const collection = await prisma.collection.create({
    data: {
      userId,
      name: data.name,
      description: data.description ?? null,
    },
  });

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: 0,
    accentColor: undefined,
    types: [],
    updatedAt: collection.updatedAt,
  };
}

const COLLECTION_SUMMARY_SELECT = {
  id: true,
  name: true,
  description: true,
  isFavorite: true,
  updatedAt: true,
  items: {
    select: { item: { select: { itemType: { select: { id: true, icon: true, color: true } } } } },
  },
} satisfies Prisma.CollectionSelect;

export async function updateCollection(
  userId: string,
  collectionId: string,
  data: UpdateCollectionInput,
): Promise<CollectionSummary | null> {
  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });
  if (!existing) return null;

  const collection = await prisma.collection.update({
    where: { id: collectionId },
    data: {
      name: data.name,
      description: data.description ?? null,
    },
    select: COLLECTION_SUMMARY_SELECT,
  });

  return toCollectionSummary(collection);
}

export async function deleteCollection(userId: string, collectionId: string): Promise<boolean> {
  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.collection.delete({ where: { id: collectionId } });

  return true;
}
