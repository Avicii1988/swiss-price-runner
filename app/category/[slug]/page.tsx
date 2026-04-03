import { getProductsByCategory, getProducts } from "@/lib/data";
import CategoryClient from "./client";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const products = params.slug
    ? await getProductsByCategory(params.slug)
    : await getProducts();

  return <CategoryClient slug={params.slug} products={products} />;
}
