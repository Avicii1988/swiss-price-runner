import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { isAuthorized, safeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Category taxonomy — messy feed categories → clean master categories.
 * All keys are normalized lowercase slugs.
 */
const CATEGORY_MIGRATIONS: Record<string, { slug: string; name: string }> = {
  // Fragrances — all variants go to parfum subcategories
  duftproben: { slug: "parfum", name: "Parfum & Düfte" },
  "extrait-de-parfum": { slug: "parfum", name: "Parfum & Düfte" },
  "eau-de-parfum": { slug: "parfum", name: "Parfum & Düfte" },
  "eau-de-toilette": { slug: "parfum", name: "Parfum & Düfte" },
  "eau-de-cologne": { slug: "parfum", name: "Parfum & Düfte" },
  cologne: { slug: "herrendufte", name: "Herrendüfte" },
  aftershave: { slug: "herrendufte", name: "Herrendüfte" },
  "after-shave": { slug: "herrendufte", name: "Herrendüfte" },
  raumduft: { slug: "parfum", name: "Parfum & Düfte" },
  raumduefte: { slug: "parfum", name: "Parfum & Düfte" },
  kerzen: { slug: "parfum", name: "Parfum & Düfte" },
  miniaturen: { slug: "parfum", name: "Parfum & Düfte" },

  // Body/skin care
  duschgel: { slug: "koerperpflege", name: "Körperpflege" },
  shampoo: { slug: "haarpflege", name: "Haarpflege" },
  conditioner: { slug: "haarpflege", name: "Haarpflege" },
  bodylotion: { slug: "koerperpflege", name: "Körperpflege" },
  "body-lotion": { slug: "koerperpflege", name: "Körperpflege" },
  deodorant: { slug: "koerperpflege", name: "Körperpflege" },
  deo: { slug: "koerperpflege", name: "Körperpflege" },
  handcreme: { slug: "pflege", name: "Pflege" },
  gesichtscreme: { slug: "pflege", name: "Pflege" },
  serum: { slug: "pflege", name: "Pflege" },
  maske: { slug: "pflege", name: "Pflege" },
  tonic: { slug: "pflege", name: "Pflege" },
  reiniger: { slug: "pflege", name: "Pflege" },

  // Makeup
  lippenstift: { slug: "make-up", name: "Make-Up" },
  mascara: { slug: "make-up", name: "Make-Up" },
  foundation: { slug: "make-up", name: "Make-Up" },
  puder: { slug: "make-up", name: "Make-Up" },
  lidschatten: { slug: "make-up", name: "Make-Up" },
  nagellack: { slug: "make-up", name: "Make-Up" },

  // Sun / special
  sonnenschutz: { slug: "sonnenpflege", name: "Sonnenpflege" },
  aftersun: { slug: "sonnenpflege", name: "Sonnenpflege" },
  selbstbraeuner: { slug: "sonnenpflege", name: "Sonnenpflege" },

  // Misc / junk
  express: { slug: "parfum", name: "Parfum & Düfte" },
  sale: { slug: "parfum", name: "Parfum & Düfte" },
  neu: { slug: "parfum", name: "Parfum & Düfte" },
  sonstiges: { slug: "parfum", name: "Parfum & Düfte" },
};

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startMs = Date.now();
  const results: { category: string; target: string; moved: number }[] = [];

  try {
    // Valid master slugs (should stay untouched)
    const validSlugs = [
      "smartphones", "laptops", "kopfhoerer", "schuhe", "gaming", "haushalt",
      "mode", "parfum", "uhren", "tv-audio", "foto", "sport", "baby", "buecher",
      // Parfum subcategories
      "herrendufte", "damendufte", "unisex-dufte", "geschenksets",
      "pflege", "make-up", "haarpflege", "koerperpflege", "sonnenpflege",
    ];

    // Apply each migration
    for (const [messySlug, target] of Object.entries(CATEGORY_MIGRATIONS)) {
      const moved = await db.$executeRaw`
        UPDATE "Product"
        SET category = ${target.slug}, "categoryName" = ${target.name}
        WHERE category = ${messySlug}
      `;
      if (Number(moved) > 0) {
        results.push({ category: messySlug, target: target.slug, moved: Number(moved) });
      }
    }

    // Catch-all: any remaining non-master category → parfum (in 500-row batches)
    let catchAllTotal = 0;
    for (let i = 0; i < 50; i++) {
      const fixed = await db.$executeRaw`
        UPDATE "Product"
        SET category = 'parfum', "categoryName" = 'Parfum & Düfte'
        WHERE id IN (
          SELECT id FROM "Product"
          WHERE category NOT IN (${Prisma.join(validSlugs)})
          LIMIT 500
        )
      `;
      const count = Number(fixed);
      catchAllTotal += count;
      if (count === 0) break;
    }
    if (catchAllTotal > 0) {
      results.push({ category: "(catch-all)", target: "parfum", moved: catchAllTotal });
    }

    const totalMoved = results.reduce((s, r) => s + r.moved, 0);

    return NextResponse.json({
      ok: true,
      totalMoved,
      migrations: results.length,
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
