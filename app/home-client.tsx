"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Camera,
  X,
  Package,
  User,
  Heart,
  Bell,
  ChevronRight,
  Flame,
  TrendingDown,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { PriceAlertModal } from "@/components/price-alert-modal";
import { SearchBar } from "@/components/search-bar";
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
  const [showVisionModal, setShowVisionModal] = useState(false);

  const { user, isLoggedIn, setShowAuthModal } = useAuth();

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

  const activeCatObj = CATEGORIES.find((c) => c.slug === activeCategory);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {selectedProduct && <ProductDetailModal item={selectedProduct} onOpenAlert={handleAlert} onClose={() => setSelectedProduct(null)} />}
      {alertProduct && <PriceAlertModal item={alertProduct} onClose={() => setAlertProduct(null)} />}

      {/* Vision Search Modal */}
      {showVisionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowVisionModal(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Camera className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-gray-900">KI-Bildsuche</h3>
            <span className="mt-1 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-blue-700">Beta</span>
            <p className="mt-3 text-sm text-gray-500">Foto hochladen und Preise vergleichen. Unsere KI erkennt das Produkt und findet den besten Schweizer Preis.</p>
            <button className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">Foto auswählen</button>
            <button onClick={() => setShowVisionModal(false)} className="mt-2 text-xs text-gray-400 hover:text-gray-600">Abbrechen</button>
          </div>
        </div>
      )}

      {/* ── Rainbow bar ──────────────────────────────────────────── */}
      <div className="rainbow-bar" />

      {/* ── Sticky Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:h-[72px] sm:gap-6 sm:px-6">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <span className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Swiss<span className="text-red-600">Price</span>Runner
            </span>
          </Link>

          {/* Wide search bar — Galaxus style */}
          <div className="relative flex-1">
            <div className="flex items-center rounded-full border-2 border-gray-200 bg-white transition focus-within:border-blue-500 focus-within:shadow-md">
              <Search className="ml-4 h-5 w-5 shrink-0 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Produkt, Marke oder Kategorie suchen..."
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none placeholder:text-gray-400"
              />
              <button
                onClick={() => setShowVisionModal(true)}
                className="mr-1 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                title="KI-Bildsuche"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Right icons */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {isLoggedIn && user ? (
              <>
                <Link href="/account" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"><Heart className="h-5 w-5" /></Link>
                <Link href="/account" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"><Bell className="h-5 w-5" /></Link>
                <Link href="/account" className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">{user.avatarInitials}</Link>
              </>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Anmelden</span>
              </button>
            )}
            <LanguageSwitcher current={lang} onChange={setLang} />
          </div>
        </div>
      </header>

      {/* ── Category Tiles ───────────────────────────────────────── */}
      {!query.trim() && !activeCategory && (
        <section className="bg-white">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
              {CATEGORIES.slice(0, 14).map((cat) => {
                const Icon = cat.icon;
                const count = allProducts.filter((p) => p.product.category === cat.slug).length;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => setActiveCategory(cat.slug)}
                    className="group flex flex-col items-center gap-2 rounded-xl p-3 transition hover:bg-gray-50 sm:p-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 transition group-hover:bg-red-50 group-hover:text-red-500 sm:h-14 sm:w-14">
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-semibold text-gray-900 sm:text-xs">{cat.name}</p>
                      {count > 0 && <p className="text-[9px] text-gray-400 sm:text-[10px]">{count} Produkte</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Active category header */}
      {activeCategory && activeCatObj && (
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
            <button onClick={() => setActiveCategory(null)} className="text-xs text-gray-400 hover:text-gray-600">Alle</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-xs font-semibold text-gray-900">{activeCatObj.name}</span>
            <button onClick={() => setActiveCategory(null)} className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Top Deals ────────────────────────────────────────────── */}
      {!query.trim() && !activeCategory && featured.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-[1400px] px-4 pb-6 sm:px-6">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-500" />
              <h2 className="text-base font-bold text-gray-900 sm:text-lg">Top Deals</h2>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {featured.slice(0, 5).map((item) => {
                const disc = item.avgChf30d > 0 && item.bestPrice.totalChf < item.avgChf30d
                  ? Math.round(((item.avgChf30d - item.bestPrice.totalChf) / item.avgChf30d) * 100)
                  : 0;
                return (
                  <Link key={item.product.gtin} href={`/product/${item.product.gtin}`} className="group rounded-xl border border-gray-100 bg-white p-3 transition hover:border-gray-200 hover:shadow-md sm:p-4">
                    <div className="relative">
                      {disc >= 3 && (
                        <span className="absolute left-0 top-0 rounded-br-lg rounded-tl-lg bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">-{disc}%</span>
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.product.imageUrl} alt={item.product.title} width={200} height={200} className="mx-auto h-28 w-28 object-contain transition-transform group-hover:scale-105 sm:h-32 sm:w-32" />
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-medium text-gray-900 sm:text-sm">{item.product.title}</p>
                    <p className="mt-1 text-[10px] text-gray-400">{item.product.brand}</p>
                    <div className="mt-2 flex items-end justify-between">
                      <p className="text-base font-bold text-gray-900 sm:text-lg">CHF {item.bestPrice.totalChf.toFixed(2)}</p>
                      {item.priceDrop30d > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-600">
                          <TrendingDown className="h-3 w-3" /> -{item.priceDrop30d.toFixed(0)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[9px] text-gray-400">inkl. Zoll + MwSt.</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Product Grid ─────────────────────────────────────────── */}
      <section className="bg-[#f5f5f5]">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              {activeCatObj?.name ?? "Alle Produkte"}
              <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
            </h2>
            {/* Mobile category scroll */}
            <div className="flex gap-1.5 overflow-x-auto lg:hidden">
              {categories.slice(0, 5).map((cat) => {
                const label = CATEGORIES.find((c) => c.slug === cat)?.name ?? cat;
                return (
                  <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)} className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-medium transition ${activeCategory === cat ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>{label}</button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtered.map((item) => <ProductCard key={item.product.gtin} item={item} onSelect={handleSelect} onAlert={handleAlert} />)}
          </div>
          {filtered.length === 0 && (
            <div className="py-20 text-center text-gray-400">
              <Package className="mx-auto h-10 w-10" />
              <p className="mt-3 text-sm">Keine Produkte gefunden.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="bg-gray-900 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-lg font-bold text-white sm:text-xl">Preisalarm einrichten</h2>
          <p className="mt-2 text-sm text-gray-400">Wir benachrichtigen dich, sobald dein Wunschpreis erreicht wird.</p>
          <button onClick={() => { if (!isLoggedIn) { setShowAuthModal(true); return; } if (featured.length > 0) handleAlert(featured[0]); }} className="mt-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
            <Bell className="h-4 w-4" /> Jetzt Alarm einrichten
          </button>
        </div>
      </section>
    </div>
  );
}
