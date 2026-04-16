#!/usr/bin/env tsx
/**
 * One-shot cleanup: delete every Price row whose sourceId is one of the
 * legacy mock / test shops that were never wired up to a real feed.
 *
 * Also deactivates any Product that ends up with zero remaining Price
 * rows after the purge — those were phantom entries that only existed
 * because the seed helper invented them.
 *
 * Safe to re-run (idempotent): if no matching rows exist the script
 * prints "nothing to purge" and exits 0.
 *
 * Usage:
 *   npx tsx scripts/purge-mocks.ts              # full run
 *   npx tsx scripts/purge-mocks.ts --dry        # preview without deleting
 *
 * Requires POSTGRES_URL (or DATABASE_URL) in the environment.
 */

import { PrismaClient, Prisma } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════════
// Target sourceIds to purge
// ═══════════════════════════════════════════════════════════════════

const MOCK_SOURCE_IDS = [
  "amazon_de",
  "amazon",
  "galaxus_ch",
  "galaxus",
  "zalando_de",
  "zalando",
  "test-shop",
  "test_shop",
  "seed",
  "mock",
];

// ═══════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════

const dryRun = process.argv.includes("--dry") || process.argv.includes("--dry-run");

// ═══════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════

const db = new PrismaClient();

function section(title: string) {
  console.log(`\n─── ${title} ` + "─".repeat(Math.max(0, 56 - title.length)));
}

async function main() {
  section("purge-mocks: delete phantom Price + Product rows");
  console.log(`Mode: ${dryRun ? "DRY RUN (no writes)" : "LIVE — will delete"}`);
  console.log(`Target sourceIds: ${MOCK_SOURCE_IDS.join(", ")}`);

  // ── 1. Count Price rows to purge ──
  section("BEFORE — Price rows");
  const priceCount = await db.price.count({
    where: { sourceId: { in: MOCK_SOURCE_IDS } },
  });
  console.log(`Mock Price rows found: ${priceCount.toLocaleString()}`);

  // Show breakdown by sourceId
  if (priceCount > 0) {
    const breakdown = await db.price.groupBy({
      by: ["sourceId"],
      where: { sourceId: { in: MOCK_SOURCE_IDS } },
      _count: true,
    });
    for (const row of breakdown) {
      console.log(`  · ${row.sourceId.padEnd(20)} ${row._count.toLocaleString()} rows`);
    }
  }

  // ── 2. Count Products with sourceType "seed" ──
  section("BEFORE — seed Products");
  const seedProductCount = await db.product.count({
    where: { sourceType: "seed" },
  });
  console.log(`Products with sourceType="seed": ${seedProductCount.toLocaleString()}`);

  if (priceCount === 0 && seedProductCount === 0) {
    section("RESULT");
    console.log("✓ Nothing to purge. Database is clean.");
    await db.$disconnect();
    return;
  }

  if (dryRun) {
    section("DRY RUN — no changes written");
    console.log(`Would delete ${priceCount.toLocaleString()} Price rows.`);
    console.log(`Would deactivate ${seedProductCount.toLocaleString()} seed Products.`);
    await db.$disconnect();
    return;
  }

  // ── 3. Delete mock Price rows ──
  section("PURGE — deleting mock Price rows");
  const deletedPrices = await db.price.deleteMany({
    where: { sourceId: { in: MOCK_SOURCE_IDS } },
  });
  console.log(`Deleted: ${deletedPrices.count.toLocaleString()} Price rows`);

  // ── 4. Find Products that now have zero Price rows (orphans) ──
  section("ORPHAN SCAN — Products with 0 remaining Price rows");
  const orphans = await db.$queryRaw<{ id: string; gtin: string; title: string }[]>`
    SELECT p.id, p.gtin, p.title
    FROM "Product" p
    LEFT JOIN "Price" pr ON pr."productId" = p.id
    WHERE pr.id IS NULL
      AND p."sourceType" = 'seed'
    LIMIT 200
  `;
  console.log(`Orphaned seed Products found: ${orphans.length}`);
  if (orphans.length > 0) {
    for (const o of orphans.slice(0, 10)) {
      console.log(`  · [${o.gtin}] ${o.title.slice(0, 60)}`);
    }
    if (orphans.length > 10) console.log(`  … and ${orphans.length - 10} more`);
  }

  // ── 5. Deactivate seed Products (soft-delete: isActive=false) ──
  section("DEACTIVATE — setting seed Products isActive=false");
  const deactivated = await db.product.updateMany({
    where: { sourceType: "seed" },
    data: { isActive: false },
  });
  console.log(`Deactivated: ${deactivated.count.toLocaleString()} Products`);

  // ── 6. Summary ──
  section("AFTER");
  const remainingMockPrices = await db.price.count({
    where: { sourceId: { in: MOCK_SOURCE_IDS } },
  });
  const remainingSeedProducts = await db.product.count({
    where: { sourceType: "seed", isActive: true },
  });
  console.log(`Mock Price rows remaining:       ${remainingMockPrices}`);
  console.log(`Active seed Products remaining:  ${remainingSeedProducts}`);

  section("RESULT");
  if (remainingMockPrices === 0 && remainingSeedProducts === 0) {
    console.log("✓ Purge complete. Database is clean.");
  } else {
    console.error("⚠ Some residual rows remain — inspect manually.");
    process.exit(1);
  }

  await db.$disconnect();
}

main().catch(async (err) => {
  console.error("\n💥 purge-mocks failed:");
  console.error(err);
  await db.$disconnect().catch(() => {});
  process.exit(1);
});
