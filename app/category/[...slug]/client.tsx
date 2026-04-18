"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  ArrowUpDown,
  SlidersHorizontal,
  ArrowRight,
  Bell,
  Flame,
} from "lucide-react";
import type { SubCategory } from "@/lib/categories";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";
import { ProductCard, ProductCardSkeleton, hasValidImage } from "@/components/product-card";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { PriceAlertModal } from "@/components/price-alert-modal";
import { SiteHeader } from "@/components/site-header";
import { CategorySidebar } from "@/components/category-sidebar";
import { ViewModeToggle, type ViewMode } from "@/components/view-mode-toggle";
import { FilterSidebar } from "@/components/filter-sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { aggregateFacets, applyFacetFilters, type ActiveFilters } from "@/lib/facets";

interface SerializedCategory {
  slug: string;
  name: string;
  description: string;
  iconName: string;
  subcategories: SubCategory[];
  productCount: number;
}

interface PageProps {
  slugs: string[];
  products: MockProductWithHistory[];
  parentCategory?: SerializedCategory;
  activeSubSlug?: string;
  breadcrumbs: { label: string; href: string }[];
  dynamicCategories?: { slug: string; name: string; productCount: number }[];
  feedCategoryName?: string;
  /**
   * Real count of active products in the category — from a SELECT COUNT(*)
   * in page.tsx, not limited by the getProductsByCategory slice cap.
   * The header badge displays this so we never show a misleading "500".
   */
  totalCount?: number;
}

type SortOption = "popular" | "price_asc" | "price_desc" | "drop";
// ViewMode type is imported from components/view-mode-toggle

export default function CategoryClient({
  slugs,
  products,
  parentCategory,
  activeSubSlug,
  breadcrumbs,
  dynamicCategories,
  feedCategoryName,
  totalCount,
}: PageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedProduct, setSelectedProduct] =
    useState<MockProductWithHistory | null>(null);
  const [alertProduct, setAlertProduct] =
    useState<MockProductWithHistory | null>(null);
  const [sort, setSort] = useState<SortOption>("popular");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) return "list";
    return "grid";
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [query, setQuery] = useState("");

  // ── Dynamic facet filters (replaces old hardcoded brand/color state) ──
  const facets = useMemo(() => aggregateFacets(products), [products]);

  // Initialise active filters from URL searchParams
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(() => {
    const init: ActiveFilters = {};
    for (const facet of facets) {
      const param = searchParams.get(facet.key);
      if (param) init[facet.key] = new Set(param.split(","));
    }
    return init;
  });

  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");

  // Price range for the slider inputs
  const priceRange = useMemo(() => {
    let min = Infinity;
    let max = 0;
    for (const p of products) {
      const chf = p.bestPrice.totalChf;
      if (chf > 0 && chf < min) min = chf;
      if (chf > max) max = chf;
    }
    return { min: min === Infinity ? 0 : min, max: max || 9999 };
  }, [products]);

  // Sync filters → URL (debounced via useEffect so rapid clicks
  // don't hammer the router)
  useEffect(() => {
    const params = new URLSearchParams();
    for (const [key, values] of Object.entries(activeFilters)) {
      if (values.size > 0) params.set(key, Array.from(values).join(","));
    }
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace(url as any, { scroll: false });
  }, [activeFilters, priceMin, priceMax, pathname, router]);

  const handleFilterChange = useCallback((key: string, value: string, selected: boolean) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      const set = new Set(prev[key] ?? []);
      if (selected) set.add(value);
      else set.delete(value);
      next[key] = set;
      return next;
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    for (const set of Object.values(activeFilters)) count += set.size;
    if (priceMin || priceMax) count++;
    return count;
  }, [activeFilters, priceMin, priceMax]);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
    setPriceMin("");
    setPriceMax("");
  }, []);

  // ── Apply all filters ──
  const filtered = useMemo(() => {
    let items = applyFacetFilters(products, activeFilters);

    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    if (!isNaN(min)) items = items.filter((p) => p.bestPrice.totalChf >= min);
    if (!isNaN(max)) items = items.filter((p) => p.bestPrice.totalChf <= max);

    switch (sort) {
      case "price_asc":
        items.sort((a, b) => a.bestPrice.totalChf - b.bestPrice.totalChf);
        break;
      case "price_desc":
        items.sort((a, b) => b.bestPrice.totalChf - a.bestPrice.totalChf);
        break;
      case "drop":
        items.sort((a, b) => b.priceDrop30d - a.priceDrop30d);
        break;
    }
    // Adtraction feed products first, then products with images
    items.sort((a, b) => {
      const aFeed = a.product.sourceType === "adtraction_feed" ? 0 : 1;
      const bFeed = b.product.sourceType === "adtraction_feed" ? 0 : 1;
      if (aFeed !== bFeed) return aFeed - bFeed;
      const aImg = hasValidImage(a.product.imageUrl) ? 0 : 1;
      const bImg = hasValidImage(b.product.imageUrl) ? 0 : 1;
      return aImg - bImg;
    });
    return items;
  }, [products, activeFilters, priceMin, priceMax, sort]);

  // ── Pagination — show 36 initially, load 36 more on click ──
  const PAGE_SIZE = 36;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const handleSelect = useCallback(
    (item: MockProductWithHistory) => setSelectedProduct(item),
    [],
  );
  const handleAlert = useCallback((item: MockProductWithHistory) => {
    setSelectedProduct(null);
    setAlertProduct(item);
  }, []);

  const activeCategorySlug = slugs[0] ?? undefined;
  const pageTitle = activeSubSlug
    ? parentCategory?.subcategories.find((s) => s.slug === activeSubSlug)?.name
    : parentCategory?.name ?? feedCategoryName ?? "Alle Produkte";
  const pageDescription = parentCategory?.description;

  // Tagesangebot — first item with biggest price drop
  const tagesangebot = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.priceDrop30d - a.priceDrop30d)
        .find((p) => p.priceDrop30d > 0),
    [products],
  );

  return (
    <div className="min-h-screen bg-white">
      {selectedProduct && (
        <ProductDetailModal
          item={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOpenAlert={handleAlert}
        />
      )}
      {alertProduct && (
        <PriceAlertModal
          item={alertProduct}
          onClose={() => setAlertProduct(null)}
        />
      )}

      {/* Shared header */}
      <SiteHeader
        query={query}
        onQueryChange={setQuery}
        allProducts={products}
        showVision={() => {}}
      />

      {/* ═══ MAIN 3-COLUMN LAYOUT ═══ */}
      <div className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5 lg:px-6">
        <div className="flex gap-6 lg:gap-8">
          {/* LEFT SIDEBAR — drill-down navigation */}
          <aside className="hidden w-[180px] shrink-0 lg:block">
            <div className="sticky top-[76px]">
              <CategorySidebar
                activeCategorySlug={activeCategorySlug}
                activeSubSlug={activeSubSlug}
                dynamicCategories={dynamicCategories}
              />
            </div>
          </aside>

          {/* CENTER — breadcrumbs + filters + product grid */}
          <main className="min-w-0 flex-1">
            {/* Breadcrumbs — inline with content, Galaxus-style */}
            <div className="mb-4">
              <Breadcrumbs items={breadcrumbs} />
            </div>

            {/* Category title */}
            <div className="mb-4">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {pageTitle}
              </h1>
              {pageDescription && !activeSubSlug && (
                <p className="mt-1 text-sm text-gray-500">
                  {pageDescription}
                </p>
              )}
            </div>

            {/* Dynamic facet filters — Galaxus-style horizontal dropdown
                bar with Beliebte Filter pills + mobile drawer */}
            <FilterSidebar
              facets={facets}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onClearAll={clearAllFilters}
              priceMin={priceMin}
              priceMax={priceMax}
              onPriceMinChange={setPriceMin}
              onPriceMaxChange={setPriceMax}
              priceRange={priceRange}
              activeFilterCount={activeFilterCount}
              resultCount={filtered.length}
            />

            {/* Sort toolbar — "Produkte"-badge uses the true DB count where
                available. When client-side filters narrow the result we show
                "X von Y", so users see both the filter impact and the real
                category size. Falls back to `filtered.length` when the server
                couldn't supply a count (feed categories, etc.). */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {typeof totalCount === "number" && totalCount > 0 && totalCount !== filtered.length ? (
                  <>
                    <span className="font-semibold text-gray-900">
                      {filtered.length.toLocaleString("de-CH")}
                    </span>{" "}
                    von{" "}
                    <span className="font-semibold text-gray-900">
                      {totalCount.toLocaleString("de-CH")}
                    </span>{" "}
                    Produkten
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-gray-900">
                      {(totalCount && totalCount > 0
                        ? totalCount
                        : filtered.length
                      ).toLocaleString("de-CH")}
                    </span>{" "}
                    Produkte
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                {/* Sort */}
                <div className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5">
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="bg-transparent text-xs font-medium text-gray-600 outline-none"
                  >
                    <option value="popular">Relevanz</option>
                    <option value="price_asc">Preis aufsteigend</option>
                    <option value="price_desc">Preis absteigend</option>
                    <option value="drop">Grösster Preisrückgang</option>
                  </select>
                </div>

                {/* View mode — shared component, identical across home + category */}
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
              </div>
            </div>

            {/* Mobile filters panel */}
            {showMobileFilters && (
              <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 lg:hidden">
                <CategorySidebar
                  activeCategorySlug={activeCategorySlug}
                  activeSubSlug={activeSubSlug}
                />
              </div>
            )}

            {/* Product grid */}
            {filtered.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 gap-px bg-[#f0f0f2] sm:grid-cols-2 lg:grid-cols-3"
                      : ""
                  }
                >
                  {visible.map((item) => (
                    <ProductCard
                      key={item.product.gtin}
                      item={item}
                      onAlert={handleAlert}
                      layout={viewMode}
                    />
                  ))}
                </div>
                {/* Load More — only shown when there are more products */}
                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="rounded-xl border border-gray-300 bg-white px-8 py-3 text-[14px] font-semibold text-gray-700 transition hover:border-gray-500 hover:shadow-sm"
                    >
                      Mehr laden ({filtered.length - visibleCount} weitere)
                    </button>
                  </div>
                )}
              </>
            ) : products.length > 0 ? (
              /* Filters active but no results */
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-20">
                <svg className="h-16 w-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <p className="mt-4 text-sm font-medium text-gray-500">
                  Keine Produkte gefunden
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Versuche andere Filter oder setze sie zurück.
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                  >
                    Filter zurücksetzen
                  </button>
                )}
              </div>
            ) : (
              /* No products at all — show skeletons as placeholder */
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-px bg-[#f0f0f2] sm:grid-cols-2 lg:grid-cols-3"
                    : ""
                }
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} layout={viewMode} />
                ))}
              </div>
            )}

            {/* Live Search Results from SearchApi */}
          </main>

          {/* RIGHT SIDEBAR — Tagesangebot */}
          {tagesangebot && (
            <aside className="hidden w-72 shrink-0 pl-8 xl:block">
              <div className="sticky top-[76px]">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-1.5 text-base font-bold text-gray-900">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Tagesangebot
                  </h2>
                  <span className="rounded border border-gray-300 px-2 py-0.5 text-xs font-bold text-gray-600">
                    {new Date().getDate()}{" "}
                    {
                      [
                        "JAN","FEB","MÄR","APR","MAI","JUN",
                        "JUL","AUG","SEP","OKT","NOV","DEZ",
                      ][new Date().getMonth()]
                    }
                  </span>
                </div>
                <Link
                  href={`/product/${tagesangebot.product.gtin}`}
                  className="group mt-3 block"
                >
                  <div className="flex items-center justify-center rounded-xl bg-gray-50 p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tagesangebot.product.imageUrl}
                      alt={tagesangebot.product.title}
                      width={200}
                      height={200}
                      className="h-44 w-44 object-contain transition-transform group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-3 text-xs text-blue-600">
                    {parentCategory?.name ?? tagesangebot.product.category}
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-bold">
                      {tagesangebot.bestPrice.totalChf.toFixed(0)}.–
                    </span>
                    {tagesangebot.avgChf30d > 0 && (
                      <span className="text-sm text-gray-400 line-through">
                        {Math.round(tagesangebot.avgChf30d)}.–
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-sm font-bold">
                    {tagesangebot.product.brand}
                  </h3>
                  <p className="line-clamp-2 text-xs text-gray-500">
                    {tagesangebot.product.title}
                  </p>
                </Link>
                <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700">
                  <Bell className="h-3.5 w-3.5" />
                  Preisalarm setzen
                </button>
              </div>
            </aside>
          )}
          {/* Right spacer when no Tagesangebot — keeps grid proportions */}
          {!tagesangebot && <div className="hidden w-72 shrink-0 xl:block" />}
        </div>
      </div>
    </div>
  );
}
