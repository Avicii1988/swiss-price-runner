"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  Star,
  Flame,
  User,
  Heart,
  Bell,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { FeaturedDeal } from "@/components/featured-deal";
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

  const activeCatName = CATEGORIES.find((c) => c.slug === activeCategory)?.name;

  return (
    <div className="min-h-screen bg-white">
      {selectedProduct && <ProductDetailModal item={selectedProduct} onOpenAlert={handleAlert} onClose={() => setSelectedProduct(null)} />}
      {alertProduct && <PriceAlertModal item={alertProduct} onClose={() => setAlertProduct(null)} />}

      {/* ── Minimal Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-extrabold tracking-tight sm:text-xl">
            Swiss<span className="text-red-600">Price</span>Runner
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn && user ? (
              <>
                <Link href="/account" className="flex items-center gap-1.5 text-sm text-gray-600 transition hover:text-gray-900">
                  <Heart className="h-4 w-4" />
                </Link>
                <Link href="/account" className="flex items-center gap-1.5 text-sm text-gray-600 transition hover:text-gray-900">
                  <Bell className="h-4 w-4" />
                </Link>
                <Link href="/account" className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                  {user.avatarInitials}
                </Link>
              </>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800">
                <User className="h-4 w-4" />
                Anmelden
              </button>
            )}
            <LanguageSwitcher current={lang} onChange={setLang} />
          </div>
        </div>
      </header>

      {/* ── Two-Column Layout ──────────────────────────────────────── */}
      <div className="mx-auto flex max-w-[1400px] gap-0">
        {/* ── LEFT: Category Sidebar ─────────────────────────────── */}
        <aside className="hidden w-60 shrink-0 border-r border-gray-100 bg-[#fafafa] lg:block">
          <nav className="sticky top-14 max-h-[calc(100vh-56px)] overflow-y-auto p-4">
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Kategorien
            </p>
            <ul className="space-y-0.5">
              <li>
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                    !activeCategory ? "bg-white font-semibold text-gray-900 shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900"
                  }`}
                >
                  <Star className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="flex-1">Alle Produkte</span>
                  <span className="text-[10px] text-gray-400">{allProducts.length}</span>
                </button>
              </li>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.slug;
                const count = allProducts.filter((p) => p.product.category === cat.slug).length;
                if (count === 0 && !isActive) return null;
                return (
                  <li key={cat.slug}>
                    <button
                      onClick={() => setActiveCategory(isActive ? null : cat.slug)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                        isActive ? "bg-white font-semibold text-gray-900 shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-red-500" : "text-gray-400"}`} />
                      <span className="flex-1">{cat.name}</span>
                      <span className="text-[10px] text-gray-400">{count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Sidebar links */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Service
              </p>
              <ul className="space-y-1 text-sm text-gray-500">
                <li><Link href="/impressum" className="block rounded-lg px-3 py-1.5 transition hover:bg-white hover:text-gray-900">Über uns</Link></li>
                <li><Link href="/impressum" className="block rounded-lg px-3 py-1.5 transition hover:bg-white hover:text-gray-900">Impressum</Link></li>
                <li><Link href="/privacy" className="block rounded-lg px-3 py-1.5 transition hover:bg-white hover:text-gray-900">Datenschutz</Link></li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* ── RIGHT: Main Content ────────────────────────────────── */}
        <main className="min-w-0 flex-1">
          {/* Search bar */}
          <div className="border-b border-gray-100 bg-[#fafafa] px-4 py-4 sm:px-6">
            <div className="mx-auto max-w-2xl">
              <SearchBar query={query} onChange={setQuery} placeholder={t(lang, "searchPlaceholder")} buttonLabel={t(lang, "searchButton")} products={allProducts} />
            </div>
          </div>

          {/* Mobile category pills */}
          <div className="flex gap-2 overflow-x-auto border-b border-gray-100 bg-white px-4 py-3 lg:hidden">
            <button onClick={() => setActiveCategory(null)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${!activeCategory ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>Alle</button>
            {categories.map((cat) => {
              const label = CATEGORIES.find((c) => c.slug === cat)?.name ?? cat;
              return (
                <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${activeCategory === cat ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>{label}</button>
              );
            })}
          </div>

          {/* Top Deals */}
          {!query.trim() && !activeCategory && featured.length > 0 && (
            <section className="border-b border-gray-100 bg-white px-4 py-8 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-red-500" />
                  <h2 className="text-lg font-bold text-gray-900">Top Deals</h2>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {featured.map((item) => <FeaturedDeal key={item.product.gtin} item={item} onSelect={handleSelect} onAlert={handleAlert} />)}
              </div>
            </section>
          )}

          {/* Product Grid */}
          <section className="px-4 py-6 sm:px-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">
                {activeCatName ?? t(lang, "trendingTitle")}
                <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((item) => <ProductCard key={item.product.gtin} item={item} onSelect={handleSelect} onAlert={handleAlert} />)}
            </div>
            {filtered.length === 0 && (
              <div className="py-20 text-center text-gray-400">
                <Package className="mx-auto h-10 w-10" />
                <p className="mt-3 text-sm">Keine Produkte gefunden.</p>
              </div>
            )}
          </section>

          {/* CTA */}
          <section className="bg-gray-900 px-4 py-10 sm:px-6">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-lg font-bold text-white sm:text-xl">Preisalarm einrichten</h2>
              <p className="mt-2 text-xs text-gray-400 sm:text-sm">Wir benachrichtigen dich, sobald dein Wunschpreis erreicht wird.</p>
              <button onClick={() => { if (!isLoggedIn) { setShowAuthModal(true); return; } if (featured.length > 0) handleAlert(featured[0]); }} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
                <Bell className="h-4 w-4" /> Jetzt Alarm einrichten
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
