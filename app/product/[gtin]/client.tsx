"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  ExternalLink,
  Heart,
  Bell,
  ShieldCheck,
  Truck,
  TrendingDown,
  TrendingUp,
  Share2,
} from "lucide-react";
import { PriceHistoryChart } from "@/components/price-history-chart";
import { PriceDropBadge } from "@/components/price-drop-badge";
import { ShippingTooltip } from "@/components/shipping-tooltip";
import { PriceAlertModal } from "@/components/price-alert-modal";
import { useAuth } from "@/lib/auth/auth-context";
import { calculateSwissPrice } from "@/lib/pricing/calculator";
import { EXCHANGE_RATE } from "@/lib/integrations/mock-service";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";
import { getCategoryBySlug } from "@/lib/categories";

const SOURCE_COLORS: Record<string, string> = {
  amazon_de: "#FF9900",
  galaxus_ch: "#0D2B5E",
  zalando_de: "#FF6900",
};

interface Props {
  item: MockProductWithHistory;
}

export function ProductDetailClient({ item }: Props) {
  const { product, priceHistory, bestPrice, bestSource, priceDrop30d, avgChf30d } = item;
  const { isLoggedIn, isFavorite, toggleFavorite, setShowAuthModal } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const isDropping = priceDrop30d > 0;
  const faved = isFavorite(product.gtin);
  const cat = getCategoryBySlug(product.category);

  // Pre-compute all source breakdowns
  const sourceBreakdowns = product.sources.map((s) => ({
    ...s,
    breakdown: calculateSwissPrice({
      amountEur: s.currentPriceEur,
      exchangeRate: EXCHANGE_RATE,
    }),
    isBest: s.sourceName === bestSource,
  }));

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {showAlert && <PriceAlertModal item={item} onClose={() => setShowAlert(false)} />}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:h-14 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-tight sm:text-lg">
            Swiss<span className="text-red-600">Price</span>Runner
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!isLoggedIn) { setShowAuthModal(true); return; }
                toggleFavorite(product.gtin);
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                faved ? "border-red-300 bg-red-50 text-red-500" : "border-gray-200 text-gray-600 hover:border-red-300"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${faved ? "fill-current" : ""}`} />
              <span className="hidden sm:inline">{faved ? "Gespeichert" : "Merken"}</span>
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300">
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Teilen</span>
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2.5 text-[11px] text-gray-400 sm:px-6 sm:text-xs">
          <Link href="/" className="flex shrink-0 items-center gap-1 hover:text-gray-600"><Home className="h-3 w-3" /> Start</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          {cat && (
            <>
              <Link href={`/category/${cat.slug}`} className="shrink-0 hover:text-gray-600">{cat.name}</Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
            </>
          )}
          <span className="truncate font-medium text-gray-700">{product.title}</span>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
          {/* ─── Left: Image ─── */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 rounded-2xl border border-gray-100 bg-white p-6 sm:p-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.imageUrl} alt={product.title} width={400} height={400} className="mx-auto h-48 w-48 object-contain sm:h-64 sm:w-64" />
            </div>
          </div>

          {/* ─── Right: Details ─── */}
          <div className="lg:col-span-8">
            {/* Title block */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {product.brand} &middot; {cat?.name ?? product.category}
              </p>
              <h1 className="mt-1 text-xl font-extrabold text-gray-900 sm:text-2xl lg:text-3xl">
                {product.title}
              </h1>
              <p className="mt-1 text-xs text-gray-400">GTIN: {product.gtin}</p>
            </div>

            {/* Price hero + badges */}
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <div>
                <p className="text-[11px] text-gray-400">Bester Schweizer Preis ab</p>
                <p className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  CHF {bestPrice.totalChf.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">via {bestSource} &middot; inkl. Zoll + MwSt.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PriceDropBadge currentChf={bestPrice.totalChf} avgChf30d={avgChf30d} />
                {isDropping ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    <TrendingDown className="h-3.5 w-3.5" /> CHF {Math.abs(priceDrop30d).toFixed(0)} in 30d
                  </span>
                ) : priceDrop30d !== 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                    <TrendingUp className="h-3.5 w-3.5" /> +CHF {Math.abs(priceDrop30d).toFixed(0)} in 30d
                  </span>
                ) : null}
              </div>
            </div>

            {/* Swiss Final Price Breakdown */}
            <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <ShieldCheck className="h-4 w-4 text-red-500" />
                Schweizer Endpreis-Berechnung
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  { label: "Brutto EUR", val: `€ ${bestPrice.originalEur.toFixed(2)}` },
                  { label: "– DE-MwSt.", val: `€ ${(bestPrice.originalEur - bestPrice.netEur).toFixed(2)}` },
                  { label: "Netto CHF", val: `CHF ${bestPrice.netChf.toFixed(2)}` },
                  { label: "+ CH-MwSt. 8.1%", val: `CHF ${bestPrice.chVat.toFixed(2)}` },
                  { label: "+ Zoll", val: bestPrice.customsFee > 0 ? `CHF ${bestPrice.customsFee.toFixed(2)}` : "frei" },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-xl bg-gray-50 px-3 py-2">
                    <p className="text-[9px] font-medium uppercase text-gray-400">{label}</p>
                    <p className="text-sm font-bold text-gray-900">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Price Comparison Table ─── */}
            <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
              <h2 className="text-sm font-bold text-gray-900">Preisvergleich – alle Quellen</h2>
              <div className="mt-3 space-y-2">
                {sourceBreakdowns
                  .sort((a, b) => a.breakdown.totalChf - b.breakdown.totalChf)
                  .map((s) => (
                  <div
                    key={s.sourceId}
                    className={`flex flex-col gap-2 rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                      s.isBest ? "border-2 border-green-200 bg-green-50" : "border border-gray-100 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-block h-3 w-3 rounded-full" style={{ background: SOURCE_COLORS[s.sourceId] ?? "#888" }} />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {s.sourceName}
                          {s.isBest && <span className="ml-2 rounded bg-green-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Bester Preis</span>}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          EUR {s.currentPriceEur.toFixed(2)} &rarr; CHF {s.breakdown.totalChf.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShippingTooltip breakdown={s.breakdown} sourceId={s.sourceId} />
                      <div className="text-right">
                        <p className="text-lg font-extrabold text-gray-900">CHF {s.breakdown.totalChf.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400">inkl. Zoll + MwSt.</p>
                      </div>
                      <button className="ml-2 flex items-center gap-1 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700">
                        <ExternalLink className="h-3.5 w-3.5" /> Shop
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Price History Chart ─── */}
            <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
              <PriceHistoryChart product={product} history30d={priceHistory} />
            </div>

            {/* Tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600">
                <ShieldCheck className="h-3 w-3" /> Zoll berechnet
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600">
                <Truck className="h-3 w-3" /> Lieferung Schweiz
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600">
                Kurs: {EXCHANGE_RATE} CHF/EUR
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Mobile Sticky Price Alert Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-lg sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold text-gray-900">CHF {bestPrice.totalChf.toFixed(2)}</p>
            <p className="text-[10px] text-gray-400">via {bestSource}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAlert(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-300"
            >
              <Bell className="h-3.5 w-3.5" /> Alarm
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700">
              <ExternalLink className="h-3.5 w-3.5" /> Zum Shop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
