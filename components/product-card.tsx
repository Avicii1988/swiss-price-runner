"use client";

import Link from "next/link";
import { TrendingDown, Heart, Pin, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";
import { getCategoryBySlug } from "@/lib/categories";

interface ProductCardProps {
  item: MockProductWithHistory;
  onSelect?: (item: MockProductWithHistory) => void;
  onAlert?: (item: MockProductWithHistory) => void;
}

export function ProductCard({ item, onAlert }: ProductCardProps) {
  const { product, bestPrice, bestSource, priceDrop30d, avgChf30d } = item;
  const { isLoggedIn, isFavorite, toggleFavorite, isPinned, togglePin, setShowAuthModal } = useAuth();
  const faved = isFavorite(product.gtin);
  const pinned = isPinned(product.gtin);
  const cat = getCategoryBySlug(product.category);

  const discount = avgChf30d > 0 && bestPrice.totalChf < avgChf30d
    ? Math.round(((avgChf30d - bestPrice.totalChf) / avgChf30d) * 100) : 0;

  return (
    <div className="group relative flex flex-col">
      {/* Quick actions — top right on hover */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isLoggedIn) { setShowAuthModal(true); return; } toggleFavorite(product.gtin); }}
          className={`flex h-7 w-7 items-center justify-center rounded-full border bg-white shadow-sm transition ${faved ? "border-red-200 text-red-500" : "border-gray-200 text-gray-400 hover:text-red-500"}`} title="Favorit">
          <Heart className={`h-3 w-3 ${faved ? "fill-current" : ""}`} />
        </button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isLoggedIn) { setShowAuthModal(true); return; } togglePin(product.gtin); }}
          className={`flex h-7 w-7 items-center justify-center rounded-full border bg-white shadow-sm transition ${pinned ? "border-blue-200 text-blue-500" : "border-gray-200 text-gray-400 hover:text-blue-500"}`} title="Merken">
          <Pin className={`h-3 w-3 ${pinned ? "fill-current" : ""}`} />
        </button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAlert?.(item); }}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:text-amber-500" title="Preisalarm">
          <Bell className="h-3 w-3" />
        </button>
      </div>

      {/* Discount badge */}
      {discount >= 3 && (
        <span className="absolute left-2 top-2 z-10 rounded bg-[#E30613] px-2 py-0.5 text-[11px] font-bold text-white">
          -{discount}%
        </span>
      )}

      <Link href={`/product/${product.gtin}`} className="flex flex-1 flex-col">
        {/* Image — uniform square, light bg, consistent sizing */}
        <div className="aspect-square overflow-hidden rounded-lg bg-[#f5f5f5] p-5">
          <div className="flex h-full w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl} alt={product.title} width={200} height={200}
              className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105" />
          </div>
        </div>

        {/* Info — Galaxus style */}
        <div className="mt-3 flex flex-1 flex-col">
          {/* Category in blue */}
          <p className="text-xs font-medium text-blue-600">{cat?.name ?? product.category}</p>

          {/* Price — "XXX.–" format */}
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900 sm:text-xl">{bestPrice.totalChf.toFixed(0)}.–</span>
            {discount >= 3 && (
              <span className="text-xs text-gray-400 line-through">statt {Math.round(avgChf30d)}.–</span>
            )}
          </div>

          {/* Brand bold + title */}
          <p className="mt-0.5 line-clamp-2 text-sm text-gray-900">
            <span className="font-bold">{product.brand}</span>{" "}
            {product.title.replace(product.brand, "").trim()}
          </p>

          {/* Source info */}
          <p className="mt-1.5 text-[10px] text-gray-400">
            {bestSource} · {product.sources.length} Angebote
            {priceDrop30d > 0 && (
              <span className="ml-1 inline-flex items-center gap-0.5 font-semibold text-green-600">
                <TrendingDown className="h-2.5 w-2.5" /> {priceDrop30d.toFixed(0)}
              </span>
            )}
          </p>
        </div>
      </Link>
    </div>
  );
}
