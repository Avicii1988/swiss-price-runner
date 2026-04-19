"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { CategorySidebar } from "@/components/category-sidebar";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { ViewModeToggle, type ViewMode } from "@/components/view-mode-toggle";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PriceAlertModal } from "@/components/price-alert-modal";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface SearchClientProps {
  query: string;
  products: MockProductWithHistory[];
}

type SortOption = "relevance" | "price_asc" | "price_desc";

export default function SearchClient({ query, products }: SearchClientProps) {
  const [q, setQ] = useState(query);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) return "list";
    return "grid";
  });
  const [alertProduct, setAlertProduct] = useState<MockProductWithHistory | null>(null);

  const sorted = useMemo(() => {
    const items = [...products];
    switch (sort) {
      case "price_asc":
        items.sort((a, b) => a.bestPrice.totalChf - b.bestPrice.totalChf);
        break;
      case "price_desc":
        items.sort((a, b) => b.bestPrice.totalChf - a.bestPrice.totalChf);
        break;
    }
    return items;
  }, [products, sort]);

  const PAGE_SIZE = 36;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);
  const hasMore = visibleCount < sorted.length;

  return (
    <div className="min-h-screen bg-white">
      {alertProduct && (
        <PriceAlertModal item={alertProduct} onClose={() => setAlertProduct(null)} />
      )}
      <SiteHeader query={q} onQueryChange={setQ} />

      <div className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5 lg:px-6">
        <div className="flex gap-6 lg:gap-8">
          <aside className="hidden w-[180px] shrink-0 lg:block">
            <div className="sticky top-[76px]">
              <CategorySidebar />
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="mb-4">
              <Breadcrumbs items={[
                { label: "Gesamtsortiment", href: "/" },
                { label: query ? `Suche: ${query}` : "Suche", href: "#" },
              ]} />
            </div>

            <div className="mb-4">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {query ? <>Suchergebnisse für &ldquo;{query}&rdquo;</> : "Suche"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {sorted.length.toLocaleString("de-CH")} {sorted.length === 1 ? "Produkt" : "Produkte"} gefunden
              </p>
            </div>

            <div className="mb-4 flex items-center justify-end gap-2">
              <div className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5">
                <ArrowUpDown className="h-3 w-3 text-gray-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="bg-transparent text-xs font-medium text-gray-600 outline-none"
                >
                  <option value="relevance">Relevanz</option>
                  <option value="price_asc">Preis aufsteigend</option>
                  <option value="price_desc">Preis absteigend</option>
                </select>
              </div>
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            </div>

            {sorted.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3"
                      : ""
                  }
                >
                  {visible.map((item) => (
                    <ProductCard
                      key={item.product.gtin}
                      item={item}
                      onAlert={(it) => setAlertProduct(it)}
                      layout={viewMode}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="rounded-xl border border-gray-300 bg-white px-8 py-3 text-[14px] font-semibold text-gray-700 transition hover:border-gray-500 hover:shadow-sm"
                    >
                      Mehr laden ({sorted.length - visibleCount} weitere)
                    </button>
                  </div>
                )}
              </>
            ) : query ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-20">
                <p className="text-sm font-medium text-gray-500">
                  Keine Produkte gefunden für &ldquo;{query}&rdquo;.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Versuche einen anderen Suchbegriff.
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3"
                    : ""
                }
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} layout={viewMode} />
                ))}
              </div>
            )}
          </main>

          <div className="hidden w-72 shrink-0 xl:block" />
        </div>
      </div>
    </div>
  );
}
