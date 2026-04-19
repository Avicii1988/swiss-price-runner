import { db } from "@/lib/db";
import SearchClient from "./client";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";
import { calculateSwissPrice } from "@/lib/pricing/calculator";
import { EXCHANGE_RATE } from "@/lib/integrations/mock-service";

export const dynamic = "force-dynamic";

const STOP = new Set(["der", "die", "das", "und", "mit", "fur", "für", "von", "the", "and", "for", "with"]);

interface RawHit {
  id: string;
  gtin: string;
  title: string;
  brand: string;
  category: string;
  categoryName: string | null;
  imageUrl: string | null;
  shopName: string | null;
  sourceType: string | null;
  affiliateUrl: string | null;
  price: string;
  shippingCostChf: string | null;
  priceIsNet: boolean | null;
  score: number;
}

async function runWeightedSearch(q: string, limit: number): Promise<RawHit[]> {
  const tokens = Array.from(new Set(
    q.toLowerCase()
      .replace(/[^a-z0-9äöüéàèç\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 2 && !STOP.has(t)),
  )).slice(0, 6);
  if (tokens.length === 0) return [];

  const safeTok = (t: string) => t.replace(/'/g, "''");

  const tokenScores = tokens.map((tok) => {
    const t = safeTok(tok);
    const p = `%${t}%`;
    const prefix = `${t}%`;
    return `
      (CASE WHEN LOWER(brand) = '${t}' THEN 100 ELSE 0 END) +
      (CASE WHEN LOWER(brand) LIKE '${prefix}' THEN 60 ELSE 0 END) +
      (CASE WHEN LOWER(title) LIKE '${p}' THEN 30 ELSE 0 END) +
      (CASE WHEN LOWER(category) LIKE '${p}' OR LOWER(COALESCE("categoryName", '')) LIKE '${p}' THEN 12 ELSE 0 END) +
      (CASE WHEN LOWER(COALESCE(description, '')) LIKE '${p}' THEN 4 ELSE 0 END)
    `;
  }).join(" + ");

  const relevanceGate = tokens.map((tok) => {
    const t = safeTok(tok);
    return `(LOWER(brand) LIKE '%${t}%' OR LOWER(title) LIKE '%${t}%')`;
  }).join(" OR ");

  const sql = `
    SELECT id, gtin, title, brand, category, "categoryName", "imageUrl",
           "shopName", "sourceType", "affiliateUrl", price::text AS price,
           "shippingCostChf"::text AS "shippingCostChf", "priceIsNet",
           (${tokenScores}) AS score
    FROM "Product"
    WHERE "isActive" = true
      AND price IS NOT NULL AND price > 0 AND price <= 50000
      AND (${relevanceGate})
    ORDER BY score DESC, price ASC NULLS LAST, "updatedAt" DESC
    LIMIT ${Math.max(1, Math.min(200, limit))}
  `;

  try {
    const rows = await db.$queryRawUnsafe<RawHit[]>(sql);
    return rows.filter((r) => Number(r.score) >= 12);
  } catch (err) {
    console.warn("[search/page]", err instanceof Error ? err.message : err);
    return [];
  }
}

function toEnriched(r: RawHit): MockProductWithHistory {
  const price = Number(r.price) || 0;
  const breakdown = price > 0
    ? {
        originalEur: 0, netEur: 0, netChf: price, chVat: 0, customsFee: 0,
        totalChf: price, exchangeRate: EXCHANGE_RATE, savings: 0,
      }
    : calculateSwissPrice({ amountEur: 0, exchangeRate: EXCHANGE_RATE });

  const sources = price > 0 ? [{
    sourceId: r.shopName ? `feed_${r.shopName.toLowerCase().replace(/\s+/g, "_")}` : "feed_default",
    sourceName: r.shopName ?? "Shop",
    url: r.affiliateUrl ?? "#",
    currentPriceEur: 0,
    nativeChf: price,
    shippingChf: r.shippingCostChf ? Number(r.shippingCostChf) : null,
    priceIsNet: r.priceIsNet === true,
  }] : [];

  return {
    product: {
      gtin: r.gtin,
      title: r.title,
      brand: r.brand,
      category: r.category,
      categoryName: r.categoryName ?? undefined,
      imageUrl: r.imageUrl ?? "",
      featured: false,
      shopName: r.shopName ?? undefined,
      sourceType: r.sourceType ?? undefined,
      affiliateUrl: r.affiliateUrl ?? undefined,
      sources,
    },
    priceHistory: [],
    bestPrice: breakdown,
    bestSource: sources[0]?.sourceName ?? "",
    priceDrop30d: 0,
    avgChf30d: price,
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const rawHits = q ? await runWeightedSearch(q, 144) : [];
  const products = rawHits.map(toEnriched);

  return <SearchClient query={q} products={products} />;
}
