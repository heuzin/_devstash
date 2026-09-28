import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const KEEP_EMAIL = "demo@devstash.io";

async function main() {
  const confirmed = process.argv.includes("--yes");

  const usersToDelete = await prisma.user.findMany({
    where: { email: { not: KEEP_EMAIL } },
    select: { id: true, email: true, name: true },
  });

  if (usersToDelete.length === 0) {
    console.log("No users to delete. Only the demo user (or nobody) exists.");
    return;
  }

  console.log(`Users that will be deleted (${usersToDelete.length}), along with all their items, collections, tags, custom item types, accounts, and sessions:`);
  for (const user of usersToDelete) {
    console.log(`- ${user.email} (${user.name ?? "no name"})`);
  }

  if (!confirmed) {
    console.log("\nDry run only — nothing was deleted. Re-run with --yes to actually delete.");
    return;
  }

  const { count: userCount } = await prisma.user.deleteMany({
    where: { email: { not: KEEP_EMAIL } },
  });
  const { count: tokenCount } = await prisma.verificationToken.deleteMany({
    where: { identifier: { not: KEEP_EMAIL } },
  });

  console.log(`\nDeleted ${userCount} user(s) and all their content.`);
  console.log(`Deleted ${tokenCount} orphaned verification token(s).`);
}

main().finally(() => prisma.$disconnect());
