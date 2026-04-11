import { NextRequest, NextResponse } from "next/server";
import { getProductsPaginated } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const limit = Math.min(48, Math.max(1, Number(params.get("limit")) || 24));
  const offset = Math.max(0, Number(params.get("offset")) || 0);

  const { products, total } = await getProductsPaginated(limit, offset);

  return NextResponse.json({
    products: products.map((p) => ({
      product: p.product,
      bestPrice: p.bestPrice,
      bestSource: p.bestSource,
      priceDrop30d: p.priceDrop30d,
      avgChf30d: p.avgChf30d,
    })),
    total,
    offset,
    limit,
    hasMore: offset + limit < total,
  });
}
