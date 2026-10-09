import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import type { ContentType } from "@/generated/prisma/client";
import type { UpdateItemInput } from "@/lib/validations/items";

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

export async function getDashboardItems(
  recentLimit = 10,
  pinnedLimit = 20,
): Promise<DashboardItems> {
  const userId = await getCurrentUserId();
  if (!userId) return { pinned: [], recent: [] };

  const [pinned, recent] = await Promise.all([
    prisma.item.findMany({
      where: { userId, isPinned: true },
      orderBy: { updatedAt: "desc" },
      take: pinnedLimit,
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

export interface ItemsByType {
  itemType: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
  items: ItemSummary[];
}

export async function getItemsByTypeSlug(slug: string): Promise<ItemsByType | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const itemType = await prisma.itemType.findFirst({
    where: { slug, isSystem: true },
  });
  if (!itemType) return null;

  const items = await prisma.item.findMany({
    where: { userId, itemTypeId: itemType.id },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    include: { itemType: true, tags: true },
  });

  return {
    itemType: {
      id: itemType.id,
      name: itemType.name,
      slug: itemType.slug,
      icon: itemType.icon,
      color: itemType.color,
    },
    items: items.map(toItemSummary),
  };
}

export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  contentType: ContentType;
  content: string | null;
  language: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  itemType: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
  collections: { id: string; name: string }[];
}

const itemDetailInclude = {
  itemType: true,
  tags: true,
  collections: { include: { collection: true } },
} as const;

type ItemDetailRow = NonNullable<
  Awaited<ReturnType<typeof prisma.item.findFirst<{ include: typeof itemDetailInclude }>>>
>;

function toItemDetail(item: ItemDetailRow): ItemDetail {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    contentType: item.contentType,
    content: item.content,
    language: item.language,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tags: item.tags.map((tag) => tag.name),
    itemType: {
      id: item.itemType.id,
      name: item.itemType.name,
      slug: item.itemType.slug,
      icon: item.itemType.icon,
      color: item.itemType.color,
    },
    collections: item.collections.map(({ collection }) => ({
      id: collection.id,
      name: collection.name,
    })),
  };
}

export async function getItemDetail(id: string): Promise<ItemDetail | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const item = await prisma.item.findFirst({
    where: { id, userId },
    include: itemDetailInclude,
  });
  if (!item) return null;

  return toItemDetail(item);
}

export async function updateItem(
  userId: string,
  itemId: string,
  data: UpdateItemInput,
): Promise<ItemDetail | null> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });
  if (!existing) return null;

  const item = await prisma.item.update({
    where: { id: itemId },
    data: {
      title: data.title,
      description: data.description ?? null,
      content: data.content ?? null,
      url: data.url ?? null,
      language: data.language ?? null,
      tags: {
        set: [],
        connectOrCreate: data.tags.map((name) => ({
          where: { userId_name: { userId, name } },
          create: { name, userId },
        })),
      },
    },
    include: itemDetailInclude,
  });

  return toItemDetail(item);
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

export interface ItemTypeSummary {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  count: number;
}

// ItemType has no timestamp to order by; mirrors the display order from
// prisma/seed.ts (SYSTEM_ITEM_TYPES).
const SYSTEM_TYPE_ORDER = ["snippet", "prompt", "command", "note", "file", "image", "link"];

export async function getItemTypesWithCounts(): Promise<ItemTypeSummary[]> {
  const userId = await getCurrentUserId();

  const itemTypes = await prisma.itemType.findMany({
    where: { isSystem: true },
    include: {
      _count: { select: { items: { where: { userId: userId ?? "" } } } },
    },
  });

  const sorted = [...itemTypes].sort(
    (a, b) => SYSTEM_TYPE_ORDER.indexOf(a.name) - SYSTEM_TYPE_ORDER.indexOf(b.name),
  );

  return sorted.map((type) => ({
    id: type.id,
    name: type.name,
    slug: type.slug,
    icon: type.icon,
    color: type.color,
    count: type._count.items,
  }));
}
