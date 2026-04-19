import {
  getDynamicCategories,
  getSiteStats,
  getThematicShelves,
  type ThematicSlot,
} from "@/lib/data";
import HomeClient from "./home-client";

// ISR — 5 min cache so shelves feel live after an import run
// without hammering the DB on every request.
export const revalidate = 300;

const HOME_SHELVES: ThematicSlot[] = [
  {
    key: "top-deals",
    subtitle: "Beste Rabatte · Heute",
    title: "Top Deals",
    // Catch-all: no category filter = whole catalogue, sorted by discount
    href: "/search?q=",
    sortBy: "deals",
  },
  {
    key: "trending-smartphones",
    subtitle: "Smartphones · Tablets",
    title: "Trending Smartphones",
    categorySlugs: ["iphone", "smartphones-apple", "smartphone", "smartphones-samsung", "smartphones-google", "smartphones-xiaomi"],
    href: "/category/smartphone",
    sortBy: "popular",
  },
  {
    key: "new-arrivals",
    subtitle: "Frisch importiert",
    title: "New Arrivals",
    href: "/search?q=",
    sortBy: "newest",
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
