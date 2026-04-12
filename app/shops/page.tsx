import { SHOP_SOURCE_LIST } from "@/lib/shop-sources";
import { db } from "@/lib/db";
import ShopsClient from "./client";

export const dynamic = "force-dynamic";

async function getShopStats() {
  try {
    const counts = await db.price.groupBy({
      by: ["sourceId"],
      _count: true,
    });
    const map: Record<string, number> = {};
    for (const c of counts) map[c.sourceId] = c._count;
    return map;
  } catch {
    return {};
  }
}

export default async function ShopsPage() {
  const counts = await getShopStats();
  const shops = SHOP_SOURCE_LIST.map((s) => ({
    id: s.id,
    name: s.name,
    wordmarkText: s.wordmark.text,
    wordmarkColor: s.wordmark.color,
    wordmarkWeight: s.wordmark.weight,
    productCount: counts[s.id] ?? 0,
  }));

  return <ShopsClient shops={shops} />;
}
