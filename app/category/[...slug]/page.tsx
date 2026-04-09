import { getProductsByCategory, getProducts, getDynamicCategories } from "@/lib/data";
import { parseCategorySlugs } from "@/lib/categories";
import CategoryClient from "./client";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const slugs = params.slug ?? [];
  const parentSlug = slugs[0] ?? "";
  const { parentCategory, activeSubCategory, breadcrumbs } =
    parseCategorySlugs(slugs);

  const [products, dynamicCategories] = await Promise.all([
    parentSlug ? getProductsByCategory(parentSlug) : getProducts(),
    getDynamicCategories(),
  ]);

  return (
    <CategoryClient
      slugs={slugs}
      products={products}
      parentCategory={parentCategory ? { slug: parentCategory.slug, name: parentCategory.name, description: parentCategory.description, iconName: parentCategory.icon.displayName ?? parentCategory.slug, subcategories: parentCategory.subcategories, productCount: parentCategory.productCount } : undefined}
      activeSubSlug={activeSubCategory?.slug}
      breadcrumbs={breadcrumbs}
      dynamicCategories={dynamicCategories}
    />
  );
}
