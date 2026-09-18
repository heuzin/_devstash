import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const SYSTEM_ITEM_TYPES = [
  { name: "snippet", slug: "snippets", icon: "Code", color: "#3b82f6" },
  { name: "prompt", slug: "prompts", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", slug: "commands", icon: "Terminal", color: "#f97316" },
  { name: "note", slug: "notes", icon: "StickyNote", color: "#fde047" },
  { name: "file", slug: "files", icon: "File", color: "#6b7280" },
  { name: "image", slug: "images", icon: "Image", color: "#ec4899" },
  { name: "link", slug: "links", icon: "Link", color: "#10b981" },
] as const;

async function main() {
  for (const type of SYSTEM_ITEM_TYPES) {
    const existing = await prisma.itemType.findFirst({
      where: { userId: null, name: type.name },
    });

    if (existing) {
      await prisma.itemType.update({
        where: { id: existing.id },
        data: { slug: type.slug, icon: type.icon, color: type.color, isSystem: true },
      });
    } else {
      await prisma.itemType.create({
        data: { ...type, isSystem: true, userId: null },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
