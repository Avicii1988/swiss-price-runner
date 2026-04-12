"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Bell, ShoppingBag, Store, Tag, Package, LayoutGrid, List as ListIcon } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { PriceAlertModal } from "@/components/price-alert-modal";
import { SiteHeader } from "@/components/site-header";
import { CategorySidebar } from "@/components/category-sidebar";
import { useAuth } from "@/lib/auth/auth-context";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface HomeClientProps {
  initialProducts: MockProductWithHistory[];
  totalProducts: number;
  featured: MockProductWithHistory[];
  categories: string[];
  dynamicCategories?: { slug: string; name: string; productCount: number }[];
  stats: { shops: number; brands: number; offers: number };
}

const PAGE_SIZE = 24;

const BLOG_ARTICLES = [
  { slug: "top-5-spring-scents-2026", title: "Top 5 Frühlingsdüfte 2026", excerpt: "Die angesagtesten Parfums für die warme Jahreszeit — von Dior bis Chanel.", image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=340&fit=crop", category: "Beauty" },
  { slug: "on-running-guide-schweiz", title: "On Running: Der Schweizer Guide", excerpt: "Welcher On-Schuh passt zu deinem Laufstil? Modelle im Vergleich.", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=340&fit=crop", category: "Sport" },
  { slug: "apple-iphone-2026-geruechte", title: "iPhone 2026: Was wir wissen", excerpt: "Alle Gerüchte, Leaks und Preiseinschätzungen für die Schweiz.", image: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600&h=340&fit=crop", category: "Tech" },
];

export default function HomeClient({ initialProducts, totalProducts, featured, dynamicCategories, stats }: HomeClientProps) {
  const [query, setQuery] = useState("");
  const [alertProduct, setAlertProduct] = useState<MockProductWithHistory | null>(null);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(PAGE_SIZE);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
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

      {/* ═══ Stats Bar — gradient with icons ═══ */}
      <div className="bg-gradient-to-r from-[#1a1f36] to-[#2d3561]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-6 px-4 py-2.5 sm:gap-10 sm:px-6">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/80">
            <Store className="h-3.5 w-3.5 text-white/50" />{stats.shops} Shops
          </span>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/80">
            <Tag className="h-3.5 w-3.5 text-white/50" />{stats.brands.toLocaleString("de-CH")} Marken
          </span>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/80">
            <Package className="h-3.5 w-3.5 text-white/50" />{stats.offers.toLocaleString("de-CH")} Angebote
          </span>
        </div>
      </div>

      {/* ═══ Main: Sidebar + Products + Blog (no banner) ═══ */}
      <div className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5 lg:px-6">
        <div className="flex gap-6 lg:gap-8">
          <aside className="hidden w-[180px] shrink-0 lg:block">
            <div className="sticky top-[120px]"><CategorySidebar dynamicCategories={dynamicCategories} /></div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <ShoppingBag className="h-4 w-4 text-gray-400" /> Alle Angebote
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-400">{totalProducts.toLocaleString("de-CH")} Produkte</span>
                {/* Grid/List toggle — visible on all screens */}
                <div className="flex overflow-hidden rounded-md border border-[#e1e1e3]">
                  <button onClick={() => setViewMode("grid")}
                    className={`flex h-7 w-8 items-center justify-center transition ${viewMode === "grid" ? "bg-gray-100 text-gray-900" : "bg-white text-gray-400 hover:text-gray-600"}`}
                    title="Raster">
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setViewMode("list")}
                    className={`flex h-7 w-8 items-center justify-center border-l border-[#e1e1e3] transition ${viewMode === "list" ? "bg-gray-100 text-gray-900" : "bg-white text-gray-400 hover:text-gray-600"}`}
                    title="Liste">
                    <ListIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product display — respects viewMode on all screens */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-px bg-[#f0f0f2] sm:grid-cols-3">
                {products.map((item) => (
                  <ProductCard key={item.product.gtin} item={item} onAlert={handleAlert} />
                ))}
                {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <ProductCardSkeleton key={`skel-${i}`} />
                ))}
              </div>
            ) : (
              <div>
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
                <button onClick={loadMore}
                  className="rounded-lg border border-[#e1e1e3] bg-white px-8 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50">
                  Mehr Angebote laden
                </button>
              </div>
            )}
            {!hasMore && products.length > 0 && (
              <p className="mt-8 text-center text-[11px] text-gray-400">Alle {totalProducts.toLocaleString("de-CH")} Angebote geladen</p>
            )}
          </main>

          <aside className="hidden w-72 shrink-0 border-l border-[#e1e1e3] pl-8 xl:block">
            <div className="sticky top-[120px] max-h-[calc(100vh-140px)] overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">News & Trends</p>
              <div className="mt-4 space-y-5">
                {BLOG_ARTICLES.map((article, i) => (
                  <Link key={article.slug} href={`/blog/${article.slug}`} className="group block">
                    <div className="aspect-video overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={article.image} alt={article.title} width={288} height={162} loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
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

      {/* ═══ CTA — "Preisalarm" ═══ */}
      <section className="border-t border-gray-200 bg-gray-900 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold text-white">Preisalarm</h2>
          <p className="mt-2 text-sm text-gray-400">Erstelle einen Alarm und wir informieren dich, sobald der Preis sinkt.</p>
          <button
            onClick={() => {
              if (!isLoggedIn) { setShowAuthModal(true); return; }
              if (featured.length > 0) handleAlert(featured[0]);
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#D81E05] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#b91a04]">
            <Bell className="h-4 w-4" /> Preisalarm erstellen
          </button>
        </div>
      </section>

      {/* Footer is in layout.tsx (global) */}
    </div>
  );
}
