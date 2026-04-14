"use client";

import Link from "next/link";
import type { Route } from "next";
import { ExternalLink } from "lucide-react";
import type { VariantSibling } from "@/lib/data";

interface VariantSelectorProps {
  siblings: VariantSibling[];
  className?: string;
}

/**
 * Variant selector — shown on the PDP when the product has sibling sizes.
 *
 * Each size chip:
 *  - Navigates to the sibling's internal PDP (/product/<gtin>) so we keep
 *    the user on PreisAlarm and show the right breakdown for that variant.
 *  - A small external-link icon on hover opens the merchant's deep-link
 *    for that specific variant — no more "you clicked 50 ml but landed on
 *    the 30 ml page of the shop".
 *
 * The selected chip is highlighted; the cheapest chip is annotated.
 */
export function VariantSelector({ siblings, className = "" }: VariantSelectorProps) {
  if (siblings.length <= 1) return null;

  const cheapestPrice = siblings.reduce((min, s) => Math.min(min, s.priceChf), Infinity);

  return (
    <div className={`rounded-2xl border border-black/[0.06] bg-white p-4 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
          Grösse wählen
        </p>
        <p className="text-[11px] text-gray-400">
          {siblings.length} Varianten
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {siblings.map((s) => {
          const isCheapest = s.priceChf === cheapestPrice;
          const label = s.sizeLabel || `GTIN ${s.gtin.slice(-4)}`;
          return (
            <div key={s.gtin} className="group/variant relative flex flex-col">
              <Link
                href={s.productUrl as Route}
                aria-current={s.isCurrent ? "page" : undefined}
                className={`flex min-h-[44px] min-w-[76px] flex-col items-center justify-center rounded-xl border px-3 py-1.5 transition active:scale-[0.98] ${
                  s.isCurrent
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-800 hover:-translate-y-px hover:border-gray-300 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                }`}
              >
                <span className="text-[13px] font-semibold tracking-tight">
                  {label}
                </span>
                <span className={`text-[11px] ${s.isCurrent ? "text-white/70" : "text-gray-500"}`}>
                  CHF {Math.floor(s.priceChf)}.–
                </span>
              </Link>

              {isCheapest && !s.isCurrent && (
                <span className="mt-1 text-center text-[9px] font-semibold uppercase tracking-wider text-emerald-600">
                  günstigste
                </span>
              )}

              {/* Merchant deep-link shortcut — visible on hover */}
              {s.affiliateUrl && s.affiliateUrl !== "#" && (
                <a
                  href={s.affiliateUrl}
                  target="_blank"
                  rel="sponsored nofollow noopener"
                  aria-label={`${label} beim Händler öffnen`}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-black/[0.06] bg-white text-gray-400 opacity-0 shadow-sm transition group-hover/variant:opacity-100 hover:text-gray-900"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" strokeWidth={2} />
                </a>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-gray-400">
        Deep-Link direkt zur jeweiligen Grösse beim Händler verfügbar.
      </p>
    </div>
  );
}
