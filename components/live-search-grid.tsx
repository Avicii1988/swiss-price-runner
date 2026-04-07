"use client";

import { useEffect } from "react";
import { useSearchProducts } from "@/lib/hooks/use-search-products";
import {
  SearchProductCard,
  SearchProductCardSkeleton,
} from "@/components/search-product-card";

interface LiveSearchGridProps {
  query: string;
  layout?: "grid" | "list";
}

/**
 * Renders live product results from SearchApi.io.
 * Shows skeleton loaders while fetching, error state on failure.
 */
export function LiveSearchGrid({ query, layout = "grid" }: LiveSearchGridProps) {
  const { products, isLoading, error, search } = useSearchProducts();

  useEffect(() => {
    if (query) search(query);
  }, [query, search]);

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center">
        <p className="text-sm text-gray-500">
          Live-Suche nicht verfügbar. Zeige lokale Ergebnisse.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={
          layout === "grid"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
            : "space-y-3"
        }
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <SearchProductCardSkeleton key={i} layout={layout} />
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div
      className={
        layout === "grid"
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
          : "space-y-3"
      }
    >
      {products.map((product, i) => (
        <SearchProductCard key={`${product.title}-${i}`} product={product} layout={layout} />
      ))}
    </div>
  );
}
