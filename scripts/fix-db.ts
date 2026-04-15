#!/usr/bin/env tsx
/**
 * One-shot DB-repair script — adds the five columns introduced by the
 * latest Product-schema change when `prisma db push` times out against
 * the Supabase pooler.
 *
 * Columns added (all nullable / have defaults so rollout is safe):
 *   shippingCostChf  Decimal(10,2)?     feed shipping cost to CH
 *   priceIsNet       Boolean DEFAULT    false
 *   groupId          Text?              variant-grouping key
 *   baseTitle        Text?              title with size suffix stripped
 *   sizeLabel        Text?              "50 ml", "Gr. 42", …
 *
 * Indexes added (match prisma/schema.prisma):
 *   "Product_groupId_idx"
 *   "Product_isActive_groupId_idx"
 *
 * Every statement uses IF NOT EXISTS so the script is idempotent — safe
 * to re-run if a previous attempt died mid-flight.
 *
 * Usage:
 *   npx tsx scripts/fix-db.ts
 *
 * Requires either POSTGRES_URL_NON_POOLING (preferred — direct DDL
 * connection) or DATABASE_URL in the environment. The script auto-
 * rewrites postgres:// → postgresql:// and appends
 * ?pgbouncer=true&connection_limit=1 when the URL points at a pooler.
 */

import { PrismaClient } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════════
// URL normalization (mirrors .github/scripts/normalize-db-url.js)
// ═══════════════════════════════════════════════════════════════════

function normalize(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null;
  let url = rawUrl.trim();
  if (!url) return null;
  if (url.startsWith("postgres://")) {
    url = "postgresql://" + url.slice("postgres://".length);
  }
  try {
    const u = new URL(url);
    if (u.protocol !== "postgresql:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function applyPgBouncerIfPooler(url: string): string {
  const u = new URL(url);
  const isPooler = /pooler\./i.test(u.hostname) || u.port === "6543";
  if (!isPooler) return url;
  if (!u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
  if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "1");
  return u.toString();
}

function pickDatabaseUrl(): string {
  const candidates = [
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
  ];
  for (const c of candidates) {
    const n = normalize(c);
    if (n) return applyPgBouncerIfPooler(n);
  }
  console.error("💥 No valid database URL found.");
  console.error("   Set POSTGRES_URL_NON_POOLING (preferred) or DATABASE_URL.");
  process.exit(1);
}

// Attach the chosen URL to the env BEFORE constructing PrismaClient so
// the generated client picks it up via prisma/schema.prisma's
// `url = env("POSTGRES_URL")` + `directUrl = env("POSTGRES_URL_NON_POOLING")`.
const chosenUrl = pickDatabaseUrl();
process.env.POSTGRES_URL = chosenUrl;
process.env.POSTGRES_URL_NON_POOLING = chosenUrl;
process.env.DATABASE_URL = chosenUrl;

// Masked debug print
{
  const u = new URL(chosenUrl);
  console.log("─── fix-db target ────────────────────────────────");
  console.log(`  host     : ${u.hostname}`);
  console.log(`  port     : ${u.port || "5432 (default)"}`);
  console.log(`  database : ${u.pathname.replace(/^\//, "") || "(none)"}`);
  console.log(`  user     : ${u.username ? u.username.slice(0, 3) + "***" : "(none)"}`);
  console.log(`  params   : ${u.search || "(none)"}`);
  console.log("──────────────────────────────────────────────────\n");
}

// ═══════════════════════════════════════════════════════════════════
// Statements to apply
// ═══════════════════════════════════════════════════════════════════

interface Statement {
  label: string;
  sql: string;
}

const STATEMENTS: Statement[] = [
  {
    label: "ADD COLUMN shippingCostChf",
    sql: `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "shippingCostChf" DECIMAL(10, 2)`,
  },
  {
    label: "ADD COLUMN priceIsNet",
    sql: `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priceIsNet" BOOLEAN NOT NULL DEFAULT false`,
  },
  {
    label: "ADD COLUMN groupId",
    sql: `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "groupId" TEXT`,
  },
  {
    label: "ADD COLUMN baseTitle",
    sql: `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "baseTitle" TEXT`,
  },
  {
    label: "ADD COLUMN sizeLabel",
    sql: `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sizeLabel" TEXT`,
  },
  {
    label: "CREATE INDEX Product_groupId_idx",
    sql: `CREATE INDEX IF NOT EXISTS "Product_groupId_idx" ON "Product"("groupId")`,
  },
  {
    label: "CREATE INDEX Product_isActive_groupId_idx",
    sql: `CREATE INDEX IF NOT EXISTS "Product_isActive_groupId_idx" ON "Product"("isActive", "groupId")`,
  },
];

// ═══════════════════════════════════════════════════════════════════
// Introspection helper — returns the currently-present column names
// so we can print a before/after diff.
// ═══════════════════════════════════════════════════════════════════

async function listProductColumns(db: PrismaClient): Promise<Set<string>> {
  const rows = await db.$queryRawUnsafe<Array<{ column_name: string }>>(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'Product'`,
  );
  return new Set(rows.map((r) => r.column_name));
}

async function listProductIndexes(db: PrismaClient): Promise<Set<string>> {
  const rows = await db.$queryRawUnsafe<Array<{ indexname: string }>>(
    `SELECT indexname
       FROM pg_indexes
      WHERE schemaname = current_schema()
        AND tablename = 'Product'`,
  );
  return new Set(rows.map((r) => r.indexname));
}

// ═══════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const db = new PrismaClient();
  console.time("fix-db");

  const expectedColumns = ["shippingCostChf", "priceIsNet", "groupId", "baseTitle", "sizeLabel"];
  const expectedIndexes = ["Product_groupId_idx", "Product_isActive_groupId_idx"];

  try {
    // ── Pre-state ──
    const before = await listProductColumns(db);
    const beforeIdx = await listProductIndexes(db);
    console.log("BEFORE:");
    for (const c of expectedColumns) {
      console.log(`  column ${c.padEnd(20)} ${before.has(c) ? "✓ exists" : "— missing"}`);
    }
    for (const i of expectedIndexes) {
      console.log(`  index  ${i.padEnd(40)} ${beforeIdx.has(i) ? "✓ exists" : "— missing"}`);
    }
    console.log();

    // ── Apply ──
    let applied = 0;
    for (const stmt of STATEMENTS) {
      const t0 = Date.now();
      try {
        await db.$executeRawUnsafe(stmt.sql);
        const ms = Date.now() - t0;
        console.log(`✓ ${stmt.label.padEnd(42)} ${ms}ms`);
        applied++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`✗ ${stmt.label}: ${msg}`);
        // Don't abort — try the rest; user can re-run the script.
      }
    }
    console.log(`\n${applied}/${STATEMENTS.length} statements applied.\n`);

    // ── Post-state ──
    const after = await listProductColumns(db);
    const afterIdx = await listProductIndexes(db);
    console.log("AFTER:");
    let allOk = true;
    for (const c of expectedColumns) {
      const ok = after.has(c);
      console.log(`  column ${c.padEnd(20)} ${ok ? "✓ present" : "✗ STILL MISSING"}`);
      if (!ok) allOk = false;
    }
    for (const i of expectedIndexes) {
      const ok = afterIdx.has(i);
      console.log(`  index  ${i.padEnd(40)} ${ok ? "✓ present" : "✗ STILL MISSING"}`);
      if (!ok) allOk = false;
    }

    if (allOk) {
      console.log("\n🎉 Schema is in sync — every expected column and index exists.");
    } else {
      console.error("\n⚠️  Schema NOT fully in sync. Inspect the errors above and re-run.");
      process.exitCode = 1;
    }
  } finally {
    await db.$disconnect();
    console.timeEnd("fix-db");
  }
}

main().catch((e) => {
  console.error("💥 Fatal:", e);
  process.exit(1);
});
