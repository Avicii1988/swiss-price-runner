import {
  getDynamicCategories,
  getSiteStats,
  getThematicShelves,
  type ThematicSlot,
  type ThematicShelf,
} from "@/lib/data";
import HomeClient from "./home-client";

// ISR — 1 hour cache so homepage navigation feels instant after the
// first load without hammering the DB on every request.
// getThematicShelves now re-throws on DB failure, so the ISR engine
// discards the failed render and preserves the last good cached page
// rather than replacing it with a "zero products" result.
export const revalidate = 3600;

// Titles containing any of these strings are accessory noise that leaks
// into phone/tech categories via messy merchant feeds.
const PHONE_JUNK = ["Hülle", "Case", "Panzerglas", "Ladekabel", "Rasierer", "Shaver", "Parfüm"];

const HOME_SHELVES: ThematicSlot[] = [
  {
    key: "trends-2026",
    subtitle: "Meistgesehen · 2026",
    title: "Trends 2026",
    href: "/search?q=",
    sortBy: "newest",
  },
  {
    key: "dufte-2026",
    subtitle: "Parfum & Düfte",
    title: "Düfte 2026",
    categorySlugs: ["parfum", "damendufte", "herrendufte", "nischenparfum", "parfum-damen", "parfum-herren"],
    href: "/category/parfum",
    sortBy: "popular",
  },
  {
    key: "luxury-tech",
    subtitle: "Premium Electronics · ab CHF 1000",
    title: "Luxury Tech",
    categorySlugs: [
      "iphone", "smartphones-apple", "smartphones-samsung", "smartphones-google",
      "laptop", "laptops", "tablet",
    ],
    href: "/category/smartphones",
    sortBy: "popular",
    priceMin: 1000,
    titleExclude: PHONE_JUNK,
  },
  {
    key: "apple-ecosystem",
    subtitle: "Apple · Ecosystem",
    title: "Apple Ecosystem",
    brandFilter: "Apple",
    href: "/search?q=Apple",
    sortBy: "popular",
    titleExclude: PHONE_JUNK,
  },
];

export default async function HomePage() {
  // getDynamicCategories + getSiteStats are wrapped in unstable_cache and
  // tolerate DB failures gracefully (return empty arrays / zero counts).
  // getThematicShelves throws on DB failure so ISR preserves the stale
  // cached page; we catch here ONLY for the very first render when no
  // prior cache exists (e.g. fresh deployment with DB temporarily down).
  const [dynamicCategories, stats] = await Promise.all([
    getDynamicCategories(),
    getSiteStats(),
  ]);

  let shelves: ThematicShelf[] = [];
  try {
    shelves = await getThematicShelves(HOME_SHELVES, 12);
  } catch {
    // DB unavailable on first render — show empty page; ISR will retry
    // on the next request cycle and populate shelves once DB recovers.
  }

  return (
    <HomeClient
      dynamicCategories={dynamicCategories}
      stats={stats}
      shelves={shelves}
    />
  );
}
