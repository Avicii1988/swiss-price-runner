"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
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
import { CategorySidebar } from "@/components/category-sidebar";
import { TrustBrandsBar } from "@/components/trust-brands-bar";
import { useAuth } from "@/lib/auth/auth-context";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface HomeClientProps {
  allProducts: MockProductWithHistory[];
  featured: MockProductWithHistory[];
  categories: string[];
}

export default function HomeClient({ allProducts, featured }: HomeClientProps) {
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MockProductWithHistory | null>(null);
  const [alertProduct, setAlertProduct] = useState<MockProductWithHistory | null>(null);
  const [showVisionModal, setShowVisionModal] = useState(false);

  const { isLoggedIn, setShowAuthModal } = useAuth();

  const handleSelect = useCallback((item: MockProductWithHistory) => setSelectedProduct(item), []);
  const handleAlert = useCallback((item: MockProductWithHistory) => { setSelectedProduct(null); setAlertProduct(item); }, []);

  // Themed product groups
  const appleProducts = useMemo(() => allProducts.filter((p) => p.product.brand === "Apple").slice(0, 4), [allProducts]);
  const shoeProducts = useMemo(() => allProducts.filter((p) => ["schuhe", "mode"].includes(p.product.category) && ["Nike", "Adidas", "On Running", "New Balance"].includes(p.product.brand)).slice(0, 4), [allProducts]);
  const trendingProducts = useMemo(() => [...allProducts].sort((a, b) => b.priceDrop30d - a.priceDrop30d).slice(0, 4), [allProducts]);

  const tagesangebot = featured[0];

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
        showVision={() => setShowVisionModal(true)}
      />

      {/* Trust & Brands */}
      <TrustBrandsBar />

      {/* ═══ MAIN ═══ */}
      <div className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5 lg:px-6">
        <div className="flex gap-6 lg:gap-8">

          {/* LEFT SIDEBAR — Gesamtsortiment drill-down */}
          <aside className="hidden w-[180px] shrink-0 lg:block">
            <CategorySidebar />
          </aside>

          {/* CENTER */}
          <main className="min-w-0 flex-1">
              <>
                {/* 🔥 Top Deals des Tages */}
                {featured.length > 0 && (
                  <section className="mb-8">
                    <div className="mb-3 flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <h2 className="text-lg font-bold text-gray-900">Top Deals des Tages</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-3">
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
                      <Link href="/category/smartphones" className="flex items-center gap-1 text-xs font-medium text-blue-600">Alle <ArrowRight className="h-3 w-3" /></Link>
                    </div>
                    <div className="grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-3">
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
                      <Link href="/category/schuhe" className="flex items-center gap-1 text-xs font-medium text-blue-600">Alle <ArrowRight className="h-3 w-3" /></Link>
                    </div>
                    <div className="grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-3">
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
                    <div className="grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-3">
                      {trendingProducts.map((item) => <ProductCard key={item.product.gtin} item={item} onSelect={handleSelect} onAlert={handleAlert} />)}
                    </div>
                  </section>
                )}

              </>
          </main>

          {/* RIGHT SIDEBAR — Tagesangebot */}
          {tagesangebot && (
            <aside className="hidden w-72 shrink-0 pl-8 xl:block">
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

      {/* CTA — single instance */}
      <section className="bg-slate-900 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-lg font-bold text-white">Preisalarm einrichten</h2>
          <p className="mt-2 text-sm text-slate-400">Wir benachrichtigen dich per E-Mail, sobald dein Wunschpreis erreicht wird.</p>
          <button onClick={() => { if (!isLoggedIn) { setShowAuthModal(true); return; } if (featured.length > 0) handleAlert(featured[0]); }}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#D81E05] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#b91a04]">
            <Bell className="h-4 w-4" /> Jetzt Alarm einrichten
          </button>
        </div>
      </section>
    </div>
  );
}
