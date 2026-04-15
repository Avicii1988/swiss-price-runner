import {
  getDynamicCategories,
  getSiteStats,
  getThematicShelves,
  type ThematicSlot,
} from "@/lib/data";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

/**
 * Four themed shelves on the homepage — curated, 12 products each
 * (3 cols × 4 rows on the default desktop grid, no orphans).
 * The "trending" slot auto-excludes the slugs covered by the other three
 * so users don't see duplicates across sections.
 */
const APPLE_SLUGS    = ["iphone", "uhren-smartwatch"];
const SNEAKER_SLUGS  = ["sneakers-newbalance"];
const BEAUTY_SLUGS   = ["parfum", "damendufte"];

const HOME_SHELVES: ThematicSlot[] = [
  {
    key: "apple-ecosystem",
    subtitle: "Tech · Premium",
    title: "Top 10 Apple Ecosystem",
    categorySlugs: APPLE_SLUGS,
    href: "/category/smartphones-apple",
  },
  {
    key: "sneaker-highlights",
    subtitle: "Street · Style",
    title: "Sneaker Highlights",
    categorySlugs: SNEAKER_SLUGS,
    href: "/category/schuhe-sneakers",
  },
  {
    key: "beauty-fragrances",
    subtitle: "Beauty · Düfte",
    title: "Beauty & Fragrances",
    categorySlugs: BEAUTY_SLUGS,
    href: "/category/parfum",
  },
  {
    key: "trending-now",
    subtitle: "Editors Picks",
    title: "Trending Now",
    excludeSlugs: [...APPLE_SLUGS, ...SNEAKER_SLUGS, ...BEAUTY_SLUGS],
    href: "/category/parfum",
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
