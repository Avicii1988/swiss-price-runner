"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Truck, PackageCheck } from "lucide-react";
import { classifyShipping } from "@/lib/pricing/calculator";
import { ShopLogo } from "@/components/shop-logo";
import { formatChf } from "@/lib/pricing/format";
import type { ShelfItem } from "@/lib/data";

export type ShelfLayout = "grid" | "list";

interface ProductShelfProps {
  title: string;
  /** Optional editorial subtitle shown above the title ("Tech · Premium"). */
  subtitle?: string;
  items: ShelfItem[];
  /** "Alle anzeigen" link target (canonical category URL). */
  href: string;
  /** Max products to render (default 12 — 3-col grid × 4 rows). */
  limit?: number;
  /** Grid (default) or single-column list layout. */
  layout?: ShelfLayout;
}

/** Extract the unique sourceIds that carry a shelf item (excl. synthetic). */
function offerSourceIds(item: ShelfItem): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const s of item.product.sources ?? []) {
    if (!s.sourceId || s.sourceId === "feed_default") continue;
    if (seen.has(s.sourceId)) continue;
    seen.add(s.sourceId);
    ids.push(s.sourceId);
  }
  return ids;
}

/**
 * Home-page thematic shelf — clean white cards in a responsive layout.
 *
 * Grid layout (default): 2 cols mobile → 3 cols from `sm` onwards.
 *   12 items fill perfectly as 2×6 (mobile) or 3×4 (desktop).
 *
 * List layout: single column of horizontal cards (thumbnail + copy),
 *   used when the user toggles "Liste" in the home-page toolbar.
 *
 * Variant handling: when a shelf item represents a group of multiple
 * variants (e.g. 30/50/100 ml of the same perfume), the card shows
 * "Ab CHF X" using the group's minimum price and a small "+N Grössen"
 * pill in the upper-left corner.
 */
export function ProductShelf({ title, subtitle, items, href, limit = 12, layout = "grid" }: ProductShelfProps) {
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

      {layout === "list" ? (
        <div className="flex flex-col divide-y divide-[#f0f0f2] bg-white">
          {visible.map((item) => (
            <ShelfListRow key={item.product.gtin} item={item} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-3">
          {visible.map((item) => (
            <ShelfCard key={item.product.gtin} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function ShelfCard({ item }: { item: ShelfItem }) {
  const { product, bestPrice } = item;
  const brand = product.brand;
  const title = product.title.replace(brand, "").trim();
  const isGrouped = item.variant != null && item.variant.variantCount > 1;

  const rawPrice = isGrouped ? item.variant!.minPriceChf : bestPrice.totalChf;
  const priceLabel = rawPrice > 0 ? formatChf(rawPrice) : null;
  const shopIds = offerSourceIds(item);
  const offerCount = shopIds.length || (product.sources?.length ?? 0);

  // Shipping hint — read from the first source (Swiss-shop default).
  const firstSource = product.sources[0];
  const shipping = classifyShipping(firstSource?.shippingChf ?? null);

  // "N Angebote ab CHF X.YY" / "1 Angebot ab CHF X.YY" / null.
  const offerLine = priceLabel
    ? offerCount >= 2
      ? `${offerCount} Angebote ab CHF ${priceLabel}`
      : `1 Angebot ab CHF ${priceLabel}`
    : null;

  return (
    <Link
      href={`/product/${product.gtin}` as Route}
      className="group relative block bg-white transition-colors duration-200 hover:bg-[#f8f8f9]"
    >
      {isGrouped && (
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-medium tracking-tight text-white backdrop-blur">
          {item.variant!.variantCount} Grössen
        </span>
      )}

      <div className="aspect-square">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            width={280}
            height={280}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-[1.03] sm:p-5"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-300">
            Ohne Bild
          </div>
        )}
      </div>
      <div className="px-2 py-3 sm:px-3">
        {priceLabel && (
          <div className="mb-1 flex items-baseline gap-1.5">
            {isGrouped && (
              <span className="text-[11px] font-normal text-gray-500">ab</span>
            )}
            <span className="text-[20px] font-bold tracking-tight text-gray-900">
              <span className="text-[13px] font-normal text-gray-500">CHF </span>
              {priceLabel}
            </span>
          </div>
        )}
        <p className="line-clamp-2 min-h-[42px] text-[14px] leading-snug text-gray-700">
          <span className="font-bold text-gray-900">{brand}</span>{" "}
          {title || product.title}
        </p>

        {/* N Angebote ab CHF X.YY */}
        {offerLine && (
          <p className="mt-1 text-[10px] font-medium text-gray-500">{offerLine}</p>
        )}

        {/* Mini-logo row — the shops that actually carry this gtin */}
        {shopIds.length > 0 && (
          <div className="mt-1.5 flex items-center -space-x-1.5">
            {shopIds.slice(0, 4).map((sid) => (
              <ShopLogo key={sid} sourceId={sid} iconOnly size="xs" />
            ))}
            {shopIds.length > 4 && (
              <span className="ml-2 text-[10px] font-medium text-gray-400">
                +{shopIds.length - 4}
              </span>
            )}
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
            + CHF {formatChf(shipping.chf)} Versand
          </p>
        )}
      </div>
    </Link>
  );
}

/**
 * Compact horizontal row variant of ShelfCard for list view — thumbnail on the
 * left, brand/title/price on the right, no internal padding on the wrapper so
 * the surrounding divide-y creates the row separators.
 */
function ShelfListRow({ item }: { item: ShelfItem }) {
  const { product, bestPrice } = item;
  const brand = product.brand;
  const title = product.title.replace(brand, "").trim();
  const isGrouped = item.variant != null && item.variant.variantCount > 1;

  const rawPrice = isGrouped ? item.variant!.minPriceChf : bestPrice.totalChf;
  const priceLabel = rawPrice > 0 ? formatChf(rawPrice) : null;
  const shopIds = offerSourceIds(item);
  const offerCount = shopIds.length || (product.sources?.length ?? 0);

  const offerLine = priceLabel
    ? offerCount >= 2
      ? `${offerCount} Angebote ab CHF ${priceLabel}`
      : `1 Angebot ab CHF ${priceLabel}`
    : null;

  return (
    <Link
      href={`/product/${product.gtin}` as Route}
      className="group flex items-center gap-4 px-3 py-3 transition hover:bg-gray-50 sm:px-4"
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-white sm:h-20 sm:w-20">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            width={80}
            height={80}
            loading="lazy"
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          {brand}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-gray-900">
          {title || product.title}
        </p>
        {isGrouped && (
          <p className="mt-0.5 text-[11px] text-gray-400">
            {item.variant!.variantCount} Grössen verfügbar
          </p>
        )}
        {shopIds.length > 0 && (
          <div className="mt-1.5 flex items-center -space-x-1.5">
            {shopIds.slice(0, 4).map((sid) => (
              <ShopLogo key={sid} sourceId={sid} iconOnly size="xs" />
            ))}
            {shopIds.length > 4 && (
              <span className="ml-2 text-[10px] font-medium text-gray-400">
                +{shopIds.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
      {priceLabel && (
        <div className="shrink-0 text-right">
          {isGrouped && (
            <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
              ab
            </p>
          )}
          <p className="text-[15px] font-semibold tracking-tight text-gray-900">
            CHF {priceLabel}
          </p>
          {offerLine && (
            <p className="mt-0.5 text-[10px] text-gray-400">{offerLine}</p>
          )}
        </div>
      )}
    </Link>
  );
}
