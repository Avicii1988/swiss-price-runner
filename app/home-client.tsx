"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Bell, ShoppingBag } from "lucide-react";
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
  {
    slug: "top-5-spring-scents-2026",
    title: "Top 5 Frühlingsdüfte 2026",
    excerpt: "Die angesagtesten Parfums für die warme Jahreszeit — von Dior bis Chanel.",
    image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=340&fit=crop",
    category: "Beauty",
  },
  {
    slug: "on-running-guide-schweiz",
    title: "On Running: Der Schweizer Guide",
    excerpt: "Welcher On-Schuh passt zu deinem Laufstil? Modelle im Vergleich.",
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=340&fit=crop",
    category: "Sport",
  },
  {
    slug: "apple-iphone-2026-geruechte",
    title: "iPhone 2026: Was wir wissen",
    excerpt: "Alle Gerüchte, Leaks und Preiseinschätzungen für die Schweiz.",
    image: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600&h=340&fit=crop",
    category: "Tech",
  },
];

export default function HomeClient({
  initialProducts,
  totalProducts,
  featured,
  dynamicCategories,
  stats,
}: HomeClientProps) {
  const [query, setQuery] = useState("");
  const [alertProduct, setAlertProduct] = useState<MockProductWithHistory | null>(null);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(PAGE_SIZE);
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
    } catch {
      // silent
    }
    setLoading(false);
  }, [loading, hasMore, offset]);

  return (
    <div className="min-h-screen bg-white">
      {alertProduct && <PriceAlertModal item={alertProduct} onClose={() => setAlertProduct(null)} />}

      <SiteHeader query={query} onQueryChange={setQuery} allProducts={products} />

      {/* ── Elevator Pitch + Live Stats (subtle, under header) ── */}
      <div className="border-b border-[#e1e1e3] bg-[#f8f8fa]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-1.5 sm:px-6">
          <p className="text-[11px] tracking-wide text-gray-400">
            Schweizer Preisvergleich mit Alarmfunktion
          </p>
          <div className="hidden items-center gap-3 text-[11px] text-gray-400 sm:flex">
            <span>{stats.shops} Shops</span>
            <span className="text-gray-200">|</span>
            <span>{stats.brands.toLocaleString("de-CH")} Marken</span>
            <span className="text-gray-200">|</span>
            <span>{stats.offers.toLocaleString("de-CH")} Angebote</span>
          </div>
        </div>
      </div>

      {/* ── Main: Sidebar + Products + Blog ── */}
      <div className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5 lg:px-6">
        <div className="flex gap-6 lg:gap-8">

          {/* LEFT SIDEBAR — Categories */}
          <aside className="hidden w-[180px] shrink-0 lg:block">
            <div className="sticky top-[120px]">
              <CategorySidebar dynamicCategories={dynamicCategories} />
            </div>
          </aside>

          {/* CENTER — Products Grid */}
          <main className="min-w-0 flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <ShoppingBag className="h-4 w-4 text-gray-400" />
                Alle Angebote
              </h2>
              <span className="text-[11px] text-gray-400">{totalProducts.toLocaleString("de-CH")} Produkte</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {products.map((item) => (
                <ProductCard key={item.product.gtin} item={item} onAlert={handleAlert} />
              ))}
              {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <ProductCardSkeleton key={`skel-${i}`} />
              ))}
            </div>

            {hasMore && !loading && (
              <div className="mt-8 flex justify-center">
                <button onClick={loadMore}
                  className="rounded-lg border border-[#e1e1e3] bg-white px-8 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50">
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

          {/* RIGHT SIDEBAR — Blog & Partners */}
          <aside className="hidden w-72 shrink-0 border-l border-[#e1e1e3] pl-8 xl:block">
            <div className="sticky top-[120px] max-h-[calc(100vh-140px)] overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                News & Trends
              </p>

              <div className="mt-4 space-y-5">
                {BLOG_ARTICLES.map((article, i) => (
                  <Link key={article.slug} href={`/blog/${article.slug}`} className="group block">
                    <div className="aspect-video overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={article.image} alt={article.title} width={288} height={162} loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <span className="mt-2 block text-[10px] font-semibold uppercase tracking-wider text-[#0076bd]">
                      {article.category}
                    </span>
                    <h3 className="mt-0.5 text-sm font-bold text-gray-900 group-hover:text-[#0076bd]">
                      {article.title}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
                      {article.excerpt}
                    </p>
                    {i < BLOG_ARTICLES.length - 1 && <div className="mt-5 border-b border-gray-100" />}
                  </Link>
                ))}
              </div>

              {/* Partner logos — subtle, in sidebar */}
              <div className="mt-8 border-t border-gray-100 pt-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-300">Partner</p>
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-gray-300">
                  <span>XXL Parfum</span>
                  <span>Parfumsale</span>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-gray-900 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-lg font-bold text-white">Verpasse keinen Deal mehr</h2>
          <p className="mt-2 text-sm text-gray-400">Erstelle einen Preisalarm und wir informieren dich, sobald der Preis sinkt.</p>
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
    </div>
  );
}
