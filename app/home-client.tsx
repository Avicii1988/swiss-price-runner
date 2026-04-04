"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Camera,
  X,
  Menu,
  Package,
  User,
  HelpCircle,
  ShoppingCart,
  ChevronRight,
  Bell,
  ArrowRight,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { PriceAlertModal } from "@/components/price-alert-modal";
import { useAuth } from "@/lib/auth/auth-context";
import { CATEGORIES } from "@/lib/categories";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface HomeClientProps {
  allProducts: MockProductWithHistory[];
  featured: MockProductWithHistory[];
  categories: string[];
}

const SIDEBAR_ITEMS = [
  { label: "IT + Multimedia", slugs: ["smartphones", "laptops", "kopfhoerer", "foto", "tv-audio"] },
  { label: "Haushalt", slugs: ["haushalt"] },
  { label: "Wohnen", slugs: [] },
  { label: "Sport", slugs: ["sport"] },
  { label: "Mode", slugs: ["schuhe", "mode"] },
  { label: "Spielzeug", slugs: ["gaming"] },
  { label: "Baby + Eltern", slugs: ["baby"] },
  { label: "Beauty + Gesundheit", slugs: ["beauty"] },
  { label: "Uhren + Schmuck", slugs: ["uhren"] },
  { label: "Bücher", slugs: ["buecher"] },
];

export default function HomeClient({ allProducts, featured, categories }: HomeClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MockProductWithHistory | null>(null);
  const [alertProduct, setAlertProduct] = useState<MockProductWithHistory | null>(null);
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { user, isLoggedIn, setShowAuthModal } = useAuth();

  // Close search dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

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

  // Live search suggestions
  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return allProducts.filter((p) =>
      p.product.title.toLowerCase().includes(q) ||
      p.product.brand.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [query, allProducts]);

  const handleSelect = useCallback((item: MockProductWithHistory) => setSelectedProduct(item), []);
  const handleAlert = useCallback((item: MockProductWithHistory) => { setSelectedProduct(null); setAlertProduct(item); }, []);

  const tagesangebot = featured[0];
  const heroProduct = featured.length > 1 ? featured[1] : featured[0];

  const showDropdown = searchFocused && query.length >= 2;

  return (
    <div className="min-h-screen bg-white">
      {selectedProduct && <ProductDetailModal item={selectedProduct} onOpenAlert={handleAlert} onClose={() => setSelectedProduct(null)} />}
      {alertProduct && <PriceAlertModal item={alertProduct} onClose={() => setAlertProduct(null)} />}

      {/* KI-Bildsuche Modal */}
      {showVisionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowVisionModal(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <Camera className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-3 text-lg font-bold text-gray-900">KI-Bildsuche</h3>
            <span className="mt-1 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-blue-700">Beta</span>
            <p className="mt-3 text-sm text-gray-500">Foto hochladen und Preise vergleichen.</p>
            <button className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white">Foto auswählen</button>
            <button onClick={() => setShowVisionModal(false)} className="mt-2 text-xs text-gray-400">Abbrechen</button>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
              <span className="text-base font-bold">Menü</span>
              <button onClick={() => setMobileMenuOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <nav className="overflow-y-auto p-2">
              {SIDEBAR_ITEMS.map((item) => (
                <button key={item.label} onClick={() => { setActiveCategory(item.slugs[0] ?? null); setMobileMenuOpen(false); }}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                  <span>{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ═══ RAINBOW BAR ═══ */}
      <div className="rainbow-bar sticky top-0 z-50" />

      {/* ═══ HEADER — Row 1: Logo + icons ═══ */}
      <header className="sticky top-[5px] z-40 bg-white">
        {/* Desktop: single row. Mobile: two rows */}
        <div className="mx-auto max-w-[1400px]">
          {/* Top row */}
          <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
            <Link href="/" className="shrink-0 text-xl font-black tracking-tight sm:text-2xl">
              SWISS<span className="text-red-600">PRICE</span>
            </Link>

            {/* Desktop search */}
            <div ref={searchRef} className="relative hidden flex-1 lg:block">
              <div className="search-rainbow-border">
                <div className="flex items-center rounded-full border border-gray-300 bg-white focus-within:border-transparent">
                  <Search className="ml-4 h-5 w-5 text-gray-400" />
                  <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setSearchFocused(true)}
                    placeholder="Wonach suchst du?" className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base outline-none placeholder:text-gray-400" />
                  <button onClick={() => setShowVisionModal(true)} className="mr-2 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Live search dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-gray-200 bg-white shadow-xl">
                  {suggestions.map((item) => (
                    <Link key={item.product.gtin} href={`/product/${item.product.gtin}`} onClick={() => { setSearchFocused(false); setQuery(""); }}
                      className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.product.imageUrl} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg bg-gray-50 object-contain" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-gray-900">{item.product.title}</p>
                        <p className="text-xs text-gray-400">{item.product.brand}</p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-gray-900">CHF {item.bestPrice.totalChf.toFixed(2)}</span>
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 px-4 py-2">
                    <button onClick={() => setSearchFocused(false)} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                      Alle Ergebnisse anzeigen <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
              {showDropdown && suggestions.length === 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-xl">
                  <p className="text-sm text-gray-500">Keine Ergebnisse für &ldquo;{query}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Right icons */}
            <div className="ml-auto flex items-center gap-1">
              {isLoggedIn && user ? (
                <Link href="/account" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100">
                  <User className="h-5 w-5" />
                </Link>
              ) : (
                <>
                  <button onClick={() => setShowAuthModal(true)} className="hidden items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 lg:flex">
                    Anmelden
                  </button>
                  <button onClick={() => setShowAuthModal(true)} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 lg:hidden">
                    <User className="h-5 w-5" />
                  </button>
                </>
              )}
              <button className="hidden h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 sm:flex">
                <HelpCircle className="h-5 w-5" />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100">
                <ShoppingCart className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile: second row with ☰ Menü + search */}
          <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-2 lg:hidden">
            <button onClick={() => setMobileMenuOpen(true)} className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-gray-700">
              <Menu className="h-5 w-5" /> Menü
            </button>
            <div ref={searchRef} className="relative flex-1">
              <div className="flex items-center rounded-full border border-gray-300 bg-white">
                <Search className="ml-3 h-4 w-4 text-gray-400" />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setSearchFocused(true)}
                  placeholder="Suche" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base outline-none placeholder:text-gray-400" />
                <button onClick={() => setShowVisionModal(true)} className="mr-1 flex h-7 w-7 items-center justify-center rounded-full text-gray-400">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              {/* Mobile search dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-gray-200 bg-white shadow-xl">
                  {suggestions.map((item) => (
                    <Link key={item.product.gtin} href={`/product/${item.product.gtin}`} onClick={() => { setSearchFocused(false); setQuery(""); }}
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.product.imageUrl} alt="" width={32} height={32} className="h-8 w-8 rounded object-contain bg-gray-50" />
                      <span className="flex-1 truncate text-gray-900">{item.product.title}</span>
                      <span className="shrink-0 font-bold">CHF {item.bestPrice.totalChf.toFixed(0)}</span>
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 px-3 py-2">
                    <button onClick={() => setSearchFocused(false)} className="text-xs font-medium text-blue-600">Alle Ergebnisse →</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="border-b border-gray-200" />
      </header>

      {/* ═══ MAIN — 3 Columns ═══ */}
      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex gap-6">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="hidden w-44 shrink-0 lg:block">
            <nav>
              {SIDEBAR_ITEMS.map((item, i) => (
                <div key={item.label}>
                  <button onClick={() => setActiveCategory(item.slugs[0] ?? null)}
                    className={`w-full py-2.5 text-left text-[14px] transition hover:text-black ${
                      item.slugs.includes(activeCategory ?? "") ? "font-semibold text-black" : "text-gray-600"
                    }`}>
                    {item.label}
                  </button>
                  {i < SIDEBAR_ITEMS.length - 1 && <div className="border-t border-gray-200" />}
                </div>
              ))}
            </nav>
          </aside>

          {/* ── CENTER ── */}
          <main className="min-w-0 flex-1">
            {/* Hero */}
            {!query.trim() && !activeCategory && heroProduct && (
              <div className="mb-6">
                <h2 className="mb-3 text-lg font-bold text-gray-900">Hintergrund</h2>
                <Link href={`/product/${heroProduct.product.gtin}`} className="group block overflow-hidden rounded-xl bg-gray-100">
                  <div className="flex items-center justify-center p-8 sm:p-12">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroProduct.product.imageUrl} alt={heroProduct.product.title} width={300} height={300}
                      className="h-48 w-48 object-contain transition-transform group-hover:scale-105 sm:h-64 sm:w-64" />
                  </div>
                </Link>
                <h3 className="mt-3 text-base font-bold text-gray-900 sm:text-lg">{heroProduct.product.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{heroProduct.product.brand} · Ab CHF {heroProduct.bestPrice.totalChf.toFixed(2)}</p>
              </div>
            )}

            {/* Breadcrumb when filtered */}
            {(query.trim() || activeCategory) && (
              <div className="mb-4 flex items-center gap-2 text-xs">
                <button onClick={() => { setActiveCategory(null); setQuery(""); }} className="text-gray-400 hover:text-gray-600">Alle</button>
                <ChevronRight className="h-3 w-3 text-gray-300" />
                <span className="font-semibold text-gray-900">
                  {activeCategory ? CATEGORIES.find((c) => c.slug === activeCategory)?.name : `"${query}"`}
                </span>
                <span className="text-gray-400">({filtered.length})</span>
              </div>
            )}

            {/* Product Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {filtered.slice(0, query.trim() || activeCategory ? 40 : 12).map((item) => (
                <ProductCard key={item.product.gtin} item={item} onSelect={handleSelect} onAlert={handleAlert} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="py-20 text-center"><Package className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 text-sm text-gray-400">Keine Produkte gefunden.</p></div>
            )}

            {!query.trim() && !activeCategory && filtered.length > 12 && (
              <div className="mt-6 text-center">
                <button onClick={() => setActiveCategory(null)} className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Alle {allProducts.length} Produkte anzeigen
                </button>
              </div>
            )}
          </main>

          {/* ── RIGHT SIDEBAR: Tagesangebot ── */}
          {!query.trim() && !activeCategory && tagesangebot && (
            <aside className="hidden w-72 shrink-0 xl:block">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">SwissPrice Tagesangebot</h2>
                <span className="rounded border border-gray-300 px-2 py-0.5 text-xs font-bold text-gray-600">
                  {new Date().getDate()} {["JAN","FEB","MÄR","APR","MAI","JUN","JUL","AUG","SEP","OKT","NOV","DEZ"][new Date().getMonth()]}
                </span>
              </div>

              <Link href={`/product/${tagesangebot.product.gtin}`} className="group mt-3 block">
                <div className="flex items-center justify-center rounded-xl bg-gray-50 p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tagesangebot.product.imageUrl} alt={tagesangebot.product.title} width={200} height={200}
                    className="h-44 w-44 object-contain transition-transform group-hover:scale-105" />
                </div>

                <div className="mt-3">
                  <p className="text-[11px] text-gray-500">
                    <strong className="text-gray-900">noch 36</strong> von 150 Stück
                  </p>
                  <div className="stock-bar mt-1"><div className="stock-bar-fill" style={{ width: "24%" }} /></div>
                </div>

                <p className="mt-3 text-xs text-blue-600">{tagesangebot.product.category}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">{tagesangebot.bestPrice.totalChf.toFixed(0)}.–</span>
                  <span className="text-sm text-gray-400 line-through">{Math.round(tagesangebot.avgChf30d)}.–</span>
                </div>
                <h3 className="mt-1 text-sm font-bold text-gray-900">{tagesangebot.product.brand} {tagesangebot.product.title.split(" ").slice(-2).join(" ")}</h3>
                <p className="text-xs text-gray-400">{tagesangebot.product.title}</p>
              </Link>

              <Link href="/" className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                Alle Angebote anzeigen <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
