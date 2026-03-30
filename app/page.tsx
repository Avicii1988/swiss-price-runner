"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ShieldCheck,
  BarChart3,
  Zap,
  Package,
  ArrowRight,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { LanguageSwitcher, type LangCode } from "@/components/language-switcher";
import { t } from "@/lib/i18n";
import {
  getMockProducts,
  getCategories,
} from "@/lib/integrations/mock-service";

export default function HomePage() {
  const [lang, setLang] = useState<LangCode>("de");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const allProducts = useMemo(() => getMockProducts(), []);
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

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* ----------------------------------------------------------------- */}
      {/* Nav */}
      {/* ----------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">
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
      <section className="relative overflow-hidden bg-white pb-12 pt-16 sm:pt-24">
        {/* Swiss cross watermark */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 opacity-[0.03]">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <rect x="35" y="10" width="30" height="80" fill="currentColor" rx="2" />
            <rect x="10" y="35" width="80" height="30" fill="currentColor" rx="2" />
          </svg>
        </div>

        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            {t(lang, "heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-500 sm:text-lg">
            {t(lang, "heroSubtitle")}
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-md focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10">
              <Search className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(lang, "searchPlaceholder")}
                className="flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
              />
              <button className="shrink-0 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95">
                {t(lang, "searchButton")}
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mx-auto mt-10 flex max-w-lg justify-center gap-8 text-center sm:gap-12">
            <div>
              <p className="text-2xl font-bold text-gray-900">10+</p>
              <p className="text-xs text-gray-400">{t(lang, "stats")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">900+</p>
              <p className="text-xs text-gray-400">{t(lang, "statsTracked")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">~12%</p>
              <p className="text-xs text-gray-400">{t(lang, "statsSaved")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* USP bar */}
      {/* ----------------------------------------------------------------- */}
      <section className="border-y border-gray-100 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4 sm:px-6">
          {[
            { icon: ShieldCheck, label: "Zoll & MwSt. berechnet" },
            { icon: BarChart3, label: "30-Tage Preisverlauf" },
            { icon: Zap, label: "Tagesaktuell" },
            { icon: Package, label: "3 Quellen verglichen" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
              <Icon className="h-4 w-4 text-red-500" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Products */}
      {/* ----------------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {t(lang, "trendingTitle")}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              {t(lang, "trendingSubtitle")}
            </p>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
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
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
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
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <ProductCard key={item.product.gtin} item={item} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <Package className="mx-auto h-10 w-10" />
            <p className="mt-3 text-sm">Keine Produkte gefunden.</p>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* How it works */}
      {/* ----------------------------------------------------------------- */}
      <section className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-bold text-gray-900">
            So funktioniert SwissPriceRunner
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Preise sammeln",
                desc: "Wir vergleichen Amazon.de, Galaxus und Zalando in Echtzeit.",
              },
              {
                step: "02",
                title: "Schweizer Kosten berechnen",
                desc: "DE-MwSt. entfernen, EUR→CHF umrechnen, CH-MwSt. & Zoll addieren.",
              },
              {
                step: "03",
                title: "Besten Preis zeigen",
                desc: "Du siehst den echten Endpreis — keine versteckten Kosten.",
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
      <section className="bg-gray-900 py-14">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Preisalarm einrichten
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Wir benachrichtigen dich, sobald dein Wunschpreis erreicht wird.
          </p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95">
            Jetzt starten
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Footer */}
      {/* ----------------------------------------------------------------- */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-gray-900">
                Swiss<span className="text-red-600">Price</span>Runner
              </span>
              <span className="text-xs text-gray-400">
                &copy; {new Date().getFullYear()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-gray-400">
              <span>{t(lang, "poweredBy")}: Amazon.de, Galaxus, Zalando</span>
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] text-gray-300">
            {t(lang, "footerDisclaimer")}
          </p>
        </div>
      </footer>
    </div>
  );
}
