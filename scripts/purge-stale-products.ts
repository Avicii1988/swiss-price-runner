#!/usr/bin/env tsx
/**
 * Purge stale products — deletes any Product (and its cascading Price /
 * UserAlert rows) that has NOT been updated by the importer in the last
 * `--days N` days (default 3).
 *
 * Run after every nightly import cycle to keep the catalogue lean:
 *   npx tsx scripts/purge-stale-products.ts [--days 3] [--dry-run]
 *
 * Safety notes:
 *   - --dry-run prints counts WITHOUT deleting anything
 *   - Cascade deletes are handled by the FK constraints in schema.prisma
 *     (Price and UserAlert both use onDelete: Cascade)
 *   - Runs ANALYZE on the three hot tables after deletion so the query
 *     planner immediately sees the reduced row counts
 *   - DOES NOT run VACUUM (requires superuser on Supabase; autovacuum
 *     handles dead-tuple reclamation automatically)
 */

import { PrismaClient } from "@prisma/client";

// ── CLI args ──────────────────────────────────────────────────────
function parseArgs(): { days: number; dryRun: boolean } {
  const args = process.argv.slice(2);
  let days = 3;
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--days" && args[i + 1]) days = parseInt(args[++i], 10);
    if (args[i] === "--dry-run") dryRun = true;
  }
  if (isNaN(days) || days < 1) {
    console.error("--days must be a positive integer");
    process.exit(1);
  }
  return { days, dryRun };
}

async function main() {
  const { days, dryRun } = parseArgs();
  const db = new PrismaClient();
  console.time("purge");

  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    console.log(
      `\n🗑️  Purge stale products${dryRun ? " (DRY RUN)" : ""}` +
      ` — threshold: ${days} days (before ${cutoff.toISOString()})\n`,
    );

    // ── 1. Count before ─────────────────────────────────────────
    const [totalProducts, staleProducts, stalePrices, staleAlerts] =
      await Promise.all([
        db.product.count(),
        db.product.count({ where: { updatedAt: { lt: cutoff } } }),
        db.price.count({
          where: { product: { updatedAt: { lt: cutoff } } },
        }),
        db.userAlert.count({
          where: { product: { updatedAt: { lt: cutoff } } },
        }),
      ]);

    console.log(`  Products total   : ${totalProducts.toLocaleString()}`);
    console.log(`  Stale products   : ${staleProducts.toLocaleString()} (${Math.round(staleProducts / totalProducts * 100)}%)`);
    console.log(`  Stale prices     : ${stalePrices.toLocaleString()}`);
    console.log(`  Stale user alerts: ${staleAlerts.toLocaleString()}`);

    if (staleProducts === 0) {
      console.log("\n✅ Nothing to purge.");
      return;
    }

    if (dryRun) {
      console.log("\n⚠️  DRY RUN — no rows deleted. Re-run without --dry-run to apply.");
      return;
    }

    // ── 2. Delete — cascade handles Price + UserAlert ───────────
    // We delete in chunks of 1000 to avoid a single enormous DELETE
    // statement that would lock the table and spike CPU on Nano.
    const CHUNK = 1_000;
    let deleted = 0;

    console.log(`\n  Deleting in chunks of ${CHUNK}…`);
    while (true) {
      // Find the next chunk of stale IDs
      const ids = await db.product.findMany({
        where: { updatedAt: { lt: cutoff } },
        select: { id: true },
        take: CHUNK,
      });
      if (ids.length === 0) break;

      const { count } = await db.product.deleteMany({
        where: { id: { in: ids.map((r) => r.id) } },
      });
      deleted += count;
      process.stdout.write(`\r  Deleted: ${deleted.toLocaleString()} / ${staleProducts.toLocaleString()}`);

      // Brief pause between chunks — let PgBouncer breathe
      await new Promise((r) => setTimeout(r, 200));
    }
    console.log(); // newline after the \r progress line

    // ── 3. ANALYZE — update planner statistics immediately ───────
    // VACUUM is intentionally omitted: it requires superuser on
    // Supabase and autovacuum handles dead tuple reclamation. ANALYZE
    // is safe with any user and gives the planner correct row-count
    // estimates right away.
    console.log("\n  Running ANALYZE on hot tables…");
    await db.$executeRawUnsafe(`ANALYZE "Product"`);
    await db.$executeRawUnsafe(`ANALYZE "Price"`);
    await db.$executeRawUnsafe(`ANALYZE "UserAlert"`);
    console.log("  ANALYZE complete.");

    // ── 4. Summary ───────────────────────────────────────────────
    const remaining = await db.product.count();
    console.log(`
🎉 Purge complete
   Deleted : ${deleted.toLocaleString()} products (+ cascaded prices + alerts)
   Remaining: ${remaining.toLocaleString()} products
   Reduction: ${Math.round((deleted / (deleted + remaining)) * 100)}%
`);
  } finally {
    await db.$disconnect();
    console.timeEnd("purge");
  }
}

main().catch((e) => {
  console.error("💥 Fatal:", e);
  process.exit(1);
});
