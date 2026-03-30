import { calculateSwissPrice, type PriceBreakdown } from "@/lib/pricing/calculator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MockProduct {
  gtin: string;
  title: string;
  brand: string;
  category: string;
  imageUrl: string;
  featured: boolean;
  sources: MockSource[];
}

export interface MockSource {
  sourceId: string;
  sourceName: string;
  url: string;
  currentPriceEur: number;
}

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
}

// ---------------------------------------------------------------------------
// Seed data – 10 popular Swiss-market products
// ---------------------------------------------------------------------------

const EXCHANGE_RATE = 0.94;

const SOURCE_NAMES: Record<string, string> = {
  amazon_de: "Amazon.de",
  galaxus_ch: "Galaxus",
  zalando_de: "Zalando",
};

const MOCK_PRODUCTS: MockProduct[] = [
  {
    gtin: "00194253715085",
    title: "iPhone 15 Pro 256GB Titan Natur",
    brand: "Apple",
    category: "Smartphones",
    imageUrl: "https://placehold.co/400x400/f8f8f8/111?text=iPhone+15+Pro",
    featured: true,
    sources: [
      { sourceId: "amazon_de", sourceName: "Amazon.de", url: "#", currentPriceEur: 1179.0 },
      { sourceId: "galaxus_ch", sourceName: "Galaxus", url: "#", currentPriceEur: 1249.0 },
      { sourceId: "zalando_de", sourceName: "Zalando", url: "#", currentPriceEur: 1199.0 },
    ],
  },
  {
    gtin: "00764011644505",
    title: "On Cloud 5 Laufschuhe – All Black",
    brand: "On Running",
    category: "Schuhe",
    imageUrl: "https://placehold.co/400x400/f8f8f8/111?text=On+Cloud+5",
    featured: true,
    sources: [
      { sourceId: "amazon_de", sourceName: "Amazon.de", url: "#", currentPriceEur: 149.95 },
      { sourceId: "galaxus_ch", sourceName: "Galaxus", url: "#", currentPriceEur: 169.9 },
      { sourceId: "zalando_de", sourceName: "Zalando", url: "#", currentPriceEur: 149.95 },
    ],
  },
  {
    gtin: "00027242923379",
    title: "Sony WH-1000XM5 Noise Cancelling",
    brand: "Sony",
    category: "Kopfhörer",
    imageUrl: "https://placehold.co/400x400/f8f8f8/111?text=Sony+XM5",
    featured: true,
    sources: [
      { sourceId: "amazon_de", sourceName: "Amazon.de", url: "#", currentPriceEur: 279.0 },
      { sourceId: "galaxus_ch", sourceName: "Galaxus", url: "#", currentPriceEur: 299.0 },
    ],
  },
  {
    gtin: "00050946000282",
    title: "Nespresso Vertuo Next Kapselmaschine",
    brand: "Nespresso",
    category: "Haushalt",
    imageUrl: "https://placehold.co/400x400/f8f8f8/111?text=Nespresso+Vertuo",
    featured: true,
    sources: [
      { sourceId: "amazon_de", sourceName: "Amazon.de", url: "#", currentPriceEur: 129.0 },
      { sourceId: "galaxus_ch", sourceName: "Galaxus", url: "#", currentPriceEur: 149.0 },
    ],
  },
  {
    gtin: "00889842640885",
    title: "Samsung Galaxy S24 Ultra 256GB",
    brand: "Samsung",
    category: "Smartphones",
    imageUrl: "https://placehold.co/400x400/f8f8f8/111?text=Galaxy+S24+Ultra",
    featured: false,
    sources: [
      { sourceId: "amazon_de", sourceName: "Amazon.de", url: "#", currentPriceEur: 1199.0 },
      { sourceId: "galaxus_ch", sourceName: "Galaxus", url: "#", currentPriceEur: 1279.0 },
      { sourceId: "zalando_de", sourceName: "Zalando", url: "#", currentPriceEur: 1219.0 },
    ],
  },
  {
    gtin: "00885909961009",
    title: "Apple AirPods Pro 2. Generation USB-C",
    brand: "Apple",
    category: "Kopfhörer",
    imageUrl: "https://placehold.co/400x400/f8f8f8/111?text=AirPods+Pro+2",
    featured: true,
    sources: [
      { sourceId: "amazon_de", sourceName: "Amazon.de", url: "#", currentPriceEur: 229.0 },
      { sourceId: "galaxus_ch", sourceName: "Galaxus", url: "#", currentPriceEur: 245.0 },
      { sourceId: "zalando_de", sourceName: "Zalando", url: "#", currentPriceEur: 239.0 },
    ],
  },
  {
    gtin: "00194253392828",
    title: 'MacBook Air M3 13" 256GB Midnight',
    brand: "Apple",
    category: "Laptops",
    imageUrl: "https://placehold.co/400x400/f8f8f8/111?text=MacBook+Air+M3",
    featured: true,
    sources: [
      { sourceId: "amazon_de", sourceName: "Amazon.de", url: "#", currentPriceEur: 1099.0 },
      { sourceId: "galaxus_ch", sourceName: "Galaxus", url: "#", currentPriceEur: 1149.0 },
    ],
  },
  {
    gtin: "00764011644260",
    title: "On Cloudmonster 2 – Undyed/Frost",
    brand: "On Running",
    category: "Schuhe",
    imageUrl: "https://placehold.co/400x400/f8f8f8/111?text=On+Cloudmonster",
    featured: false,
    sources: [
      { sourceId: "amazon_de", sourceName: "Amazon.de", url: "#", currentPriceEur: 169.95 },
      { sourceId: "galaxus_ch", sourceName: "Galaxus", url: "#", currentPriceEur: 179.9 },
      { sourceId: "zalando_de", sourceName: "Zalando", url: "#", currentPriceEur: 169.95 },
    ],
  },
  {
    gtin: "00196337069534",
    title: "Dyson V15 Detect Absolute",
    brand: "Dyson",
    category: "Haushalt",
    imageUrl: "https://placehold.co/400x400/f8f8f8/111?text=Dyson+V15",
    featured: true,
    sources: [
      { sourceId: "amazon_de", sourceName: "Amazon.de", url: "#", currentPriceEur: 599.0 },
      { sourceId: "galaxus_ch", sourceName: "Galaxus", url: "#", currentPriceEur: 649.0 },
    ],
  },
  {
    gtin: "00045496883386",
    title: "Nintendo Switch OLED Weiss",
    brand: "Nintendo",
    category: "Gaming",
    imageUrl: "https://placehold.co/400x400/f8f8f8/111?text=Switch+OLED",
    featured: false,
    sources: [
      { sourceId: "amazon_de", sourceName: "Amazon.de", url: "#", currentPriceEur: 299.0 },
      { sourceId: "galaxus_ch", sourceName: "Galaxus", url: "#", currentPriceEur: 319.0 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Deterministic pseudo-random generator (seeded, no crypto needed)
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------------
// Generate 30-day price history
// ---------------------------------------------------------------------------

function generatePriceHistory(product: MockProduct): MockPricePoint[] {
  const history: MockPricePoint[] = [];
  const now = new Date();
  const seed = product.gtin.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRandom(seed);

  for (let day = 29; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().slice(0, 10);

    for (const source of product.sources) {
      const drift = 1 + (rand() - 0.5) * 0.16;
      const amountEur = Math.round(source.currentPriceEur * drift * 100) / 100;

      const breakdown = calculateSwissPrice({
        amountEur,
        exchangeRate: EXCHANGE_RATE,
        category: "standard",
        clearanceType: "vereinfacht",
      });

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
  return MOCK_PRODUCTS.map((product) => {
    const priceHistory = generatePriceHistory(product);

    const latestPrices = product.sources.map((s) => {
      const breakdown = calculateSwissPrice({
        amountEur: s.currentPriceEur,
        exchangeRate: EXCHANGE_RATE,
        category: "standard",
        clearanceType: "vereinfacht",
      });
      return { sourceId: s.sourceId, sourceName: s.sourceName, breakdown };
    });

    const best = latestPrices.reduce((min, cur) =>
      cur.breakdown.totalChf < min.breakdown.totalChf ? cur : min,
    );

    const oldestDay = priceHistory.filter((p) => p.date === priceHistory[0].date);
    const oldestBestChf = Math.min(...oldestDay.map((p) => p.amountChf));
    const priceDrop30d = oldestBestChf - best.breakdown.totalChf;

    return {
      product,
      priceHistory,
      bestPrice: best.breakdown,
      bestSource: best.sourceName,
      priceDrop30d: Math.round(priceDrop30d * 100) / 100,
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
  return [...new Set(MOCK_PRODUCTS.map((p) => p.category))];
}
