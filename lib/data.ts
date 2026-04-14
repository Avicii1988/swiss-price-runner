import { db } from "@/lib/db";
import { calculateSwissPrice, type PriceBreakdown } from "@/lib/pricing/calculator";
import { SEED_PRODUCTS } from "@/prisma/seed";
import type { MockProduct } from "@/prisma/seed";
import { EXCHANGE_RATE, generatePriceHistory } from "@/lib/integrations/mock-service";
import type { MockPricePoint, MockProductWithHistory } from "@/lib/integrations/mock-service";
import { decodeHtmlEntities, prettifySlug, cleanCategoryName } from "@/lib/category-icons";
import { findCategoryNode, type CategoryNode } from "@/lib/categories";

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
      where: { isActive: true },
      select: {
        id: true, gtin: true, title: true, brand: true, category: true,
        categoryName: true, imageUrl: true, shopName: true, sourceType: true,
        affiliateUrl: true, price: true,
      },
    });

    if (dbProducts.length > 0) {
      return dbProducts.map((p) => buildFromDb({ ...p, prices: [] }));
    }
  } catch (err) {
    console.warn("[data] DB fetch failed, using seed data:", err instanceof Error ? err.message : err);
  }

  return buildFromSeed();
}

/**
 * Lightweight homepage query: only loads `limit` products sorted by best price.
 * Used instead of getProducts() on the homepage to avoid loading 16k+ products.
 */
export async function getProductsPaginated(limit = 24, offset = 0): Promise<{ products: MockProductWithHistory[]; total: number }> {
  try {
    const [dbProducts, total] = await Promise.all([
      db.product.findMany({
        where: { isActive: true, price: { gt: 0 } },
        select: {
          id: true, gtin: true, title: true, brand: true, category: true,
          categoryName: true, imageUrl: true, shopName: true, sourceType: true,
          affiliateUrl: true, price: true,
        },
        orderBy: { updatedAt: "desc" },
        skip: offset,
        take: limit,
      }),
      db.product.count({ where: { isActive: true, price: { gt: 0 } } }),
    ]);

    return {
      products: dbProducts.map((p) => buildFromDb({ ...p, prices: [] })),
      total,
    };
  } catch (err) {
    console.warn("[data] paginated fetch failed:", err instanceof Error ? err.message : err);
    const all = buildFromSeed();
    return { products: all.slice(offset, offset + limit), total: all.length };
  }
}

/**
 * Stats for the stats bar — cached via ISR.
 */
export async function getSiteStats(): Promise<{ shops: number; brands: number; offers: number }> {
  try {
    const [brandResult, offerCount, shopResult] = await Promise.all([
      db.product.groupBy({ by: ["brand"], where: { isActive: true }, _count: true }),
      db.product.count({ where: { isActive: true } }),
      db.price.groupBy({ by: ["sourceId"], _count: true }),
    ]);
    return { shops: shopResult.length, brands: brandResult.length, offers: offerCount };
  } catch {
    return { shops: 2, brands: 500, offers: 16000 };
  }
}

export async function getProductByGtin(gtin: string): Promise<MockProductWithHistory | null> {
  try {
    const p = await db.product.findUnique({
      where: { gtin },
      select: {
        id: true, gtin: true, title: true, brand: true, category: true,
        categoryName: true, imageUrl: true, shopName: true, sourceType: true,
        affiliateUrl: true, price: true,
        prices: {
          orderBy: { timestamp: "desc" },
          select: { amountChf: true, amountEur: true, sourceId: true, shopName: true, url: true, timestamp: true },
        },
      },
    });
    if (p) return buildFromDb(p);
  } catch (err) {
    console.warn("[data] getProductByGtin failed:", err instanceof Error ? err.message : err);
  }

  // Fallback to seed
  const seed = SEED_PRODUCTS.find((s) => s.gtin === gtin);
  if (!seed) return null;
  return buildFromSeedProduct(seed);
}

export async function getFeatured(): Promise<MockProductWithHistory[]> {
  // Featured products are only in seed data — no DB query needed
  return SEED_PRODUCTS.filter((p) => p.featured).slice(0, 3).map(enrichProduct);
}

export async function getProductsByCategory(slug: string): Promise<MockProductWithHistory[]> {
  try {
    // Direct DB query with WHERE filter + LIMIT (was loading all 16k+ products!)
    const dbProducts = await db.product.findMany({
      where: {
        isActive: true,
        price: { gt: 0 },
        OR: [
          { category: slug },
          // Also match Parfum & Düfte subcategories under parent "parfum"
          ...(slug === "parfum"
            ? [{ category: { in: ["herrendufte", "damendufte", "unisex-dufte", "geschenksets", "pflege", "make-up", "haarpflege", "koerperpflege", "sonnenpflege"] } }]
            : []),
        ],
      },
      select: {
        id: true, gtin: true, title: true, brand: true, category: true,
        categoryName: true, imageUrl: true, shopName: true, sourceType: true,
        affiliateUrl: true, price: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 500, // Cap at 500 for category pages
    });
    return dbProducts.map((p) => buildFromDb({ ...p, prices: [] }));
  } catch {
    const all = SEED_PRODUCTS.filter((p) => p.category === slug);
    return all.map(enrichProduct);
  }
}

export async function getDistinctCategories(): Promise<string[]> {
  try {
    // Direct DB: groupBy instead of loading all products
    const groups = await db.product.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: true,
    });
    return groups.map((g) => g.category);
  } catch {
    return [...new Set(SEED_PRODUCTS.map((p) => p.category))];
  }
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
  price?: unknown | null;
  prices: { amountChf: unknown; amountEur: unknown; sourceId: string; shopName?: string | null; url?: string | null; timestamp?: Date }[];
};

function buildFromDb(p: DbProduct): MockProductWithHistory {
  const isFeedProduct = p.sourceType === "adtraction_feed";
  const affiliateUrl = p.affiliateUrl || "#";

  const sourceMap = new Map<string, { chf: number; eur: number; url: string; shopName: string }>();
  for (const price of p.prices) {
    if (!sourceMap.has(price.sourceId)) {
      sourceMap.set(price.sourceId, {
        chf: Number(price.amountChf),
        eur: Number(price.amountEur),
        url: price.url && price.url !== "#" ? price.url : affiliateUrl,
        shopName: price.shopName || p.shopName || price.sourceId,
      });
    }
  }

  // Determine CHF price: Product.price → Price.amountChf fallback → 0
  const directPriceChf = p.price ? Number(p.price) : 0;
  const latestPriceChf = p.prices.length > 0 ? Number(p.prices[0].amountChf) : 0;
  const bestChf = directPriceChf > 0 ? directPriceChf : latestPriceChf;

  const seed = SEED_PRODUCTS.find((s) => s.gtin === p.gtin);

  // For feed products with CHF prices: reverse-convert to EUR
  // so the existing enrichProduct pipeline produces the correct totalChf.
  const effectiveEur = isFeedProduct && bestChf > 0
    ? bestChf / EXCHANGE_RATE
    : 0;

  const sources = Array.from(sourceMap.entries()).map(([sid, { chf, eur, url, shopName: sName }]) => {
    // Per-shop price: use each source's OWN CHF amount (not the global lowest)
    // Reverse-convert CHF → EUR for feed products so calculateSwissPrice produces the right totalChf
    const perShopEur = isFeedProduct && chf > 0 ? chf / EXCHANGE_RATE : eur;
    return {
      sourceId: sid,
      sourceName: sName || SOURCE_NAMES[sid] || sid,
      url,
      currentPriceEur: perShopEur,
    };
  });

  // Feed product without Price records: create a virtual source from Product fields
  if (sources.length === 0 && isFeedProduct) {
    sources.push({
      sourceId: "feed_default",
      sourceName: p.shopName || "Shop",
      url: affiliateUrl,
      currentPriceEur: effectiveEur,
    });
  }

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

// ═══════════════════════════════════════════════════════════════════
// Homepage curation — TopPicks, PriceDrops, Thematic shelves, Trending
// ═══════════════════════════════════════════════════════════════════

const COMMON_SELECT = {
  id: true, gtin: true, title: true, brand: true, category: true,
  categoryName: true, imageUrl: true, shopName: true, sourceType: true,
  affiliateUrl: true, price: true,
} as const;

/**
 * Top picks — the n most recently refreshed active products with a valid
 * image + price. Proxy for "popular/trending" until we have click telemetry.
 */
export async function getTopPicks(n = 10): Promise<MockProductWithHistory[]> {
  try {
    const dbProducts = await db.product.findMany({
      where: {
        isActive: true,
        price: { gt: 0 },
        imageUrl: { not: null },
      },
      select: COMMON_SELECT,
      orderBy: { updatedAt: "desc" },
      take: n,
    });
    return dbProducts.map((p) => buildFromDb({ ...p, prices: [] }));
  } catch (err) {
    console.warn("[data] getTopPicks failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Price drops — products where originalPriceChf > price, ordered by
 * discount percentage DESC. Computes discount inline via raw SQL so
 * we can sort server-side.
 */
export interface PriceDropProduct {
  item: MockProductWithHistory;
  originalPriceChf: number;
  discountPct: number;   // integer 0-99
}

export async function getPriceDrops(n = 24): Promise<PriceDropProduct[]> {
  try {
    const rows = await db.$queryRaw<Array<{
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
      price: string;                 // Decimal → string via Prisma
      originalPriceChf: string;
      discount_pct: number;
    }>>`
      SELECT id, gtin, title, brand, category, "categoryName", "imageUrl",
             "shopName", "sourceType", "affiliateUrl", price, "originalPriceChf",
             ROUND(((("originalPriceChf" - price) / "originalPriceChf") * 100)::numeric, 0)::int AS discount_pct
      FROM "Product"
      WHERE "isActive" = true
        AND price > 0
        AND "originalPriceChf" IS NOT NULL
        AND "originalPriceChf" > price
        AND "imageUrl" IS NOT NULL
      ORDER BY discount_pct DESC, "updatedAt" DESC
      LIMIT ${n}
    `;

    return rows.map((r) => ({
      item: buildFromDb({
        id: r.id,
        gtin: r.gtin,
        title: r.title,
        brand: r.brand,
        category: r.category,
        categoryName: r.categoryName,
        imageUrl: r.imageUrl,
        shopName: r.shopName,
        sourceType: r.sourceType,
        affiliateUrl: r.affiliateUrl,
        price: r.price,
        prices: [],
      }),
      originalPriceChf: Number(r.originalPriceChf),
      discountPct: Number(r.discount_pct),
    }));
  } catch (err) {
    console.warn("[data] getPriceDrops failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Walk the static category tree collecting every descendant leaf slug.
 * Includes the node itself so "parfum/damendufte" also picks up products
 * whose Product.category is "damendufte" (not just the L3 children).
 */
function collectDescendantSlugs(node: CategoryNode): string[] {
  const out: string[] = [node.slug];
  for (const child of node.children) out.push(...collectDescendantSlugs(child));
  return out;
}

/**
 * Thematic shelves — one "shelf" per editorial slot. Each slot references
 * a category by slug (root, L2, or L3); products are drawn from that slug
 * AND all its descendants, ordered by most-recently-updated.
 *
 * Returns an empty shelf if the slug isn't in the tree.
 */
export interface ThematicSlot {
  key: string;                 // short id for React keys
  title: string;               // "Hottest Fragrances"
  subtitle?: string;
  categorySlug: string;        // root | L2 | L3 slug inside CATEGORY_TREE
  /** Relative path for the "see more" CTA. Derived from the tree if omitted. */
  href?: string;
  /** Accent color — applied as a subtle gradient tint on the banner. */
  accent?: string;
}

export interface ThematicShelf {
  slot: ThematicSlot;
  items: MockProductWithHistory[];
}

export async function getThematicShelves(
  slots: ThematicSlot[],
  perShelf = 6,
): Promise<ThematicShelf[]> {
  try {
    const results = await Promise.all(
      slots.map(async (slot) => {
        const node = findCategoryNode(slot.categorySlug);
        if (!node) return { slot, items: [] };
        const slugs = collectDescendantSlugs(node);
        const dbProducts = await db.product.findMany({
          where: {
            isActive: true,
            price: { gt: 0 },
            imageUrl: { not: null },
            category: { in: slugs },
          },
          select: COMMON_SELECT,
          orderBy: { updatedAt: "desc" },
          take: perShelf,
        });
        const items = dbProducts.map((p) => buildFromDb({ ...p, prices: [] }));
        return { slot, items };
      }),
    );
    return results;
  } catch (err) {
    console.warn("[data] getThematicShelves failed:", err instanceof Error ? err.message : err);
    return slots.map((slot) => ({ slot, items: [] }));
  }
}

/**
 * Trending tags — top n brands by active-product count. Used for the
 * Hero-Search chips row. Returns just the brand names.
 */
export async function getTrendingTags(n = 12): Promise<string[]> {
  try {
    const rows = await db.product.groupBy({
      by: ["brand"],
      where: { isActive: true, price: { gt: 0 } },
      _count: { brand: true },
      orderBy: { _count: { brand: "desc" } },
      take: n + 5, // pull a few extras so we can filter out junky brand names
    });
    return rows
      .map((r) => decodeHtmlEntities(r.brand))
      .filter((b) => b.length >= 2 && b.length <= 40 && !/^[\d\s]+$/.test(b))
      .slice(0, n);
  } catch (err) {
    console.warn("[data] getTrendingTags failed:", err instanceof Error ? err.message : err);
    return [];
  }
}
