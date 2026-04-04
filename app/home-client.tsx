"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Camera,
  X,
  Menu,
  Package,
  User,
  Heart,
  ShoppingCart,
  ChevronRight,
  Bell,
  Clock,
  TrendingDown,
  Flame,
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

// Galaxus sidebar groupings
const SIDEBAR_ITEMS = [
  { label: "IT + Multimedia", slugs: ["smartphones", "laptops", "kopfhoerer", "foto", "tv-audio"] },
  { label: "Haushalt", slugs: ["haushalt"] },
  { label: "Sport + Freizeit", slugs: ["sport"] },
  { label: "Mode + Schuhe", slugs: ["schuhe", "mode"] },
  { label: "Beauty + Wellness", slugs: ["beauty"] },
  { label: "Gaming + Spielzeug", slugs: ["gaming"] },
  { label: "Uhren + Schmuck", slugs: ["uhren"] },
  { label: "Baby + Kind", slugs: ["baby"] },
  { label: "Bücher + Medien", slugs: ["buecher"] },
];

export default function HomeClient({ allProducts, featured, categories }: HomeClientProps) {
  const [lang, setLang] = useState<LangCode>("de");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MockProductWithHistory | null>(null);
  const [alertProduct, setAlertProduct] = useState<MockProductWithHistory | null>(null);
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Pick best Tagesangebot from featured
  const tagesangebot = featured[0];
  const tagesangebotDiscount = tagesangebot && tagesangebot.avgChf30d > 0 && tagesangebot.bestPrice.totalChf < tagesangebot.avgChf30d
    ? Math.round(((tagesangebot.avgChf30d - tagesangebot.bestPrice.totalChf) / tagesangebot.avgChf30d) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {selectedProduct && <ProductDetailModal item={selectedProduct} onOpenAlert={handleAlert} onClose={() => setSelectedProduct(null)} />}
      {alertProduct && <PriceAlertModal item={alertProduct} onClose={() => setAlertProduct(null)} />}

      {/* KI-Bildsuche Modal */}
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
              <span className="text-base font-bold">Menü</span>
              <button onClick={() => setMobileMenuOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="overflow-y-auto p-2">
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveCategory(item.slugs[0]);
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
              <div className="my-2 border-t border-gray-100" />
              <button
                onClick={() => { setActiveCategory(null); setMobileMenuOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <Flame className="h-4 w-4" /> Alle Produkte
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ═══ RAINBOW BAR ═══ */}
      <div className="rainbow-bar sticky top-0 z-50" />

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-[5px] z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-3 sm:h-16 sm:gap-5 sm:px-6">
          {/* Mobile menu */}
          <button onClick={() => setMobileMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 lg:hidden">
            <Menu className="h-5 w-5 text-gray-700" />
          </button>

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <span className="text-lg font-extrabold tracking-tight sm:text-xl">
              Swiss<span className="text-red-600">Price</span>Runner
            </span>
          </Link>

          {/* Search — rainbow border on focus */}
          <div className="search-rainbow-border z-10 flex-1">
            <div className="flex items-center rounded-full border-2 border-gray-200 bg-white focus-within:border-transparent">
              <Search className="ml-3 h-4 w-4 shrink-0 text-gray-400 sm:ml-4 sm:h-5 sm:w-5" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Produkt, Marke oder Kategorie suchen..."
                className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-gray-400 sm:px-3 sm:py-3 sm:text-base"
              />
              <button
                onClick={() => setShowVisionModal(true)}
                className="mr-1 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-blue-600 sm:mr-2 sm:h-9 sm:w-9"
                title="KI-Bildsuche"
              >
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          {/* Right icons */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {isLoggedIn && user ? (
              <>
                <Link href="/account" className="hidden h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 sm:flex"><Heart className="h-5 w-5" /></Link>
                <Link href="/account" className="hidden h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 sm:flex"><Bell className="h-5 w-5" /></Link>
                <Link href="/account" className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">{user.avatarInitials}</Link>
              </>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2 sm:text-sm sm:font-medium">
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">Anmelden</span>
              </button>
            )}
            <LanguageSwitcher current={lang} onChange={setLang} />
            <button className="hidden h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 sm:flex">
              <ShoppingCart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT — 3 Column Desktop ═══ */}
      <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex gap-5">
          {/* ── LEFT SIDEBAR (desktop only) ── */}
          <aside className="hidden w-52 shrink-0 lg:block">
            <div className="rounded-xl bg-white">
              <nav className="py-1">
                {SIDEBAR_ITEMS.map((item, i) => (
                  <div key={item.label}>
                    <button
                      onClick={() => setActiveCategory(item.slugs[0])}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-[13px] transition hover:bg-gray-50 ${
                        item.slugs.includes(activeCategory ?? "") ? "font-semibold text-blue-600" : "text-gray-700"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                    {i < SIDEBAR_ITEMS.length - 1 && <div className="mx-4 border-t border-gray-100" />}
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── CENTER CONTENT ── */}
          <main className="min-w-0 flex-1">
            {/* Hero / Featured Story — Galaxus "Hintergrund-Story" */}
            {!query.trim() && !activeCategory && featured.length > 1 && (
              <Link href={`/product/${featured[1].product.gtin}`} className="group mb-5 block overflow-hidden rounded-xl bg-white">
                <div className="flex flex-col sm:flex-row">
                  <div className="flex items-center justify-center bg-gray-50 p-6 sm:w-80 sm:p-10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={featured[1].product.imageUrl} alt={featured[1].product.title} width={240} height={240} className="h-40 w-40 object-contain transition-transform group-hover:scale-105 sm:h-52 sm:w-52" />
                  </div>
                  <div className="flex flex-1 flex-col justify-center p-5 sm:p-8">
                    <span className="mb-2 inline-block w-fit rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">Hintergrund-Story</span>
                    <h2 className="text-lg font-bold text-gray-900 sm:text-2xl">{featured[1].product.title}</h2>
                    <p className="mt-2 text-sm text-gray-500">
                      {featured[1].product.brand} – Jetzt ab <strong>CHF {featured[1].bestPrice.totalChf.toFixed(2)}</strong> inkl. Schweizer Zoll und MwSt. Im Preisvergleich über 3 Quellen.
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition group-hover:gap-2">
                      Jetzt vergleichen <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Product Grid */}
            {(query.trim() || activeCategory) && (
              <div className="mb-4 flex items-center gap-2">
                <button onClick={() => { setActiveCategory(null); setQuery(""); }} className="text-xs text-gray-400 hover:text-gray-600">Alle</button>
                <ChevronRight className="h-3 w-3 text-gray-300" />
                <span className="text-xs font-semibold text-gray-900">
                  {activeCategory ? CATEGORIES.find((c) => c.slug === activeCategory)?.name ?? activeCategory : `"${query}"`}
                </span>
                <span className="text-xs text-gray-400">({filtered.length})</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.slice(0, query.trim() || activeCategory ? 40 : 12).map((item) => (
                <ProductCard key={item.product.gtin} item={item} onSelect={handleSelect} onAlert={handleAlert} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="rounded-xl bg-white py-20 text-center">
                <Package className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-400">Keine Produkte gefunden.</p>
              </div>
            )}

            {!query.trim() && !activeCategory && filtered.length > 12 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setActiveCategory(null)}
                  className="rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300"
                >
                  Alle {allProducts.length} Produkte anzeigen
                </button>
              </div>
            )}
          </main>

          {/* ── RIGHT SIDEBAR: Tagesangebot (desktop only) ── */}
          {!query.trim() && !activeCategory && tagesangebot && (
            <aside className="hidden w-64 shrink-0 xl:block">
              <div className="rounded-xl bg-white p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600">Tagesangebot</span>
                </div>

                <Link href={`/product/${tagesangebot.product.gtin}`} className="group mt-3 block">
                  <div className="flex items-center justify-center rounded-lg bg-gray-50 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tagesangebot.product.imageUrl} alt={tagesangebot.product.title} width={180} height={180} className="h-36 w-36 object-contain transition-transform group-hover:scale-105" />
                  </div>

                  <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-gray-900">{tagesangebot.product.title}</h3>
                  <p className="mt-1 text-xs text-gray-400">{tagesangebot.product.brand}</p>

                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-xl font-bold text-gray-900">CHF {tagesangebot.bestPrice.totalChf.toFixed(2)}</span>
                    {tagesangebotDiscount >= 3 && (
                      <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">-{tagesangebotDiscount}%</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[10px] text-gray-400">{tagesangebot.bestSource} · inkl. Zoll + MwSt.</p>
                </Link>

                {/* Stock bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Noch 36 von 150 Stück</span>
                    <span className="font-semibold text-red-600">24%</span>
                  </div>
                  <div className="stock-bar mt-1">
                    <div className="stock-bar-fill" style={{ width: "24%" }} />
                  </div>
                </div>

                <button
                  onClick={() => handleAlert(tagesangebot)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700"
                >
                  <Bell className="h-3.5 w-3.5" />
                  Preisalarm
                </button>
              </div>

              {/* Quick links */}
              <div className="mt-4 rounded-xl bg-white p-4">
                <p className="text-xs font-bold text-gray-700">Beliebte Kategorien</p>
                <div className="mt-2 space-y-1">
                  {["smartphones", "mode", "gaming", "kopfhoerer", "haushalt"].map((slug) => {
                    const cat = CATEGORIES.find((c) => c.slug === slug);
                    if (!cat) return null;
                    return (
                      <button key={slug} onClick={() => setActiveCategory(slug)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50">
                        <span>{cat.name}</span>
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
