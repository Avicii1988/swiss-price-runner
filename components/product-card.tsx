"use client";

import Link from "next/link";
import { TrendingDown, TrendingUp, ExternalLink, Heart } from "lucide-react";
import { Sparkline } from "./sparkline";
import { useAuth } from "@/lib/auth/auth-context";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface ProductCardProps {
  item: MockProductWithHistory;
  onSelect?: (item: MockProductWithHistory) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  amazon_de: "#FF9900",
  galaxus_ch: "#0D2B5E",
  zalando_de: "#FF6900",
};

const SOURCE_LABELS: Record<string, string> = {
  amazon_de: "Amazon.de",
  galaxus_ch: "Galaxus",
  zalando_de: "Zalando",
};

export function ProductCard({ item, onSelect }: ProductCardProps) {
  const { product, priceHistory, bestPrice, bestSource, priceDrop30d } = item;
  const isDropping = priceDrop30d > 0;
  const { isLoggedIn, isFavorite, toggleFavorite, setShowAuthModal } = useAuth();
  const faved = isFavorite(product.gtin);

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
      {/* Category badge */}
      <div className="absolute left-3 top-3 z-10">
        <span className="rounded-full bg-gray-900/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
          {product.category}
        </span>
      </div>

      {/* Featured badge */}
      {product.featured && (
        <div className="absolute right-3 top-3 z-10">
          <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            Top Deal
          </span>
        </div>
      )}

      {/* Image */}
      <div className="flex items-center justify-center bg-gray-50 p-4 pt-10 sm:p-6 sm:pt-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.title}
          width={160}
          height={160}
          className="h-32 w-32 object-contain transition-transform group-hover:scale-105 sm:h-40 sm:w-40"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 pt-2 sm:p-4 sm:pt-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 sm:text-[11px]">
          {product.brand}
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-gray-900 sm:text-sm">
          {product.title}
        </h3>

        {/* Sparkline */}
        <div className="mt-2 sm:mt-3">
          <Sparkline data={sparkData} width={220} height={40} />
          <p className="mt-0.5 text-[9px] text-gray-400 sm:text-[10px]">30 Tage Preisverlauf</p>
        </div>

        {/* Price */}
        <div className="mt-2 flex items-end justify-between sm:mt-3">
          <div>
            <p className="text-[10px] text-gray-400 sm:text-[11px]">Ab</p>
            <p className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              CHF {bestPrice.totalChf.toFixed(2)}
            </p>
            <p className="text-[10px] text-gray-400 sm:text-[11px]">
              EUR {bestPrice.originalEur.toFixed(2)} inkl. Zoll + MwSt.
            </p>
          </div>
          <div className="text-right">
            {isDropping ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 sm:gap-1 sm:px-2 sm:text-xs">
                <TrendingDown className="h-3 w-3" />
                -{Math.abs(priceDrop30d).toFixed(0)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 sm:gap-1 sm:px-2 sm:text-xs">
                <TrendingUp className="h-3 w-3" />
                +{Math.abs(priceDrop30d).toFixed(0)}
              </span>
            )}
          </div>
        </div>

        {/* Source comparison */}
        <div className="mt-2 space-y-1 border-t border-gray-50 pt-2 sm:mt-3 sm:space-y-1.5 sm:pt-3">
          {product.sources.map((source) => {
            const isBest = source.sourceName === bestSource;
            return (
              <div
                key={source.sourceId}
                className={`flex items-center justify-between rounded-lg px-2 py-1 text-[10px] sm:px-2.5 sm:py-1.5 sm:text-xs ${
                  isBest ? "bg-green-50 font-semibold" : "bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2"
                    style={{
                      backgroundColor: SOURCE_COLORS[source.sourceId] ?? "#888",
                    }}
                  />
                  <span className="hidden xs:inline">{SOURCE_LABELS[source.sourceId] ?? source.sourceId}</span>
                  <span className="xs:hidden">
                    {(SOURCE_LABELS[source.sourceId] ?? source.sourceId).slice(0, 3)}
                  </span>
                  {isBest && (
                    <span className="rounded bg-green-600 px-1 py-px text-[8px] font-bold uppercase text-white sm:text-[9px]">
                      Best
                    </span>
                  )}
                </span>
                <span className="font-mono">
                  EUR {source.currentPriceEur.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-2 flex gap-2 sm:mt-3">
          <button
            onClick={(e) => e.preventDefault()}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-600 py-1.5 text-[10px] font-semibold text-white transition hover:bg-red-700 sm:gap-1.5 sm:py-2 sm:text-xs"
          >
            <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Zum Shop
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!isLoggedIn) { setShowAuthModal(true); return; }
              toggleFavorite(product.gtin);
            }}
            className={`flex items-center justify-center rounded-lg border px-2.5 py-1.5 transition sm:px-3 sm:py-2 ${
              faved ? "border-red-300 bg-red-50 text-red-500" : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600"
            }`}
          >
            <Heart className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${faved ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>
    </Link>
  );
}
