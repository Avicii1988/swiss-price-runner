import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/products/suggest?q=dio&limit=6
 * Smart autocomplete: returns brand completions + product type suggestions.
 * Used by the mobile search overlay (Galaxus-style suggestions).
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  const limit = Math.min(10, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 6));

  if (!q || q.length < 1) {
    return NextResponse.json({ brands: [], suggestions: [] });
  }

  try {
    const pattern = `${q}%`;

    // Brand suggestions: groupBy brand + product count
    const brandResults = await db.$queryRaw<{ brand: string; count: bigint }[]>`
      SELECT brand, COUNT(*)::bigint as count
      FROM "Product"
      WHERE "isActive" = true AND LOWER(brand) LIKE ${pattern}
      GROUP BY brand
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    // Category hints: which categories contain this brand's products
    const topBrand = brandResults[0]?.brand;
    let categoryHints: { brand: string; category: string; categoryName: string | null; count: number }[] = [];
    if (topBrand) {
      const catResults = await db.$queryRaw<{ category: string; categoryName: string | null; count: bigint }[]>`
        SELECT category, "categoryName", COUNT(*)::bigint as count
        FROM "Product"
        WHERE "isActive" = true AND brand = ${topBrand}
        GROUP BY category, "categoryName"
        ORDER BY count DESC
        LIMIT 3
      `;
      categoryHints = catResults.map((c) => ({
        brand: topBrand,
        category: c.category,
        categoryName: c.categoryName,
        count: Number(c.count),
      }));
    }

    return NextResponse.json({
      brands: brandResults.map((b) => ({ name: b.brand, count: Number(b.count) })),
      categoryHints,
    });
  } catch {
    return NextResponse.json({ brands: [], categoryHints: [] });
  }
}
