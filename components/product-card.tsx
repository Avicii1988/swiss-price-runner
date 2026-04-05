"use client";

import Link from "next/link";
import { TrendingDown, Heart, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface ProductCardProps {
  item: MockProductWithHistory;
  onSelect?: (item: MockProductWithHistory) => void;
  onAlert?: (item: MockProductWithHistory) => void;
}

const SOURCE_ICONS: Record<string, string> = {
  amazon_de: "A",
  galaxus_ch: "G",
  zalando_de: "Z",
};

export function ProductCard({ item, onAlert }: ProductCardProps) {
  const { product, bestPrice, bestSource, priceDrop30d, avgChf30d } = item;
  const { isLoggedIn, isFavorite, toggleFavorite, setShowAuthModal } = useAuth();
  const faved = isFavorite(product.gtin);

  const bestSourceId = product.sources.find((s) => s.sourceName === bestSource)?.sourceId ?? "";

  const discount = avgChf30d > 0 && bestPrice.totalChf < avgChf30d
    ? Math.round(((avgChf30d - bestPrice.totalChf) / avgChf30d) * 100)
    : 0;

  return (
    <div className="group relative rounded-xl border border-gray-100 bg-white transition hover:border-gray-200 hover:shadow-md">
      {/* Quick actions — appear on hover */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={(e) => { e.preventDefault(); if (!isLoggedIn) { setShowAuthModal(true); return; } toggleFavorite(product.gtin); }}
          className={`flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-sm transition ${faved ? "border-red-200 text-red-500" : "border-gray-200 text-gray-400 hover:text-red-500"}`}
        >
          <Heart className={`h-3.5 w-3.5 ${faved ? "fill-current" : ""}`} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); onAlert?.(item); }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:text-amber-500"
        >
          <Bell className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Discount badge */}
      {discount >= 3 && (
        <div className="absolute left-0 top-0 z-10">
          <span className="rounded-br-xl rounded-tl-xl bg-red-600 px-2 py-1 text-[10px] font-bold text-white">
            -{discount}%
          </span>
        </div>
      )}

      <Link href={`/product/${product.gtin}`} className="block p-3 sm:p-4">
        {/* Image — square container with uniform background */}
        <div className="aspect-square overflow-hidden rounded-2xl bg-neutral-50 p-4">
          <div className="flex h-full w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.title}
              width={160}
              height={160}
              className="max-h-full max-w-full scale-110 object-contain transition-transform group-hover:scale-[1.15]"
            />
          </div>
        </div>

        {/* Info */}
        <div className="mt-3">
          <p className="text-[10px] font-medium text-gray-400 sm:text-[11px]">{product.brand}</p>
          <h3 className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-gray-900 sm:text-sm">
            {product.title}
          </h3>
        </div>

        {/* Price — large amount, small currency */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-medium text-gray-500">CHF</span>
              <span className="text-2xl font-bold tracking-tight text-gray-900">
                {bestPrice.totalChf.toFixed(2)}
              </span>
            </div>
            {/* Shop with icon placeholder */}
            <div className="mt-1 flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[8px] font-bold text-gray-500">
                {SOURCE_ICONS[bestSourceId] ?? "·"}
              </span>
              <span className="text-[10px] text-gray-400">{bestSource}</span>
            </div>
          </div>
          {priceDrop30d > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-600">
              <TrendingDown className="h-3 w-3" />
              {priceDrop30d.toFixed(0)}
            </span>
          )}
        </div>

        {/* Source count */}
        <p className="mt-2 text-[9px] text-gray-400">
          {product.sources.length} Angebote vergleichen
        </p>
      </Link>
    </div>
  );
}
