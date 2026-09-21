import { prisma } from "@/lib/prisma";

// TODO: replace with the authenticated user's id once Auth.js is wired up.
const DEMO_USER_EMAIL = "demo@devstash.io";

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

export async function getRecentCollections(limit = 6): Promise<CollectionSummary[]> {
  const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (!user) return [];

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      items: {
        include: { item: { include: { itemType: true } } },
      },
    },
  });

  return collections.map((collection) => {
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
  });
}
