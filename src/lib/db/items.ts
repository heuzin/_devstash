import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import type { ContentType } from "@/generated/prisma/client";
import type { CreateItemInput, UpdateItemInput } from "@/lib/validations/items";
import { CREATABLE_ITEM_TYPE_NAMES, UPLOAD_TYPE_NAMES, URL_TYPE_NAMES } from "@/lib/item-types";
import { R2_PUBLIC_URL, deleteFromR2, keyFromFileUrl } from "@/lib/r2";
import {
  DASHBOARD_RECENT_ITEMS_LIMIT,
  ITEMS_PER_PAGE,
  clampPage,
  getTotalPages,
  type PaginationMeta,
} from "@/lib/pagination";

export interface ItemSummary {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  tags: string[];
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  itemType: {
    name: string;
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
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  itemType: { name: string; icon: string; color: string };
}): ItemSummary {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    tags: item.tags.map((tag) => tag.name),
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    itemType: { name: item.itemType.name, icon: item.itemType.icon, color: item.itemType.color },
  };
}

export interface DashboardItems {
  pinned: ItemSummary[];
  recent: ItemSummary[];
}

export async function getDashboardItems(
  recentLimit = DASHBOARD_RECENT_ITEMS_LIMIT,
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
  pagination: PaginationMeta;
}

export async function getItemsByTypeSlug(slug: string, page = 1): Promise<ItemsByType | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const itemType = await prisma.itemType.findFirst({
    where: { slug, isSystem: true },
  });
  if (!itemType) return null;

  const where = { userId, itemTypeId: itemType.id };
  const totalCount = await prisma.item.count({ where });
  const totalPages = getTotalPages(totalCount, ITEMS_PER_PAGE);
  const currentPage = clampPage(page, totalPages);

  const items = await prisma.item.findMany({
    where,
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
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
    pagination: { page: currentPage, totalPages, totalCount },
  };
}

export interface CollectionItems {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
  items: ItemSummary[];
  pagination: PaginationMeta;
}

export async function getCollectionItems(
  collectionId: string,
  page = 1,
): Promise<CollectionItems | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true, name: true, description: true, isFavorite: true },
  });
  if (!collection) return null;

  const where = { userId, collections: { some: { collectionId } } };
  const totalCount = await prisma.item.count({ where });
  const totalPages = getTotalPages(totalCount, ITEMS_PER_PAGE);
  const currentPage = clampPage(page, totalPages);

  const items = await prisma.item.findMany({
    where,
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: { itemType: true, tags: true },
  });

  return {
    collection,
    items: items.map(toItemSummary),
    pagination: { page: currentPage, totalPages, totalCount },
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

async function filterOwnedCollectionIds(
  userId: string,
  collectionIds: string[],
): Promise<string[]> {
  if (collectionIds.length === 0) return [];

  const owned = await prisma.collection.findMany({
    where: { userId, id: { in: collectionIds } },
    select: { id: true },
  });
  return owned.map((collection) => collection.id);
}

export async function createItem(userId: string, data: CreateItemInput): Promise<ItemDetail> {
  const itemType = await prisma.itemType.findFirst({
    where: { id: data.itemTypeId, isSystem: true },
  });
  if (!itemType || !CREATABLE_ITEM_TYPE_NAMES.has(itemType.name)) {
    throw new Error("Invalid item type");
  }

  const isUrlType = URL_TYPE_NAMES.has(itemType.name);
  if (isUrlType && !data.url) {
    throw new Error("URL is required for links");
  }

  const isUploadType = UPLOAD_TYPE_NAMES.has(itemType.name);
  if (isUploadType) {
    if (!data.fileUrl || !data.fileName || !data.fileSize) {
      throw new Error("A file upload is required for this type");
    }
    if (!data.fileUrl.startsWith(`${R2_PUBLIC_URL}/`)) {
      throw new Error("Invalid file upload");
    }
  }

  const contentType: ContentType = isUrlType ? "URL" : isUploadType ? "FILE" : "TEXT";
  const ownedCollectionIds = await filterOwnedCollectionIds(userId, data.collectionIds);

  const item = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      contentType,
      content: isUrlType || isUploadType ? null : (data.content ?? null),
      url: isUrlType ? data.url : null,
      language: data.language ?? null,
      fileUrl: isUploadType ? data.fileUrl : null,
      fileName: isUploadType ? data.fileName : null,
      fileSize: isUploadType ? data.fileSize : null,
      userId,
      itemTypeId: itemType.id,
      tags: {
        connectOrCreate: data.tags.map((name) => ({
          where: { userId_name: { userId, name } },
          create: { name, userId },
        })),
      },
      collections: {
        create: ownedCollectionIds.map((collectionId) => ({ collectionId })),
      },
    },
    include: itemDetailInclude,
  });

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

  const ownedCollectionIds = await filterOwnedCollectionIds(userId, data.collectionIds);

  const item = await prisma.$transaction(async (tx) => {
    await tx.itemCollection.deleteMany({
      where: { itemId, collectionId: { notIn: ownedCollectionIds } },
    });
    await tx.itemCollection.createMany({
      data: ownedCollectionIds.map((collectionId) => ({ itemId, collectionId })),
      skipDuplicates: true,
    });

    return tx.item.update({
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
  });

  return toItemDetail(item);
}

export async function deleteItem(userId: string, itemId: string): Promise<boolean> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true, contentType: true, fileUrl: true },
  });
  if (!existing) return false;

  await prisma.item.delete({ where: { id: itemId } });

  if (existing.contentType === "FILE" && existing.fileUrl) {
    const key = keyFromFileUrl(existing.fileUrl);
    if (key) {
      await deleteFromR2(key).catch((error) => {
        console.error("Failed to delete R2 object for item", itemId, error);
      });
    }
  }

  return true;
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

export interface SearchItem {
  id: string;
  title: string;
  contentPreview: string | null;
  itemType: {
    name: string;
    icon: string;
    color: string;
  };
}

const CONTENT_PREVIEW_MAX_LENGTH = 140;

export async function getSearchItems(): Promise<SearchItem[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      url: true,
      itemType: { select: { name: true, icon: true, color: true } },
    },
  });

  return items.map((item) => {
    const preview = item.description ?? item.content ?? item.url ?? null;
    return {
      id: item.id,
      title: item.title,
      contentPreview: preview ? preview.slice(0, CONTENT_PREVIEW_MAX_LENGTH) : null,
      itemType: item.itemType,
    };
  });
}
