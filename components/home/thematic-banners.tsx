import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";
import type { ThematicShelf } from "@/lib/data";

interface ThematicBannersProps {
  shelves: ThematicShelf[];
}

/**
 * Three oversized editorial tiles — Hottest Fragrances / Apple Ecosystem /
 * Urban Sneakers. Each tile is a linked card that shows 2-3 live product
 * thumbnails pulled from the shelf's category subtree.
 */
export function ThematicBanners({ shelves }: ThematicBannersProps) {
  const usable = shelves.filter((s) => s.items.length > 0);
  if (usable.length === 0) return null;

  return (
    <section className="bg-[#fafafa] py-14 sm:py-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="mb-8 flex items-end justify-between sm:mb-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Editorial
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Kuratierte Welten
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {usable.map(({ slot, items }) => {
            const href = (slot.href ?? `/category/${slot.categorySlug}`) as Route;
            const accent = slot.accent ?? "#111111";
            const hero = items[0]?.product.imageUrl;
            const extras = items.slice(1, 4);

            return (
              <Link
                key={slot.key}
                href={href}
                className="group relative block overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)]"
              >
                {/* Hero image with accent tint */}
                <div
                  className="relative aspect-[4/3] overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${accent}14 0%, ${accent}06 60%, transparent 100%)`,
                  }}
                >
                  {hero ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hero}
                      alt={slot.title}
                      width={520}
                      height={390}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain p-10 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  ) : null}
                  {/* Accent corner glow */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full opacity-40 blur-3xl"
                    style={{ background: accent }}
                  />
                </div>

                {/* Caption */}
                <div className="flex items-start justify-between gap-3 px-6 pb-6 pt-5">
                  <div className="min-w-0">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                      style={{ color: accent }}
                    >
                      {slot.subtitle ?? "Thema"}
                    </p>
                    <h3 className="mt-1.5 truncate text-lg font-semibold tracking-tight text-gray-900">
                      {slot.title}
                    </h3>
                    {extras.length > 0 && (
                      <div className="mt-3 flex -space-x-2">
                        {extras.map((ex) =>
                          ex.product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={ex.product.gtin}
                              src={ex.product.imageUrl}
                              alt=""
                              width={28}
                              height={28}
                              loading="lazy"
                              className="h-7 w-7 rounded-full border border-white bg-white object-contain p-1 shadow-sm"
                            />
                          ) : null,
                        )}
                      </div>
                    )}
                  </div>
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition group-hover:scale-105"
                    style={{ background: accent }}
                  >
                    <ArrowUpRight className="h-4 w-4" />
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
