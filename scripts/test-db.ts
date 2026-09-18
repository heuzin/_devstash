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
}

main()
  .catch((error) => {
    console.error("❌ Database test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
