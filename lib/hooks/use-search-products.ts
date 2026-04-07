"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface SearchProduct {
  title: string;
  price: string | null;
  extractedPrice: number | null;
  currency: string;
  source: string;
  thumbnail: string | null;
  link: string;
  rating: number | null;
  reviews: number | null;
  delivery: string | null;
}

interface UseSearchProductsReturn {
  products: SearchProduct[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => void;
}

const cache = new Map<string, { data: SearchProduct[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

/**
 * Hook to fetch live product data from /api/products (SearchApi.io).
 * Includes in-memory caching and debounce.
 */
export function useSearchProducts(
  initialQuery?: string,
): UseSearchProductsReturn {
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      setProducts([]);
      return;
    }

    // Check cache
    const cached = cache.get(q);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setProducts(cached.data);
      return;
    }

    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/products?q=${encodeURIComponent(q)}&num=20`,
        { signal: controller.signal },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      const results: SearchProduct[] = data.results ?? [];

      cache.set(q, { data: results, ts: Date.now() });
      setProducts(results);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Search failed");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) search(initialQuery);
  }, [initialQuery, search]);

  return { products, isLoading, error, search };
}
