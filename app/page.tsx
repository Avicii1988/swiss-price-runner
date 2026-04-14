import {
  getProductsPaginated,
  getDynamicCategories,
  getSiteStats,
  getTopPicks,
  getPriceDrops,
  getThematicShelves,
  getTrendingTags,
  type ThematicSlot,
} from "@/lib/data";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

/**
 * Three editorial shelves on the homepage — curated, not automatic.
 * Slugs reference nodes in lib/categories.ts::CATEGORY_TREE.
 */
const THEMATIC_SLOTS: ThematicSlot[] = [
  {
    key: "hottest-fragrances",
    title: "Hottest Fragrances",
    subtitle: "Beauty Editorial",
    categorySlug: "damendufte",
    accent: "#c67a9e",
  },
  {
    key: "apple-ecosystem",
    title: "Apple Ecosystem",
    subtitle: "Tech · Premium",
    categorySlug: "smartphones-apple",
    accent: "#1d1d1f",
  },
  {
    key: "urban-sneakers",
    title: "Urban Sneakers",
    subtitle: "Street · Style",
    categorySlug: "schuhe-sneakers",
    accent: "#f26a2e",
  },
];

export default async function HomePage() {
  const [
    { products: initialProducts, total },
    dynamicCategories,
    stats,
    topPicks,
    priceDrops,
    shelves,
    trending,
  ] = await Promise.all([
    getProductsPaginated(24, 0),
    getDynamicCategories(),
    getSiteStats(),
    getTopPicks(10),
    getPriceDrops(12),
    getThematicShelves(THEMATIC_SLOTS, 4),
    getTrendingTags(10),
  ]);

  return (
    <HomeClient
      initialProducts={initialProducts}
      totalProducts={total}
      dynamicCategories={dynamicCategories}
      stats={stats}
      topPicks={topPicks}
      priceDrops={priceDrops}
      shelves={shelves}
      trending={trending}
    />
  );
}
