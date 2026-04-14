"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { PriceAlertModal } from "@/components/price-alert-modal";
import { SiteHeader } from "@/components/site-header";
import { CategorySidebar } from "@/components/category-sidebar";
import { ViewModeToggle, type ViewMode } from "@/components/view-mode-toggle";
import { HeroSearch } from "@/components/home/hero-search";
import { TopPicksRail } from "@/components/home/top-picks-rail";
import { ThematicBanners } from "@/components/home/thematic-banners";
import { PriceDropsGrid } from "@/components/home/price-drops-grid";
import { useAuth } from "@/lib/auth/auth-context";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";
import type { PriceDropProduct, ThematicShelf } from "@/lib/data";

interface HomeClientProps {
  initialProducts: MockProductWithHistory[];
  totalProducts: number;
  dynamicCategories?: { slug: string; name: string; productCount: number }[];
  stats: { shops: number; brands: number; offers: number };
  topPicks: MockProductWithHistory[];
  priceDrops: PriceDropProduct[];
  shelves: ThematicShelf[];
  trending: string[];
}

const PAGE_SIZE = 24;

const BLOG_ARTICLES = [
  { slug: "top-5-spring-scents-2026", title: "Top 5 Frühlingsdüfte 2026", excerpt: "Die angesagtesten Parfums für die warme Jahreszeit — von Dior bis Chanel.", image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=340&fit=crop", category: "Beauty" },
  { slug: "on-running-guide-schweiz", title: "On Running: Der Schweizer Guide", excerpt: "Welcher On-Schuh passt zu deinem Laufstil? Modelle im Vergleich.", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=340&fit=crop", category: "Sport" },
  { slug: "apple-iphone-2026-geruechte", title: "iPhone 2026: Was wir wissen", excerpt: "Alle Gerüchte, Leaks und Preiseinschätzungen für die Schweiz.", image: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600&h=340&fit=crop", category: "Tech" },
];

export default function HomeClient({
  initialProducts,
  totalProducts,
  dynamicCategories,
  stats,
  topPicks,
  priceDrops,
  shelves,
  trending,
}: HomeClientProps) {
  const [query, setQuery] = useState("");
  const [alertProduct, setAlertProduct] = useState<MockProductWithHistory | null>(null);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(PAGE_SIZE);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) return "list";
    return "grid";
  });
  const hasMore = offset < totalProducts;
  const { isLoggedIn, setShowAuthModal } = useAuth();
  const handleAlert = useCallback((item: MockProductWithHistory) => setAlertProduct(item), []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/list?limit=${PAGE_SIZE}&offset=${offset}`);
      const data = await res.json();
      if (data.products?.length) {
        setProducts((prev) => [...prev, ...data.products]);
        setOffset((prev) => prev + data.products.length);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [loading, hasMore, offset]);

  return (
    <div className="min-h-screen bg-white">
      {alertProduct && <PriceAlertModal item={alertProduct} onClose={() => setAlertProduct(null)} />}
      <SiteHeader query={query} onQueryChange={setQuery} allProducts={products} />

      {/* ═══ Magazine-style homepage ═══ */}
      <HeroSearch trending={trending} stats={stats} />
      <TopPicksRail items={topPicks} />
      <ThematicBanners shelves={shelves} />
      <PriceDropsGrid items={priceDrops} />

      {/* ═══ Full catalog — sidebar + grid + blog ═══ */}
      <section className="border-t border-black/5 bg-[#fafafa] py-14 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Gesamtsortiment</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Alle Angebote</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-[11px] text-gray-400 sm:inline">
                {totalProducts.toLocaleString("de-CH")} Produkte
              </span>
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>

          <div className="flex gap-6 lg:gap-8">
            <aside className="hidden w-[200px] shrink-0 lg:block">
              <div className="sticky top-[76px] rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <CategorySidebar dynamicCategories={dynamicCategories} />
              </div>
            </aside>

            <main className="min-w-0 flex-1">
              {/* Product display — respects viewMode on all screens */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-black/[0.06] bg-[#f0f0f2] sm:grid-cols-3">
                  {products.map((item) => (
                    <ProductCard key={item.product.gtin} item={item} onAlert={handleAlert} />
                  ))}
                  {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <ProductCardSkeleton key={`skel-${i}`} />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
                  {products.map((item) => (
                    <ProductCard key={item.product.gtin} item={item} onAlert={handleAlert} layout="list" />
                  ))}
                  {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <ProductCardSkeleton key={`skel-${i}`} layout="list" />
                  ))}
                </div>
              )}

              {hasMore && !loading && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={loadMore}
                    className="rounded-full border border-gray-200 bg-white px-7 py-2.5 text-[13px] font-semibold text-gray-700 transition hover:-translate-y-px hover:border-gray-300 hover:bg-gray-50"
                  >
                    Mehr Angebote laden
                  </button>
                </div>
              )}
              {!hasMore && products.length > 0 && (
                <p className="mt-8 text-center text-[11px] text-gray-400">
                  Alle {totalProducts.toLocaleString("de-CH")} Angebote geladen
                </p>
              )}
            </main>

            <aside className="hidden w-72 shrink-0 xl:block">
              <div className="sticky top-[76px] max-h-[calc(100vh-100px)] overflow-y-auto pl-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">News &amp; Trends</p>
                <div className="mt-4 space-y-5">
                  {BLOG_ARTICLES.map((article, i) => (
                    <Link key={article.slug} href={`/blog/${article.slug}`} className="group block">
                      <div className="aspect-video overflow-hidden rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={article.image} alt={article.title} width={288} height={162} loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                      </div>
                      <span className="mt-2 block text-[10px] font-semibold uppercase tracking-wider text-[#0076bd]">{article.category}</span>
                      <h3 className="mt-0.5 text-sm font-bold text-gray-900 group-hover:text-[#0076bd]">{article.title}</h3>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-gray-500">{article.excerpt}</p>
                      {i < BLOG_ARTICLES.length - 1 && <div className="mt-5 border-b border-gray-100" />}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══ CTA — "Preisalarm" ═══ */}
      <section className="bg-gray-900 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <Bell className="mx-auto h-6 w-6 text-white/60" />
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Preisalarm</h2>
          <p className="mt-2 text-sm text-gray-400">
            Erstelle einen Alarm und wir informieren dich, sobald der Preis sinkt.
          </p>
          <button
            onClick={() => {
              if (!isLoggedIn) { setShowAuthModal(true); return; }
              const first = topPicks[0] ?? priceDrops[0]?.item;
              if (first) handleAlert(first);
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D81E05] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#b91a04]"
          >
            <Bell className="h-4 w-4" /> Preisalarm erstellen
          </button>
        </div>
      </section>

      {/* Footer is in layout.tsx (global) */}
    </div>
  );
}
