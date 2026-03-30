"use client";

import { TrendingDown, TrendingUp, ExternalLink, Bell } from "lucide-react";
import { Sparkline } from "./sparkline";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface ProductCardProps {
  item: MockProductWithHistory;
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

export function ProductCard({ item }: ProductCardProps) {
  const { product, priceHistory, bestPrice, bestSource, priceDrop30d } = item;
  const isDropping = priceDrop30d > 0;

  // Get best-source history for sparkline (one point per day)
  const bestSourceId = product.sources.find(
    (s) => s.sourceName === bestSource,
  )?.sourceId;
  const sparkData = priceHistory
    .filter((p) => p.sourceId === bestSourceId)
    .map((p) => p.amountChf);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg hover:border-gray-200">
      {/* Category badge */}
      <div className="absolute left-3 top-3 z-10">
        <span className="rounded-full bg-gray-900/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
          {product.category}
        </span>
      </div>

      {/* Image area */}
      <div className="flex items-center justify-center bg-gray-50 p-6 pt-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.title}
          width={160}
          height={160}
          className="h-40 w-40 object-contain transition-transform group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 pt-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
          {product.brand}
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
          {product.title}
        </h3>

        {/* Sparkline */}
        <div className="mt-3">
          <Sparkline data={sparkData} width={220} height={44} />
          <p className="mt-1 text-[10px] text-gray-400">30 Tage Preisverlauf</p>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[11px] text-gray-400">Ab</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900">
              CHF {bestPrice.totalChf.toFixed(2)}
            </p>
            <p className="text-[11px] text-gray-400">
              EUR {bestPrice.originalEur.toFixed(2)} inkl. Zoll + MwSt.
            </p>
          </div>
          <div className="text-right">
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
        </div>

        {/* Source comparison */}
        <div className="mt-3 space-y-1.5 border-t border-gray-50 pt-3">
          {product.sources.map((source) => {
            const isBest = source.sourceName === bestSource;
            return (
              <div
                key={source.sourceId}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                  isBest ? "bg-green-50 font-semibold" : "bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: SOURCE_COLORS[source.sourceId] ?? "#888",
                    }}
                  />
                  {SOURCE_LABELS[source.sourceId] ?? source.sourceId}
                  {isBest && (
                    <span className="rounded bg-green-600 px-1 py-px text-[9px] font-bold uppercase text-white">
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
        <div className="mt-3 flex gap-2">
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2 text-xs font-semibold text-white transition hover:bg-red-700">
            <ExternalLink className="h-3.5 w-3.5" />
            Zum Shop
          </button>
          <button className="flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-gray-500 transition hover:border-red-300 hover:text-red-600">
            <Bell className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
