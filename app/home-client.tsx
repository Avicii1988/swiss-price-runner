"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  ChevronRight,
  X,
  Bell,
  ArrowRight,
  Flame,
  TrendingDown,
  Percent,
  Apple,
  Footprints,
  TrendingUp,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { PriceAlertModal } from "@/components/price-alert-modal";
import { VisualSearchModal } from "@/components/visual-search-modal";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/lib/auth/auth-context";
import { CATEGORIES } from "@/lib/categories";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface HomeClientProps {
  allProducts: MockProductWithHistory[];
  featured: MockProductWithHistory[];
  categories: string[];
}

const SIDEBAR_ITEMS = [
  { label: "IT + Multimedia", slugs: ["smartphones", "laptops", "kopfhoerer", "foto", "tv-audio"], subs: ["Smartphones", "Laptops", "Kopfhörer", "TV & Audio", "Foto"] },
  { label: "Haushalt", slugs: ["haushalt"], subs: ["Staubsauger", "Kaffeemaschinen", "Küchengeräte"] },
  { label: "Sport", slugs: ["sport"], subs: ["Fitness", "Velo", "Wandern"] },
  { label: "Mode", slugs: ["mode", "schuhe"], subs: ["Sneakers", "Laufschuhe", "Jacken", "Jeans"] },
  { label: "Gaming + Spielzeug", slugs: ["gaming"], subs: ["PlayStation", "Xbox", "Nintendo"] },
  { label: "Baby + Eltern", slugs: ["baby"], subs: [] },
  { label: "Beauty + Gesundheit", slugs: ["beauty"], subs: ["Parfum", "Pflege", "Haarpflege"] },
  { label: "Uhren + Schmuck", slugs: ["uhren"], subs: [] },
  { label: "Bücher + Medien", slugs: ["buecher"], subs: [] },
];

export default function HomeClient({ allProducts, featured }: HomeClientProps) {
  const [activeSlugs, setActiveSlugs] = useState<string[] | null>(null);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MockProductWithHistory | null>(null);
  const [alertProduct, setAlertProduct] = useState<MockProductWithHistory | null>(null);
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [expandedSidebar, setExpandedSidebar] = useState<string | null>(null);

  const { isLoggedIn, setShowAuthModal } = useAuth();

  const filtered = useMemo(() => {
    let items = allProducts;
    if (activeSlugs && activeSlugs.length > 0) items = items.filter((p) => activeSlugs.includes(p.product.category));
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((p) => p.product.title.toLowerCase().includes(q) || p.product.brand.toLowerCase().includes(q) || p.product.gtin.includes(q));
    }
    return items;
  }, [allProducts, activeSlugs, query]);

  const handleSelect = useCallback((item: MockProductWithHistory) => setSelectedProduct(item), []);
  const handleAlert = useCallback((item: MockProductWithHistory) => { setSelectedProduct(null); setAlertProduct(item); }, []);

  const selectCategory = (slugs: string[], label: string) => {
    if (activeLabel === label) { setActiveSlugs(null); setActiveLabel(null); }
    else { setActiveSlugs(slugs.length > 0 ? slugs : null); setActiveLabel(label); }
  };

  const clearFilter = () => { setActiveSlugs(null); setActiveLabel(null); setQuery(""); };

  // Themed product groups
  const appleProducts = useMemo(() => allProducts.filter((p) => p.product.brand === "Apple").slice(0, 4), [allProducts]);
  const shoeProducts = useMemo(() => allProducts.filter((p) => ["schuhe", "mode"].includes(p.product.category) && ["Nike", "Adidas", "On Running", "New Balance"].includes(p.product.brand)).slice(0, 4), [allProducts]);
  const trendingProducts = useMemo(() => [...allProducts].sort((a, b) => b.priceDrop30d - a.priceDrop30d).slice(0, 4), [allProducts]);

  const tagesangebot = featured[0];
  const isFiltered = !!(query.trim() || activeSlugs);

  return (
    <div className="min-h-screen bg-white">
      {selectedProduct && <ProductDetailModal item={selectedProduct} onOpenAlert={handleAlert} onClose={() => setSelectedProduct(null)} />}
      {alertProduct && <PriceAlertModal item={alertProduct} onClose={() => setAlertProduct(null)} />}

      {showVisionModal && (
        <VisualSearchModal onClose={() => setShowVisionModal(false)} allProducts={allProducts} />
      )}

      {/* Shared header */}
      <SiteHeader
        query={query}
        onQueryChange={setQuery}
        allProducts={allProducts}
        onCategorySelect={selectCategory}
        showVision={() => setShowVisionModal(true)}
      />

      {/* ═══ MAIN ═══ */}
      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-10">
        <div className="flex gap-6">

          {/* LEFT SIDEBAR with sub-categories */}
          <aside className="hidden w-48 shrink-0 lg:block">
            <nav>
              {SIDEBAR_ITEMS.map((item, i) => (
                <div key={item.label}>
                  <button onClick={() => {
                    selectCategory(item.slugs, item.label);
                    setExpandedSidebar(expandedSidebar === item.label ? null : item.label);
                  }}
                    className={`flex w-full items-center justify-between py-2.5 text-left text-[14px] transition hover:text-black ${
                      activeLabel === item.label ? "font-semibold text-black" : "text-gray-600"
                    }`}>
                    <span>{item.label}</span>
                    {item.subs.length > 0 && <ChevronRight className={`h-3.5 w-3.5 text-gray-400 transition ${expandedSidebar === item.label ? "rotate-90" : ""}`} />}
                  </button>
                  {expandedSidebar === item.label && item.subs.length > 0 && (
                    <div className="mb-1 ml-3 space-y-0.5 border-l border-gray-200 pl-3">
                      {item.subs.map((sub) => (
                        <button key={sub} onClick={() => selectCategory(item.slugs, item.label)}
                          className="block w-full py-1 text-left text-[13px] text-gray-500 transition hover:text-black">{sub}</button>
                      ))}
                    </div>
                  )}
                  {i < SIDEBAR_ITEMS.length - 1 && <div className="border-t border-gray-200" />}
                </div>
              ))}
            </nav>

            {/* Entdecken section */}
            <div className="mt-5 border-t border-gray-200 pt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Entdecken</p>
              <div className="space-y-0.5">
                <button onClick={() => clearFilter()} className="w-full py-1.5 text-left text-[13px] text-gray-600 transition hover:text-black">
                  Top 100 Deals
                </button>
                <button onClick={() => clearFilter()} className="w-full py-1.5 text-left text-[13px] text-gray-600 transition hover:text-black">
                  Preisstürze
                </button>
                <button onClick={() => clearFilter()} className="w-full py-1.5 text-left text-[13px] text-gray-600 transition hover:text-black">
                  Neu im Preisvergleich
                </button>
              </div>
            </div>
          </aside>

          {/* CENTER */}
          <main className="min-w-0 flex-1">
            {/* Breadcrumb when filtered */}
            {isFiltered && (
              <div className="mb-4 flex items-center gap-2 text-xs">
                <button onClick={clearFilter} className="text-gray-400 hover:text-gray-600">Alle</button>
                <ChevronRight className="h-3 w-3 text-gray-300" />
                <span className="font-semibold text-gray-900">{activeLabel ?? `"${query}"`}</span>
                <span className="text-gray-400">({filtered.length})</span>
                <button onClick={clearFilter} className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200"><X className="h-3 w-3" /></button>
              </div>
            )}

            {/* When filtered — product grid only */}
            {isFiltered && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.slice(0, 40).map((item) => <ProductCard key={item.product.gtin} item={item} onSelect={handleSelect} onAlert={handleAlert} />)}
                </div>
                {filtered.length === 0 && <div className="py-20 text-center"><Package className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 text-sm text-gray-400">Keine Produkte gefunden.</p></div>}
              </>
            )}

            {/* When NOT filtered — themed sections */}
            {!isFiltered && (
              <>
                {/* 🔥 Top Deals des Tages */}
                {featured.length > 0 && (
                  <section className="mb-8">
                    <div className="mb-3 flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <h2 className="text-lg font-bold text-gray-900">Top Deals des Tages</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                      {featured.slice(0, 4).map((item) => {
                        const disc = item.avgChf30d > 0 && item.bestPrice.totalChf < item.avgChf30d
                          ? Math.round(((item.avgChf30d - item.bestPrice.totalChf) / item.avgChf30d) * 100) : 0;
                        const bestSrcId = item.product.sources.find((s) => s.sourceName === item.bestSource)?.sourceId ?? "";
                        return (
                          <Link key={item.product.gtin} href={`/product/${item.product.gtin}`}
                            className="group relative rounded-xl border border-gray-100 bg-white p-3 transition hover:shadow-md sm:p-4">
                            {disc >= 2 && <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-0.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white"><Percent className="h-2.5 w-2.5" /> -{disc}%</span>}
                            <div className="aspect-square overflow-hidden rounded-2xl p-3">
                              <div className="flex h-full w-full items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.product.imageUrl} alt={item.product.title} width={160} height={160} className="max-h-full max-w-full scale-110 object-contain transition-transform group-hover:scale-[1.15]" />
                              </div>
                            </div>
                            <p className="mt-2 line-clamp-2 text-xs font-medium text-gray-900 sm:text-sm">{item.product.title}</p>
                            <div className="mt-2">
                              <div className="flex items-baseline gap-1">
                                <span className="text-xs font-medium text-gray-500">CHF</span>
                                <span className="text-2xl font-bold tracking-tight text-gray-900">{item.bestPrice.totalChf.toFixed(2)}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[8px] font-bold text-gray-500">{bestSrcId === "amazon_de" ? "A" : bestSrcId === "galaxus_ch" ? "G" : "Z"}</span>
                                <span className="text-[10px] text-gray-400">{item.bestSource}</span>
                                {item.priceDrop30d > 0 && <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-600"><TrendingDown className="h-3 w-3" /> {item.priceDrop30d.toFixed(0)}</span>}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* 🍏 Apple-Welt */}
                {appleProducts.length > 0 && (
                  <section className="mb-8">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Apple className="h-5 w-5 text-gray-700" />
                        <h2 className="text-lg font-bold text-gray-900">Apple-Welt</h2>
                      </div>
                      <button onClick={() => selectCategory(["smartphones", "laptops", "kopfhoerer"], "Apple")} className="flex items-center gap-1 text-xs font-medium text-blue-600">Alle <ArrowRight className="h-3 w-3" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                      {appleProducts.map((item) => <ProductCard key={item.product.gtin} item={item} onSelect={handleSelect} onAlert={handleAlert} />)}
                    </div>
                  </section>
                )}

                {/* 👟 Zeit für neue Laufschuhe */}
                {shoeProducts.length > 0 && (
                  <section className="mb-8">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Footprints className="h-5 w-5 text-orange-500" />
                        <h2 className="text-lg font-bold text-gray-900">Zeit für neue Laufschuhe</h2>
                      </div>
                      <button onClick={() => selectCategory(["mode", "schuhe"], "Mode")} className="flex items-center gap-1 text-xs font-medium text-blue-600">Alle <ArrowRight className="h-3 w-3" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                      {shoeProducts.map((item) => <ProductCard key={item.product.gtin} item={item} onSelect={handleSelect} onAlert={handleAlert} />)}
                    </div>
                  </section>
                )}

                {/* 📈 Gerade beliebt */}
                {trendingProducts.length > 0 && (
                  <section className="mb-8">
                    <div className="mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <h2 className="text-lg font-bold text-gray-900">Gerade beliebt</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                      {trendingProducts.map((item) => <ProductCard key={item.product.gtin} item={item} onSelect={handleSelect} onAlert={handleAlert} />)}
                    </div>
                  </section>
                )}

                {/* Show all */}
                <div className="mt-4 text-center">
                  <button onClick={() => { setActiveSlugs([]); setActiveLabel("Alle"); }}
                    className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Alle {allProducts.length} Produkte anzeigen
                  </button>
                </div>
              </>
            )}
          </main>

          {/* RIGHT SIDEBAR — separated by fine divider */}
          {!isFiltered && tagesangebot && (
            <aside className="hidden w-72 shrink-0 border-l border-gray-200 pl-6 xl:block">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Tagesangebot</h2>
                <span className="rounded border border-gray-300 px-2 py-0.5 text-xs font-bold text-gray-600">
                  {new Date().getDate()} {["JAN","FEB","MÄR","APR","MAI","JUN","JUL","AUG","SEP","OKT","NOV","DEZ"][new Date().getMonth()]}
                </span>
              </div>
              <Link href={`/product/${tagesangebot.product.gtin}`} className="group mt-3 block">
                <div className="flex items-center justify-center rounded-xl bg-gray-50 p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tagesangebot.product.imageUrl} alt={tagesangebot.product.title} width={200} height={200} className="h-44 w-44 object-contain group-hover:scale-105 transition-transform" />
                </div>
                <div className="mt-3">
                  <p className="text-[11px] text-gray-500"><strong className="text-gray-900">noch 36</strong> von 150 Stück</p>
                  <div className="stock-bar mt-1"><div className="stock-bar-fill" style={{ width: "24%" }} /></div>
                </div>
                <p className="mt-3 text-xs text-blue-600">{tagesangebot.product.category}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold">{tagesangebot.bestPrice.totalChf.toFixed(0)}.–</span>
                  <span className="text-sm text-gray-400 line-through">{Math.round(tagesangebot.avgChf30d)}.–</span>
                </div>
                <h3 className="mt-1 text-sm font-bold">{tagesangebot.product.brand}</h3>
                <p className="line-clamp-2 text-xs text-gray-500">{tagesangebot.product.title}</p>
              </Link>
              <Link href="/" className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                Alle Angebote anzeigen <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>
          )}
        </div>
      </div>

      {/* CTA */}
      <section className="bg-gray-900 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-lg font-bold text-white">Preisalarm einrichten</h2>
          <p className="mt-2 text-sm text-gray-400">Wir benachrichtigen dich, sobald dein Wunschpreis erreicht wird.</p>
          <button onClick={() => { if (!isLoggedIn) { setShowAuthModal(true); return; } if (featured.length > 0) handleAlert(featured[0]); }}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700">
            <Bell className="h-4 w-4" /> Jetzt Alarm einrichten
          </button>
        </div>
      </section>
    </div>
  );
}
