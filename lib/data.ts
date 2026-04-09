import { db } from "@/lib/db";
import { calculateSwissPrice, type PriceBreakdown } from "@/lib/pricing/calculator";
import { SEED_PRODUCTS } from "@/prisma/seed";
import type { MockProduct } from "@/prisma/seed";
import { EXCHANGE_RATE, generatePriceHistory } from "@/lib/integrations/mock-service";
import type { MockPricePoint, MockProductWithHistory } from "@/lib/integrations/mock-service";
import { decodeHtmlEntities, prettifySlug, cleanCategoryName } from "@/lib/category-icons";

const SOURCE_NAMES: Record<string, string> = {
  amazon_de: "Amazon.de",
  galaxus_ch: "Galaxus",
  zalando_de: "Zalando",
};

/**
 * Load dynamic categories from DB — only categories with at least 1 product.
 */
export async function getDynamicCategories(): Promise<
  { slug: string; name: string; productCount: number }[]
> {
  try {
    // Get all categories that have products
    const result = await db.product.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });

    // Try to get proper names from Category table
    const dbCats = await db.category.findMany({
      select: { slug: true, name: true },
    }).catch(() => [] as { slug: string; name: string }[]);

    const catNameMap = new Map(dbCats.map((c) => [c.slug, c.name]));

    return result.map((r) => {
      const rawName = catNameMap.get(r.category);
      const name = rawName ? cleanCategoryName(rawName) : prettifySlug(r.category);
      return { slug: r.category, name, productCount: r._count.category };
    });
  } catch {
    return [];
  }
}

/**
 * Fetch all products from Supabase with latest prices.
 * Falls back to seed data if DB is empty or unreachable.
 */
export async function getProducts(): Promise<MockProductWithHistory[]> {
  try {
    const dbProducts = await db.product.findMany({
      select: {
        id: true, gtin: true, title: true, brand: true, category: true,
        categoryName: true, imageUrl: true, shopName: true, sourceType: true,
        affiliateUrl: true, isActive: true, createdAt: true, updatedAt: true,
        prices: {
          orderBy: { timestamp: "desc" },
          take: 10,
          select: { amountChf: true, amountEur: true, sourceId: true, url: true, timestamp: true },
        },
      },
    });

    if (dbProducts.length > 0) {
      return dbProducts.map((p) => buildFromDb(p));
    }
  } catch (err) {
    console.warn("[data] DB fetch failed, using seed data:", err instanceof Error ? err.message : err);
  }

  // Fallback to seed
  return buildFromSeed();
}

export async function getProductByGtin(gtin: string): Promise<MockProductWithHistory | null> {
  try {
    const p = await db.product.findUnique({
      where: { gtin },
      select: {
        id: true, gtin: true, title: true, brand: true, category: true,
        categoryName: true, imageUrl: true, shopName: true, sourceType: true,
        affiliateUrl: true, isActive: true, createdAt: true, updatedAt: true,
        prices: {
          orderBy: { timestamp: "desc" },
          take: 30,
          select: { amountChf: true, amountEur: true, sourceId: true, url: true, timestamp: true },
        },
      },
    });
    if (p) return buildFromDb(p);
  } catch {
    // fallback
  }

  // Fallback to seed
  const seed = SEED_PRODUCTS.find((s) => s.gtin === gtin);
  if (!seed) return null;
  return buildFromSeedProduct(seed);
}

export async function getFeatured(): Promise<MockProductWithHistory[]> {
  const all = await getProducts();
  return all.filter((p) => p.product.featured).slice(0, 3);
}

export async function getProductsByCategory(slug: string): Promise<MockProductWithHistory[]> {
  const all = await getProducts();
  return all.filter((p) => p.product.category === slug);
}

export async function getDistinctCategories(): Promise<string[]> {
  const all = await getProducts();
  return [...new Set(all.map((p) => p.product.category))];
}

export async function getAllGtinsFromDb(): Promise<string[]> {
  try {
    const products = await db.product.findMany({ select: { gtin: true } });
    if (products.length > 0) return products.map((p) => p.gtin);
  } catch {
    // fallback
  }
  return SEED_PRODUCTS.map((p) => p.gtin);
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

type DbProduct = {
  id: string;
  gtin: string;
  title: string;
  brand: string;
  category: string;
  categoryName?: string | null;
  imageUrl: string | null;
  shopName?: string | null;
  sourceType?: string | null;
  affiliateUrl?: string | null;
  prices: { amountChf: unknown; amountEur: unknown; sourceId: string; url?: string | null; timestamp: Date }[];
};

function buildFromDb(p: DbProduct): MockProductWithHistory {
  const sourceMap = new Map<string, { chf: number; eur: number; url: string }>();
  for (const price of p.prices) {
    if (!sourceMap.has(price.sourceId)) {
      sourceMap.set(price.sourceId, {
        chf: Number(price.amountChf),
        eur: Number(price.amountEur),
        url: price.url || "#",
      });
    }
  }

  const seed = SEED_PRODUCTS.find((s) => s.gtin === p.gtin);

  const sources = Array.from(sourceMap.entries()).map(([sid, { eur, url }]) => ({
    sourceId: sid,
    sourceName: p.shopName || SOURCE_NAMES[sid] || sid,
    url,
    currentPriceEur: eur,
  }));

  const product: MockProduct = {
    gtin: p.gtin,
    title: decodeHtmlEntities(p.title),
    brand: decodeHtmlEntities(p.brand),
    category: p.category,
    categoryName: p.categoryName ? decodeHtmlEntities(p.categoryName) : undefined,
    imageUrl: p.imageUrl ?? seed?.imageUrl ?? "",
    featured: seed?.featured ?? false,
    shopName: p.shopName ?? undefined,
    sourceType: p.sourceType ?? undefined,
    affiliateUrl: p.affiliateUrl ?? undefined,
    sources: sources.length > 0 ? sources : seed?.sources ?? [],
  };

  return enrichProduct(product);
}

function buildFromSeedProduct(seed: MockProduct): MockProductWithHistory {
  return enrichProduct(seed);
}

function buildFromSeed(): MockProductWithHistory[] {
  return SEED_PRODUCTS.map(enrichProduct);
}

function enrichProduct(product: MockProduct): MockProductWithHistory {
  const priceHistory = generatePriceHistory(product, 30);

  const latestPrices = product.sources.map((s) => {
    const breakdown = calculateSwissPrice({
      amountEur: s.currentPriceEur,
      exchangeRate: EXCHANGE_RATE,
      category: "standard",
      clearanceType: "vereinfacht",
    });
    return { sourceId: s.sourceId, sourceName: s.sourceName, breakdown };
  });

  if (latestPrices.length === 0) {
    const emptyBreakdown: PriceBreakdown = {
      originalEur: 0, netEur: 0, netChf: 0, chVat: 0,
      customsFee: 0, totalChf: 0, exchangeRate: EXCHANGE_RATE, savings: 0,
    };
    return { product, priceHistory, bestPrice: emptyBreakdown, bestSource: "", priceDrop30d: 0, avgChf30d: 0 };
  }

  const best = latestPrices.reduce((min, cur) =>
    cur.breakdown.totalChf < min.breakdown.totalChf ? cur : min,
  );

  const oldestDay = priceHistory.filter((p) => p.date === priceHistory[0]?.date);
  const oldestBestChf = oldestDay.length > 0 ? Math.min(...oldestDay.map((p) => p.amountChf)) : best.breakdown.totalChf;
  const priceDrop30d = oldestBestChf - best.breakdown.totalChf;

  const allChf = priceHistory.map((p) => p.amountChf);
  const avgChf30d = allChf.length > 0 ? allChf.reduce((a, b) => a + b, 0) / allChf.length : best.breakdown.totalChf;

  return {
    product,
    priceHistory,
    bestPrice: best.breakdown,
    bestSource: best.sourceName,
    priceDrop30d: Math.round(priceDrop30d * 100) / 100,
    avgChf30d: Math.round(avgChf30d * 100) / 100,
  };
}
