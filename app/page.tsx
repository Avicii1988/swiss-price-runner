import { getProducts, getFeatured, getDistinctCategories, getDynamicCategories } from "@/lib/data";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [allProducts, featured, categories, dynamicCategories] = await Promise.all([
    getProducts(),
    getFeatured(),
    getDistinctCategories(),
    getDynamicCategories(),
  ]);

  return (
    <HomeClient
      allProducts={allProducts}
      featured={featured}
      categories={categories}
      dynamicCategories={dynamicCategories}
    />
  );
}
