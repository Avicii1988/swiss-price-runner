import { getProductsByCategory, getProducts, getDynamicCategories } from "@/lib/data";
import { parseCategorySlugs } from "@/lib/categories";
import { prettifySlug } from "@/lib/category-icons";
import CategoryClient from "./client";

export const revalidate = 3600; // ISR: regenerate every hour

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

  // If it's a feed category (not in master list), build breadcrumbs from dynamic data
  let finalBreadcrumbs = breadcrumbs;
  let feedCategoryName: string | undefined;

  if (!parentCategory && parentSlug) {
    const dynCat = dynamicCategories.find((dc) => dc.slug === parentSlug);
    feedCategoryName = dynCat?.name || prettifySlug(parentSlug);
    finalBreadcrumbs = [
      { label: "Gesamtsortiment", href: "/" },
      { label: feedCategoryName, href: `/category/${parentSlug}` },
    ];
  }

  return (
    <CategoryClient
      slugs={slugs}
      products={products}
      parentCategory={parentCategory ? {
        slug: parentCategory.slug,
        name: parentCategory.name,
        description: parentCategory.description,
        iconName: parentCategory.icon.displayName ?? parentCategory.slug,
        subcategories: parentCategory.subcategories,
        productCount: parentCategory.productCount,
      } : undefined}
      activeSubSlug={activeSubCategory?.slug}
      breadcrumbs={finalBreadcrumbs}
      dynamicCategories={dynamicCategories}
      feedCategoryName={feedCategoryName}
    />
  );
}
