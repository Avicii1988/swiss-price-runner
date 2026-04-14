#!/usr/bin/env node
/**
 * Normalize the Supabase database URL for a GitHub Actions workflow.
 *
 * Usage (in a workflow step):
 *   - name: Normalize DB URL
 *     env:
 *       RAW_NON_POOLED: ${{ secrets.POSTGRES_URL_NON_POOLING }}
 *       RAW_DATABASE:   ${{ secrets.DATABASE_URL }}
 *       FORCE_POOLED:   ${{ inputs.force_pooled }}   # optional, 'true' | 'false'
 *     run: node .github/scripts/normalize-db-url.js
 *
 * What it does:
 *   1. Picks the best candidate (prefer POSTGRES_URL_NON_POOLING for DDL /
 *      bulk scripts; swap to DATABASE_URL when FORCE_POOLED=true).
 *   2. Rewrites legacy `postgres://` prefix → `postgresql://`
 *      (Prisma 5+ strict scheme).
 *   3. If the chosen URL is a Supabase pooler host (matches /pooler\./
 *      or port 6543), auto-appends `?pgbouncer=true&connection_limit=1`
 *      so Prisma skips prepared statements. This fixes
 *      "prepared statement s0 already exists" (P2010).
 *   4. Exports the normalized URL to POSTGRES_URL, POSTGRES_URL_NON_POOLING,
 *      and DATABASE_URL via $GITHUB_ENV — every downstream step inherits it.
 *   5. Prints a masked debug summary (no password leakage).
 */

const fs = require("fs");

function normalize(url) {
  if (!url) return null;
  if (url.startsWith("postgres://")) {
    url = "postgresql://" + url.slice("postgres://".length);
  }
  try {
    const u = new URL(url);
    if (u.protocol !== "postgresql:") return null;
    return { url, parsed: u };
  } catch {
    return null;
  }
}

function isPooler(u) {
  // Supabase pooler hosts contain "pooler." (e.g. aws-0-eu-central-1.pooler.supabase.com)
  // and historically listen on port 6543 in transaction mode.
  return /pooler\./i.test(u.hostname) || u.port === "6543";
}

function applyPgBouncerParams(url) {
  const u = new URL(url);
  if (!u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
  if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "1");
  return u.toString();
}

const raw = {
  non_pooled: (process.env.RAW_NON_POOLED || "").trim(),
  database:   (process.env.RAW_DATABASE   || "").trim(),
};
const forcePooled = process.env.FORCE_POOLED === "true";

console.log("─── Candidate secrets ───────────────────────────────────");
console.log(`POSTGRES_URL_NON_POOLING set: ${raw.non_pooled ? "yes" : "no"}`);
console.log(`DATABASE_URL set:             ${raw.database   ? "yes" : "no"}`);
console.log(`force_pooled input:           ${forcePooled}`);

const candidates = forcePooled
  ? [["pooled (forced)", raw.database], ["direct", raw.non_pooled]]
  : [["direct", raw.non_pooled], ["pooled", raw.database]];

let chosen = null;
let chosenLabel = "";
for (const [label, c] of candidates) {
  if (!c) continue;
  const n = normalize(c);
  if (!n) {
    console.log(`  ↳ ${label}: invalid URL, skipping`);
    continue;
  }
  chosen = n;
  chosenLabel = label;
  break;
}

if (!chosen) {
  console.error("\n💥 No valid database URL found. Check your GitHub Secrets.");
  process.exit(1);
}

let finalUrl = chosen.url;
const pooler = isPooler(chosen.parsed);
if (pooler) {
  const before = finalUrl;
  finalUrl = applyPgBouncerParams(finalUrl);
  if (before !== finalUrl) {
    console.log("  ↳ pooler detected → auto-appended ?pgbouncer=true&connection_limit=1");
  } else {
    console.log("  ↳ pooler detected (pgbouncer params already present)");
  }
}

// ── Masked debug output ──
const pf = new URL(finalUrl);
console.log("\n─── Using normalized URL ────────────────────────────────");
console.log(`  mode     : ${chosenLabel}`);
console.log(`  protocol : ${pf.protocol}`);
console.log(`  host     : ${pf.hostname}`);
console.log(`  port     : ${pf.port || "(default 5432)"}`);
console.log(`  database : ${pf.pathname.replace(/^\//, "") || "(none)"}`);
console.log(`  user     : ${pf.username ? pf.username.slice(0, 3) + "***" : "(none)"}`);
console.log(`  password : ${pf.password ? "***" + pf.password.length + " chars***" : "(none)"}`);
console.log(`  params   : ${pf.search || "(none)"}`);
console.log(`  pooler   : ${pooler ? "yes (pgbouncer flags applied)" : "no (direct)"}`);

// ── Export to subsequent steps ──
if (!process.env.GITHUB_ENV) {
  console.error("\n⚠️  GITHUB_ENV not set — cannot export. Are you running outside Actions?");
  process.exit(1);
}
fs.appendFileSync(
  process.env.GITHUB_ENV,
  `POSTGRES_URL=${finalUrl}\n` +
    `POSTGRES_URL_NON_POOLING=${finalUrl}\n` +
    `DATABASE_URL=${finalUrl}\n`,
);
console.log("\n✓ Exported POSTGRES_URL / POSTGRES_URL_NON_POOLING / DATABASE_URL");
