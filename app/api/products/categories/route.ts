import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/products/categories
 * Returns product count per category slug — used by sidebar/mobile menu.
 */
export async function GET() {
  try {
    const groups = await db.product.groupBy({
      by: ["category"],
      where: { isActive: true, price: { gt: 0 } },
      _count: true,
    });
    const counts: Record<string, number> = {};
    for (const g of groups) counts[g.category] = g._count;
    return NextResponse.json({ counts });
  } catch {
    return NextResponse.json({ counts: {} });
  }
}
