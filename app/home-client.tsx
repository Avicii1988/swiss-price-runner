"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Bell, Search, BarChart3, ShoppingBag } from "lucide-react";
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
    <div className="min-h-screen bg-[#fafafa]">
      {alertProduct && <PriceAlertModal item={alertProduct} onClose={() => setAlertProduct(null)} />}

      <SiteHeader query={query} onQueryChange={setQuery} allProducts={products} />

      {/* ── Stats Bar ── */}
      <div className="border-b border-[#e1e1e3] bg-[#f5f5f7]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-2 sm:px-6">
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span className="font-medium text-gray-500">Vertrauenspartner</span>
            <span className="text-gray-300">XXL Parfum</span>
            <span className="text-gray-300">Parfumsale</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium text-gray-500">
            <span>{stats.shops} Shops</span>
            <span className="text-gray-300">|</span>
            <span>{stats.brands.toLocaleString("de-CH")} Marken</span>
            <span className="text-gray-300">|</span>
            <span>{stats.offers.toLocaleString("de-CH")} Angebote</span>
          </div>
        </div>
      </div>

      {/* ── "Was ist PreisAlarm?" Info ── */}
      <div className="border-b border-[#e1e1e3] bg-white">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6">
          <div className="text-center sm:text-left">
            <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
              <Search className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Suchen</h3>
            </div>
            <p className="text-[13px] leading-relaxed text-gray-500">Durchsuche alle grossen Schweizer Händler an einem Ort.</p>
          </div>
          <div className="text-center sm:text-left">
            <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
              <BarChart3 className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Vergleichen</h3>
            </div>
            <p className="text-[13px] leading-relaxed text-gray-500">Neutrale Echtzeit-Preise. Keine versteckten Gebühren.</p>
          </div>
          <div className="text-center sm:text-left">
            <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
              <Bell className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Alarmieren</h3>
            </div>
            <p className="text-[13px] leading-relaxed text-gray-500">Setze einen Preisalarm und verpasse nie wieder den Bestpreis.</p>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="mx-auto max-w-[1400px] px-3 py-6 sm:px-5 lg:px-6">
        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar */}
          <aside className="hidden w-[180px] shrink-0 lg:block">
            <div className="sticky top-[120px]">
              <CategorySidebar dynamicCategories={dynamicCategories} />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="min-w-0 flex-1">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                <ShoppingBag className="mb-0.5 mr-2 inline h-5 w-5 text-gray-400" />
                Alle Angebote
              </h2>
              <span className="text-xs text-gray-400">{totalProducts.toLocaleString("de-CH")} Produkte</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((item) => (
                <ProductCard key={item.product.gtin} item={item} onAlert={handleAlert} />
              ))}
              {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <ProductCardSkeleton key={`skel-${i}`} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && !loading && (
              <div className="mt-8 flex justify-center">
                <button onClick={loadMore}
                  className="rounded-lg border border-gray-200 bg-white px-8 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50">
                  Mehr Angebote laden
                </button>
              </div>
            )}

            {!hasMore && products.length > 0 && (
              <p className="mt-8 text-center text-xs text-gray-400">
                Alle {totalProducts.toLocaleString("de-CH")} Angebote geladen
              </p>
            )}
          </main>
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
