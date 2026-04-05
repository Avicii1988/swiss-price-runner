"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  Grid3X3,
  List,
  Home,
} from "lucide-react";
import { CATEGORIES, getCategoryBySlug, type Category } from "@/lib/categories";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";
import { ProductCard } from "@/components/product-card";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { PriceAlertModal } from "@/components/price-alert-modal";

interface PageProps {
  slug: string;
  products: MockProductWithHistory[];
}

type SortOption = "popular" | "price_asc" | "price_desc" | "drop";
type ViewMode = "grid" | "list";

export default function CategoryClient({ slug, products }: PageProps) {
  const category = getCategoryBySlug(slug);
  const [selectedProduct, setSelectedProduct] = useState<MockProductWithHistory | null>(null);
  const [alertProduct, setAlertProduct] = useState<MockProductWithHistory | null>(null);
  const [sort, setSort] = useState<SortOption>("popular");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.product.brand))],
    [products],
  );

  const filtered = useMemo(() => {
    let items = [...products];
    if (selectedBrands.length > 0) {
      items = items.filter((p) => selectedBrands.includes(p.product.brand));
    }
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    if (!isNaN(min)) items = items.filter((p) => p.bestPrice.totalChf >= min);
    if (!isNaN(max)) items = items.filter((p) => p.bestPrice.totalChf <= max);
    switch (sort) {
      case "price_asc": items.sort((a, b) => a.bestPrice.totalChf - b.bestPrice.totalChf); break;
      case "price_desc": items.sort((a, b) => b.bestPrice.totalChf - a.bestPrice.totalChf); break;
      case "drop": items.sort((a, b) => b.priceDrop30d - a.priceDrop30d); break;
    }
    return items;
  }, [products, selectedBrands, priceMin, priceMax, sort]);

  const handleSelect = useCallback((item: MockProductWithHistory) => {
    setSelectedProduct(item);
  }, []);

  const handleAlert = useCallback((item: MockProductWithHistory) => {
    setSelectedProduct(null);
    setAlertProduct(item);
  }, []);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
    );
  };

  const FilterSidebar = () => (
    <div className="space-y-5">
      {/* Subcategories */}
      {category && category.subcategories.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Unterkategorien</h3>
          <ul className="mt-2 space-y-0.5">
            {category.subcategories.map((sub) => (
              <li key={sub.slug}>
                <button className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-gray-700 transition hover:bg-gray-100">
                  <span>{sub.name}</span>
                  <span className="text-[10px] text-gray-400">{sub.productCount}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price range */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Preis (CHF)</h3>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs outline-none focus:border-red-400"
          />
          <span className="self-center text-xs text-gray-400">–</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs outline-none focus:border-red-400"
          />
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Marke</h3>
        <div className="mt-2 space-y-1">
          {brands.map((brand) => (
            <label key={brand} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs transition hover:bg-gray-100">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="accent-red-600"
              />
              {brand}
            </label>
          ))}
        </div>
      </div>

      {/* All categories */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Alle Kategorien</h3>
        <ul className="mt-2 space-y-0.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = cat.slug === slug;
            return (
              <li key={cat.slug}>
                <Link
                  href={`/category/${cat.slug}`}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${isActive ? "bg-red-50 font-semibold text-red-600" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="flex-1">{cat.name}</span>
                  <span className="text-[10px] text-gray-400">{cat.productCount}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa]">
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

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:h-14 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-tight sm:text-lg">
            Preis<span className="text-red-600">Alarm</span>
          </Link>
          <Link href="/account" className="text-xs text-gray-500 hover:text-gray-700">
            Mein Konto
          </Link>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-2.5 text-xs text-gray-400 sm:px-6">
          <Link href="/" className="flex items-center gap-1 transition hover:text-gray-600">
            <Home className="h-3 w-3" /> Start
          </Link>
          <ChevronRight className="h-3 w-3" />
          {category ? (
            <span className="font-medium text-gray-900">{category.name}</span>
          ) : (
            <span className="font-medium text-gray-900">Alle Produkte</span>
          )}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Category hero */}
        {category && (
          <div className="mb-6">
            <div className="flex items-center gap-3">
              {(() => { const Icon = category.icon; return <Icon className="h-6 w-6 text-red-500" />; })()}
              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{category.name}</h1>
                <p className="text-xs text-gray-400 sm:text-sm">{category.description}</p>
              </div>
            </div>

            {/* Subcategory chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {category.subcategories.map((sub) => (
                <button
                  key={sub.slug}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[10px] font-medium text-gray-600 transition hover:border-red-300 hover:text-red-600 sm:text-xs"
                >
                  {sub.name}
                  <span className="ml-1 text-gray-400">({sub.productCount})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar – desktop */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-20 rounded-2xl border border-gray-100 bg-white p-4">
              <FilterSidebar />
            </div>
          </aside>

          {/* Main grid area */}
          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2 sm:px-4">
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-900">{filtered.length}</span> Produkte
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
                <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5">
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="bg-transparent text-[10px] font-medium text-gray-600 outline-none sm:text-xs"
                  >
                    <option value="popular">Beliebt</option>
                    <option value="price_asc">Preis aufsteigend</option>
                    <option value="price_desc">Preis absteigend</option>
                    <option value="drop">Grösster Preisrückgang</option>
                  </select>
                </div>

                {/* View mode */}
                <div className="hidden items-center gap-0.5 rounded-lg border border-gray-200 p-0.5 sm:flex">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-md p-1 ${viewMode === "grid" ? "bg-gray-900 text-white" : "text-gray-400"}`}
                  >
                    <Grid3X3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded-md p-1 ${viewMode === "list" ? "bg-gray-900 text-white" : "text-gray-400"}`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile filters panel */}
            {showMobileFilters && (
              <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 lg:hidden">
                <FilterSidebar />
              </div>
            )}

            {/* Product grid */}
            <div className={
              viewMode === "grid"
                ? "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
                : "space-y-3"
            }>
              {filtered.map((item) => (
                <ProductCard
                  key={item.product.gtin}
                  item={item}
                  onSelect={handleSelect}
                  onAlert={handleAlert}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-sm text-gray-400">Keine Produkte in dieser Kategorie mit den gewählten Filtern.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
