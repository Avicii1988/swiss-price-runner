import { getProductsPaginated, getFeatured, getDynamicCategories, getSiteStats } from "@/lib/data";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ products: initialProducts, total }, featured, dynamicCategories, stats] = await Promise.all([
    getProductsPaginated(24, 0),
    getFeatured(),
    getDynamicCategories(),
    getSiteStats(),
  ]);

  return (
    <HomeClient
      initialProducts={initialProducts}
      totalProducts={total}
      featured={featured}
      categories={[]}
      dynamicCategories={dynamicCategories}
      stats={stats}
    />
  );
}
