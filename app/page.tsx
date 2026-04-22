import {
  getDynamicCategories,
  getSiteStats,
  getThematicShelves,
  type ThematicSlot,
} from "@/lib/data";
import HomeClient from "./home-client";

// ISR — 1 hour cache so homepage navigation feels instant after the
// first load without hammering the DB on every request.
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
  const [dynamicCategories, stats, shelves] = await Promise.all([
    getDynamicCategories(),
    getSiteStats(),
    getThematicShelves(HOME_SHELVES, 12),
  ]);

  return (
    <HomeClient
      dynamicCategories={dynamicCategories}
      stats={stats}
      shelves={shelves}
    />
  );
}
