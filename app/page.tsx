"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  ShieldCheck,
  BarChart3,
  Zap,
  Package,
  ArrowRight,
  Star,
  Flame,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { FeaturedDeal } from "@/components/featured-deal";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { LanguageSwitcher, type LangCode } from "@/components/language-switcher";
import { t } from "@/lib/i18n";
import {
  getMockProducts,
  getFeaturedProducts,
  getCategories,
  type MockProductWithHistory,
} from "@/lib/integrations/mock-service";

export default function HomePage() {
  const [lang, setLang] = useState<LangCode>("de");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MockProductWithHistory | null>(null);

  const allProducts = useMemo(() => getMockProducts(), []);
  const featured = useMemo(() => getFeaturedProducts().slice(0, 3), []);
  const categories = useMemo(() => getCategories(), []);

  const filtered = useMemo(() => {
    let items = allProducts;
    if (activeCategory) {
      items = items.filter((p) => p.product.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (p) =>
          p.product.title.toLowerCase().includes(q) ||
          p.product.brand.toLowerCase().includes(q) ||
          p.product.gtin.includes(q),
      );
    }
    return items;
  }, [allProducts, activeCategory, query]);

  const handleSelect = useCallback((item: MockProductWithHistory) => {
    setSelectedProduct(item);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          item={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Nav */}
      {/* ----------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:h-14 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight sm:text-lg">
              Swiss<span className="text-red-600">Price</span>Runner
            </span>
            <span className="hidden rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-600 sm:inline">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher current={lang} onChange={setLang} />
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------------- */}
      {/* Hero */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-white pb-10 pt-12 sm:pb-14 sm:pt-20">
        {/* Swiss cross watermark */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 opacity-[0.03]">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <rect x="35" y="10" width="30" height="80" fill="currentColor" rx="2" />
            <rect x="10" y="35" width="80" height="30" fill="currentColor" rx="2" />
          </svg>
        </div>

        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            {t(lang, "heroTitle")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500 sm:mt-4 sm:text-lg">
            {t(lang, "heroSubtitle")}
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-6 max-w-xl sm:mt-8">
            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 shadow-md focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10 sm:px-4 sm:py-3">
              <Search className="h-4 w-4 shrink-0 text-gray-400 sm:h-5 sm:w-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(lang, "searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 sm:text-base"
              />
              <button className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 active:scale-95 sm:px-5 sm:text-sm">
                {t(lang, "searchButton")}
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mx-auto mt-8 flex max-w-lg justify-center gap-6 text-center sm:mt-10 sm:gap-12">
            <div>
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">10+</p>
              <p className="text-[10px] text-gray-400 sm:text-xs">{t(lang, "stats")}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">900+</p>
              <p className="text-[10px] text-gray-400 sm:text-xs">{t(lang, "statsTracked")}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-600 sm:text-2xl">~12%</p>
              <p className="text-[10px] text-gray-400 sm:text-xs">{t(lang, "statsSaved")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* USP bar */}
      {/* ----------------------------------------------------------------- */}
      <section className="border-y border-gray-100 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-4 sm:gap-4 sm:py-6 sm:px-6">
          {[
            { icon: ShieldCheck, label: "Zoll & MwSt. berechnet" },
            { icon: BarChart3, label: "30-Tage Preisverlauf" },
            { icon: Zap, label: "Tagesaktuell" },
            { icon: Package, label: "3 Quellen verglichen" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[10px] text-gray-600 sm:gap-2 sm:text-xs">
              <Icon className="h-3.5 w-3.5 shrink-0 text-red-500 sm:h-4 sm:w-4" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Top Deals – Featured Products */}
      {/* ----------------------------------------------------------------- */}
      {!query.trim() && !activeCategory && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
              Top Deals Schweiz
            </h2>
          </div>
          <p className="mt-1 text-xs text-gray-400 sm:text-sm">
            Unsere besten Preise heute — inklusive aller Importkosten
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 lg:grid-cols-3">
            {featured.map((item) => (
              <FeaturedDeal
                key={item.product.gtin}
                item={item}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* All Products */}
      {/* ----------------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6" id="products">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-red-500" />
            <div>
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                {t(lang, "trendingTitle")}
              </h2>
              <p className="mt-0.5 text-xs text-gray-400 sm:text-sm">
                {t(lang, "trendingSubtitle")}
              </p>
            </div>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition sm:px-3 sm:text-xs ${
                !activeCategory
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t(lang, "filterAll")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? null : cat)
                }
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition sm:px-3 sm:text-xs ${
                  activeCategory === cat
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <ProductCard
              key={item.product.gtin}
              item={item}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <Package className="mx-auto h-8 w-8 sm:h-10 sm:w-10" />
            <p className="mt-3 text-xs sm:text-sm">Keine Produkte gefunden.</p>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* How it works */}
      {/* ----------------------------------------------------------------- */}
      <section className="border-t border-gray-100 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-center text-lg font-bold text-gray-900 sm:text-xl">
            So funktioniert SwissPriceRunner
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:mt-10 sm:grid-cols-3 sm:gap-8">
            {[
              {
                step: "01",
                title: "Preise sammeln",
                desc: "Wir vergleichen Amazon.de, Galaxus und Zalando in Echtzeit.",
              },
              {
                step: "02",
                title: "Schweizer Kosten berechnen",
                desc: "DE-MwSt. entfernen, EUR\u2192CHF umrechnen, CH-MwSt. & Zoll addieren.",
              },
              {
                step: "03",
                title: "Besten Preis zeigen",
                desc: "Du siehst den echten Endpreis \u2014 keine versteckten Kosten.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-600">
                  {step}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* CTA */}
      {/* ----------------------------------------------------------------- */}
      <section className="bg-gray-900 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-lg font-bold text-white sm:text-2xl">
            Preisalarm einrichten
          </h2>
          <p className="mt-2 text-xs text-gray-400 sm:text-sm">
            Wir benachrichtigen dich, sobald dein Wunschpreis erreicht wird.
          </p>
          <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 active:scale-95 sm:mt-6 sm:px-6 sm:py-3 sm:text-sm">
            Jetzt starten
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Sources bar */}
      {/* ----------------------------------------------------------------- */}
      <div className="border-t border-gray-100 bg-white py-3 sm:py-4">
        <p className="text-center text-[10px] text-gray-400 sm:text-[11px]">
          {t(lang, "poweredBy")}: Amazon.de &middot; Galaxus &middot; Zalando
        </p>
      </div>
    </div>
  );
}
