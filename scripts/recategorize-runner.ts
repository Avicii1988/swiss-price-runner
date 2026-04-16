#!/usr/bin/env tsx
/**
 * Standalone recategorize runner — re-maps every existing Product to the
 * new 3-level category taxonomy based on lib/category-rules.ts.
 *
 * Runs in GitHub Actions (or any Node env with DATABASE_URL set).
 *
 * Usage:
 *   npx tsx scripts/recategorize-runner.ts              # full scan
 *   npx tsx scripts/recategorize-runner.ts --batch 5000 # batch size (default 5000)
 *   npx tsx scripts/recategorize-runner.ts --dry        # no DB writes, log diffs
 *   npx tsx scripts/recategorize-runner.ts --only parfum # limit to current category
 *
 * For every product:
 *   1. Load title + brand + description + categoryName and hand the
 *      combined haystack to resolveCategoryForExisting. The description
 *      column was added so luxury brand signals that live in marketing
 *      copy (e.g. "Tom Ford Noir — A woody oriental …") finally reach
 *      the pattern scanner even when the product title is truncated.
 *   2. If the resulting leaf differs from Product.category → queue an UPDATE
 *   3. Upsert all ancestor Category rows (parentId linked)
 *   4. Commit: 1 multi-row UPDATE via VALUES join + 1 ensureCategories call
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { resolveCategoryForExisting } from "../lib/category-rules";

// ═══════════════════════════════════════════════════════════════════
// CLI argument parsing
// ═══════════════════════════════════════════════════════════════════

interface Args {
  batch: number;
  dryRun: boolean;
  only: string | null;
  limit: number | null; // hard cap total products scanned
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let batch = 5000;
  let dryRun = false;
  let only: string | null = null;
  let limit: number | null = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch") batch = parseInt(args[++i], 10);
    else if (args[i] === "--dry" || args[i] === "--dry-run") dryRun = true;
    else if (args[i] === "--only") only = args[++i];
    else if (args[i] === "--limit") limit = parseInt(args[++i], 10);
  }
  return { batch, dryRun, only, limit };
}

// ═══════════════════════════════════════════════════════════════════
// ensureCategories — identical logic to the importer, kept local here
// to avoid circular deps with the runner file.
// ═══════════════════════════════════════════════════════════════════

function titleCase(slug: string): string {
  return slug.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

async function ensureCategories(
  db: PrismaClient,
  pairs: Iterable<{ path: string[]; name: string }>,
): Promise<void> {
  const byDepth = new Map<number, Map<string, { name: string; parent: string | null }>>();
  for (const { path, name } of pairs) {
    for (let i = 0; i < path.length; i++) {
      const slug = path[i];
      const parent = i === 0 ? null : path[i - 1];
      const isLeaf = i === path.length - 1;
      const level = byDepth.get(i) ?? new Map();
      const prev = level.get(slug);
      const effectiveName = isLeaf ? name : prev?.name ?? titleCase(slug);
      level.set(slug, { name: effectiveName, parent });
      byDepth.set(i, level);
    }
  }
  if (byDepth.size === 0) return;

  const maxDepth = Math.max(...byDepth.keys());
  for (let depth = 0; depth <= maxDepth; depth++) {
    const level = byDepth.get(depth);
    if (!level || level.size === 0) continue;

    const rows = Prisma.join(
      Array.from(level.entries()).map(([slug, { name, parent }]) =>
        parent === null
          ? Prisma.sql`(${generateId()}, ${name}, ${slug}, NULL, ${depth}, NOW())`
          : Prisma.sql`(${generateId()}, ${name}, ${slug}, (SELECT id FROM "Category" WHERE slug = ${parent} LIMIT 1), ${depth}, NOW())`,
      ),
    );

    await db.$executeRaw`
      INSERT INTO "Category" (id, name, slug, "parentId", "sortOrder", "createdAt")
      VALUES ${rows}
      ON CONFLICT (slug) DO UPDATE SET
        "parentId"  = COALESCE("Category"."parentId",  EXCLUDED."parentId"),
        "sortOrder" = CASE WHEN "Category"."sortOrder" = 0 THEN EXCLUDED."sortOrder" ELSE "Category"."sortOrder" END
    `;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const { batch, dryRun, only, limit } = parseArgs();
  console.log(`🔄 Recategorize — batch=${batch} dryRun=${dryRun} only=${only ?? "*"} limit=${limit ?? "∞"}`);
  const db = new PrismaClient();
  console.time("total");

  // Pre-count for % progress (cheap COUNT, takes <100 ms on 140 k rows)
  const totalActive = await db.product.count({
    where: {
      isActive: true,
      ...(only ? { category: only } : {}),
    },
  });
  console.log(`📊 Total active products to scan: ${totalActive.toLocaleString()}`);

  let cursor: string | null = null;
  let scanned = 0;
  let changed = 0;
  const changeCounts = new Map<string, number>();   // leaf-slug → count

  try {
    while (true) {
      if (limit !== null && scanned >= limit) break;

      // Keyset pagination on id — cheap & resumable.
      const whereClauses: Prisma.Sql[] = [Prisma.sql`"isActive" = true`];
      if (only) whereClauses.push(Prisma.sql`category = ${only}`);
      if (cursor) whereClauses.push(Prisma.sql`id > ${cursor}`);
      const whereSql = Prisma.join(whereClauses, " AND ");

      const take = Math.min(batch, limit !== null ? limit - scanned : batch);

      const rows = await db.$queryRaw<Array<{
        id: string;
        gtin: string;
        title: string;
        brand: string;
        category: string;
        categoryName: string | null;
        description: string;
      }>>`
        SELECT id, gtin, title, brand, category, "categoryName",
               COALESCE(description, '') AS description
        FROM "Product"
        WHERE ${whereSql}
        ORDER BY id ASC
        LIMIT ${take}
      `;

      if (rows.length === 0) break;

      interface Update {
        gtin: string;
        oldLeaf: string;
        newLeaf: string;
        newName: string;
        path: string[];
      }
      const updates: Update[] = [];
      const paths: { path: string[]; name: string }[] = [];

      for (const row of rows) {
        const resolved = resolveCategoryForExisting(
          row.title || "",
          row.brand || "",
          row.description || "",
          row.category,
          row.categoryName,
        );
        paths.push(resolved);
        const newLeaf = resolved.path[resolved.path.length - 1];
        if (newLeaf === row.category) continue;   // already correct
        updates.push({
          gtin: row.gtin,
          oldLeaf: row.category,
          newLeaf,
          newName: resolved.name,
          path: resolved.path,
        });
      }

      scanned += rows.length;
      cursor = rows[rows.length - 1].id;
      const pct = totalActive > 0 ? `${((scanned / totalActive) * 100).toFixed(1)}%` : "";

      if (dryRun) {
        for (const u of updates) {
          changeCounts.set(u.newLeaf, (changeCounts.get(u.newLeaf) ?? 0) + 1);
        }
        changed += updates.length;
        console.log(`[${pct} ${scanned.toLocaleString()}] would update ${updates.length}/${rows.length}`);
        continue;
      }

      if (updates.length === 0) {
        console.log(`[${pct} ${scanned.toLocaleString()}] no changes in batch`);
        continue;
      }

      // 1. Seed ancestors for every path we're about to write.
      await ensureCategories(db, paths);

      // 2. One multi-row UPDATE via VALUES-join.
      const valueRows = Prisma.join(
        updates.map((u) => Prisma.sql`(${u.gtin}::text, ${u.newLeaf}::text, ${u.newName}::text)`),
      );
      const n = await db.$executeRaw`
        UPDATE "Product" AS p
        SET category = v.new_leaf,
            "categoryName" = v.new_name,
            "updatedAt" = NOW()
        FROM (VALUES ${valueRows}) AS v(gtin, new_leaf, new_name)
        WHERE p.gtin = v.gtin AND p.category <> v.new_leaf
      `;
      const moved = Number(n);
      changed += moved;
      for (const u of updates) {
        changeCounts.set(u.newLeaf, (changeCounts.get(u.newLeaf) ?? 0) + 1);
      }
      console.log(`[${pct} ${scanned.toLocaleString()}] ${moved}/${updates.length} updated`);
    }

    console.log(`\n🎉 Recategorize complete`);
    console.log(`   scanned: ${scanned.toLocaleString()}`);
    console.log(`   changed: ${changed.toLocaleString()}`);
    if (changeCounts.size > 0) {
      console.log(`\n   Top destinations:`);
      const sorted = Array.from(changeCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);
      for (const [slug, count] of sorted) {
        console.log(`     ${slug.padEnd(32)} ${count.toLocaleString()}`);
      }
    }
  } finally {
    await db.$disconnect();
    console.timeEnd("total");
  }
}

main().catch((e) => {
  console.error("💥 Fatal:", e);
  process.exit(1);
});
