"use client";

import { useState } from "react";
import Link from "next/link";
import { Tag, Package } from "lucide-react";
import { PriceAlertModal } from "@/components/price-alert-modal";
import { PreisAlarmBell } from "@/components/preisalarm-logo";
import { SiteHeader } from "@/components/site-header";
import { CategorySidebar } from "@/components/category-sidebar";
import { ProductShelf } from "@/components/home/product-shelf";
import { ViewModeToggle, type ViewMode } from "@/components/view-mode-toggle";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";
import type { ThematicShelf } from "@/lib/data";

interface HomeClientProps {
  dynamicCategories?: { slug: string; name: string; productCount: number }[];
  stats: { shops: number; brands: number; offers: number };
  shelves: ThematicShelf[];
}

// News sidebar — static editorial picks
const BLOG_ARTICLES = [
  { slug: "top-5-spring-scents-2026", title: "Top 5 Frühlingsdüfte 2026", excerpt: "Die angesagtesten Parfums für die warme Jahreszeit — von Dior bis Chanel.", image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=340&fit=crop", category: "Beauty" },
  { slug: "on-running-guide-schweiz", title: "On Running: Der Schweizer Guide", excerpt: "Welcher On-Schuh passt zu deinem Laufstil? Modelle im Vergleich.", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=340&fit=crop", category: "Sport" },
  { slug: "apple-iphone-2026-geruechte", title: "iPhone 2026: Was wir wissen", excerpt: "Alle Gerüchte, Leaks und Preiseinschätzungen für die Schweiz.", image: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600&h=340&fit=crop", category: "Tech" },
];

export default function HomeClient({ dynamicCategories, stats, shelves }: HomeClientProps) {
  const [query, setQuery] = useState("");
  const [alertProduct, setAlertProduct] = useState<MockProductWithHistory | null>(null);
  // Home-page view mode — list on mobile (<640px), grid on desktop.
  // Mirrors the same responsive initialiser used by the category page.
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "list" : "grid",
  );

  return (
    <div className="min-h-screen bg-white">
      {alertProduct && (
        <PriceAlertModal item={alertProduct} onClose={() => setAlertProduct(null)} />
      )}
      <SiteHeader query={query} onQueryChange={setQuery} />

      {/* ═══ Mission bar — short, punchy positioning line.
          Replaces the old Shops/Marken/Angebote counter. Tells new
          visitors in one breath what the site does and hints at the
          signature feature (Preisalarm). Shop count is hidden (user
          feedback: revealing "17 Shops" looked thin for a price
          comparison site in beta). Marken + Angebote counters moved
          to a dedicated band above the News sidebar. ═══ */}
      <div className="bg-gradient-to-r from-[#1a1f36] to-[#2d3561]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-3 px-4 py-2.5 sm:px-6">
          <p className="text-[12px] font-medium text-white/90 sm:text-[13px]">
            Dein Schweizer Preisvergleich –{" "}
            <span className="text-white/70">neutral, unabhängig,</span>
            {" "}mit Echtzeit-<span className="font-semibold text-white">Preisalarm</span>
          </p>
          <PreisAlarmBell size={28} />
        </div>
      </div>

      {/* ═══ Main 3-col: Sidebar · Shelves · News ═══ */}
      <div className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5 lg:px-6">
        <div className="flex gap-6 lg:gap-8">
          {/* Left sidebar — category tree */}
          <aside className="hidden w-[180px] shrink-0 lg:block">
            <div className="sticky top-[76px]">
              <CategorySidebar dynamicCategories={dynamicCategories} />
            </div>
          </aside>

          {/* Center — themed product shelves */}
          <main className="min-w-0 flex-1">
            {/* View toolbar — mirrors the control on category pages so
                users can flip between grid and list across the app. */}
            <div className="mb-3 flex items-center justify-end">
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            </div>

            {shelves.map(({ slot, items }) => (
              <ProductShelf
                key={slot.key}
                title={slot.title}
                subtitle={slot.subtitle}
                items={items}
                href={slot.href ?? "/"}
                limit={12}
                layout={viewMode}
                onAlert={(item) => setAlertProduct(item)}
              />
            ))}

            {shelves.every((s) => s.items.length === 0) && (
              <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-10 text-center">
                <p className="text-sm text-gray-500">
                  Noch keine Produkte geladen. Bitte triggere einen Import-Run.
                </p>
              </div>
            )}
          </main>

          {/* Right — News & Trends */}
          <aside className="hidden w-72 shrink-0 border-l border-[#e1e1e3] pl-8 xl:block">
            <div className="sticky top-[76px] max-h-[calc(100vh-100px)] overflow-y-auto pr-1">
              {/* Catalogue counter band — dark-navy pill with the two
                  numbers that matter (brands + offers). Moved here from
                  the old top stats bar so the hero strip stays editorial
                  and the catalogue scale lives next to the news list. */}
              <div className="mb-5 overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1f36] to-[#2d3561] p-4 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60">
                  Katalog
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-white/60">
                      <Tag className="h-3 w-3" strokeWidth={2.2} />
                      Marken
                    </span>
                    <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight">
                      {stats.brands.toLocaleString("de-CH")}
                    </p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-white/60">
                      <Package className="h-3 w-3" strokeWidth={2.2} />
                      Angebote
                    </span>
                    <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight">
                      {stats.offers.toLocaleString("de-CH")}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                News &amp; Trends
              </p>
              <div className="mt-4 space-y-5">
                {BLOG_ARTICLES.map((article, i) => (
                  <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    className="group block"
                  >
                    <div className="aspect-video overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.image}
                        alt={article.title}
                        width={288}
                        height={162}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
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
                    {i < BLOG_ARTICLES.length - 1 && (
                      <div className="mt-5 border-b border-gray-100" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer (global) is rendered in layout.tsx */}
    </div>
  );
}
