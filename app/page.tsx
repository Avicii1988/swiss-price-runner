import {
  getDynamicCategories,
  getSiteStats,
  getThematicShelves,
  type ThematicSlot,
} from "@/lib/data";
import HomeClient from "./home-client";

/**
 * ISR — regenerate the landing page in the background at most every
 * 5 minutes. Previous `force-dynamic` forced a cold render on every
 * request, which was the biggest single source of slow TTFB: every hit
 * ran getThematicShelves (5 shelves × 2 queries = 10 SQL round trips
 * on the Supabase pooler) plus getDynamicCategories + getSiteStats.
 * 5 minutes is short enough that users still see fresh inventory after
 * an import run, and long enough that the shelves get cached for
 * 99%+ of hits.
 */
export const revalidate = 300;

/**
 * Five themed shelves on the homepage — 12 products each (3×4 grid).
 *
 * Order matters: shelves render top-to-bottom and slot 1 owns the
 * above-the-fold attention. Trending Now leads so the landing page
 * always opens with fresh, editor-surfaced inventory; Apple /
 * Sneakers / Beauty follow as topical verticals; Luxury & High-End
 * anchors the bottom.
 *
 * Slug-set design:
 *   Apple       — every surface that belongs to the Apple ecosystem
 *                 (iPhone, iPad, MacBook, AirPods, HomePod, Watch).
 *                 Product CATEGORY_MAP patterns route each class to
 *                 the right L3 slug, so the shelf now reflects the
 *                 full catalogue, not just the phone.
 *   Sneakers    — `schuhe-sneakers` root slug. getThematicShelves
 *                 calls unionDescendants(), which fans out to every
 *                 brand L3 (Nike, Adidas, NB, On, Puma, Asics, Hoka,
 *                 Salomon) in one filter. Single root slug = single
 *                 source of truth.
 *   Beauty      — parfum root + damendufte for emphasis. The parfum
 *                 root covers the long tail via descendants.
 *   Luxury      — uhren-luxus + parfum-nische. Replaces the previous
 *                 generic editor-picks slot with a targeted luxury
 *                 vertical fed by the new L3 slugs.
 *   Trending    — excludeSlugs over everything above, so the catch-
 *                 all still surfaces the long-tail inventory without
 *                 duplicating products that appear in curated shelves.
 */
const APPLE_SLUGS    = ["iphone", "ipad", "laptops-macbook", "airpods", "homepod", "uhren-smartwatch"];
const SNEAKER_SLUGS  = ["schuhe-sneakers"];
const BEAUTY_SLUGS   = ["parfum", "damendufte"];
const LUXURY_SLUGS   = ["uhren-luxus", "parfum-nische"];

const HOME_SHELVES: ThematicSlot[] = [
  {
    key: "trending-now",
    subtitle: "Editors Picks",
    title: "Trending Now",
    excludeSlugs: [...APPLE_SLUGS, ...SNEAKER_SLUGS, ...BEAUTY_SLUGS, ...LUXURY_SLUGS],
    href: "/category/parfum",
  },
  {
    key: "apple-ecosystem",
    subtitle: "Tech · Premium",
    title: "Apple Ecosystem",
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
    key: "luxury-highend",
    subtitle: "Luxus · Nische",
    title: "Luxury & High-End",
    categorySlugs: LUXURY_SLUGS,
    href: "/category/uhren-luxus",
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
