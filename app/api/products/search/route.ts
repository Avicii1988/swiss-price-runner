import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/products/search?q=chanel&limit=8
 * Fuzzy search over all active products using ILIKE on title, brand, gtin.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const limit = Math.min(20, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 8));

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const pattern = `%${q}%`;
    const results = await db.$queryRaw<
      { gtin: string; title: string; brand: string; category: string; imageUrl: string | null; price: number | null; shopName: string | null }[]
    >`
      SELECT gtin, title, brand, category, "imageUrl", price::float, "shopName"
      FROM "Product"
      WHERE "isActive" = true
        AND (title ILIKE ${pattern} OR brand ILIKE ${pattern} OR gtin ILIKE ${pattern})
      ORDER BY
        CASE WHEN brand ILIKE ${pattern} THEN 0 ELSE 1 END,
        CASE WHEN title ILIKE ${pattern} THEN 0 ELSE 1 END,
        price ASC NULLS LAST
      LIMIT ${limit}
    `;

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[search]", err instanceof Error ? err.message : err);
    return NextResponse.json({ results: [] });
  }
}
