"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ExternalLink,
  Heart,
  Bell,
  ShieldCheck,
  Truck,
  Plane,
  TrendingDown,
  Pin,
} from "lucide-react";
import { PriceHistoryChart } from "@/components/price-history-chart";
import { PriceDropBadge } from "@/components/price-drop-badge";
import { ShippingTooltip } from "@/components/shipping-tooltip";
import { PriceAlertModal } from "@/components/price-alert-modal";
import { HowWeCalculateButton } from "@/components/how-we-calculate";
import { EmailAlertForm } from "@/components/email-alert-form";
import { SiteHeader } from "@/components/site-header";
import { VisualSearchModal } from "@/components/visual-search-modal";
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

const SIDEBAR_NAV: Record<string, { parent: string; siblings: string[] }> = {
  smartphones: { parent: "IT + Multimedia", siblings: ["Smartphones", "Laptops", "Kopfhörer", "TV & Audio", "Foto"] },
  laptops: { parent: "IT + Multimedia", siblings: ["Smartphones", "Laptops", "Kopfhörer", "TV & Audio", "Foto"] },
  kopfhoerer: { parent: "IT + Multimedia", siblings: ["Smartphones", "Laptops", "Kopfhörer", "TV & Audio", "Foto"] },
  "tv-audio": { parent: "IT + Multimedia", siblings: ["Smartphones", "Laptops", "Kopfhörer", "TV & Audio", "Foto"] },
  foto: { parent: "IT + Multimedia", siblings: ["Smartphones", "Laptops", "Kopfhörer", "TV & Audio", "Foto"] },
  haushalt: { parent: "Haushalt", siblings: ["Staubsauger", "Kaffeemaschinen", "Küchengeräte"] },
  sport: { parent: "Sport", siblings: ["Fitness", "Velo", "Wandern"] },
  mode: { parent: "Mode", siblings: ["Sneakers", "Laufschuhe", "Jacken", "Jeans"] },
  schuhe: { parent: "Mode", siblings: ["Sneakers", "Laufschuhe", "Jacken", "Jeans"] },
  gaming: { parent: "Gaming + Spielzeug", siblings: ["PlayStation", "Xbox", "Nintendo"] },
  beauty: { parent: "Beauty + Gesundheit", siblings: ["Parfum", "Pflege", "Make-up"] },
  uhren: { parent: "Uhren + Schmuck", siblings: ["Smartwatches", "Sportuhren"] },
};

interface Props {
  item: MockProductWithHistory;
  allProducts: MockProductWithHistory[];
}

export function ProductDetailClient({ item, allProducts }: Props) {
  const { product, priceHistory, bestPrice, bestSource, priceDrop30d, avgChf30d } = item;
  const { isLoggedIn, isFavorite, toggleFavorite, setShowAuthModal } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const [showVision, setShowVision] = useState(false);
  const [pdpQuery, setPdpQuery] = useState("");
  const isDropping = priceDrop30d > 0;
  const faved = isFavorite(product.gtin);
  const cat = getCategoryBySlug(product.category);
  const sidebarNav = SIDEBAR_NAV[product.category];

  const sourceBreakdowns = product.sources.map((s) => ({
    ...s,
    breakdown: calculateSwissPrice({ amountEur: s.currentPriceEur, exchangeRate: EXCHANGE_RATE }),
    isBest: s.sourceName === bestSource,
  }));

  const discount = avgChf30d > 0 && bestPrice.totalChf < avgChf30d
    ? Math.round(((avgChf30d - bestPrice.totalChf) / avgChf30d) * 100) : 0;

  return (
    <div className="min-h-screen bg-white pb-60 sm:pb-0">
      {showAlert && <PriceAlertModal item={item} onClose={() => setShowAlert(false)} />}
      {showVision && <VisualSearchModal onClose={() => setShowVision(false)} allProducts={allProducts} />}

      {/* Shared header — with allProducts for global search */}
      <SiteHeader query={pdpQuery} onQueryChange={setPdpQuery} allProducts={allProducts} showVision={() => setShowVision(true)} />

      {/* ═══ MAIN: sidebar + content ═══ */}
      <div className="mx-auto max-w-[1600px] px-5 py-6 sm:px-10">
        <div className="flex gap-8">

          {/* ── LEFT: Deep-nav sidebar ── */}
          <aside className="hidden w-48 shrink-0 lg:block">
            <nav>
              <Link href="/" className="flex items-center justify-between py-2 text-sm text-gray-700 hover:text-black">
                Gesamtsortiment <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <div className="border-t border-gray-200" />
              {sidebarNav && (
                <>
                  <p className="flex items-center justify-between py-2 text-sm font-semibold text-gray-900">
                    {sidebarNav.parent} <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                  </p>
                  <div className="border-t border-gray-200" />
                  <p className="py-2 text-sm font-semibold text-gray-900">{cat?.name ?? product.category}</p>
                  <div className="ml-3 space-y-0.5 border-l border-gray-200 pl-3">
                    {sidebarNav.siblings.map((sub) => (
                      <p key={sub} className={`py-1 text-[13px] ${sub === (cat?.name ?? "") ? "font-semibold text-black" : "text-gray-500"}`}>
                        {sub}
                      </p>
                    ))}
                  </div>
                  <div className="mt-2 border-t border-gray-200" />
                </>
              )}
            </nav>
          </aside>

          {/* ── RIGHT: Product content (max-width for clean proportions) ── */}
          <main className="min-w-0 flex-1 max-w-4xl">
            {/* Breadcrumbs — directly above product content, NOT above sidebar */}
            <nav className="mb-4 flex items-center gap-1.5 overflow-x-auto text-xs text-gray-400">
              <Link href="/" className="shrink-0 text-blue-600 hover:underline">Gesamtsortiment</Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
              {sidebarNav && (
                <>
                  <span className="shrink-0 text-blue-600">{sidebarNav.parent}</span>
                  <ChevronRight className="h-3 w-3 shrink-0" />
                </>
              )}
              {cat && (
                <>
                  <Link href={`/category/${cat.slug}`} className="shrink-0 text-blue-600 hover:underline">{cat.name}</Link>
                  <ChevronRight className="h-3 w-3 shrink-0" />
                </>
              )}
              <span className="truncate text-gray-600">{product.title}</span>
            </nav>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Image */}
              <div className="lg:col-span-5">
                <div className="sticky top-28 rounded-xl bg-gray-50 p-6 sm:p-10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.imageUrl} alt={product.title} width={400} height={400} className="mx-auto h-52 w-52 object-contain sm:h-72 sm:w-72" />
                </div>
              </div>

              {/* Details */}
              <div className="lg:col-span-7">
                {/* Discount badge */}
                {discount >= 3 && (
                  <span className="mb-2 inline-block rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">-{discount}%</span>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-gray-900">{bestPrice.totalChf.toFixed(0)}.–</span>
                  {discount >= 3 && (
                    <span className="text-base text-gray-400 line-through">statt {Math.round(avgChf30d)}.–</span>
                  )}
                </div>

                {/* Brand + Title */}
                <h1 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
                  <span className="font-extrabold">{product.brand}</span> {product.title.replace(product.brand, "").trim()}
                </h1>
                <p className="mt-1 text-sm text-gray-500">{cat?.name ?? product.category} · GTIN {product.gtin}</p>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <PriceDropBadge currentChf={bestPrice.totalChf} avgChf30d={avgChf30d} />
                  {isDropping && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                      <TrendingDown className="h-3.5 w-3.5" /> CHF {Math.abs(priceDrop30d).toFixed(0)} in 30d
                    </span>
                  )}
                  {(() => {
                    const bestSid = sourceBreakdowns.reduce((a, b) => a.breakdown.totalChf < b.breakdown.totalChf ? a : b);
                    const isImport = bestSid.sourceId === "amazon_de" || bestSid.sourceId === "zalando_de";
                    const isSwiss = bestSid.sourceId === "galaxus_ch";
                    return (
                      <>
                        {isImport && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700"><Plane className="h-3 w-3" /> Import-Vorteil</span>}
                        {isSwiss && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"><ShieldCheck className="h-3 w-3" /> CH Garantie</span>}
                      </>
                    );
                  })()}
                </div>

                {/* Delivery */}
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-600">Lieferung Schweiz</span>
                  <span className="text-gray-400">· inkl. Zoll + MwSt.</span>
                </div>

                {/* CTA — single row: Preisalarm + Zum besten Shop */}
                <div className="mt-5 flex gap-3">
                  <button onClick={() => setShowAlert(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
                    <Bell className="h-4 w-4" /> Preisalarm setzen
                  </button>
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                    <ExternalLink className="h-4 w-4" /> Zum besten Shop
                  </button>
                </div>

                {/* Merken (Pin to Merkliste) */}
                <div className="mt-2">
                  <button
                    onClick={() => { if (!isLoggedIn) { setShowAuthModal(true); return; } toggleFavorite(product.gtin); }}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition ${faved ? "border-red-300 bg-red-50 text-red-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                    <Pin className={`h-4 w-4 ${faved ? "fill-current" : ""}`} />
                    {faved ? "Gemerkt" : "Merken"}
                  </button>
                </div>

                {/* Swiss Price Breakdown */}
                <div className="mt-6 border-t border-gray-200 pt-5">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <ShieldCheck className="h-4 w-4 text-red-500" /> Schweizer Endpreis-Berechnung
                  </h2>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {[
                      { label: "Brutto EUR", val: `€ ${bestPrice.originalEur.toFixed(2)}` },
                      { label: "– DE-MwSt.", val: `€ ${(bestPrice.originalEur - bestPrice.netEur).toFixed(2)}` },
                      { label: "Netto CHF", val: `${bestPrice.netChf.toFixed(2)}` },
                      { label: "+ CH-MwSt.", val: `${bestPrice.chVat.toFixed(2)}` },
                      { label: "+ Zoll", val: bestPrice.customsFee > 0 ? `${bestPrice.customsFee.toFixed(2)}` : "frei" },
                    ].map(({ label, val }) => (
                      <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[9px] font-medium uppercase text-gray-400">{label}</p>
                        <p className="text-sm font-bold text-gray-900">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Comparison Table */}
                <div className="mt-6 border-t border-gray-200 pt-5">
                  <h2 className="text-sm font-bold text-gray-900">Preisvergleich – alle Quellen</h2>
                  <div className="mt-3 space-y-2">
                    {sourceBreakdowns.sort((a, b) => a.breakdown.totalChf - b.breakdown.totalChf).map((s) => (
                      <div key={s.sourceId} className={`flex flex-col gap-2 rounded-lg px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${s.isBest ? "border-2 border-green-200 bg-green-50" : "border border-gray-100 bg-gray-50"}`}>
                        <div className="flex items-center gap-3">
                          <span className="inline-block h-3 w-3 rounded-full" style={{ background: SOURCE_COLORS[s.sourceId] ?? "#888" }} />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {s.sourceName}
                              {s.isBest && <span className="ml-2 rounded bg-green-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Bester Preis</span>}
                            </p>
                            <p className="text-[11px] text-gray-400">EUR {s.currentPriceEur.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShippingTooltip breakdown={s.breakdown} sourceId={s.sourceId} />
                          <span className="text-lg font-bold text-gray-900">{s.breakdown.totalChf.toFixed(0)}.–</span>
                          <button className="ml-2 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price History Chart */}
                <div className="mt-6 border-t border-gray-200 pt-5">
                  <div className="rounded-lg border border-gray-100 bg-white p-4">
                    <PriceHistoryChart product={product} history30d={priceHistory} />
                  </div>
                </div>

                {/* Email Alert — directly below chart */}
                <div className="mt-4">
                  <EmailAlertForm productGtin={product.gtin} productTitle={product.title} currentPriceChf={bestPrice.totalChf} />
                </div>

                {/* Tags + How we calculate */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600"><ShieldCheck className="h-3 w-3" /> Zoll berechnet</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600"><Truck className="h-3 w-3" /> Lieferung Schweiz</span>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600">Kurs: {EXCHANGE_RATE} CHF/EUR</span>
                </div>
                <div className="mt-3"><HowWeCalculateButton /></div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Sticky Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-lg sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-gray-900">{bestPrice.totalChf.toFixed(0)}.–</p>
            <p className="text-[10px] text-gray-400">{bestSource}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAlert(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700">
              <Bell className="h-3.5 w-3.5" /> Alarm
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white">
              <ExternalLink className="h-3.5 w-3.5" /> Shop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
