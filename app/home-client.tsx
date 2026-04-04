"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Camera,
  X,
  Menu,
  Package,
  Heart,
  ShoppingCart,
  ChevronRight,
  Bell,
  ArrowRight,
  Flame,
  TrendingDown,
  Percent,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { PriceAlertModal } from "@/components/price-alert-modal";
import { LanguageSwitcher, type LangCode } from "@/components/language-switcher";
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
  { label: "Sport", slugs: ["sport"] },
  { label: "Mode", slugs: ["mode", "schuhe"] },
  { label: "Gaming + Spielzeug", slugs: ["gaming"] },
  { label: "Baby + Eltern", slugs: ["baby"] },
  { label: "Beauty + Gesundheit", slugs: ["beauty"] },
  { label: "Uhren + Schmuck", slugs: ["uhren"] },
  { label: "Bücher + Medien", slugs: ["buecher"] },
];

export default function HomeClient({ allProducts, featured }: HomeClientProps) {
  const [lang, setLang] = useState<LangCode>("de");
  const [activeSlugs, setActiveSlugs] = useState<string[] | null>(null);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MockProductWithHistory | null>(null);
  const [alertProduct, setAlertProduct] = useState<MockProductWithHistory | null>(null);
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRefDesktop = useRef<HTMLDivElement>(null);
  const searchRefMobile = useRef<HTMLDivElement>(null);

  const { user, isLoggedIn, setShowAuthModal } = useAuth();

  useEffect(() => {
    function handle(e: MouseEvent) {
      const t = e.target as Node;
      if (searchRefDesktop.current?.contains(t) || searchRefMobile.current?.contains(t)) return;
      setSearchFocused(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Filter by multiple slugs (fixes Mode = mode + schuhe)
  const filtered = useMemo(() => {
    let items = allProducts;
    if (activeSlugs && activeSlugs.length > 0) {
      items = items.filter((p) => activeSlugs.includes(p.product.category));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((p) =>
        p.product.title.toLowerCase().includes(q) ||
        p.product.brand.toLowerCase().includes(q) ||
        p.product.gtin.includes(q),
      );
    }
    return items;
  }, [allProducts, activeSlugs, query]);

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

  const selectCategory = (item: typeof SIDEBAR_ITEMS[number]) => {
    if (activeLabel === item.label) { setActiveSlugs(null); setActiveLabel(null); }
    else { setActiveSlugs(item.slugs.length > 0 ? item.slugs : null); setActiveLabel(item.label); }
  };

  const clearFilter = () => { setActiveSlugs(null); setActiveLabel(null); setQuery(""); };

  const tagesangebot = featured[0];
  const showDropdown = searchFocused && query.length >= 2;
  const totalResults = suggestions.length;

  // Search dropdown component (reused for desktop + mobile)
  const SearchDropdown = () => (
    <>
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {suggestions.map((item) => (
            <Link key={item.product.gtin} href={`/product/${item.product.gtin}`} onClick={() => { setSearchFocused(false); setQuery(""); }}
              className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.product.imageUrl} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg bg-gray-50 object-contain" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-900">{item.product.title}</p>
                <p className="text-[11px] text-gray-400">{item.product.brand}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-gray-900">CHF {item.bestPrice.totalChf.toFixed(2)}</span>
            </Link>
          ))}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <button onClick={() => setSearchFocused(false)} className="flex items-center gap-1 text-xs font-medium text-blue-600">
              Alle {totalResults} Ergebnisse anzeigen <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
      {showDropdown && suggestions.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-xl">
          <p className="text-sm text-gray-500">Keine Ergebnisse für &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </>
  );

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
            <nav className="overflow-y-auto">
              {SIDEBAR_ITEMS.map((item) => (
                <button key={item.label} onClick={() => { selectCategory(item); setMobileMenuOpen(false); }}
                  className="flex w-full items-center justify-between border-b border-gray-50 px-5 py-3.5 text-[15px] text-gray-700 transition hover:bg-gray-50">
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

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-[5px] z-40 bg-white">
        <div className="mx-auto max-w-[1400px]">
          {/* Header row: logo + search + icons */}
          <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
            <Link href="/" className="shrink-0 text-xl font-black tracking-tight sm:text-2xl">
              SWISS<span className="text-red-600">PRICE</span>
            </Link>

            {/* Desktop search */}
            <div ref={searchRefDesktop} className="relative hidden flex-1 lg:block">
              <div className="search-rainbow-border">
                <div className="flex items-center rounded-full border border-gray-300 bg-white focus-within:border-transparent">
                  <Search className="ml-4 h-4 w-4 text-gray-400" />
                  <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setSearchFocused(true)}
                    placeholder="Wonach suchst du?" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-gray-400" />
                  <button onClick={() => setShowVisionModal(true)} className="mr-1.5 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <SearchDropdown />
            </div>

            {/* Right: Anmelden + Heart + Lang + Cart */}
            <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
              {isLoggedIn && user ? (
                <Link href="/account" className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {user.name.split(" ")[0]}
                </Link>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                  Anmelden
                </button>
              )}
              <Link href="/account" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100">
                <Heart className="h-5 w-5" />
              </Link>
              <LanguageSwitcher current={lang} onChange={setLang} />
              <button className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100">
                <ShoppingCart className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-200" />
      </header>

      {/* ═══ MOBILE: ☰ Menü bar + search (full-width, below header) ═══ */}
      <div className="border-b border-gray-200 bg-white px-4 py-2 lg:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileMenuOpen(true)} className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-gray-700">
            <Menu className="h-5 w-5" /> Menü
          </button>
          <div ref={searchRefMobile} className="relative flex-1">
            <div className="flex items-center rounded-full border border-gray-300 bg-white">
              <Search className="ml-3 h-4 w-4 text-gray-400" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setSearchFocused(true)}
                placeholder="Suche" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base outline-none placeholder:text-gray-400" />
              <button onClick={() => setShowVisionModal(true)} className="mr-1 flex h-7 w-7 items-center justify-center rounded-full text-gray-400">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <SearchDropdown />
          </div>
        </div>
      </div>

      {/* ═══ MAIN — 3 Columns ═══ */}
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
        <div className="flex gap-6">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="hidden w-44 shrink-0 lg:block">
            <nav>
              {SIDEBAR_ITEMS.map((item, i) => (
                <div key={item.label}>
                  <button onClick={() => selectCategory(item)}
                    className={`w-full py-2.5 text-left text-[14px] transition hover:text-black ${
                      activeLabel === item.label ? "font-semibold text-black" : "text-gray-600"
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
            {/* Top Deals (replaces Hintergrund hero) */}
            {!query.trim() && !activeSlugs && featured.length > 0 && (
              <section className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <h2 className="text-lg font-bold text-gray-900">Top Deals</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {featured.slice(0, 4).map((item) => {
                    const disc = item.avgChf30d > 0 && item.bestPrice.totalChf < item.avgChf30d
                      ? Math.round(((item.avgChf30d - item.bestPrice.totalChf) / item.avgChf30d) * 100) : 0;
                    return (
                      <Link key={item.product.gtin} href={`/product/${item.product.gtin}`}
                        className="group relative rounded-xl border border-gray-100 bg-white p-3 transition hover:border-gray-200 hover:shadow-md sm:p-4">
                        {disc >= 2 && (
                          <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-0.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            <Percent className="h-2.5 w-2.5" /> -{disc}%
                          </span>
                        )}
                        <div className="flex items-center justify-center py-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.product.imageUrl} alt={item.product.title} width={120} height={120}
                            className="h-24 w-24 object-contain transition-transform group-hover:scale-105 sm:h-28 sm:w-28" />
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs font-medium text-gray-900 sm:text-sm">{item.product.title}</p>
                        <div className="mt-2 flex items-end justify-between">
                          <span className="text-base font-bold text-gray-900 sm:text-lg">CHF {item.bestPrice.totalChf.toFixed(2)}</span>
                          {item.priceDrop30d > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-600">
                              <TrendingDown className="h-3 w-3" /> {item.priceDrop30d.toFixed(0)}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[9px] text-gray-400">{item.bestSource} · inkl. Zoll</p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Breadcrumb */}
            {(query.trim() || activeSlugs) && (
              <div className="mb-4 flex items-center gap-2 text-xs">
                <button onClick={clearFilter} className="text-gray-400 hover:text-gray-600">Alle</button>
                <ChevronRight className="h-3 w-3 text-gray-300" />
                <span className="font-semibold text-gray-900">
                  {activeLabel ?? `"${query}"`}
                </span>
                <span className="text-gray-400">({filtered.length})</span>
                <button onClick={clearFilter} className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Product Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {filtered.slice(0, query.trim() || activeSlugs ? 40 : 12).map((item) => (
                <ProductCard key={item.product.gtin} item={item} onSelect={handleSelect} onAlert={handleAlert} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="py-20 text-center"><Package className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 text-sm text-gray-400">Keine Produkte gefunden.</p></div>
            )}

            {!query.trim() && !activeSlugs && filtered.length > 12 && (
              <div className="mt-6 text-center">
                <button onClick={() => { setActiveSlugs([]); setActiveLabel("Alle"); }}
                  className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Alle {allProducts.length} Produkte anzeigen
                </button>
              </div>
            )}
          </main>

          {/* ── RIGHT SIDEBAR: Tagesangebot ── */}
          {!query.trim() && !activeSlugs && tagesangebot && (
            <aside className="hidden w-72 shrink-0 xl:block">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Tagesangebot</h2>
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
                  <p className="text-[11px] text-gray-500"><strong className="text-gray-900">noch 36</strong> von 150 Stück</p>
                  <div className="stock-bar mt-1"><div className="stock-bar-fill" style={{ width: "24%" }} /></div>
                </div>

                <p className="mt-3 text-xs text-blue-600">{tagesangebot.product.category}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">{tagesangebot.bestPrice.totalChf.toFixed(0)}.–</span>
                  <span className="text-sm text-gray-400 line-through">{Math.round(tagesangebot.avgChf30d)}.–</span>
                </div>
                <h3 className="mt-1 text-sm font-bold text-gray-900">{tagesangebot.product.brand}</h3>
                <p className="line-clamp-2 text-xs text-gray-500">{tagesangebot.product.title}</p>
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
