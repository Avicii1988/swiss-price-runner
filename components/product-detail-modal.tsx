"use client";

import { X, ExternalLink, Bell, TrendingDown, TrendingUp, ShieldCheck, Truck } from "lucide-react";
import { PriceHistoryChart } from "./price-history-chart";
import { getShopSource } from "@/lib/shop-sources";
import { formatChf } from "@/lib/pricing/format";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface ProductDetailModalProps {
  item: MockProductWithHistory;
  onClose: () => void;
  onOpenAlert: (item: MockProductWithHistory) => void;
}

export function ProductDetailModal({ item, onClose, onOpenAlert }: ProductDetailModalProps) {
  const { product, priceHistory, bestPrice, bestSource, priceDrop30d } = item;
  const isDropping = priceDrop30d > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 pt-8 sm:pt-16"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top section */}
        <div className="flex flex-col sm:flex-row">
          <div className="flex shrink-0 items-center justify-center bg-gray-50 p-8 sm:w-64 sm:rounded-tl-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl} alt={product.title} width={200} height={200} className="h-48 w-48 object-contain" />
          </div>

          <div className="flex-1 p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {product.brand} &middot; {product.category}
            </p>
            <h2 className="mt-1 text-lg font-bold text-gray-900 sm:text-xl">{product.title}</h2>
            <p className="mt-1 text-xs text-gray-400">GTIN: {product.gtin}</p>

            <div className="mt-4 flex items-end gap-3">
              <div>
                <p className="text-[11px] text-gray-400">Bester Preis ab</p>
                <p className="text-3xl font-extrabold tracking-tight text-gray-900">
                  CHF {bestPrice.totalChf.toFixed(2)}
                </p>
              </div>
              {isDropping ? (
                <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                  <TrendingDown className="h-3.5 w-3.5" />
                  CHF {Math.abs(priceDrop30d).toFixed(0)} gesunken
                </span>
              ) : (
                <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                  CHF {Math.abs(priceDrop30d).toFixed(0)} gestiegen
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Netto EUR", value: `€ ${bestPrice.netEur.toFixed(2)}` },
                { label: "Netto CHF", value: `CHF ${bestPrice.netChf.toFixed(2)}` },
                { label: "CH-MwSt.", value: `CHF ${bestPrice.chVat.toFixed(2)}` },
                { label: "Zoll", value: bestPrice.customsFee > 0 ? `CHF ${bestPrice.customsFee.toFixed(2)}` : "frei" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-[10px] text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                <ShieldCheck className="h-3 w-3" /> Zoll berechnet
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                <Truck className="h-3 w-3" /> Lieferung CH
              </span>
            </div>
          </div>
        </div>

        {/* Price History Chart */}
        <div className="border-t border-gray-100 px-5 py-5 sm:px-6">
          <PriceHistoryChart product={product} history30d={priceHistory} />
        </div>

        {/* Source comparison table */}
        <div className="border-t border-gray-100 px-5 py-5 sm:px-6">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Preisvergleich</h3>
          <div className="space-y-2">
            {product.sources.map((source) => {
              const isBest = source.sourceName === bestSource;
              const shop = getShopSource(source.sourceId);
              const showEurLine = source.currentPriceEur > 0;
              return (
                <div
                  key={source.sourceId}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                    isBest ? "border-2 border-green-200 bg-green-50" : "border border-gray-100 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: shop.color }} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {shop.name}
                        {isBest && <span className="ml-2 rounded bg-green-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Bester Preis</span>}
                      </p>
                      {showEurLine && (
                        <p className="text-[11px] text-gray-400">EUR {formatChf(source.currentPriceEur)}</p>
                      )}
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700">
                    <ExternalLink className="h-3.5 w-3.5" /> Zum Shop
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Alert CTA ── */}
        <div className="rounded-b-2xl border-t border-gray-100 bg-gradient-to-r from-red-50 to-amber-50 px-5 py-4 sm:px-6">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Preisalarm einrichten</p>
              <p className="text-xs text-gray-500">
                Wir benachrichtigen dich sofort, wenn der Preis fällt.
              </p>
            </div>
            <button
              onClick={() => { onClose(); onOpenAlert(item); }}
              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              <Bell className="h-4 w-4" />
              Alarm setzen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
