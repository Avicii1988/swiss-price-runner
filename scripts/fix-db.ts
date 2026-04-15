#!/usr/bin/env tsx
/**
 * One-shot idempotent DDL sync for the Product table.
 *
 * Background:
 *   `prisma db push` times out against the Supabase pooler when the diff
 *   is non-trivial. This script sidesteps Prisma's migration engine and
 *   applies the missing DDL directly via `ALTER TABLE … IF NOT EXISTS` and
 *   `CREATE INDEX IF NOT EXISTS`, so it's safe to re-run.
 *
 * Adds to "Product":
 *   ┌────────────────────────┬──────────────────┬─────────────────┐
 *   │ Column                 │ Type             │ Default         │
 *   ├────────────────────────┼──────────────────┼─────────────────┤
 *   │ shippingCostChf        │ DECIMAL(10,2)    │ NULL            │
 *   │ priceIsNet             │ BOOLEAN NOT NULL │ false           │
 *   │ groupId                │ TEXT             │ NULL            │
 *   │ baseTitle              │ TEXT             │ NULL            │
 *   │ sizeLabel              │ TEXT             │ NULL            │
 *   │ description            │ TEXT             │ NULL            │
 *   └────────────────────────┴──────────────────┴─────────────────┘
 *
 *   Indexes:
 *     Product_groupId_idx           ON ("groupId")
 *     Product_isActive_groupId_idx  ON ("isActive", "groupId")
 *
 * Flow:
 *   1. Introspect current schema → before-diff.
 *   2. Apply DDL (each stmt idempotent).
 *   3. Re-introspect → after-diff.
 *   4. Exit 0 if target schema is fully present, else exit 1.
 *
 * Usage:
 *   npx tsx scripts/fix-db.ts
 *   # requires POSTGRES_URL (or DATABASE_URL) in env
 */

import { PrismaClient } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════════
// Target schema
// ═══════════════════════════════════════════════════════════════════

type ColumnSpec = {
  name: string;
  ddlType: string; // type + nullability + default
};

const REQUIRED_COLUMNS: ColumnSpec[] = [
  { name: "shippingCostChf", ddlType: `DECIMAL(10,2)` },
  { name: "priceIsNet", ddlType: `BOOLEAN NOT NULL DEFAULT false` },
  { name: "groupId", ddlType: `TEXT` },
  { name: "baseTitle", ddlType: `TEXT` },
  { name: "sizeLabel", ddlType: `TEXT` },
  { name: "description", ddlType: `TEXT` },
];

type IndexSpec = {
  name: string;
  columns: string[]; // raw column names (will be quoted)
};

const REQUIRED_INDEXES: IndexSpec[] = [
  { name: "Product_groupId_idx", columns: ["groupId"] },
  { name: "Product_isActive_groupId_idx", columns: ["isActive", "groupId"] },
];

// ═══════════════════════════════════════════════════════════════════
// Introspection
// ═══════════════════════════════════════════════════════════════════

const prisma = new PrismaClient();

async function listColumns(): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Product'
  `;
  return new Set(rows.map((r) => r.column_name));
}

async function listIndexes(): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'Product'
  `;
  return new Set(rows.map((r) => r.indexname));
}

function diffColumns(existing: Set<string>): ColumnSpec[] {
  return REQUIRED_COLUMNS.filter((c) => !existing.has(c.name));
}

function diffIndexes(existing: Set<string>): IndexSpec[] {
  return REQUIRED_INDEXES.filter((i) => !existing.has(i.name));
}

// ═══════════════════════════════════════════════════════════════════
// DDL
// ═══════════════════════════════════════════════════════════════════

async function applyColumn(col: ColumnSpec): Promise<void> {
  // ADD COLUMN IF NOT EXISTS is supported on Postgres 9.6+; safe against
  // re-runs. Column name is quoted to preserve camelCase.
  const stmt = `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.ddlType}`;
  console.log(`  · ${stmt}`);
  await prisma.$executeRawUnsafe(stmt);
}

async function applyIndex(idx: IndexSpec): Promise<void> {
  const cols = idx.columns.map((c) => `"${c}"`).join(", ");
  const stmt = `CREATE INDEX IF NOT EXISTS "${idx.name}" ON "Product" (${cols})`;
  console.log(`  · ${stmt}`);
  await prisma.$executeRawUnsafe(stmt);
}

// ═══════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════

function section(title: string) {
  console.log(`\n─── ${title} ` + "─".repeat(Math.max(0, 56 - title.length)));
}

async function main() {
  section("fix-db: idempotent DDL sync for Product table");

  // ── BEFORE ──
  const beforeCols = await listColumns();
  const beforeIdx = await listIndexes();
  const missingColsBefore = diffColumns(beforeCols);
  const missingIdxBefore = diffIndexes(beforeIdx);

  section("BEFORE");
  console.log(`Columns on Product: ${beforeCols.size}`);
  console.log(`Indexes on Product: ${beforeIdx.size}`);
  console.log(
    `Missing columns:    ${
      missingColsBefore.length === 0
        ? "(none)"
        : missingColsBefore.map((c) => c.name).join(", ")
    }`,
  );
  console.log(
    `Missing indexes:    ${
      missingIdxBefore.length === 0
        ? "(none)"
        : missingIdxBefore.map((i) => i.name).join(", ")
    }`,
  );

  if (missingColsBefore.length === 0 && missingIdxBefore.length === 0) {
    section("RESULT");
    console.log("✓ Schema is already in sync. Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  // ── APPLY ──
  section("APPLY");
  // Columns first, then indexes (indexes may reference new columns).
  for (const col of REQUIRED_COLUMNS) {
    await applyColumn(col);
  }
  for (const idx of REQUIRED_INDEXES) {
    await applyIndex(idx);
  }

  // ── AFTER ──
  const afterCols = await listColumns();
  const afterIdx = await listIndexes();
  const missingColsAfter = diffColumns(afterCols);
  const missingIdxAfter = diffIndexes(afterIdx);

  section("AFTER");
  console.log(`Columns on Product: ${afterCols.size}`);
  console.log(`Indexes on Product: ${afterIdx.size}`);
  console.log(
    `Missing columns:    ${
      missingColsAfter.length === 0
        ? "(none) ✓"
        : missingColsAfter.map((c) => c.name).join(", ") + " ✗"
    }`,
  );
  console.log(
    `Missing indexes:    ${
      missingIdxAfter.length === 0
        ? "(none) ✓"
        : missingIdxAfter.map((i) => i.name).join(", ") + " ✗"
    }`,
  );

  section("RESULT");
  await prisma.$disconnect();

  if (missingColsAfter.length > 0 || missingIdxAfter.length > 0) {
    console.error("💥 Schema is still incomplete after apply. Exiting non-zero.");
    process.exit(1);
  }

  console.log("✓ Schema is now in sync.");
}

main().catch(async (err) => {
  console.error("\n💥 fix-db failed:");
  console.error(err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
