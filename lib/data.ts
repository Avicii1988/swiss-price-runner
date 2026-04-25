import { cache } from "react";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// unstable_cache — graceful fallback for environments where it's not available
let _unstable_cache: typeof import("next/cache").unstable_cache;
try {
  _unstable_cache = require("next/cache").unstable_cache;
} catch {
  // Fallback: no-op wrapper that just calls the function directly
  _unstable_cache = ((fn: any) => fn) as any;
}
import {
  calculateSwissPrice,
  buildSwissShopBreakdown,
  type PriceBreakdown,
} from "@/lib/pricing/calculator";
import { SEED_PRODUCTS } from "@/prisma/seed";
import type { MockProduct } from "@/prisma/seed";
import { EXCHANGE_RATE, generatePriceHistory } from "@/lib/integrations/mock-service";
import type { MockPricePoint, MockProductWithHistory } from "@/lib/integrations/mock-service";
import { decodeHtmlEntities, prettifySlug, cleanCategoryName } from "@/lib/category-icons";
import { findCategoryNode, type CategoryNode } from "@/lib/categories";

// Shop-name lookup — empty placeholder. Real shop names flow through
// getShopSource() from lib/shop-sources (populated from the live
// Adtraction feed registry). The legacy Amazon.de / Galaxus / Zalando
// entries are gone together with the rest of the mock data.
const SOURCE_NAMES: Record<string, string> = {};

/**
 * Load dynamic categories from DB — only categories with at least 1 product.
 */
/**
 * Cached dynamic categories — SWR with 5 min TTL so the sidebar
 * and filter dropdowns don't re-query the DB on every page view.
 */
export const getDynamicCategories = _unstable_cache(
  async (): Promise<{ slug: string; name: string; productCount: number }[]> => {
    try {
      const result = await db.product.groupBy({
        by: ["category"],
        where: { isActive: true },
        _count: { category: true },
        orderBy: { _count: { category: "desc" } },
      });
      const dbCats = await db.category.findMany({
        select: { slug: true, name: true },
      }).catch(() => [] as { slug: string; name: string }[]);
      const catNameMap = new Map(dbCats.map((c) => [c.slug, c.name]));
      return result.map((r) => {
        const rawName = catNameMap.get(r.category);
        const name = rawName ? cleanCategoryName(rawName) : prettifySlug(r.category);
        return { slug: r.category, name, productCount: r._count.category };
      });
    } catch { return []; }
  },
  ["dynamic-categories"],
  { revalidate: 300 },
);

/**
 * Fetch a capped slice of products from Supabase with their latest
 * prices. Falls back to seed data if the DB is empty or unreachable.
 *
 * The previous implementation pulled every active row (~16k+) on every
 * call, which is the root cause of the slow server render on any page
 * that reaches this function. Capped at 2000 — more than enough for
 * the catch-all "no parent slug" category view and for the legacy
 * consumers; specific listings should always use getProductsByCategory
 * or getProductsPaginated instead.
 */
export async function getProducts(): Promise<MockProductWithHistory[]> {
  try {
    const dbProducts = await db.product.findMany({
      where: { isActive: true },
      select: {
        id: true, gtin: true, title: true, brand: true, category: true,
        categoryName: true, imageUrl: true, shopName: true, sourceType: true,
        affiliateUrl: true, price: true, sizeLabel: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 2000,
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
          affiliateUrl: true, price: true, sizeLabel: true,
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
export const getSiteStats = _unstable_cache(
  async (): Promise<{ shops: number; brands: number; offers: number }> => {
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
  },
  ["site-stats"],
  { revalidate: 300 },
);

export async function getProductByGtin(gtin: string): Promise<MockProductWithHistory | null> {
  try {
    const p = await db.product.findUnique({
      where: { gtin },
      select: {
        id: true, gtin: true, title: true, brand: true, category: true,
        categoryName: true, imageUrl: true, shopName: true, sourceType: true,
        affiliateUrl: true, price: true, sizeLabel: true,
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

/**
 * Parfum parent → list of legacy flat subcategory slugs that should be
 * folded into the parent category page. Kept in one place so
 * getProductsByCategory and countProductsByCategory stay in sync.
 */
const PARFUM_SUB_SLUGS = [
  "herrendufte",
  "damendufte",
  "unisex-dufte",
  "geschenksets",
  "pflege",
  "make-up",
  "haarpflege",
  "koerperpflege",
  "sonnenpflege",
];

/**
 * Per-request memoisation — React's `cache()` de-duplicates identical
 * calls inside a single server render, so the category page and its
 * breadcrumb / sidebar can both ask for the same slug without issuing
 * two SQL round-trips. `revalidate = 300` on the route (see
 * app/category/[...slug]/page.tsx) then keeps the result hot across
 * requests until the next ISR regeneration.
 */
export const getProductsByCategory = cache(
  async (slug: string): Promise<MockProductWithHistory[]> => _getProductsByCategory(slug),
);

async function _getProductsByCategory(slug: string): Promise<MockProductWithHistory[]> {
  try {
    // Raw SQL so we can rank deterministically and expand descendants.
    //
    // Matching strategy:
    //   /category/schuhe-sneakers used to run `category = 'schuhe-sneakers'`
    //   verbatim — but every imported SKU actually lives on a leaf slug
    //   (sneakers-nike, sneakers-newbalance, …), so the L2 page came up
    //   empty. We now walk the tree via findCategoryNode() +
    //   collectDescendantSlugs() and filter `category IN (self + descendants)`,
    //   matching the behaviour of the home shelves.
    //
    // Sort strategy:
    //   · L1 root (e.g. /category/smartphones): rank by shop_count DESC so
    //     the overview leads with multi-shop comparison-worthy hits.
    //   · L2 / L3 subcategories (e.g. /category/smartphones-apple,
    //     /category/damen-kleider): rank by price DESC so the flagship /
    //     most expensive SKU leads — the "teuerste zuerst" rule the
    //     product team asked for. shop_count stays as the secondary
    //     tiebreaker so multi-shop items still bubble up within the same
    //     price band.
    const node = findCategoryNode(slug);
    const matchSlugs = node
      ? collectDescendantSlugs(node)
      : [slug];
    // Legacy: the flat `parfum` root used to fold a hand-maintained list
    // of sibling slugs. With the tree walker that list is now covered by
    // descendants, but we keep the PARFUM_SUB_SLUGS merge for resilience
    // in case old products still sit on a slug that never existed in the
    // tree (`herrendufte`, `damendufte` without parents, etc.).
    const filterSlugs = slug === "parfum"
      ? Array.from(new Set([...matchSlugs, ...PARFUM_SUB_SLUGS]))
      : matchSlugs;

    const isSubcategory = node ? node.depth >= 1 : false;
    const orderBy = isSubcategory
      ? Prisma.sql`ORDER BY p.price DESC NULLS LAST,
                            COALESCE(sc.shop_count, 1) DESC,
                            p."updatedAt" DESC`
      : Prisma.sql`ORDER BY COALESCE(sc.shop_count, 1) DESC,
                            p."updatedAt" DESC`;

    // Smartphone categories carry accessory noise (cases, chargers, shavers).
    // Exclude those titles so only actual phones appear in phone categories.
    const SMARTPHONE_SLUG_RE = /\b(smartphone|iphone|mobile)\b/i;
    const isSmartphoneCat = filterSlugs.some((s) => SMARTPHONE_SLUG_RE.test(s));
    const SMARTPHONE_EXCLUSIONS = ["Hülle", "Case", "Panzerglas", "Ladekabel", "Rasierer", "Shaver", "Parfüm"];
    const exclusionClauses = isSmartphoneCat
      ? SMARTPHONE_EXCLUSIONS.map((kw) => Prisma.sql`p.title NOT ILIKE ${`%${kw}%`}`)
      : [];
    const exclusionSql = exclusionClauses.length > 0
      ? Prisma.sql`AND ${Prisma.join(exclusionClauses, " AND ")}`
      : Prisma.sql``;

    const rows = await db.$queryRaw<Array<{
      id: string; gtin: string; title: string; brand: string; category: string;
      categoryName: string | null; imageUrl: string | null; shopName: string | null;
      sourceType: string | null; affiliateUrl: string | null;
      price: string;
      shop_ids: string[] | null;
    }>>`
      WITH shop_counts AS (
        SELECT
          "productId",
          COUNT(DISTINCT "sourceId")::int AS shop_count,
          array_agg(DISTINCT "sourceId") AS shop_ids
        FROM "Price"
        GROUP BY "productId"
      )
      SELECT p.id, p.gtin, p.title, p.brand, p.category, p."categoryName",
             p."imageUrl", p."shopName", p."sourceType", p."affiliateUrl",
             p.price, p."sizeLabel",
             sc.shop_ids AS shop_ids
      FROM "Product" p
      LEFT JOIN shop_counts sc ON sc."productId" = p.id
      WHERE p."isActive" = true
        AND p.price IS NOT NULL AND p.price > 0
        AND p.category IN (${Prisma.join(filterSlugs)})
        ${exclusionSql}
      ${orderBy}
      LIMIT 1000
    `;

    return rows.map((p) =>
      buildFromDb({ ...p, prices: [], shopIds: p.shop_ids ?? undefined }),
    );
  } catch {
    const all = SEED_PRODUCTS.filter((p) => p.category === slug);
    return all.map(enrichProduct);
  }
}

/**
 * Total active products in a category — a single SELECT COUNT(*) with
 * the same WHERE clause as getProductsByCategory. Used by the category
 * header so the "X Produkte"-badge reflects the true DB count rather
 * than the slice cap from getProductsByCategory (which was previously
 * misread as "500 Produkte" in every category).
 */
/**
 * Same cache wrapper as getProductsByCategory — the count query runs
 * once per slug per render (header badge + any downstream consumer
 * share the result), then rides the route-level ISR.
 */
export const countProductsByCategory = cache(
  async (slug: string): Promise<number> => _countProductsByCategory(slug),
);

async function _countProductsByCategory(slug: string): Promise<number> {
  if (!slug) return 0;
  try {
    const node = findCategoryNode(slug);
    const matchSlugs = node ? collectDescendantSlugs(node) : [slug];
    const filterSlugs = slug === "parfum"
      ? Array.from(new Set([...matchSlugs, ...PARFUM_SUB_SLUGS]))
      : matchSlugs;
    return await db.product.count({
      where: {
        isActive: true,
        price: { gt: 0 },
        category: { in: filterSlugs },
      },
    });
  } catch {
    return 0;
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

/**
 * Variant sibling — one size of the product currently displayed on the PDP.
 * Used by the variant selector to render "30 ml · 50 ml · 100 ml" chips
 * that deep-link to the merchant's specific variant URL.
 */
export interface VariantSibling {
  gtin: string;
  sizeLabel: string | null;
  /** JSON-serialised Record<string,string> from import-time attribute extraction. */
  displayAttributes: string | null;
  title: string;
  brand: string;
  category: string;
  priceChf: number;
  affiliateUrl: string | null;
  productUrl: string;
  isCurrent: boolean;
}

/**
 * Fetch all variants that share a groupId with the given GTIN.
 * Ordered by numeric size asc (so 30 ml comes before 50 ml before 100 ml).
 * Returns an empty array for ungrouped products.
 */
export async function getVariantSiblings(gtin: string): Promise<VariantSibling[]> {
  try {
    const current = await db.product.findUnique({
      where: { gtin },
      select: { groupId: true, sizeLabel: true },
    });
    if (!current?.groupId) return [];

    const siblings = await db.product.findMany({
      where: { groupId: current.groupId, isActive: true, price: { gt: 0 } },
      select: {
        gtin: true,
        title: true,
        brand: true,
        category: true,
        sizeLabel: true,
        displayAttributes: true,
        price: true,
        affiliateUrl: true,
      },
      orderBy: { price: "asc" },
    });

    return siblings
      .map((s) => ({
        gtin: s.gtin,
        sizeLabel: s.sizeLabel,
        displayAttributes: s.displayAttributes,
        title: s.title,
        brand: s.brand,
        category: s.category,
        priceChf: Number(s.price),
        affiliateUrl: s.affiliateUrl,
        productUrl: `/product/${s.gtin}`,
        isCurrent: s.gtin === gtin,
      }))
      // Sort by the leading numeric portion of sizeLabel, fall back to price.
      .sort((a, b) => {
        const na = parseFloat((a.sizeLabel || "").replace(/[^\d.]/g, "")) || 0;
        const nb = parseFloat((b.sizeLabel || "").replace(/[^\d.]/g, "")) || 0;
        if (na && nb && na !== nb) return na - nb;
        return a.priceChf - b.priceChf;
      });
  } catch (err) {
    console.warn("[data] getVariantSiblings failed:", err instanceof Error ? err.message : err);
    return [];
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
  shippingCostChf?: unknown | null;
  priceIsNet?: boolean | null;
  sizeLabel?: string | null;
  prices: { amountChf: unknown; amountEur: unknown; sourceId: string; shopName?: string | null; url?: string | null; timestamp?: Date }[];
  /**
   * Optional list of sourceIds that carry this product. Populated by
   * listing queries (shelves, category) from the Price table so the
   * card UI can render a "X Angebote" count + a mini-logo row without
   * a per-card round-trip. PDP reads full Price rows and ignores this.
   */
  shopIds?: string[];
};

function buildFromDb(p: DbProduct): MockProductWithHistory {
  const isFeedProduct = p.sourceType === "adtraction_feed";
  const affiliateUrl = p.affiliateUrl || "#";
  const productShippingChf = p.shippingCostChf == null ? null : Number(p.shippingCostChf);
  const productPriceIsNet = p.priceIsNet === true;

  // Determine CHF price first so it can act as the canonical fallback for
  // sources whose Price.amountChf is missing or zero (an occasional symptom
  // of a partial import). The importer writes Price.amountEur = 0 for every
  // feed row, so we can't trust the EUR column on its own.
  const directPriceChf = p.price ? Number(p.price) : 0;

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

  const latestPriceChf = p.prices.length > 0 ? Number(p.prices[0].amountChf) : 0;
  const bestChf = directPriceChf > 0 ? directPriceChf : latestPriceChf;

  const seed = SEED_PRODUCTS.find((s) => s.gtin === p.gtin);

  // All feed imports flow native CHF end-to-end: regardless of whether the
  // Price row carries a valid amountChf or not, we prefer Product.price
  // (directPriceChf) as the canonical display price. This defends against
  // the "0.–" regression we'd see when a half-written Price row zeroed out
  // the amount even though Product.price was intact.
  const sources = Array.from(sourceMap.entries()).map(([sid, { chf, eur, url, shopName: sName }]) => {
    const effectiveChf = chf > 0 ? chf : directPriceChf;
    if (effectiveChf > 0) {
      return {
        sourceId: sid,
        sourceName: sName || SOURCE_NAMES[sid] || sid,
        url,
        currentPriceEur: 0,
        nativeChf: effectiveChf,
        shippingChf: productShippingChf,
        priceIsNet: productPriceIsNet,
      };
    }
    // Last resort: only reached when neither Price.amountChf nor
    // Product.price are usable. Falls through the DE-import path, which
    // will produce totalChf=0 for the empty EUR input; the UI prints
    // "Preis auf Anfrage" for that state.
    return {
      sourceId: sid,
      sourceName: sName || SOURCE_NAMES[sid] || sid,
      url,
      currentPriceEur: eur,
    };
  });

  // Listing queries (shelves, category) don't load Price rows individually
  // — they carry a pre-aggregated `shopIds` list from the raw SQL join.
  // Expand that list into one virtual source per shop so the card UI
  // can read `product.sources.length` as the true offer count and iterate
  // sources[].sourceId for the mini-logo row. All virtual sources share
  // the same price (Product.price = lowest offer from the SQL ranking).
  if (sources.length === 0 && p.shopIds && p.shopIds.length > 0 && bestChf > 0) {
    for (const sid of p.shopIds) {
      sources.push({
        sourceId: sid,
        sourceName: SOURCE_NAMES[sid] || sid,
        url: affiliateUrl,
        currentPriceEur: 0,
        nativeChf: bestChf,
        shippingChf: productShippingChf,
        priceIsNet: productPriceIsNet,
      });
    }
  }

  // Fallback: no Price rows and no pre-aggregated shopIds, but we know
  // the product is a feed item with a valid Product.price → synthesise
  // one virtual source so the card still has a "Zum Shop" target.
  if (sources.length === 0 && (isFeedProduct || directPriceChf > 0) && bestChf > 0) {
    sources.push({
      sourceId: "feed_default",
      sourceName: p.shopName || "Shop",
      url: affiliateUrl,
      currentPriceEur: 0,
      nativeChf: bestChf,
      shippingChf: productShippingChf,
      priceIsNet: productPriceIsNet,
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
    sizeLabel: p.sizeLabel ?? undefined,
    // Sources come exclusively from the real feed data — no more
    // amazon_de / galaxus_ch / zalando_de fallback from the seed.
    // If a DB product genuinely has no pricing, the UI renders the
    // "Preis auf Anfrage" state rather than inventing phantom offers.
    sources,
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
    // Swiss-shop feed: use the native CHF breakdown (no DE-VAT / no customs).
    if (s.nativeChf != null && s.nativeChf > 0) {
      const breakdown = buildSwissShopBreakdown({
        grossChf: s.nativeChf,
        shippingChf: s.shippingChf ?? null,
        priceIsNet: s.priceIsNet === true,
      });
      return { sourceId: s.sourceId, sourceName: s.sourceName, breakdown };
    }
    // DE-import path (Amazon.de etc.): existing pipeline with VAT removal + customs.
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
  affiliateUrl: true, price: true, sizeLabel: true,
  shippingCostChf: true, priceIsNet: true,
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
 * Thematic shelves — one "shelf" per editorial slot. Slots can target:
 *   - a single slug via `categorySlug`         (root, L2, or L3)
 *   - a union of slugs via `categorySlugs[]`   (multi-tree match)
 *   - "everything else" via `excludeSlugs[]`   (for a general/trending feed)
 *
 * Products are drawn from the referenced slug(s) AND all their descendants,
 * ordered by most-recently-updated. Returns an empty shelf if no slug resolves.
 */
export interface ThematicSlot {
  key: string;                    // short id for React keys
  title: string;                  // "Top 10 Apple Ecosystem"
  subtitle?: string;
  /** Single-slug targeting (legacy shape, still supported). */
  categorySlug?: string;
  /** Multi-slug targeting — union of all descendants. */
  categorySlugs?: string[];
  /** Catch-all shelf: exclude products whose leaf slug is in this descendant set. */
  excludeSlugs?: string[];
  /** Relative path for the "Alle anzeigen" CTA. Required for the home page. */
  href?: string;
  /** Accent color — applied as a subtle gradient tint on editorial banners. */
  accent?: string;
  /**
   * Sort override for this shelf.
   *   "popular" (default) — most-shops first, then recency
   *   "deals"   — biggest absolute discount (originalPriceChf − price) first
   *   "newest"  — most recently imported (createdAt DESC)
   */
  sortBy?: "popular" | "deals" | "newest";
  /** Exclude products whose title contains any of these strings (case-insensitive). */
  titleExclude?: string[];
  /** Restrict to a specific brand (case-insensitive exact match). */
  brandFilter?: string;
  /** Only include products with price >= this CHF value. */
  priceMin?: number;
}

/**
 * Variant metadata attached to each shelf item. Populated from the per-group
 * aggregate query inside `getThematicShelves`. `variantCount = 1` means the
 * product is a singleton and should render like a regular card; any higher
 * value triggers the "Ab CHF X" label + variant-count pill in the UI.
 */
export interface VariantMeta {
  groupId: string | null;
  variantCount: number;
  /** Lowest Product.price across all variants sharing the groupId. */
  minPriceChf: number;
}

export type ShelfItem = MockProductWithHistory & { variant?: VariantMeta };

export interface ThematicShelf {
  slot: ThematicSlot;
  items: ShelfItem[];
}

function unionDescendants(slugs: string[]): string[] {
  const seen = new Set<string>();
  for (const slug of slugs) {
    const node = findCategoryNode(slug);
    if (!node) { seen.add(slug); continue; }
    for (const s of collectDescendantSlugs(node)) seen.add(s);
  }
  return Array.from(seen);
}

export async function getThematicShelves(
  slots: ThematicSlot[],
  perShelf = 6,
): Promise<ThematicShelf[]> {
  try {
    const results = await Promise.all(
      slots.map(async (slot) => {
        let categoryFilter: { mode: "in" | "notIn"; slugs: string[] } | null = null;

        if (slot.categorySlugs && slot.categorySlugs.length > 0) {
          const slugs = unionDescendants(slot.categorySlugs);
          if (slugs.length === 0) return { slot, items: [] };
          categoryFilter = { mode: "in", slugs };
        } else if (slot.categorySlug) {
          const node = findCategoryNode(slot.categorySlug);
          if (!node) return { slot, items: [] };
          categoryFilter = { mode: "in", slugs: collectDescendantSlugs(node) };
        } else if (slot.excludeSlugs && slot.excludeSlugs.length > 0) {
          categoryFilter = { mode: "notIn", slugs: unionDescendants(slot.excludeSlugs) };
        }

        // ── Grouped query: DISTINCT ON (groupId) with min-price as representative ──
        // Products without a groupId are treated as singletons via COALESCE(groupId, gtin).
        // We pick the cheapest variant per group as the representative row and also
        // return the group's variantCount + minPriceChf so the UI can show "Ab CHF X".
        const whereClauses: Prisma.Sql[] = [
          Prisma.sql`"isActive" = true`,
          Prisma.sql`price IS NOT NULL AND price > 0`,
          Prisma.sql`"imageUrl" IS NOT NULL`,
        ];
        if (slot.priceMin && slot.priceMin > 0) {
          whereClauses.push(Prisma.sql`price >= ${slot.priceMin}`);
        }
        if (slot.brandFilter) {
          whereClauses.push(Prisma.sql`brand ILIKE ${slot.brandFilter}`);
        }
        if (slot.titleExclude && slot.titleExclude.length > 0) {
          for (const kw of slot.titleExclude) {
            whereClauses.push(Prisma.sql`title NOT ILIKE ${`%${kw}%`}`);
          }
        }
        if (categoryFilter) {
          if (categoryFilter.slugs.length === 0) {
            // notIn with empty list = match all → skip the filter
          } else if (categoryFilter.mode === "in") {
            whereClauses.push(Prisma.sql`category IN (${Prisma.join(categoryFilter.slugs)})`);
          } else {
            whereClauses.push(Prisma.sql`category NOT IN (${Prisma.join(categoryFilter.slugs)})`);
          }
        }
        const whereSql = Prisma.join(whereClauses, " AND ");

        // Shop-count priority: rank products carried by the most
        // distinct shops first, then by recency. Rows with no Price
        // records (just a Product.price) count as 1 shop. The
        // shop_counts CTE groups the Price table once and is reused
        // across every shelf; array_agg(DISTINCT "sourceId") also
        // returns the list of shop IDs so the card UI can render the
        // mini-logo row without extra DB round-trips.
        const rows = await db.$queryRaw<Array<{
          id: string; gtin: string; title: string; brand: string; category: string;
          categoryName: string | null; imageUrl: string | null; shopName: string | null;
          sourceType: string | null; affiliateUrl: string | null;
          price: string; originalPriceChf: string | null;
          shippingCostChf: string | null; priceIsNet: boolean;
          groupId: string | null;
          variant_count: number; min_price: string;
          shop_count: number;
          shop_ids: string[] | null;
        }>>`
          WITH agg AS (
            SELECT
              COALESCE("groupId", gtin) AS grp_key,
              COUNT(*)::int           AS variant_count,
              MIN(price)              AS min_price
            FROM "Product"
            WHERE ${whereSql}
            GROUP BY COALESCE("groupId", gtin)
          ),
          shop_counts AS (
            SELECT
              "productId",
              COUNT(DISTINCT "sourceId")::int AS shop_count,
              array_agg(DISTINCT "sourceId") AS shop_ids
            FROM "Price"
            GROUP BY "productId"
          ),
          reps AS (
            SELECT DISTINCT ON (COALESCE(p."groupId", p.gtin))
              p.*,
              a.variant_count,
              a.min_price,
              COALESCE(sc.shop_count, 1)::int AS shop_count,
              sc.shop_ids AS shop_ids
            FROM "Product" p
            JOIN agg a ON a.grp_key = COALESCE(p."groupId", p.gtin)
            LEFT JOIN shop_counts sc ON sc."productId" = p.id
            WHERE ${whereSql}
            ORDER BY COALESCE(p."groupId", p.gtin), p.price ASC
          )
          SELECT id, gtin, title, brand, category, "categoryName", "imageUrl",
                 "shopName", "sourceType", "affiliateUrl", price, "originalPriceChf",
                 "shippingCostChf", "priceIsNet", "groupId", "sizeLabel",
                 variant_count, min_price, shop_count, shop_ids
          FROM reps
          ORDER BY ${slot.sortBy === "deals"
            ? Prisma.sql`CASE WHEN "originalPriceChf" IS NOT NULL AND "originalPriceChf" > price THEN ("originalPriceChf" - price) ELSE 0 END DESC, shop_count DESC`
            : slot.sortBy === "newest"
            ? Prisma.sql`"createdAt" DESC`
            : Prisma.sql`shop_count DESC, "updatedAt" DESC`}
          LIMIT ${perShelf}
        `;

        const items: ShelfItem[] = rows.map((r) => {
          const built = buildFromDb({
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
            shippingCostChf: r.shippingCostChf,
            priceIsNet: r.priceIsNet,
            prices: [],
            shopIds: r.shop_ids ?? undefined,
          });
          return {
            ...built,
            variant: {
              groupId: r.groupId,
              variantCount: Number(r.variant_count),
              minPriceChf: Number(r.min_price),
            },
          };
        });
        return { slot, items };
      }),
    );

    // If every slot came back empty the DB is likely unhealthy or the
    // catalogue hasn't been imported yet. We distinguish the two cases:
    //   · Total items > 0 → real data, cache normally.
    //   · Total items = 0 → poisoned result; throw so Next.js ISR
    //     discards this render and preserves the last good cached page
    //     rather than caching a "zero products" view for the next hour.
    const totalItems = results.reduce((sum, r) => sum + r.items.length, 0);
    if (totalItems === 0) {
      throw new Error("getThematicShelves: all slots empty — DB may be unhealthy");
    }

    return results;
  } catch (err) {
    console.warn("[data] getThematicShelves failed:", err instanceof Error ? err.message : err);
    // Re-throw so the Next.js ISR background revalidation marks this
    // render as failed. The PREVIOUS successfully cached HTML page is
    // then preserved instead of being replaced by a zero-product page.
    throw err;
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
