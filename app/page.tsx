import { getProducts, getFeatured, getDistinctCategories } from "@/lib/data";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [allProducts, featured, categories] = await Promise.all([
    getProducts(),
    getFeatured(),
    getDistinctCategories(),
  ]);

  return (
    <HomeClient
      allProducts={allProducts}
      featured={featured}
      categories={categories}
    />
  );
}
