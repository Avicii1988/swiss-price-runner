import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthorized, safeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Title-keyword-based recategorization.
 * Fixes products that were bulk-moved to "parfum" by cleanup Phase 2.
 *
 * Call order matters: more specific matches first (gift set > set).
 */
const RULES: { slug: string; name: string; patterns: string[] }[] = [
  // Geschenksets first (otherwise "for men set" matches herren)
  { slug: "geschenksets", name: "Geschenksets",
    patterns: ["geschenkset", "gift set", "coffret", "set %", "duo pack", "3-piece", "2-piece", "lot de"] },

  // Unisex before gender-specific
  { slug: "unisex-dufte", name: "Unisex-Düfte",
    patterns: ["unisex", "eau universelle"] },

  // Damendüfte (German + French + English + "pour elle")
  { slug: "damendufte", name: "Damendüfte",
    patterns: ["pour femme", "for women", "for her", "damen", "women", "donna", "lady", "woman", "elle "] },

  // Herrendüfte
  { slug: "herrendufte", name: "Herrendüfte",
    patterns: ["pour homme", "for men", "for him", "herren", "men", "uomo", "aftershave", "after-shave", "cologne"] },

  // Make-up
  { slug: "make-up", name: "Make-Up",
    patterns: ["lipstick", "lippenstift", "mascara", "foundation", "puder", "rouge", "concealer", "eyeshadow", "lidschatten", "nail", "nagellack", "lipgloss", "lip gloss"] },

  // Haarpflege
  { slug: "haarpflege", name: "Haarpflege",
    patterns: ["shampoo", "conditioner", "haar", "hair", "spülung", "haarmask", "hair mask"] },

  // Sonnenpflege
  { slug: "sonnenpflege", name: "Sonnenpflege",
    patterns: ["sonnenschutz", "sun lotion", "sunscreen", "after sun", "aftersun", "spf", "selbstbräuner", "self tan"] },

  // Körperpflege
  { slug: "koerperpflege", name: "Körperpflege",
    patterns: ["duschgel", "shower gel", "body lotion", "bodylotion", "deodorant", "deo ", "body wash", "bath"] },

  // Pflege (face/skin — catch-all AFTER specific)
  { slug: "pflege", name: "Pflege",
    patterns: ["serum", "moisturi", "gesichtscreme", "face cream", "anti-age", "anti-aging", "retinol", "hyaluron", "cleanser", "toner", "maske", "mask", "eye cream"] },
];

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startMs = Date.now();
  const results: { slug: string; moved: number; pattern: string }[] = [];

  try {
    // Only touch products currently in "parfum" bucket (the catch-all target)
    // Keep already-categorized products in their proper subcategory
    for (const rule of RULES) {
      for (const pattern of rule.patterns) {
        const searchTerm = `%${pattern}%`;
        try {
          const moved = await db.$executeRaw`
            UPDATE "Product"
            SET category = ${rule.slug}, "categoryName" = ${rule.name}
            WHERE category = 'parfum'
              AND "isActive" = true
              AND (LOWER(title) LIKE ${searchTerm} OR LOWER(COALESCE(brand, '')) LIKE ${searchTerm})
          `;
          const n = Number(moved);
          if (n > 0) results.push({ slug: rule.slug, moved: n, pattern });
        } catch {
          /* skip this pattern */
        }
      }
    }

    const totalMoved = results.reduce((s, r) => s + r.moved, 0);
    return NextResponse.json({
      ok: true,
      totalMoved,
      operations: results.length,
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
  }
}
