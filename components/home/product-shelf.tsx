"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Truck, PackageCheck } from "lucide-react";
import { classifyShipping } from "@/lib/pricing/calculator";
import type { ShelfItem } from "@/lib/data";

interface ProductShelfProps {
  title: string;
  /** Optional editorial subtitle shown above the title ("Tech · Premium"). */
  subtitle?: string;
  items: ShelfItem[];
  /** "Alle anzeigen" link target (canonical category URL). */
  href: string;
  /** Max products to render (default 10). */
  limit?: number;
}

/**
 * Home-page thematic shelf — clean white cards in a responsive grid.
 *
 * Layout: 2 cols mobile / 3 tablet / 5 desktop. 10 items fills perfectly
 * as 2×5 or 5×2 without orphans on those breakpoints.
 *
 * Variant handling: when a shelf item represents a group of multiple
 * variants (e.g. 30/50/100 ml of the same perfume), the card shows
 * "Ab CHF X" using the group's minimum price and a small "+N Grössen"
 * pill in the upper-left corner.
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
 * Shipping chip + variant badge render only when data is present so the
 * card stays clean for simple products.
 */
function ShelfCard({ item }: { item: ShelfItem }) {
  const { product, bestPrice } = item;
  const brand = product.brand;
  const title = product.title.replace(brand, "").trim();
  const isGrouped = item.variant != null && item.variant.variantCount > 1;
  const chf = isGrouped
    ? Math.floor(item.variant!.minPriceChf)
    : Math.floor(bestPrice.totalChf);

  // Shipping hint — use the first source's shipping (Swiss-shop default).
  const firstSource = product.sources[0];
  const shipping = classifyShipping(firstSource?.shippingChf ?? null);

  return (
    <Link
      href={`/product/${product.gtin}` as Route}
      className="group relative block overflow-hidden rounded-2xl border border-black/[0.06] bg-white transition duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)]"
    >
      {/* Variant badge — top-left, only when grouped */}
      {isGrouped && (
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-medium tracking-tight text-white backdrop-blur">
          {item.variant!.variantCount} Grössen
        </span>
      )}

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
          <div className="mt-2 flex items-baseline gap-1.5">
            {isGrouped && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                ab
              </span>
            )}
            <span className="text-[15px] font-semibold tracking-tight text-gray-900">
              {chf}.<span className="text-[11px] text-gray-400">–</span>
            </span>
          </div>
        )}

        {/* Shipping chip — tiny, only shown when we have a definitive answer */}
        {shipping.kind === "included" && (
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
            <PackageCheck className="h-3 w-3" strokeWidth={2} />
            Versand inkl.
          </p>
        )}
        {shipping.kind === "paid" && (
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-gray-500">
            <Truck className="h-3 w-3" strokeWidth={2} />
            + CHF {Math.round(shipping.chf)} Versand
          </p>
        )}
      </div>
    </Link>
  );
}
