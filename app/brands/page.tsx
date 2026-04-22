import { db } from "@/lib/db";
import BrandsClient from "./client";

export const dynamic = "force-dynamic";

async function getBrands() {
  try {
    const rows = await db.$queryRaw<{ brand: string; count: bigint }[]>`
      SELECT brand, COUNT(*) AS count
      FROM "Product"
      WHERE brand IS NOT NULL
        AND brand != ''
        AND LENGTH(brand) > 1
        AND brand != 'XXL Parfum'
      GROUP BY brand
      ORDER BY brand ASC
    `;
    return rows.map((r) => ({ name: r.brand, productCount: Number(r.count) }));
  } catch {
    return [];
  }
}

export default async function BrandsPage() {
  const brands = await getBrands();
  return <BrandsClient brands={brands} />;
}
