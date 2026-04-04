"use client";

import Link from "next/link";
import { TrendingDown, TrendingUp, Bell, ArrowRightLeft, Percent } from "lucide-react";
import { Sparkline } from "./sparkline";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface FeaturedDealProps {
  item: MockProductWithHistory;
  onSelect?: (item: MockProductWithHistory) => void;
  onAlert?: (item: MockProductWithHistory) => void;
}

export function FeaturedDeal({ item, onSelect, onAlert }: FeaturedDealProps) {
  const { product, priceHistory, bestPrice, bestSource, priceDrop30d, avgChf30d } = item;
  const isDropping = priceDrop30d > 0;

  // Discount vs 30-day average
  const discountPercent =
    avgChf30d > 0 && bestPrice.totalChf < avgChf30d
      ? Math.round(((avgChf30d - bestPrice.totalChf) / avgChf30d) * 100)
      : 0;

  const bestSourceId = product.sources.find(
    (s) => s.sourceName === bestSource,
  )?.sourceId;
  const sparkData = priceHistory
    .filter((p) => p.sourceId === bestSourceId)
    .map((p) => p.amountChf);

  return (
    <Link
      href={`/product/${product.gtin}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg hover:border-gray-200"
    >
      {/* Discount badge */}
      {discountPercent >= 3 && (
        <div className="absolute left-3 top-3 z-10">
          <span className="inline-flex items-center gap-0.5 rounded-lg bg-green-600 px-2 py-1 text-xs font-bold text-white shadow-sm">
            <Percent className="h-3 w-3" />
            -{discountPercent}%
          </span>
        </div>
      )}

      {/* Top Deal badge */}
      <div className="absolute right-3 top-3 z-10">
        <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
          Top Deal
        </span>
      </div>

      {/* Image */}
      <div className="flex items-center justify-center bg-gray-50 p-5 pt-10 sm:p-8 sm:pt-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.title}
          width={160}
          height={160}
          className="h-32 w-32 object-contain transition-transform group-hover:scale-105 sm:h-36 sm:w-36"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          {product.brand} &middot; {product.category}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-gray-900 sm:text-base">
          {product.title}
        </h3>

        {/* Sparkline */}
        <div className="mt-3">
          <Sparkline data={sparkData} width={220} height={36} />
        </div>

        {/* Price row */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] text-gray-400">Ab</p>
            <p className="text-2xl font-extrabold tracking-tight text-gray-900">
              CHF {bestPrice.totalChf.toFixed(2)}
            </p>
            <p className="text-[10px] text-gray-400">
              via {bestSource} &middot; inkl. Zoll + MwSt.
            </p>
          </div>
          {isDropping ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
              <TrendingDown className="h-3 w-3" />
              -{Math.abs(priceDrop30d).toFixed(0)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
              <TrendingUp className="h-3 w-3" />
              +{Math.abs(priceDrop30d).toFixed(0)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2 border-t border-gray-50 pt-3">
          <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2 text-xs font-semibold text-white transition group-hover:bg-red-700">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Vergleichen
          </span>
          <button
            onClick={(e) => { e.preventDefault(); onAlert?.(item); }}
            className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-red-300 hover:text-red-600"
          >
            <Bell className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
}
