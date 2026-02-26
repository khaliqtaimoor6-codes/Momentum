/**
 * One-time script to create a TTL index on TimetableEntry.createdAt
 * so that entries auto-delete after 7 days.
 *
 * Run: npx tsx scripts/setup-ttl.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create TTL index: entries expire 7 days (604800 seconds) after createdAt
  await prisma.$runCommandRaw({
    createIndexes: "TimetableEntry",
    indexes: [
      {
        key: { createdAt: 1 },
        name: "TimetableEntry_ttl_7days",
        expireAfterSeconds: 604800, // 7 days
      },
    ],
  });
  console.log("✅ TTL index created — entries will auto-delete after 7 days");
}

main()
  .catch((e) => {
    console.error("❌ Error creating TTL index:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
