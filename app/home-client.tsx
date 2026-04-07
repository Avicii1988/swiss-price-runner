"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Bell,
  ArrowRight,
  Flame,
  TrendingDown,
  Percent,
  Apple,
  Footprints,
  Droplets,
  Sparkles,
  Monitor,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { PriceAlertModal } from "@/components/price-alert-modal";
import { VisualSearchModal } from "@/components/visual-search-modal";
import { SiteHeader } from "@/components/site-header";
import { CategorySidebar } from "@/components/category-sidebar";
import { TrustBrandsBar } from "@/components/trust-brands-bar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LiveSearchGrid } from "@/components/live-search-grid";
import { useAuth } from "@/lib/auth/auth-context";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface HomeClientProps {
  allProducts: MockProductWithHistory[];
  featured: MockProductWithHistory[];
  categories: string[];
}

// Section header component
function SectionHeader({
  icon,
  title,
  href,
  linkText = "Alle",
}: {
  icon: React.ReactNode;
  title: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {href && (
        <Link
          href={href as Route}
          className="flex items-center gap-1 text-xs font-medium text-[#0076bd] transition hover:text-[#005a94]"
        >
          {linkText} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

export default function HomeClient({ allProducts, featured }: HomeClientProps) {
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<MockProductWithHistory | null>(null);
  const [alertProduct, setAlertProduct] =
    useState<MockProductWithHistory | null>(null);
  const [showVisionModal, setShowVisionModal] = useState(false);

  const { isLoggedIn, setShowAuthModal } = useAuth();

  const handleSelect = useCallback(
    (item: MockProductWithHistory) => setSelectedProduct(item),
    [],
  );
  const handleAlert = useCallback(
    (item: MockProductWithHistory) => {
      setSelectedProduct(null);
      setAlertProduct(item);
    },
    [],
  );

  // ── Diversified Hot Deals: at least 50% non-tech ───────────
  const hotDeals = useMemo(() => {
    const lifestyle = allProducts.filter((p) =>
      ["parfum", "beauty", "mode", "schuhe"].includes(p.product.category),
    );
    const tech = allProducts.filter((p) =>
      !["parfum", "beauty", "mode", "schuhe"].includes(p.product.category),
    );
    // Sort both by price drop, pick 3 lifestyle + 3 tech
    const topLifestyle = [...lifestyle]
      .sort((a, b) => b.priceDrop30d - a.priceDrop30d)
      .slice(0, 3);
    const topTech = [...tech]
      .sort((a, b) => b.priceDrop30d - a.priceDrop30d)
      .slice(0, 3);
    // Interleave: lifestyle first
    const mixed: MockProductWithHistory[] = [];
    for (let i = 0; i < 3; i++) {
      if (topLifestyle[i]) mixed.push(topLifestyle[i]);
      if (topTech[i]) mixed.push(topTech[i]);
    }
    return mixed;
  }, [allProducts]);

  // ── Category-specific product groups ───────────────────────
  const beautyProducts = useMemo(
    () =>
      allProducts
        .filter((p) => ["beauty", "parfum"].includes(p.product.category) &&
          ["La Mer", "Dyson", "Lancôme", "Chanel"].some((b) => p.product.brand.includes(b)))
        .slice(0, 4),
    [allProducts],
  );

  const perfumeProducts = useMemo(
    () =>
      allProducts
        .filter((p) => p.product.category === "parfum")
        .sort((a, b) => b.priceDrop30d - a.priceDrop30d)
        .slice(0, 4),
    [allProducts],
  );

  const shoeProducts = useMemo(
    () =>
      allProducts
        .filter(
          (p) =>
            ["schuhe", "mode"].includes(p.product.category) &&
            ["Nike", "Adidas", "On Running", "New Balance"].includes(
              p.product.brand,
            ),
        )
        .slice(0, 4),
    [allProducts],
  );

  const appleProducts = useMemo(
    () => allProducts.filter((p) => p.product.brand === "Apple").slice(0, 4),
    [allProducts],
  );

  const techProducts = useMemo(
    () =>
      allProducts
        .filter((p) =>
          ["smartphones", "laptops", "kopfhoerer", "gaming", "tv-audio"].includes(
            p.product.category,
          ) && p.product.brand !== "Apple",
        )
        .sort((a, b) => b.priceDrop30d - a.priceDrop30d)
        .slice(0, 4),
    [allProducts],
  );

  const tagesangebot = featured[0];

  return (
    <div className="min-h-screen bg-white">
      {selectedProduct && (
        <ProductDetailModal
          item={selectedProduct}
          onOpenAlert={handleAlert}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      {alertProduct && (
        <PriceAlertModal
          item={alertProduct}
          onClose={() => setAlertProduct(null)}
        />
      )}
      {showVisionModal && (
        <VisualSearchModal
          onClose={() => setShowVisionModal(false)}
          allProducts={allProducts}
        />
      )}

      <SiteHeader
        query={query}
        onQueryChange={setQuery}
        allProducts={allProducts}
        showVision={() => setShowVisionModal(true)}
      />

      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-[1400px] px-3 py-2.5 sm:px-5 lg:px-6">
          <Breadcrumbs items={[{ label: "Gesamtsortiment", href: "/" }]} />
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5 lg:px-6">
        <div className="flex gap-6 lg:gap-8">
          {/* LEFT SIDEBAR */}
          <aside className="hidden w-[180px] shrink-0 lg:block">
            <div className="sticky top-20">
              <CategorySidebar />
            </div>
          </aside>

          {/* CENTER */}
          <main className="min-w-0 flex-1">
            {/* ═══ 🔥 Hot Deals — diversified ═══ */}
            {hotDeals.length > 0 && (
              <section className="mb-10">
                <SectionHeader
                  icon={<Flame className="h-5 w-5 text-orange-500" />}
                  title="Top Deals des Tages"
                />
                <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
                  {hotDeals.slice(0, 6).map((item) => (
                    <ProductCard
                      key={item.product.gtin}
                      item={item}
                      onSelect={handleSelect}
                      onAlert={handleAlert}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ═══ 1. Premium Beauty & Skincare ═══ */}
            <section className="mb-10">
              <SectionHeader
                icon={<Sparkles className="h-5 w-5 text-pink-500" />}
                title="Premium Beauty & Skincare"
                href="/category/parfum"
              />
              {beautyProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
                  {beautyProducts.map((item) => (
                    <ProductCard
                      key={item.product.gtin}
                      item={item}
                      onSelect={handleSelect}
                      onAlert={handleAlert}
                    />
                  ))}
                </div>
              ) : (
                <LiveSearchGrid
                  query="Premium Skincare Schweiz La Mer Clinique"
                  layout="grid"
                />
              )}
            </section>

            {/* ═══ 2. Exklusive Düfte ═══ */}
            <section className="mb-10">
              <SectionHeader
                icon={<Droplets className="h-5 w-5 text-violet-500" />}
                title="Exklusive Düfte"
                href="/category/parfum"
              />
              {perfumeProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
                  {perfumeProducts.map((item) => (
                    <ProductCard
                      key={item.product.gtin}
                      item={item}
                      onSelect={handleSelect}
                      onAlert={handleAlert}
                    />
                  ))}
                </div>
              ) : (
                <LiveSearchGrid
                  query="Luxus Parfum Schweiz Dior Chanel"
                  layout="grid"
                />
              )}
            </section>

            {/* ═══ 3. Trend Schuhe & Sneaker ═══ */}
            {shoeProducts.length > 0 && (
              <section className="mb-10">
                <SectionHeader
                  icon={<Footprints className="h-5 w-5 text-orange-500" />}
                  title="Trend Schuhe & Sneaker"
                  href="/category/schuhe"
                />
                <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
                  {shoeProducts.map((item) => (
                    <ProductCard
                      key={item.product.gtin}
                      item={item}
                      onSelect={handleSelect}
                      onAlert={handleAlert}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ═══ 4. Apple World ═══ */}
            {appleProducts.length > 0 && (
              <section className="mb-10">
                <SectionHeader
                  icon={<Apple className="h-5 w-5 text-gray-700" />}
                  title="Apple-Welt"
                  href="/category/smartphones"
                />
                <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
                  {appleProducts.map((item) => (
                    <ProductCard
                      key={item.product.gtin}
                      item={item}
                      onSelect={handleSelect}
                      onAlert={handleAlert}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ═══ 5. Tech & Gadgets ═══ */}
            {techProducts.length > 0 && (
              <section className="mb-10">
                <SectionHeader
                  icon={<Monitor className="h-5 w-5 text-slate-600" />}
                  title="Tech & Gadgets"
                  href="/category/laptops"
                />
                <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
                  {techProducts.map((item) => (
                    <ProductCard
                      key={item.product.gtin}
                      item={item}
                      onSelect={handleSelect}
                      onAlert={handleAlert}
                    />
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* RIGHT SIDEBAR — Tagesangebot */}
          {tagesangebot && (
            <aside className="hidden w-72 shrink-0 pl-8 xl:block">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">
                  Tagesangebot
                </h2>
                <span className="rounded border border-gray-300 px-2 py-0.5 text-xs font-bold text-gray-600">
                  {new Date().getDate()}{" "}
                  {
                    [
                      "JAN","FEB","MÄR","APR","MAI","JUN",
                      "JUL","AUG","SEP","OKT","NOV","DEZ",
                    ][new Date().getMonth()]
                  }
                </span>
              </div>
              <Link
                href={`/product/${tagesangebot.product.gtin}`}
                className="group mt-3 block"
              >
                <div className="flex items-center justify-center rounded-xl bg-white p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tagesangebot.product.imageUrl}
                    alt={tagesangebot.product.title}
                    width={200}
                    height={200}
                    className="h-44 w-44 object-contain mix-blend-multiply transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-[11px] text-gray-500">
                    <strong className="text-gray-900">noch 36</strong> von 150
                    Stück
                  </p>
                  <div className="stock-bar mt-1">
                    <div
                      className="stock-bar-fill"
                      style={{ width: "24%" }}
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#0076bd]">
                  {tagesangebot.product.category}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold">
                    {tagesangebot.bestPrice.totalChf.toFixed(0)}.–
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    {Math.round(tagesangebot.avgChf30d)}.–
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-bold">
                  {tagesangebot.product.brand}
                </h3>
                <p className="line-clamp-2 text-xs text-gray-500">
                  {tagesangebot.product.title}
                </p>
              </Link>
              <Link
                href="/"
                className="mt-4 flex items-center gap-1 text-sm font-medium text-[#0076bd] hover:text-[#005a94]"
              >
                Alle Angebote anzeigen <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>
          )}
        </div>
      </div>

      {/* Beliebte Marken */}
      <TrustBrandsBar />

      {/* CTA */}
      <section className="bg-slate-900 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-lg font-bold text-white">
            Preisalarm einrichten
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Wir benachrichtigen dich per E-Mail, sobald dein Wunschpreis
            erreicht wird.
          </p>
          <button
            onClick={() => {
              if (!isLoggedIn) {
                setShowAuthModal(true);
                return;
              }
              if (featured.length > 0) handleAlert(featured[0]);
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#D81E05] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#b91a04]"
          >
            <Bell className="h-4 w-4" /> Jetzt Alarm einrichten
          </button>
        </div>
      </section>
    </div>
  );
}
