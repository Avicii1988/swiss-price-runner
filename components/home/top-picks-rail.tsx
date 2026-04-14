"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface TopPicksRailProps {
  items: MockProductWithHistory[];
}

/**
 * Horizontally scrollable shelf of featured products — Apple-store-style
 * cards with rounded corners, soft shadows and smooth scroll-snap.
 */
export function TopPicksRail({ items }: TopPicksRailProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              <Sparkles className="h-3.5 w-3.5" />
              Top 10 Picks
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Was die Schweiz gerade liebt
            </h2>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Zurück scrollen"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Weiter scrollen"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="scrollbar-hide mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4 sm:gap-5"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((item, idx) => {
            const img = item.product.imageUrl;
            const brand = item.product.brand;
            const title = item.product.title.replace(brand, "").trim();
            const chf = Math.floor(item.bestPrice.totalChf);
            return (
              <Link
                key={item.product.gtin}
                href={`/product/${item.product.gtin}`}
                className="group relative w-[200px] shrink-0 snap-start sm:w-[232px]"
              >
                {/* Card */}
                <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition duration-500 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)]">
                  {/* Rank badge */}
                  <div className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900/90 text-[11px] font-semibold text-white backdrop-blur">
                    {idx + 1}
                  </div>
                  <div className="aspect-square bg-[#f7f7f8]">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={item.product.title}
                        width={232}
                        height={232}
                        loading="lazy"
                        className="h-full w-full object-contain p-6 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
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
                    {chf > 0 && (
                      <p className="mt-2 text-[17px] font-semibold tracking-tight text-gray-900">
                        {chf}.–
                        <span className="ml-1 text-[11px] font-normal text-gray-400">CHF</span>
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          {/* trailing spacer so the last card doesn't butt against the edge */}
          <div aria-hidden className="w-4 shrink-0 sm:w-8" />
        </div>
      </div>
    </section>
  );
}
