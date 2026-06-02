import {
  getDynamicCategories,
  getSiteStats,
  getThematicShelves,
  type ThematicSlot,
  type ThematicShelf,
} from "@/lib/data";
import HomeClient from "./home-client";

// Never statically generate at build time — the DB is not available
// in the Vercel build environment and getThematicShelves would hang
// until the 60s worker timeout, causing the build to fail.
// getThematicShelves is wrapped in unstable_cache (60s TTL) in data.ts
// so the data is still served from cache between requests.
export const dynamic = "force-dynamic";

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
  const [dynamicCategories, stats] = await Promise.all([
    getDynamicCategories(),
    getSiteStats(),
  ]);

  let shelves: ThematicShelf[] = [];
  try {
    shelves = await getThematicShelves(HOME_SHELVES, 12);
  } catch {
    // With force-dynamic there is no ISR stale-page to fall back to, so
    // re-throwing would produce a 500 on every request. Always degrade
    // gracefully to an empty-shelves home page instead.
  }

  return (
    <HomeClient
      dynamicCategories={dynamicCategories}
      stats={stats}
      shelves={shelves}
    />
  );
}
