"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  Grid3X3,
  List,
  SlidersHorizontal,
  ArrowRight,
  Bell,
  Flame,
} from "lucide-react";
import type { SubCategory } from "@/lib/categories";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { PriceAlertModal } from "@/components/price-alert-modal";
import { SiteHeader } from "@/components/site-header";
import { CategorySidebar } from "@/components/category-sidebar";
import { FilterBar } from "@/components/filter-bar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LiveSearchGrid } from "@/components/live-search-grid";

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
}

type SortOption = "popular" | "price_asc" | "price_desc" | "drop";
type ViewMode = "grid" | "list";

export default function CategoryClient({
  slugs,
  products,
  parentCategory,
  activeSubSlug,
  breadcrumbs,
}: PageProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<MockProductWithHistory | null>(null);
  const [alertProduct, setAlertProduct] =
    useState<MockProductWithHistory | null>(null);
  const [sort, setSort] = useState<SortOption>("popular");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [query, setQuery] = useState("");

  // Filter state
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.product.brand))].sort(),
    [products],
  );

  const filtered = useMemo(() => {
    let items = [...products];

    // Subcategory filtering — not yet mapped to real product data,
    // but the route is ready for when products carry subcategory slugs
    if (selectedBrands.length > 0) {
      items = items.filter((p) => selectedBrands.includes(p.product.brand));
    }
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
    return items;
  }, [products, selectedBrands, priceMin, priceMax, sort]);

  const handleSelect = useCallback(
    (item: MockProductWithHistory) => setSelectedProduct(item),
    [],
  );
  const handleAlert = useCallback((item: MockProductWithHistory) => {
    setSelectedProduct(null);
    setAlertProduct(item);
  }, []);

  const activeFilterCount =
    selectedBrands.length +
    (priceMin || priceMax ? 1 : 0) +
    (rating !== null ? 1 : 0) +
    selectedColors.length;

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setPriceMin("");
    setPriceMax("");
    setRating(null);
    setSelectedColors([]);
  };

  const activeCategorySlug = slugs[0] ?? undefined;
  const pageTitle = activeSubSlug
    ? parentCategory?.subcategories.find((s) => s.slug === activeSubSlug)?.name
    : parentCategory?.name ?? "Alle Produkte";
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

      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-[1400px] px-3 py-2.5 sm:px-5 lg:px-6">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      </div>

      {/* ═══ MAIN 3-COLUMN LAYOUT ═══ */}
      <div className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5 lg:px-6">
        <div className="flex gap-6 lg:gap-8">
          {/* LEFT SIDEBAR — drill-down navigation */}
          <aside className="hidden w-[180px] shrink-0 lg:block">
            <div className="sticky top-20">
              <CategorySidebar
                activeCategorySlug={activeCategorySlug}
                activeSubSlug={activeSubSlug}
              />
            </div>
          </aside>

          {/* CENTER — filters + product grid */}
          <main className="min-w-0 flex-1">
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

            {/* Galaxus-style Filter Bar */}
            <FilterBar
              brands={brands}
              selectedBrands={selectedBrands}
              onBrandsChange={setSelectedBrands}
              priceMin={priceMin}
              priceMax={priceMax}
              onPriceMinChange={setPriceMin}
              onPriceMaxChange={setPriceMax}
              rating={rating}
              onRatingChange={setRating}
              selectedColors={selectedColors}
              onColorsChange={setSelectedColors}
              activeFilterCount={activeFilterCount}
              onClearAll={clearAllFilters}
            />

            {/* Sort toolbar */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-900">
                  {filtered.length}
                </span>{" "}
                Produkte
              </p>
              <div className="flex items-center gap-2">
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[10px] font-medium text-gray-600 lg:hidden"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  Filter
                </button>

                {/* Sort */}
                <div className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5">
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="bg-transparent text-xs font-medium text-gray-600 outline-none"
                  >
                    <option value="popular">Beliebt</option>
                    <option value="price_asc">Preis aufsteigend</option>
                    <option value="price_desc">Preis absteigend</option>
                    <option value="drop">Grösster Preisrückgang</option>
                  </select>
                </div>

                {/* View mode */}
                <div className="hidden items-center gap-0.5 rounded-md border border-gray-200 p-0.5 sm:flex">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-md p-1 ${
                      viewMode === "grid"
                        ? "bg-gray-900 text-white"
                        : "text-gray-400"
                    }`}
                  >
                    <Grid3X3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded-md p-1 ${
                      viewMode === "list"
                        ? "bg-gray-900 text-white"
                        : "text-gray-400"
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
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
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
                    : "space-y-3"
                }
              >
                {filtered.map((item) => (
                  <ProductCard
                    key={item.product.gtin}
                    item={item}
                    onSelect={handleSelect}
                    onAlert={handleAlert}
                    layout={viewMode}
                  />
                ))}
              </div>
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
                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
                    : "space-y-3"
                }
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} layout={viewMode} />
                ))}
              </div>
            )}

            {/* Live Search Results from SearchApi */}
            {pageTitle && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h2 className="mb-4 text-base font-bold text-slate-900">
                  Live-Preise für «{pageTitle}»
                </h2>
                <LiveSearchGrid
                  query={`${pageTitle} Schweiz kaufen`}
                  layout={viewMode}
                />
              </div>
            )}
          </main>

          {/* RIGHT SIDEBAR — Tagesangebot */}
          {tagesangebot && (
            <aside className="hidden w-72 shrink-0 pl-8 xl:block">
              <div className="sticky top-20">
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
