import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

/**
 * POST /api/admin/cleanup?secret=xxx
 *
 * One-shot database cleanup:
 * 1. Delete products with price 0
 * 2. Fix categories with ">" paths → re-map to clean names
 * 3. Fix double-encoded affiliate URLs (&amp;)
 * 4. Move unmapped categories to "sonstiges"
 */
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, number> = {};

  try {
    // ── 1. Find and deactivate products with no valid price ──
    // Get all product IDs
    const allProducts = await db.product.findMany({
      select: { id: true, gtin: true },
      where: { isActive: true, sourceType: "adtraction_feed" },
    });

    let zeroPriceCount = 0;
    for (const p of allProducts) {
      const latestPrice = await db.price.findFirst({
        where: { productId: p.id },
        orderBy: { timestamp: "desc" },
        select: { amountChf: true },
      });
      const chf = latestPrice ? Number(latestPrice.amountChf) : 0;
      if (chf <= 0) {
        await db.product.update({
          where: { id: p.id },
          data: { isActive: false },
        });
        zeroPriceCount++;
      }
      // Safety timeout
      if (zeroPriceCount > 0 && zeroPriceCount % 100 === 0) {
        await new Promise((r) => setTimeout(r, 50));
      }
    }
    results.deactivatedZeroPrice = zeroPriceCount;

    // ── 2. Fix categories containing ">" ─────────────────────
    const badCatProducts = await db.product.findMany({
      where: {
        OR: [
          { category: { contains: ">" } },
          { category: { contains: "-gt-" } },
        ],
        isActive: true,
      },
      select: { id: true, category: true, categoryName: true },
      take: 500,
    });

    let fixedCategories = 0;
    for (const p of badCatProducts) {
      const mapped = mapCategory(p.categoryName || p.category);
      await db.product.update({
        where: { id: p.id },
        data: { category: mapped.slug, categoryName: mapped.name },
      });
      fixedCategories++;
    }
    results.fixedCategories = fixedCategories;

    // ── 3. Move unmapped/weird categories to "sonstiges" ─────
    const VALID_CATS = new Set([
      "smartphones", "laptops", "kopfhoerer", "schuhe", "gaming",
      "haushalt", "mode", "parfum", "uhren", "tv-audio", "foto",
      "sport", "baby", "buecher", "beauty",
      "herrendufte", "damendufte", "unisex-dufte",
      "pflege", "make-up", "haarpflege", "koerperpflege",
      "geschenksets", "sonnenpflege", "sonstiges",
    ]);

    const weirdCats = await db.product.findMany({
      where: { isActive: true },
      select: { id: true, category: true },
    });

    let movedToSonstiges = 0;
    for (const p of weirdCats) {
      if (!VALID_CATS.has(p.category)) {
        await db.product.update({
          where: { id: p.id },
          data: { category: "sonstiges", categoryName: "Sonstiges" },
        });
        movedToSonstiges++;
      }
    }
    results.movedToSonstiges = movedToSonstiges;

    // ── 4. Fix double-encoded affiliate URLs ─────────────────
    const badLinks = await db.$queryRaw<{ id: string; affiliateUrl: string }[]>`
      SELECT id, "affiliateUrl" FROM "Product"
      WHERE "affiliateUrl" LIKE '%&amp;%'
      AND "isActive" = true
      LIMIT 1000
    `;

    let fixedLinks = 0;
    for (const p of badLinks) {
      let url = p.affiliateUrl;
      // Decode up to 3 times
      for (let i = 0; i < 3; i++) {
        const prev = url;
        url = url.replace(/&amp;/g, "&");
        if (url === prev) break;
      }
      await db.product.update({
        where: { id: p.id },
        data: { affiliateUrl: url },
      });
      fixedLinks++;
    }
    results.fixedAffiliateLinks = fixedLinks;

    // ── 5. Fix image URLs with &amp; ─────────────────────────
    const badImages = await db.$queryRaw<{ id: string; imageUrl: string }[]>`
      SELECT id, "imageUrl" FROM "Product"
      WHERE "imageUrl" LIKE '%&amp;%'
      AND "isActive" = true
      LIMIT 1000
    `;

    let fixedImages = 0;
    for (const p of badImages) {
      let url = p.imageUrl;
      for (let i = 0; i < 3; i++) {
        const prev = url;
        url = url.replace(/&amp;/g, "&");
        if (url === prev) break;
      }
      await db.product.update({
        where: { id: p.id },
        data: { imageUrl: url },
      });
      fixedImages++;
    }
    results.fixedImageUrls = fixedImages;

    return NextResponse.json({ status: "ok", results });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
      results,
    }, { status: 500 });
  }
}

// ── Category mapping (same as import) ────────────────────────

const CAT_MAP: { pattern: string; slug: string; name: string }[] = [
  { pattern: "men's fragrance", slug: "herrendufte", name: "Herrendüfte" },
  { pattern: "aftershave", slug: "herrendufte", name: "Herrendüfte" },
  { pattern: "cologne", slug: "herrendufte", name: "Herrendüfte" },
  { pattern: "women's fragrance", slug: "damendufte", name: "Damendüfte" },
  { pattern: "unisex fragrance", slug: "unisex-dufte", name: "Unisex-Düfte" },
  { pattern: "fragrance", slug: "parfum", name: "Parfum & Düfte" },
  { pattern: "perfume", slug: "parfum", name: "Parfum & Düfte" },
  { pattern: "skin care", slug: "pflege", name: "Pflege" },
  { pattern: "skincare", slug: "pflege", name: "Pflege" },
  { pattern: "make up", slug: "make-up", name: "Make-Up" },
  { pattern: "makeup", slug: "make-up", name: "Make-Up" },
  { pattern: "hair", slug: "haarpflege", name: "Haarpflege" },
  { pattern: "bath", slug: "koerperpflege", name: "Körperpflege" },
  { pattern: "body", slug: "koerperpflege", name: "Körperpflege" },
  { pattern: "gift", slug: "geschenksets", name: "Geschenksets" },
  { pattern: "sun", slug: "sonnenpflege", name: "Sonnenpflege" },
];

function mapCategory(raw: string): { slug: string; name: string } {
  const lower = raw.toLowerCase();
  for (const entry of CAT_MAP) {
    if (lower.includes(entry.pattern)) return { slug: entry.slug, name: entry.name };
  }
  return { slug: "sonstiges", name: "Sonstiges" };
}
