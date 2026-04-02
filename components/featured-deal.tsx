"use client";

import Link from "next/link";
import { TrendingDown, TrendingUp, ArrowRight, Bell } from "lucide-react";
import { Sparkline } from "./sparkline";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface FeaturedDealProps {
  item: MockProductWithHistory;
  onSelect?: (item: MockProductWithHistory) => void;
  onAlert?: (item: MockProductWithHistory) => void;
}

export function FeaturedDeal({ item, onSelect, onAlert }: FeaturedDealProps) {
  const { product, priceHistory, bestPrice, bestSource, priceDrop30d } = item;
  const isDropping = priceDrop30d > 0;

  const bestSourceId = product.sources.find(
    (s) => s.sourceName === bestSource,
  )?.sourceId;
  const sparkData = priceHistory
    .filter((p) => p.sourceId === bestSourceId)
    .map((p) => p.amountChf);

  return (
    <Link
      href={`/product/${product.gtin}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg hover:border-gray-200 sm:flex-row"
    >
      {/* Image */}
      <div className="flex shrink-0 items-center justify-center bg-gray-50 p-6 sm:w-48 sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.title}
          width={140}
          height={140}
          className="h-28 w-28 object-contain transition-transform group-hover:scale-105 sm:h-32 sm:w-32"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              Top Deal
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              {product.brand} &middot; {product.category}
            </span>
          </div>
          <h3 className="mt-1.5 text-sm font-bold text-gray-900 sm:text-base">
            {product.title}
          </h3>
        </div>

        <div className="mt-3 flex items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div>
              <p className="text-[10px] text-gray-400">Ab</p>
              <p className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                CHF {bestPrice.totalChf.toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-400">
                via {bestSource} &middot; inkl. Zoll + MwSt.
              </p>
            </div>
            <div className="hidden sm:block">
              <Sparkline data={sparkData} width={120} height={36} />
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
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
            <button
              onClick={(e) => { e.preventDefault(); onAlert?.(item); }}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-600 transition hover:border-red-300 hover:text-red-600"
            >
              <Bell className="h-3 w-3" /> Alarm
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
