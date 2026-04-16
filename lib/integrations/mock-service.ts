import {
  calculateSwissPrice,
  buildSwissShopBreakdown,
  type PriceBreakdown,
} from "@/lib/pricing/calculator";
import { SEED_PRODUCTS } from "@/prisma/seed";

// ---------------------------------------------------------------------------
// Types (re-exported so the rest of the app keeps working)
// ---------------------------------------------------------------------------

export type { MockProduct, MockSource } from "@/prisma/seed";
import type { MockProduct } from "@/prisma/seed";

export interface MockPricePoint {
  date: string;
  amountEur: number;
  amountChf: number;
  sourceId: string;
  sourceName: string;
}

export interface MockProductWithHistory {
  product: MockProduct;
  priceHistory: MockPricePoint[];
  bestPrice: PriceBreakdown;
  bestSource: string;
  priceDrop30d: number;
  avgChf30d: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EXCHANGE_RATE = 0.94;

// SOURCE_NAMES was a legacy mapping for the Amazon / Galaxus / Zalando
// placeholder integrations. Those aren't wired up yet, so the map is
// empty — live shop name resolution goes through getShopSource() from
// lib/shop-sources, which is populated from the real Adtraction feeds.
const SOURCE_NAMES: Record<string, string> = {};

// ---------------------------------------------------------------------------
// Deterministic PRNG
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------------
// Price history generator — supports variable day ranges
// ---------------------------------------------------------------------------

export function generatePriceHistory(
  product: MockProduct,
  days: number = 30,
): MockPricePoint[] {
  const history: MockPricePoint[] = [];
  const now = new Date();
  const seed = product.gtin.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRandom(seed);

  for (let day = days - 1; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().slice(0, 10);

    for (const source of product.sources) {
      const drift = 1 + (rand() - 0.5) * 0.16;

      let amountEur: number;
      let breakdown: PriceBreakdown;
      if (source.nativeChf != null && source.nativeChf > 0) {
        // Swiss-shop source: drift the native CHF directly.
        const driftedChf = Math.round(source.nativeChf * drift * 100) / 100;
        breakdown = buildSwissShopBreakdown({
          grossChf: driftedChf,
          shippingChf: source.shippingChf ?? null,
          priceIsNet: source.priceIsNet === true,
        });
        amountEur = 0;
      } else {
        amountEur = Math.round(source.currentPriceEur * drift * 100) / 100;
        breakdown = calculateSwissPrice({
          amountEur,
          exchangeRate: EXCHANGE_RATE,
          category: "standard",
          clearanceType: "vereinfacht",
        });
      }

      history.push({
        date: dateStr,
        amountEur,
        amountChf: breakdown.totalChf,
        sourceId: source.sourceId,
        sourceName: SOURCE_NAMES[source.sourceId] ?? source.sourceId,
      });
    }
  }

  return history;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getMockProducts(): MockProductWithHistory[] {
  return SEED_PRODUCTS.map((product) => {
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

    // Seed products can ship with an empty sources array since the mock
    // Amazon / Galaxus / Zalando shops have been retired. Fall back to
    // an empty breakdown so downstream consumers still get a well-formed
    // object (priceHistory + 0-valued price) without crashing on reduce.
    const best =
      latestPrices.length > 0
        ? latestPrices.reduce((min, cur) =>
            cur.breakdown.totalChf < min.breakdown.totalChf ? cur : min,
          )
        : {
            sourceId: "",
            sourceName: "",
            breakdown: {
              originalEur: 0,
              netEur: 0,
              netChf: 0,
              chVat: 0,
              customsFee: 0,
              totalChf: 0,
              exchangeRate: EXCHANGE_RATE,
              savings: 0,
            },
          };

    const oldestDay = priceHistory.filter((p) => p.date === priceHistory[0]?.date);
    const oldestBestChf = oldestDay.length > 0
      ? Math.min(...oldestDay.map((p) => p.amountChf))
      : best.breakdown.totalChf;
    const priceDrop30d = oldestBestChf - best.breakdown.totalChf;

    const allChf = priceHistory.map((p) => p.amountChf);
    const avgChf30d = allChf.length > 0
      ? allChf.reduce((a, b) => a + b, 0) / allChf.length
      : best.breakdown.totalChf;

    return {
      product,
      priceHistory,
      bestPrice: best.breakdown,
      bestSource: best.sourceName,
      priceDrop30d: Math.round(priceDrop30d * 100) / 100,
      avgChf30d: Math.round(avgChf30d * 100) / 100,
    };
  });
}

export function getFeaturedProducts(): MockProductWithHistory[] {
  return getMockProducts().filter((p) => p.product.featured);
}

export function getMockProductByGtin(gtin: string): MockProductWithHistory | undefined {
  return getMockProducts().find((p) => p.product.gtin === gtin);
}

export function getCategories(): string[] {
  return [...new Set(SEED_PRODUCTS.map((p) => p.category))];
}

export function getProductsByCategory(categorySlug: string): MockProductWithHistory[] {
  return getMockProducts().filter((p) => p.product.category === categorySlug);
}

export function getAllGtins(): string[] {
  return SEED_PRODUCTS.map((p) => p.gtin);
}
