import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  console.log("✅ Connected to the database");

  const itemTypes = await prisma.itemType.findMany({ orderBy: { name: "asc" } });
  console.log(`\nItem types (${itemTypes.length}):`);
  for (const type of itemTypes) {
    console.log(`- ${type.name} (${type.slug}) isSystem=${type.isSystem}`);
  }

  const user = await prisma.user.findUnique({ where: { email: "demo@devstash.io" } });
  if (!user) {
    console.log("\n⚠️  Demo user not found. Run `npm run db:seed` first.");
    return;
  }

  console.log(`\nDemo user: ${user.name} <${user.email}> isPro=${user.isPro}`);

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    include: { items: { include: { item: { include: { itemType: true } } } } },
    orderBy: { name: "asc" },
  });

  console.log(`\nCollections (${collections.length}):`);
  for (const collection of collections) {
    console.log(`\n- ${collection.name} — ${collection.description} (${collection.items.length} items)`);
    for (const { item } of collection.items) {
      console.log(`    [${item.itemType.name}] ${item.title}`);
    }
  }

  const itemCount = await prisma.item.count({ where: { userId: user.id } });
  console.log(`\nTotal items for demo user: ${itemCount}`);
}

main()
  .catch((error) => {
    console.error("❌ Database test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
