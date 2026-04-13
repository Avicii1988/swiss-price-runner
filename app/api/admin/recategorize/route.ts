import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isAuthorized, safeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Title-keyword-based recategorization.
 * Fixes products that were bulk-moved to "parfum" by cleanup Phase 2.
 *
 * Optimized:
 *   - 1 query per rule (OR of all patterns) instead of 1 per pattern
 *   - ?recent=true → only products updated in last 24h (for incremental runs)
 *   - ?since=ISO_DATE → only products updated since given date
 *
 * Order matters: more specific matches first (gift set > men > fragrance).
 */
const RULES: { slug: string; name: string; patterns: string[] }[] = [
  { slug: "geschenksets", name: "Geschenksets",
    patterns: ["geschenkset", "gift set", "coffret", "duo pack", "3-piece", "2-piece", "lot de"] },
  { slug: "unisex-dufte", name: "Unisex-Düfte",
    patterns: ["unisex", "eau universelle"] },
  { slug: "damendufte", name: "Damendüfte",
    patterns: ["pour femme", "for women", "for her", "damen", " women ", "donna", "lady", " woman", "elle "] },
  { slug: "herrendufte", name: "Herrendüfte",
    patterns: ["pour homme", "for men", "for him", "herren", " men ", "uomo", "aftershave", "after-shave", "cologne"] },
  { slug: "make-up", name: "Make-Up",
    patterns: ["lipstick", "lippenstift", "mascara", "foundation", "puder", "rouge", "concealer", "eyeshadow", "lidschatten", "nail polish", "nagellack", "lipgloss", "lip gloss"] },
  { slug: "haarpflege", name: "Haarpflege",
    patterns: ["shampoo", "conditioner", "haarmask", "hair mask", "spülung", " haar ", " hair "] },
  { slug: "sonnenpflege", name: "Sonnenpflege",
    patterns: ["sonnenschutz", "sun lotion", "sunscreen", "after sun", "aftersun", "spf", "selbstbräuner", "self tan"] },
  { slug: "koerperpflege", name: "Körperpflege",
    patterns: ["duschgel", "shower gel", "body lotion", "bodylotion", "deodorant", " deo ", "body wash", "bath salt"] },
  { slug: "pflege", name: "Pflege",
    patterns: ["serum", "moisturi", "gesichtscreme", "face cream", "anti-age", "anti-aging", "retinol", "hyaluron", "cleanser", "toner", "maske", " mask ", "eye cream"] },
];

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startMs = Date.now();
  console.time("recategorize");
  const results: { slug: string; moved: number }[] = [];

  // Optional incremental filter — skips already-categorized products AND
  // optionally restricts to recently-updated ones to keep each run cheap.
  const recent = req.nextUrl.searchParams.get("recent") === "true";
  const sinceParam = req.nextUrl.searchParams.get("since");
  let sinceDate: Date | null = null;
  if (sinceParam) sinceDate = new Date(sinceParam);
  else if (recent) sinceDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    for (const rule of RULES) {
      // Build OR clause: LOWER(title) LIKE %p1% OR LOWER(title) LIKE %p2% OR ...
      const likeConditions = rule.patterns.flatMap((p) => {
        const searchTerm = `%${p.toLowerCase()}%`;
        return [
          Prisma.sql`LOWER(title) LIKE ${searchTerm}`,
          Prisma.sql`LOWER(COALESCE(brand, '')) LIKE ${searchTerm}`,
        ];
      });
      const whereAny = Prisma.join(likeConditions, " OR ");
      const sinceClause = sinceDate
        ? Prisma.sql`AND "updatedAt" >= ${sinceDate}`
        : Prisma.empty;

      try {
        // Single UPDATE per rule, bounded by LIMIT via subquery
        const moved = await db.$executeRaw`
          UPDATE "Product"
          SET category = ${rule.slug}, "categoryName" = ${rule.name}
          WHERE id IN (
            SELECT id FROM "Product"
            WHERE category = 'parfum'
              AND "isActive" = true
              ${sinceClause}
              AND (${whereAny})
            LIMIT 5000
          )
        `;
        const n = Number(moved);
        if (n > 0) results.push({ slug: rule.slug, moved: n });
      } catch (e) {
        console.error(`[recategorize] ${rule.slug}:`, e instanceof Error ? e.message : e);
      }
    }

    const totalMoved = results.reduce((s, r) => s + r.moved, 0);
    return NextResponse.json({
      ok: true,
      totalMoved,
      filter: sinceDate ? `since ${sinceDate.toISOString()}` : "full scan",
      results,
      durationMs: Date.now() - startMs,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      partial: results,
      message: safeErrorMessage(error),
      durationMs: Date.now() - startMs,
    }, { status: 500 });
  } finally {
    console.timeEnd("recategorize");
  }
}
