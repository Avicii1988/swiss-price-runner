import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/products/by-gtins?gtins=123,456,789
 * Batch-lookup products by GTIN list. Used by the account page.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("gtins");
  if (!raw) return NextResponse.json({ products: [] });

  const gtins = raw.split(",").map((g) => g.trim()).filter(Boolean).slice(0, 100);
  if (gtins.length === 0) return NextResponse.json({ products: [] });

  try {
    const products = await db.product.findMany({
      where: { gtin: { in: gtins } },
      select: {
        gtin: true, title: true, brand: true, category: true,
        categoryName: true, imageUrl: true, shopName: true, price: true,
      },
    });
    return NextResponse.json({
      products: products.map((p) => ({
        gtin: p.gtin,
        title: p.title,
        brand: p.brand,
        category: p.category,
        categoryName: p.categoryName,
        imageUrl: p.imageUrl,
        shopName: p.shopName,
        price: p.price ? Number(p.price) : null,
      })),
    });
  } catch {
    return NextResponse.json({ products: [] });
  }
}
