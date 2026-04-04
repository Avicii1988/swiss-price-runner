"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  BarChart3,
  Zap,
  Package,
  Star,
  Flame,
  User,
  Heart,
  Bell,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { FeaturedDeal } from "@/components/featured-deal";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { PriceAlertModal } from "@/components/price-alert-modal";
import { HowWeCalculateButton } from "@/components/how-we-calculate";
import { SearchBar } from "@/components/search-bar";
import { CategoryNav } from "@/components/category-nav";
import { LanguageSwitcher, type LangCode } from "@/components/language-switcher";
import { t } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/auth-context";
import { CATEGORIES } from "@/lib/categories";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface HomeClientProps {
  allProducts: MockProductWithHistory[];
  featured: MockProductWithHistory[];
  categories: string[];
}

export default function HomeClient({ allProducts, featured, categories }: HomeClientProps) {
  const [lang, setLang] = useState<LangCode>("de");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MockProductWithHistory | null>(null);
  const [alertProduct, setAlertProduct] = useState<MockProductWithHistory | null>(null);

  const { user, isLoggedIn, setShowAuthModal, logout } = useAuth();

  const filtered = useMemo(() => {
    let items = allProducts;
    if (activeCategory) items = items.filter((p) => p.product.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((p) =>
        p.product.title.toLowerCase().includes(q) ||
        p.product.brand.toLowerCase().includes(q) ||
        p.product.gtin.includes(q),
      );
    }
    return items;
  }, [allProducts, activeCategory, query]);

  const handleSelect = useCallback((item: MockProductWithHistory) => setSelectedProduct(item), []);
  const handleAlert = useCallback((item: MockProductWithHistory) => { setSelectedProduct(null); setAlertProduct(item); }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {selectedProduct && <ProductDetailModal item={selectedProduct} onOpenAlert={handleAlert} onClose={() => setSelectedProduct(null)} />}
      {alertProduct && <PriceAlertModal item={alertProduct} onClose={() => setAlertProduct(null)} />}

      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-lg">
        {/* Top row: logo + search + auth */}
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-3 px-4 sm:h-14 sm:px-6">
          <Link href="/" className="shrink-0 text-base font-bold tracking-tight sm:text-lg">Swiss<span className="text-red-600">Price</span>Runner</Link>

          {/* Centered search — visible on desktop in header */}
          <div className="hidden flex-1 px-4 lg:block">
            <SearchBar query={query} onChange={setQuery} placeholder={t(lang, "searchPlaceholder")} buttonLabel={t(lang, "searchButton")} products={allProducts} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {isLoggedIn && user ? (
              <>
                <Link href="/account" className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300"><Heart className="h-3.5 w-3.5" /><span className="hidden sm:inline">{user.favorites.length}</span></Link>
                <Link href="/account" className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300"><Bell className="h-3.5 w-3.5" /><span className="hidden sm:inline">{user.alerts.length}</span></Link>
                <Link href="/account" className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">{user.avatarInitials}</Link>
              </>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800"><User className="h-3.5 w-3.5" /><span className="hidden sm:inline">Anmelden</span></button>
            )}
            <LanguageSwitcher current={lang} onChange={setLang} />
          </div>
        </div>
        {/* Bottom row: category nav */}
        <div className="border-t border-gray-50 bg-white">
          <div className="relative mx-auto flex max-w-7xl items-center gap-1 px-4 py-1 sm:px-6">
            <CategoryNav />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-white pb-10 pt-12 sm:pb-14 sm:pt-20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 opacity-[0.03]">
          <svg viewBox="0 0 100 100" className="h-full w-full"><rect x="35" y="10" width="30" height="80" fill="currentColor" rx="2" /><rect x="10" y="35" width="80" height="30" fill="currentColor" rx="2" /></svg>
        </div>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">{t(lang, "heroTitle")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500 sm:mt-4 sm:text-lg">{t(lang, "heroSubtitle")}</p>
          <div className="mx-auto mt-6 max-w-xl sm:mt-8">
            <SearchBar query={query} onChange={setQuery} placeholder={t(lang, "searchPlaceholder")} buttonLabel={t(lang, "searchButton")} products={allProducts} />
          </div>
          <div className="mx-auto mt-8 flex max-w-lg justify-center gap-6 text-center sm:mt-10 sm:gap-12">
            <div><p className="text-xl font-bold text-gray-900 sm:text-2xl">{allProducts.length}</p><p className="text-[10px] text-gray-400 sm:text-xs">{t(lang, "stats")}</p></div>
            <div><p className="text-xl font-bold text-gray-900 sm:text-2xl">{allProducts.length * 60}+</p><p className="text-[10px] text-gray-400 sm:text-xs">{t(lang, "statsTracked")}</p></div>
            <div><p className="text-xl font-bold text-red-600 sm:text-2xl">~12%</p><p className="text-[10px] text-gray-400 sm:text-xs">{t(lang, "statsSaved")}</p></div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-4 sm:gap-4 sm:py-6 sm:px-6">
          {([
            { icon: ShieldCheck, label: "Zoll & MwSt. berechnet" },
            { icon: BarChart3, label: "30-Tage Preisverlauf" },
            { icon: Zap, label: "Tagesaktuell" },
            { icon: Package, label: "3 Quellen verglichen" },
          ] as const).map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[10px] text-gray-600 sm:gap-2 sm:text-xs"><Icon className="h-3.5 w-3.5 shrink-0 text-red-500 sm:h-4 sm:w-4" />{label}</div>
          ))}
        </div>
      </section>

      {!query.trim() && !activeCategory && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10 sm:px-6">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Kategorien durchstöbern</h2>
          <p className="mt-1 text-xs text-gray-400 sm:text-sm">Finde die besten Schweizer Preise in jeder Kategorie</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {CATEGORIES.slice(0, 10).map((cat) => { const Icon = cat.icon; return (
              <Link key={cat.slug} href={`/category/${cat.slug}`} className="group flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-3 transition hover:border-gray-200 hover:shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition group-hover:bg-red-50 group-hover:text-red-500"><Icon className="h-4 w-4" /></div>
                <div className="min-w-0"><p className="truncate text-xs font-semibold text-gray-900">{cat.name}</p><p className="text-[10px] text-gray-400">{cat.productCount}</p></div>
                <ChevronRight className="ml-auto h-3 w-3 shrink-0 text-gray-300 group-hover:text-red-400" />
              </Link>
            ); })}
          </div>
        </section>
      )}

      {!query.trim() && !activeCategory && featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
          <div className="flex items-center gap-2"><Flame className="h-5 w-5 text-red-500" /><h2 className="text-lg font-bold text-gray-900 sm:text-xl">Top Deals Schweiz</h2></div>
          <p className="mt-1 text-xs text-gray-400 sm:text-sm">Unsere besten Preise heute — inklusive aller Importkosten</p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 lg:grid-cols-3">
            {featured.map((item) => <FeaturedDeal key={item.product.gtin} item={item} onSelect={handleSelect} onAlert={handleAlert} />)}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6" id="products">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2"><Star className="h-5 w-5 text-red-500" /><div><h2 className="text-lg font-bold text-gray-900 sm:text-xl">{t(lang, "trendingTitle")}</h2><p className="mt-0.5 text-xs text-gray-400 sm:text-sm">{t(lang, "trendingSubtitle")}</p></div></div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button onClick={() => setActiveCategory(null)} className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition sm:px-3 sm:text-xs ${!activeCategory ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{t(lang, "filterAll")}</button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)} className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition sm:px-3 sm:text-xs ${activeCategory === cat ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{cat}</button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => <ProductCard key={item.product.gtin} item={item} onSelect={handleSelect} onAlert={handleAlert} />)}
        </div>
        {filtered.length === 0 && <div className="py-20 text-center text-gray-400"><Package className="mx-auto h-8 w-8 sm:h-10 sm:w-10" /><p className="mt-3 text-xs sm:text-sm">Keine Produkte gefunden.</p></div>}
      </section>

      <section className="border-t border-gray-100 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-center text-lg font-bold text-gray-900 sm:text-xl">So funktioniert SwissPriceRunner</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:mt-10 sm:grid-cols-3 sm:gap-8">
            {[
              { step: "01", title: "Preise sammeln", desc: "Wir vergleichen Amazon.de, Galaxus und Zalando in Echtzeit." },
              { step: "02", title: "Schweizer Kosten berechnen", desc: "DE-MwSt. entfernen, EUR\u2192CHF umrechnen, CH-MwSt. & Zoll addieren." },
              { step: "03", title: "Besten Preis zeigen", desc: "Du siehst den echten Endpreis \u2014 keine versteckten Kosten." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-600">{step}</div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center"><HowWeCalculateButton /></div>
        </div>
      </section>

      <section className="bg-gray-900 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-lg font-bold text-white sm:text-2xl">Preisalarm einrichten</h2>
          <p className="mt-2 text-xs text-gray-400 sm:text-sm">Wir benachrichtigen dich, sobald dein Wunschpreis erreicht wird.</p>
          <button onClick={() => { if (!isLoggedIn) { setShowAuthModal(true); return; } if (featured.length > 0) handleAlert(featured[0]); }} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 active:scale-95 sm:mt-6 sm:px-6 sm:py-3 sm:text-sm"><Bell className="h-4 w-4" />Jetzt Alarm einrichten</button>
        </div>
      </section>

      <div className="border-t border-gray-100 bg-white py-3 sm:py-4">
        <p className="text-center text-[10px] text-gray-400 sm:text-[11px]">{t(lang, "poweredBy")}: Amazon.de &middot; Galaxus &middot; Zalando</p>
      </div>
    </div>
  );
}
