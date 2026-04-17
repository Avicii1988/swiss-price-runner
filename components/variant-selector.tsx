"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ExternalLink } from "lucide-react";
import { formatChf } from "@/lib/pricing/format";
import { extractAttributes, attributeLabel, variantLabel, type ExtractedAttributes } from "@/lib/attributes";
import type { VariantSibling } from "@/lib/data";

interface VariantSelectorProps {
  siblings: VariantSibling[];
  category?: string;
  className?: string;
}

/**
 * Two-level variant selector for the PDP.
 *
 * Level 1 (The Spec): buttons for the primary attribute — storage for
 * phones, size for shoes/fashion, volume for perfume.
 *   [128 GB]  [256 GB]  [512 GB]
 *
 * Level 2 (The Visual): buttons/swatches for the secondary attribute —
 * usually colour. Filtered to only show colours available for the
 * selected Level 1 value.
 *   [Black]  [Titanium]  [White]
 *
 * When a user clicks a Level 1 button the Level 2 buttons update.
 * Clicking a Level 2 button (or a Level 1 when there's no L2) navigates
 * to the selected variant's PDP.
 *
 * Labels never show GTINs — they use the extracted attribute values.
 * If no attribute could be extracted, the chip shows "Standard".
 */
export function VariantSelector({
  siblings,
  category = "",
  className = "",
}: VariantSelectorProps) {
  if (siblings.length <= 1) return null;

  // ── Extract attributes for every sibling ──
  const enriched = useMemo(() => {
    return siblings.map((s) => {
      // If the product carries displayAttributes JSON, parse it.
      // Otherwise fall back to title-based extraction.
      const attrs = extractAttributes(
        s.sizeLabel || "",
        "",
        category,
      );
      // Never show "Standard" — use variantLabel() which falls back
      // to a meaningful title fragment when no attribute is extractable.
      const primaryVal = attrs.primary?.value
        ?? variantLabel(s.sizeLabel, s.sizeLabel || s.gtin, "", category);
      return {
        ...s,
        attrs,
        primaryValue: primaryVal,
        secondaryValue: attrs.secondary?.value ?? null,
      };
    });
  }, [siblings, category]);

  // ── Derive unique Level 1 values (ordered by appearance) ──
  const primaryKey = enriched[0]?.attrs.primary?.key ?? "size";
  const primaryValues = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const e of enriched) {
      if (!seen.has(e.primaryValue)) {
        seen.add(e.primaryValue);
        out.push(e.primaryValue);
      }
    }
    return out;
  }, [enriched]);

  // ── State: which Level 1 is selected ──
  const currentSibling = enriched.find((e) => e.isCurrent);
  const [selectedPrimary, setSelectedPrimary] = useState<string>(
    currentSibling?.primaryValue ?? primaryValues[0] ?? "Variante",
  );

  // ── Level 2: siblings matching the selected primary, grouped by secondary ──
  const level2Siblings = useMemo(
    () => enriched.filter((e) => e.primaryValue === selectedPrimary),
    [enriched, selectedPrimary],
  );

  const hasLevel2 = level2Siblings.some((s) => s.secondaryValue != null);
  const secondaryKey = enriched[0]?.attrs.secondary?.key ?? "color";

  const cheapestPrice = siblings.reduce((min, s) => Math.min(min, s.priceChf), Infinity);

  // When there's only one primary value, skip Level 1 entirely and
  // show all siblings as a flat list (like the old selector).
  const showTwoLevels = primaryValues.length > 1;

  return (
    <div className={`rounded-2xl border border-black/[0.06] bg-white p-4 ${className}`}>
      {/* ── Level 1: Primary attribute ── */}
      {showTwoLevels && (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
              {attributeLabel(primaryKey)} wählen
            </p>
            <p className="text-[11px] text-gray-400">
              {primaryValues.length} Optionen
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {primaryValues.map((val) => {
              const isSelected = val === selectedPrimary;
              const cheapestInGroup = enriched
                .filter((e) => e.primaryValue === val)
                .reduce((min, e) => Math.min(min, e.priceChf), Infinity);
              return (
                <button
                  key={val}
                  onClick={() => setSelectedPrimary(val)}
                  className={`flex min-h-[40px] min-w-[72px] flex-col items-center justify-center rounded-xl border px-3 py-1.5 transition ${
                    isSelected
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <span className="text-[13px] font-semibold tracking-tight">{val}</span>
                  <span className={`text-[10px] ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                    ab CHF {formatChf(cheapestInGroup)}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── Variants — single unified group (no more "Grösse" + "Variante" double header) ── */}
      <div className={showTwoLevels ? "mt-4 border-t border-gray-100 pt-4" : ""}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
            {showTwoLevels && hasLevel2
              ? `${attributeLabel(secondaryKey)} wählen`
              : `Variante wählen`}
          </p>
          <p className="text-[11px] text-gray-400">
            {(showTwoLevels ? level2Siblings : enriched).length} verfügbar
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(showTwoLevels ? level2Siblings : enriched).map((s) => {
            const isCheapest = s.priceChf === cheapestPrice;
            // NEVER show GTINs or "Standard" — use the secondary value,
            // the extracted primary, or a meaningful title fragment.
            const label = hasLevel2 && s.secondaryValue
              ? s.secondaryValue
              : s.primaryValue;

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
                  <span className="text-[13px] font-semibold tracking-tight">{label}</span>
                  <span className={`text-[11px] ${s.isCurrent ? "text-white/70" : "text-gray-500"}`}>
                    CHF {formatChf(s.priceChf)}
                  </span>
                </Link>

                {isCheapest && !s.isCurrent && (
                  <span className="mt-1 text-center text-[9px] font-semibold uppercase tracking-wider text-emerald-600">
                    günstigste
                  </span>
                )}

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
      </div>

      <p className="mt-3 text-[11px] text-gray-400">
        Deep-Link direkt zur jeweiligen Variante beim Händler verfügbar.
      </p>
    </div>
  );
}
