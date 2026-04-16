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
 * P2024 / pool-timeout fix:
 *   Supabase pooler limits connections to 1 and the default pool_timeout
 *   is too short for DDL statements (especially CREATE INDEX on a 140 k
 *   row table). We now construct the PrismaClient with an extended
 *   pool_timeout (60 s) and wrap every DDL call in retry-with-backoff
 *   (3 attempts, 5 s apart). Each statement runs strictly sequentially
 *   — no parallel ADD COLUMN / CREATE INDEX.
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
 *     Product_groupId_idx                  ON ("groupId")
 *     Product_isActive_groupId_idx         ON ("isActive", "groupId")
 *     Product_isActive_category_price_idx  ON ("isActive", "category", "price")
 *
 * Flow:
 *   1. Introspect current schema → before-diff.
 *   2. Apply DDL one statement at a time (each idempotent, with retry).
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
  ddlType: string;
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
  columns: string[];
};

const REQUIRED_INDEXES: IndexSpec[] = [
  { name: "Product_groupId_idx", columns: ["groupId"] },
  { name: "Product_isActive_groupId_idx", columns: ["isActive", "groupId"] },
  { name: "Product_isActive_category_price_idx", columns: ["isActive", "category", "price"] },
];

// ═══════════════════════════════════════════════════════════════════
// Prisma client — extended pool timeout to survive Supabase pooler
// ═══════════════════════════════════════════════════════════════════

function buildDatasourceUrl(): string {
  const raw = process.env.POSTGRES_URL
    || process.env.POSTGRES_URL_NON_POOLING
    || process.env.DATABASE_URL
    || "";
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    u.searchParams.set("connection_limit", "1");
    u.searchParams.set("pool_timeout", "60");
    // pgbouncer flag — required when going through the Supabase pooler
    if (/pooler\./i.test(u.hostname) || u.port === "6543") {
      u.searchParams.set("pgbouncer", "true");
    }
    return u.toString();
  } catch {
    return raw;
  }
}

const dsUrl = buildDatasourceUrl();
console.log(`🔗 Connecting with pool_timeout=60, connection_limit=1`);

const prisma = new PrismaClient({
  datasources: dsUrl ? { db: { url: dsUrl } } : undefined,
});

// ═══════════════════════════════════════════════════════════════════
// Retry helper — handles transient P2024 / connection-pool timeouts
// ═══════════════════════════════════════════════════════════════════

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5_000;

async function withRetry(label: string, fn: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await fn();
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isPoolTimeout =
        msg.includes("P2024") ||
        msg.includes("pool") ||
        msg.includes("Timed out");
      if (isPoolTimeout && attempt < MAX_RETRIES) {
        console.warn(
          `  ⚠ ${label}: pool timeout (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS / 1000}s…`,
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      throw err;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// Introspection
// ═══════════════════════════════════════════════════════════════════

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
// DDL — strictly sequential, one statement at a time, with retry
// ═══════════════════════════════════════════════════════════════════

async function applyColumn(col: ColumnSpec): Promise<void> {
  const stmt = `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.ddlType}`;
  console.log(`  · ${stmt}`);
  await withRetry(`ADD COLUMN ${col.name}`, () =>
    prisma.$executeRawUnsafe(stmt).then(() => {}),
  );
}

async function applyIndex(idx: IndexSpec): Promise<void> {
  const cols = idx.columns.map((c) => `"${c}"`).join(", ");
  // CREATE INDEX CONCURRENTLY avoids an exclusive table lock — other
  // readers/writers keep running while the index builds in the
  // background. The IF NOT EXISTS guard makes it idempotent.
  // NOTE: CONCURRENTLY cannot run inside a transaction; Prisma's
  // $executeRawUnsafe runs each call as its own implicit transaction,
  // which PG auto-commits before the concurrent build starts, so this
  // is safe.
  const stmt = `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${idx.name}" ON "Product" (${cols})`;
  console.log(`  · ${stmt}`);
  await withRetry(`CREATE INDEX ${idx.name}`, () =>
    prisma.$executeRawUnsafe(stmt).then(() => {}),
  );
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

  // ── APPLY — strictly sequential: all columns first, then indexes ──
  section("APPLY — columns");
  for (const col of REQUIRED_COLUMNS) {
    await applyColumn(col);
  }

  section("APPLY — indexes (CONCURRENTLY)");
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
