"use client";

import { useCallback } from "react";
import Link from "next/link";
import { TrendingDown, Heart, Pin, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop";

/** Returns true if the image URL looks like a valid product photo */
export function hasValidImage(url: string | undefined | null): boolean {
  if (!url) return false;
  if (url.includes("picsum.photos")) return false;
  return true;
}
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";
import { getCategoryBySlug } from "@/lib/categories";

interface ProductCardProps {
  item: MockProductWithHistory;
  onSelect?: (item: MockProductWithHistory) => void;
  onAlert?: (item: MockProductWithHistory) => void;
  layout?: "grid" | "list";
}

export function ProductCard({ item, onAlert, layout = "grid" }: ProductCardProps) {
  const { product, bestPrice, bestSource, priceDrop30d, avgChf30d } = item;
  const { isLoggedIn, isFavorite, toggleFavorite, isPinned, togglePin, setShowAuthModal } = useAuth();
  const faved = isFavorite(product.gtin);
  const pinned = isPinned(product.gtin);
  const cat = getCategoryBySlug(product.category);

  const discount = avgChf30d > 0 && bestPrice.totalChf < avgChf30d
    ? Math.round(((avgChf30d - bestPrice.totalChf) / avgChf30d) * 100) : 0;

  // ── LIST LAYOUT ────────────────────────────────────────────
  if (layout === "list") {
    return (
      <div className="group relative flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-3 transition hover:shadow-md sm:gap-5 sm:p-4">
        {/* Quick actions — top right on hover */}
        <div className="absolute right-3 top-3 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
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

        <Link href={`/product/${product.gtin}`} className="flex flex-1 items-center gap-4 sm:gap-5">
          {/* Image — fixed size, centered */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-white p-2 sm:h-28 sm:w-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl || FALLBACK_IMG}
              alt={product.title}
              width={100}
              height={100}
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
              className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-blue-600">{cat?.name ?? product.category}</p>
            <p className="mt-0.5 line-clamp-2 text-sm text-gray-900">
              <span className="font-bold">{product.brand}</span>{" "}
              {product.title.replace(product.brand, "").trim()}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              {bestSource} · {product.sources.length} Angebote
              {priceDrop30d > 0 && (
                <span className="ml-1 inline-flex items-center gap-0.5 font-semibold text-green-600">
                  <TrendingDown className="h-2.5 w-2.5" /> {priceDrop30d.toFixed(0)}
                </span>
              )}
            </p>
          </div>

          {/* Price — right aligned */}
          <div className="shrink-0 text-right">
            <span className="text-lg font-bold text-gray-900">{bestPrice.totalChf.toFixed(0)}.–</span>
            {discount >= 3 && (
              <p className="text-xs text-gray-400 line-through">statt {Math.round(avgChf30d)}.–</p>
            )}
          </div>
        </Link>
      </div>
    );
  }

  // ── GRID LAYOUT (default) ──────────────────────────────────
  return (
    <div className="group relative flex flex-col rounded-xl border border-gray-100 bg-white transition hover:shadow-md">
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
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:text-[#D81E05] group-hover:[&>svg]:bell-animate" title="Preisalarm">
          <Bell className="h-3 w-3 transition-transform group-hover:animate-[bell-ring_0.6s_ease-in-out]" />
        </button>
      </div>

      {/* Discount badge */}
      {discount >= 3 && (
        <span className="absolute left-2 top-2 z-10 rounded bg-[#D81E05] px-2 py-0.5 text-[11px] font-bold text-white">
          -{discount}%
        </span>
      )}

      <Link href={`/product/${product.gtin}`} className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Image — clean white bg, centered, mix-blend for seamless look */}
        <div className="aspect-square overflow-hidden rounded-lg bg-white p-4">
          <div className="flex h-full w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl || FALLBACK_IMG}
              alt={product.title}
              width={200}
              height={200}
              className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform group-hover:scale-105"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
            />
          </div>
        </div>

        {/* Info — Galaxus style */}
        <div className="mt-3 flex flex-1 flex-col">
          {/* Category in blue */}
          <p className="text-xs font-medium text-blue-600">{cat?.name ?? product.category}</p>

          {/* Price — "XXX.–" format */}
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{bestPrice.totalChf.toFixed(0)}.–</span>
            {discount >= 3 && (
              <span className="text-xs text-gray-400 line-through">statt {Math.round(avgChf30d)}.–</span>
            )}
          </div>

          {/* Brand bold + title */}
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-800">
            <span className="font-bold">{product.brand}</span>{" "}
            {product.title.replace(product.brand, "").trim()}
          </p>

          {/* Source info */}
          <p className="mt-auto pt-2 text-[10px] text-gray-400">
            {bestSource} · {product.sources.length} Angebote
            {priceDrop30d > 0 && (
              <span className="ml-1 inline-flex items-center gap-0.5 font-semibold text-emerald-600">
                <TrendingDown className="h-2.5 w-2.5" /> CHF {priceDrop30d.toFixed(0)}
              </span>
            )}
          </p>
        </div>
      </Link>
    </div>
  );
}

/** Skeleton loader for product cards */
export function ProductCardSkeleton({ layout = "grid" }: { layout?: "grid" | "list" }) {
  if (layout === "list") {
    return (
      <div className="flex animate-pulse items-center gap-4 rounded-xl border border-gray-100 bg-white p-3 sm:gap-5 sm:p-4">
        <div className="h-24 w-24 shrink-0 rounded-lg bg-gray-100 sm:h-28 sm:w-28" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-gray-100" />
          <div className="h-4 w-3/4 rounded bg-gray-100" />
          <div className="h-3 w-1/2 rounded bg-gray-100" />
        </div>
        <div className="shrink-0 space-y-1 text-right">
          <div className="ml-auto h-5 w-16 rounded bg-gray-100" />
          <div className="ml-auto h-3 w-12 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-3 sm:p-4">
      <div className="aspect-square rounded-lg bg-gray-100" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-20 rounded bg-gray-100" />
        <div className="h-5 w-16 rounded bg-gray-100" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}
