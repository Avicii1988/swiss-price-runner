"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import type { PriceDropProduct } from "@/lib/data";

interface PriceDropsGridProps {
  items: PriceDropProduct[];
}

/**
 * Best-Deals grid — products sorted by actual (price vs originalPriceChf)
 * discount percentage. Each card shows the discount badge prominently.
 * Responsive: 2 cols mobile, 3 tablet, 4 desktop.
 */
export function PriceDropsGrid({ items }: PriceDropsGridProps) {
  if (items.length === 0) return null;

  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D81E05]">
              <Flame className="h-3.5 w-3.5" />
              Price Drops
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Beste Deals — jetzt reduziert
            </h2>
            <p className="mt-1.5 text-[13px] text-gray-500">
              Automatisch berechnet aus dem UVP gegenüber dem aktuellen Preis.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {items.map(({ item, originalPriceChf, discountPct }) => {
            const img = item.product.imageUrl;
            const brand = item.product.brand;
            const title = item.product.title.replace(brand, "").trim();
            const chf = Math.floor(item.bestPrice.totalChf);
            const orig = Math.floor(originalPriceChf);
            return (
              <Link
                key={item.product.gtin}
                href={`/product/${item.product.gtin}`}
                className="group relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)]"
              >
                {/* Discount badge */}
                <div className="absolute left-3 top-3 z-10 rounded-full bg-[#D81E05] px-2.5 py-1 text-[11px] font-semibold tracking-tight text-white shadow-sm">
                  −{discountPct}%
                </div>

                <div className="aspect-square bg-[#f7f7f8]">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={item.product.title}
                      width={280}
                      height={280}
                      loading="lazy"
                      className="h-full w-full object-contain p-5 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-300">
                      Ohne Bild
                    </div>
                  )}
                </div>

                <div className="px-4 py-3.5">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {brand}
                  </p>
                  <p className="mt-0.5 line-clamp-2 min-h-[36px] text-[13px] leading-snug text-gray-900">
                    {title || item.product.title}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-[17px] font-semibold tracking-tight text-gray-900">
                      {chf}.–
                    </span>
                    {orig > chf && (
                      <span className="text-[12px] text-gray-400 line-through">
                        {orig}.–
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
