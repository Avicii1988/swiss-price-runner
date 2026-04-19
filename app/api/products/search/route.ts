import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/products/search?q=iphone+17+pro&limit=8
 *
 * Weighted full-text-ish ranking. Each token from the query is matched
 * against brand / title / category / description with descending weight,
 * mirroring the way Galaxus surfaces results: brand+model first, then
 * topical category match, then long-tail description hits.
 *
 *   Brand exact match    100
 *   Brand prefix          60
 *   Title token           30
 *   Category token        12
 *   Description token      4
 *   Multi-token bonus  +token-count
 *
 * A minimum score threshold drops irrelevant noise that would otherwise
 * leak in via single-letter substring matches.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const limit = Math.min(60, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 8));

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Tokens — drop trivial fillers, lowercase, dedupe
  const STOP = new Set(["der", "die", "das", "und", "mit", "fur", "für", "von", "the", "and", "for", "with"]);
  const tokens = Array.from(new Set(
    q.toLowerCase()
      .replace(/[^a-z0-9äöüéàèç\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 2 && !STOP.has(t)),
  )).slice(0, 6); // cap at 6 tokens to keep SQL bounded

  if (tokens.length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const fullPattern = `%${q.toLowerCase()}%`;
    const exactBrand = q.toLowerCase();

    // Build a weighted score per row — one CASE per token per column.
    // Postgres handles this fast for the catalogue size we run with.
    const tokenScores = tokens.map((tok) => {
      const p = `%${tok}%`;
      const prefix = `${tok}%`;
      return `
        (CASE WHEN LOWER(brand) = '${tok.replace(/'/g, "''")}' THEN 100 ELSE 0 END) +
        (CASE WHEN LOWER(brand) LIKE '${prefix.replace(/'/g, "''")}' THEN 60 ELSE 0 END) +
        (CASE WHEN LOWER(title) LIKE '${p.replace(/'/g, "''")}' THEN 30 ELSE 0 END) +
        (CASE WHEN LOWER(category) LIKE '${p.replace(/'/g, "''")}' OR LOWER(COALESCE("categoryName", '')) LIKE '${p.replace(/'/g, "''")}' THEN 12 ELSE 0 END) +
        (CASE WHEN LOWER(COALESCE(description, '')) LIKE '${p.replace(/'/g, "''")}' THEN 4 ELSE 0 END)
      `;
    }).join(" + ");

    // Hard relevance gate: at least one token must hit brand or title.
    const relevanceGate = tokens.map((tok) => {
      const p = `%${tok}%`;
      const safe = p.replace(/'/g, "''");
      return `(LOWER(brand) LIKE '${safe}' OR LOWER(title) LIKE '${safe}')`;
    }).join(" OR ");

    const sql = `
      SELECT gtin, title, brand, category, "categoryName", "imageUrl", price::float, "shopName",
             (${tokenScores}) AS score
      FROM "Product"
      WHERE "isActive" = true
        AND price IS NOT NULL AND price > 0 AND price <= 50000
        AND (${relevanceGate})
      ORDER BY score DESC, price ASC NULLS LAST, "updatedAt" DESC
      LIMIT ${limit}
    `;

    const results = await db.$queryRawUnsafe<
      { gtin: string; title: string; brand: string; category: string; categoryName: string | null; imageUrl: string | null; price: number | null; shopName: string | null; score: number }[]
    >(sql);

    // Drop low-score noise: anything below a brand-prefix-only hit.
    const filtered = results.filter((r) => Number(r.score) >= 12);

    return NextResponse.json({ results: filtered });
  } catch (err) {
    console.error("[search]", err instanceof Error ? err.message : err);
    return NextResponse.json({ results: [] });
  }
}
