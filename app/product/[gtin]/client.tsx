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
import { ShareRow } from "@/components/share-row";
import { VariantSelector } from "@/components/variant-selector";
import type { VariantSibling } from "@/lib/data";
import { classifyShipping } from "@/lib/pricing/calculator";
import { useAuth } from "@/lib/auth/auth-context";
import { calculateSwissPrice, buildSwissShopBreakdown } from "@/lib/pricing/calculator";
import { EXCHANGE_RATE } from "@/lib/integrations/mock-service";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";
import { getCategoryBySlug } from "@/lib/categories";
import { getShopSource } from "@/lib/shop-sources";
import { ShopLogo } from "@/components/shop-logo";
import { BrandLogo } from "@/components/brand-logo";
import { formatChf } from "@/lib/pricing/format";

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
  parfum: { parent: "Parfum & Düfte", siblings: ["Herrendüfte", "Damendüfte", "Unisex"] },
  beauty: { parent: "Beauty + Pflege", siblings: ["Hautpflege", "Haarpflege", "Make-up"] },
  uhren: { parent: "Uhren + Schmuck", siblings: ["Smartwatches", "Sportuhren"] },
  // Feed categories
  herrendufte: { parent: "Parfum & Düfte", siblings: ["Herrendüfte", "Damendüfte", "Unisex-Düfte"] },
  damendufte: { parent: "Parfum & Düfte", siblings: ["Herrendüfte", "Damendüfte", "Unisex-Düfte"] },
  "unisex-dufte": { parent: "Parfum & Düfte", siblings: ["Herrendüfte", "Damendüfte", "Unisex-Düfte"] },
  pflege: { parent: "Beauty & Pflege", siblings: ["Pflege", "Haarpflege", "Make-Up"] },
  "make-up": { parent: "Beauty & Pflege", siblings: ["Pflege", "Haarpflege", "Make-Up"] },
  haarpflege: { parent: "Beauty & Pflege", siblings: ["Pflege", "Haarpflege", "Make-Up"] },
  koerperpflege: { parent: "Beauty & Pflege", siblings: ["Körperpflege", "Pflege", "Haarpflege"] },
  geschenksets: { parent: "Parfum & Düfte", siblings: ["Geschenksets", "Herrendüfte", "Damendüfte"] },
  sonnenpflege: { parent: "Beauty & Pflege", siblings: ["Sonnenpflege", "Pflege", "Haarpflege"] },
};

interface Props {
  item: MockProductWithHistory;
  allProducts: MockProductWithHistory[];
  /** Sibling variants (different sizes) sharing the same groupId. Empty for ungrouped SKUs. */
  variantSiblings?: VariantSibling[];
}

export function ProductDetailClient({ item, allProducts, variantSiblings = [] }: Props) {
  const { product, priceHistory, bestPrice, bestSource, priceDrop30d, avgChf30d } = item;
  const { isLoggedIn, isFavorite, toggleFavorite, isPinned, togglePin, setShowAuthModal } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const [showVision, setShowVision] = useState(false);
  const [pdpQuery, setPdpQuery] = useState("");
  const isDropping = priceDrop30d > 0;
  const faved = isFavorite(product.gtin);
  const pinned = isPinned(product.gtin);
  const cat = getCategoryBySlug(product.category);
  const sidebarNav = SIDEBAR_NAV[product.category] ?? null;
  const hasSources = product.sources.length > 0;

  // Best source URL for affiliate link
  const bestSourceUrl = product.affiliateUrl || product.sources.find((s) => s.sourceName === bestSource)?.url || "#";

  // Per-source breakdown — must match the pipeline used by enrichProduct
  // in lib/data.ts, otherwise the PDP recomputes EUR→CHF with amountEur=0
  // for every Swiss-shop source and shows "0.–". The Swiss-shop branch
  // (nativeChf present) passes straight through buildSwissShopBreakdown;
  // the DE-import branch stays on calculateSwissPrice as before.
  const sourceBreakdowns = product.sources.map((s) => {
    const breakdown = s.nativeChf != null && s.nativeChf > 0
      ? buildSwissShopBreakdown({
          grossChf: s.nativeChf,
          shippingChf: s.shippingChf ?? null,
          priceIsNet: s.priceIsNet === true,
        })
      : calculateSwissPrice({ amountEur: s.currentPriceEur, exchangeRate: EXCHANGE_RATE });
    return {
      ...s,
      breakdown,
      isBest: s.sourceName === bestSource,
      url: s.url || product.affiliateUrl || "#",
    };
  });

  const discount = avgChf30d > 0 && bestPrice.totalChf > 0 && bestPrice.totalChf < avgChf30d
    ? Math.round(((avgChf30d - bestPrice.totalChf) / avgChf30d) * 100) : 0;

  // Category display name
  const categoryDisplayName = cat?.name ?? product.categoryName ?? product.category;

  return (
    <div className="min-h-screen bg-white pb-24 sm:pb-0">
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
              {/* Image — no background tint; just the bare product shot
                  against the page white, Galaxus-style. */}
              <div className="lg:col-span-5">
                <div className="sticky top-28 p-4 sm:p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.imageUrl || "/icon.svg"} alt={product.title} width={400} height={400}
                    className="mx-auto h-52 w-52 object-contain sm:h-80 sm:w-80" />
                </div>
              </div>

              {/* Details */}
              <div className="lg:col-span-7">
                {/* Discount badge */}
                {discount >= 3 && (
                  <span className="mb-2 inline-block rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">-{discount}%</span>
                )}

                {/* Price — exact rappen, no rounding to whole francs */}
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-gray-900">
                    {bestPrice.totalChf > 0 ? `CHF ${formatChf(bestPrice.totalChf)}` : "Preis auf Anfrage"}
                  </span>
                  {discount >= 3 && (
                    <span className="text-base text-gray-400 line-through">
                      statt CHF {formatChf(avgChf30d)}
                    </span>
                  )}
                </div>

                {/* Brand + Title — official brand logo (Clearbit) flanks
                    the brand name so the hero looks brand-authentic and
                    falls back to a coloured initial chip on error. */}
                <div className="mt-2 flex items-center gap-3">
                  <BrandLogo name={product.brand} size="sm" shape="circle" />
                  <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    <span className="font-extrabold">{product.brand}</span> {product.title.replace(product.brand, "").trim()}
                  </h1>
                </div>
                <p className="mt-1 text-sm text-gray-500">{cat?.name ?? product.category} · GTIN {product.gtin}</p>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <PriceDropBadge currentChf={bestPrice.totalChf} avgChf30d={avgChf30d} />
                  {isDropping && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                      <TrendingDown className="h-3.5 w-3.5" /> CHF {formatChf(Math.abs(priceDrop30d))} in 30d
                    </span>
                  )}
                  {hasSources && (() => {
                    const bestSid = sourceBreakdowns.reduce((a, b) => a.breakdown.totalChf < b.breakdown.totalChf ? a : b);
                    const isImport = bestSid.sourceId === "amazon_de" || bestSid.sourceId === "zalando_de";
                    const isSwiss = bestSid.sourceId === "galaxus_ch";
                    const isFeed = bestSid.sourceId.startsWith("adtraction");
                    return (
                      <>
                        {isImport && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700"><Plane className="h-3 w-3" /> Import-Vorteil</span>}
                        {isSwiss && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"><ShieldCheck className="h-3 w-3" /> CH Garantie</span>}
                        {isFeed && product.shopName && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">Partner: {product.shopName}</span>}
                      </>
                    );
                  })()}
                </div>

                {/* Delivery */}
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600">Lieferung Schweiz</span>
                  </span>
                  <span className="text-gray-400">· inkl. Zoll + MwSt.</span>
                  <span className="text-xs text-gray-400">· Kurs: {EXCHANGE_RATE} CHF/EUR</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Letztes Update: {new Date().toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}, {new Date().toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} Uhr
                </p>

                {/* CTA — single row: Preisalarm + Zum besten Shop */}
                <div className="mt-5 flex gap-3">
                  <button onClick={() => setShowAlert(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
                    <Bell className="h-4 w-4" /> Preisalarm setzen
                  </button>
                  <a href={bestSourceUrl || "#"} target="_blank" rel="sponsored nofollow noopener"
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                    <ExternalLink className="h-4 w-4" /> Zum besten Shop
                  </a>
                </div>

                {/* Shipping chip — shown only when we have a definitive answer */}
                {(() => {
                  const s = classifyShipping(product.sources[0]?.shippingChf ?? null);
                  if (s.kind === "included") {
                    return (
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                        <Truck className="h-3 w-3" /> Versand in die Schweiz inkl.
                      </p>
                    );
                  }
                  if (s.kind === "paid") {
                    return (
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-600">
                        <Truck className="h-3 w-3" /> zzgl. CHF {Math.round(s.chf)}.– Versand
                      </p>
                    );
                  }
                  return null;
                })()}

                {/* Variant selector — only when the product has sibling sizes */}
                {variantSiblings.length > 1 && (
                  <div className="mt-4">
                    <VariantSelector siblings={variantSiblings} />
                  </div>
                )}

                {/* Merken + Favorit — independent states */}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => { if (!isLoggedIn) { setShowAuthModal(true); return; } togglePin(product.gtin); }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition ${pinned ? "border-blue-300 bg-blue-50 text-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                    <Pin className={`h-4 w-4 ${pinned ? "fill-current" : ""}`} />
                    {pinned ? "Gemerkt" : "Merken"}
                  </button>
                  <button
                    onClick={() => { if (!isLoggedIn) { setShowAuthModal(true); return; } toggleFavorite(product.gtin); }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition ${faved ? "border-red-300 bg-red-50 text-red-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                    <Heart className={`h-4 w-4 ${faved ? "fill-current" : ""}`} />
                    Favorit
                  </button>
                </div>

                {/* Share row — WhatsApp · Telegram · Copy Link */}
                <div className="mt-3">
                  <ShareRow title={`${product.brand} ${product.title}`.trim()} />
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
                {sourceBreakdowns.length > 0 ? (
                <div className="mt-6 border-t border-gray-200 pt-5">
                  <h2 className="text-sm font-bold text-gray-900">Preisvergleich – alle Quellen</h2>
                  <div className="mt-3 space-y-2">
                    {sourceBreakdowns.sort((a, b) => a.breakdown.totalChf - b.breakdown.totalChf).map((s) => {
                      const shop = getShopSource(s.sourceId);
                      // Swiss-shop feeds carry EUR = 0 by construction. Only
                      // show the EUR sub-line when the source is a true
                      // DE-import where EUR is the source-of-truth.
                      const showEurLine = s.currentPriceEur > 0;
                      const hasChf = s.breakdown.totalChf > 0;
                      const ctaPrice = hasChf ? `CHF ${formatChf(s.breakdown.totalChf)}` : "Preis prüfen";
                      return (
                      <div key={s.sourceId} className={`flex flex-col gap-2 rounded-lg px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${s.isBest ? "border-2 border-green-200 bg-green-50" : "border border-gray-100 bg-gray-50"}`}>
                        <div className="flex items-center gap-3">
                          {/* Official shop logo (Clearbit) with a graceful
                              text-wordmark fallback — single component keeps
                              card + PDP branding identical. */}
                          <ShopLogo sourceId={s.sourceId} size="md" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {shop.name}
                              {s.isBest && <span className="ml-2 rounded bg-green-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Bester Preis</span>}
                            </p>
                            {showEurLine && (
                              <p className="text-[11px] text-gray-400">EUR {s.currentPriceEur.toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShippingTooltip breakdown={s.breakdown} sourceId={s.sourceId} />
                          <span className="text-lg font-bold text-gray-900">{ctaPrice}</span>
                          <a
                            href={s.url || "#"}
                            target="_blank"
                            rel="sponsored nofollow noopener"
                            className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 sm:ml-2"
                          >
                            <ExternalLink className="h-4 w-4" /> Zum Shop
                          </a>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
                ) : product.affiliateUrl ? (
                <div className="mt-6 border-t border-gray-200 pt-5">
                  <h2 className="text-sm font-bold text-gray-900">Angebot von {product.shopName || "Partner"}</h2>
                  <div className="mt-3 rounded-lg border-2 border-green-200 bg-green-50 px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {product.shopName || "Partner-Shop"}
                          <span className="ml-2 rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Partner</span>
                        </p>
                        {bestPrice.totalChf > 0 && <p className="mt-1 text-2xl font-bold text-gray-900">CHF {formatChf(bestPrice.totalChf)}</p>}
                      </div>
                      <a href={product.affiliateUrl} target="_blank" rel="sponsored nofollow noopener"
                        className="flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700">
                        <ExternalLink className="h-4 w-4" /> Zum Shop
                      </a>
                    </div>
                  </div>
                </div>
                ) : null}

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
            <p className="text-lg font-bold text-gray-900">{bestPrice.totalChf > 0 ? `CHF ${formatChf(bestPrice.totalChf)}` : "—"}</p>
            <p className="text-[10px] text-gray-400">{bestSource}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAlert(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700">
              <Bell className="h-3.5 w-3.5" /> Alarm
            </button>
            <a href={bestSourceUrl || "#"} target="_blank" rel="sponsored nofollow noopener"
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white">
              <ExternalLink className="h-3.5 w-3.5" /> Shop
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
