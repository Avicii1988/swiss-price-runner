"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "lucide-react";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface ProductShelfProps {
  title: string;
  /** Optional editorial subtitle shown above the title ("Tech · Premium"). */
  subtitle?: string;
  items: MockProductWithHistory[];
  /** "Alle anzeigen" link target (canonical category URL). */
  href: string;
  /** Max products to render (default 10). */
  limit?: number;
}

/**
 * Home-page thematic shelf — clean white cards in a responsive grid.
 *
 * Layout: 2 cols mobile / 3 tablet / 5 desktop. 10 items fills perfectly
 * as 2×5 or 5×2 without orphans; 3-col intentionally keeps a 3+3+3+1
 * pattern on tablet (readable on the wider breakpoints that matter).
 *
 * Visuals match the original "Alle Angebote" screenshot — a simple
 * title row with an "Alle anzeigen" CTA, white cards with border,
 * subtle hover lift, clean Swiss-style typography.
 */
export function ProductShelf({ title, subtitle, items, href, limit = 10 }: ProductShelfProps) {
  if (items.length === 0) return null;
  const visible = items.slice(0, limit);
  const target = href as Route;

  return (
    <section className="mb-10">
      {/* Header row */}
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          {subtitle && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              {subtitle}
            </p>
          )}
          <h2 className="mt-0.5 truncate text-[17px] font-semibold tracking-tight text-gray-900 sm:text-lg">
            {title}
          </h2>
        </div>
        <Link
          href={target}
          className="group flex shrink-0 items-center gap-1 text-[12px] font-medium text-gray-600 transition hover:text-gray-900"
        >
          Alle anzeigen
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 xl:grid-cols-5">
        {visible.map((item) => (
          <ShelfCard key={item.product.gtin} item={item} />
        ))}
      </div>
    </section>
  );
}

/**
 * Minimal product card for shelves — image, brand, truncated title, price.
 * No alert bell / heart / pin — those live on the full catalog grid
 * and the product-detail page so the shelves stay fast-scannable.
 */
function ShelfCard({ item }: { item: MockProductWithHistory }) {
  const { product, bestPrice } = item;
  const brand = product.brand;
  const title = product.title.replace(brand, "").trim();
  const chf = Math.floor(bestPrice.totalChf);
  return (
    <Link
      href={`/product/${product.gtin}` as Route}
      className="group block overflow-hidden rounded-2xl border border-black/[0.06] bg-white transition duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)]"
    >
      <div className="aspect-square bg-[#f7f7f8]">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            width={280}
            height={280}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.03] sm:p-5"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-300">
            Ohne Bild
          </div>
        )}
      </div>
      <div className="px-3 py-3 sm:px-3.5">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          {brand}
        </p>
        <p className="mt-0.5 line-clamp-2 min-h-[34px] text-[12px] leading-snug text-gray-900">
          {title || product.title}
        </p>
        {chf > 0 && (
          <p className="mt-2 text-[15px] font-semibold tracking-tight text-gray-900">
            {chf}.<span className="text-[11px] text-gray-400">–</span>
          </p>
        )}
      </div>
    </Link>
  );
}
