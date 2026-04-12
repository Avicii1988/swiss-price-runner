import { db } from "@/lib/db";
import BrandsClient from "./client";

export const dynamic = "force-dynamic";

async function getBrands() {
  try {
    const groups = await db.product.groupBy({
      by: ["brand"],
      where: { isActive: true, price: { gt: 0 } },
      _count: true,
      orderBy: { _count: { brand: "desc" } },
    });
    return groups
      .filter((g) => g.brand && g.brand.length > 1 && g.brand !== "XXL Parfum")
      .map((g) => ({ name: g.brand, productCount: g._count }));
  } catch {
    return [];
  }
}

export default async function BrandsPage() {
  const brands = await getBrands();
  return <BrandsClient brands={brands} />;
}
