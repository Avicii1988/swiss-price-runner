"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ExternalLink } from "lucide-react";
import { formatChf } from "@/lib/pricing/format";
import { extractAttributes, attributeLabel, isGtin } from "@/lib/attributes";
import type { VariantSibling } from "@/lib/data";

interface VariantSelectorProps {
  siblings: VariantSibling[];
  category?: string;
  className?: string;
}

// Common color → hex swatch palette. Falls back to a neutral grey
// gradient when the color name isn't in this list, so users still see
// a coloured circle and can disambiguate by label.
const COLOR_SWATCHES: Record<string, string> = {
  schwarz: "#1D1D1F", black: "#1D1D1F", anthrazit: "#2a2a2a", graphite: "#3a3a3a",
  weiss: "#F5F5F7", weiß: "#F5F5F7", white: "#F5F5F7", ivory: "#f3ead4",
  cream: "#f1e8d4", creme: "#f1e8d4", porcelain: "#efe8df", starlight: "#efe8df",
  silber: "#c4c8cc", silver: "#c4c8cc", gold: "#d4af37", titanium: "#A6A9AA", titan: "#A6A9AA",
  bronze: "#c08c5d", kupfer: "#b87333", grau: "#9aa0a6", gray: "#9aa0a6", grey: "#9aa0a6",
  rot: "#dc2626", red: "#dc2626", bordeaux: "#5e1b1b", coral: "#ff6f61",
  blau: "#2B3541", blue: "#2B3541", navy: "#0b1e3f", "sierra blue": "#5a8aa8",
  "pacific blue": "#1a405d", "alpine green": "#3a5c46", petrol: "#005f73",
  iris: "#a3a8e2", lavender: "#c8b8e0", lila: "#7c3aed", violett: "#7c3aed", purple: "#7c3aed",
  "deep purple": "#4b2c80", grün: "#16a34a", green: "#16a34a", gruen: "#16a34a", mint: "#a7e3c2", khaki: "#7d7a4a",
  gelb: "#facc15", yellow: "#facc15", orange: "#f97316",
  rosa: "#f9a8d4", pink: "#ec4899", peony: "#e94f7f",
  beige: "#d8c9a3", taupe: "#a99078", braun: "#7c4a2a", brown: "#7c4a2a", natur: "#c2a878",
  midnight: "#1b1d2a", obsidian: "#0f0f12", "phantom black": "#0a0a0a",
  "natural titanium": "#A6A9AA", "desert titanium": "#c1a47e", "blue titanium": "#2B3541",
};

function colorSwatch(name: string): string {
  const k = name.trim().toLowerCase();
  return COLOR_SWATCHES[k] ?? "linear-gradient(135deg, #d4d4d8, #71717a)";
}

/**
 * Two-level variant selector for the PDP.
 *
 *   Level 1 (Spec, rectangles): storage, size, volume — clean buttons
 *     with the value + price.
 *   Level 2 (Color, swatches): coloured circles labelled with the
 *     colour name; selected state shows a black ring.
 *
 * Labels are diff-derived: if neither feed attributes nor regex
 * extraction yield a value, we look at the words that distinguish each
 * sibling's title from the shared base and use those instead. GTINs are
 * blocked at every step.
 */
export function VariantSelector({
  siblings,
  category = "",
  className = "",
}: VariantSelectorProps) {
  if (siblings.length <= 1) return null;

  const enriched = useMemo(() => {
    const raw = siblings.map((s) => ({
      ...s,
      attrs: extractAttributes(s.title, "", s.category || category),
    }));

    // Diff pass: tokens unique to each title vs. all the others.
    const allTitleWords = raw.map((r) =>
      r.title
        .toLowerCase()
        .replace(/[^a-zäöüéàèç0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length >= 2 && !isGtin(w)),
    );
    const commonWords = new Set<string>();
    if (allTitleWords.length > 0) {
      for (const w of allTitleWords[0]) {
        if (allTitleWords.every((tw) => tw.includes(w))) commonWords.add(w);
      }
    }

    return raw.map((s, i) => {
      // Primary label priority:
      //   1. sizeLabel from feed (g:size) — direct from merchant, most accurate
      //   2. extractAttributes regex (storage/volume/size from title)
      //   2.5. Hard GB/TB regex directly on title — emergency catch for feeds
      //        that don't export g:size but do include "128GB" in the title
      //   3. Diff — unique tokens this sibling has vs. all others
      //   4. "Standard" as last resort
      let primary: string | null = null;

      // Client-side defense: reject stored sizeLabels that are cellular
      // generation strings (5G, 4G, 3G, 2G) — these can leak from feeds
      // that tag g:size with the connectivity standard rather than capacity.
      const isNetworkGen = (v: string) => /^\d+\s?G$/i.test(v.trim());

      if (s.sizeLabel && !isGtin(s.sizeLabel) && s.sizeLabel !== "Standard" && !isNetworkGen(s.sizeLabel)) {
        primary = s.sizeLabel;
      }
      if (!primary) {
        const extracted = s.attrs.primary?.value ?? null;
        if (extracted && !isGtin(extracted)) primary = extracted;
      }
      // Priority 2.5 — hard GB/TB regex directly on title
      if (!primary) {
        const gbMatch = s.title.match(/(\d+)\s?(GB|TB|go|to)\b/i);
        if (gbMatch) {
          const num = gbMatch[1];
          const rawUnit = gbMatch[2].toLowerCase();
          const unit = rawUnit === "go" ? "GB" : rawUnit === "to" ? "TB" : rawUnit.toUpperCase();
          primary = `${num}${unit}`;
        }
      }
      if (!primary) {
        const uniqueWords = allTitleWords[i]
          .filter((w) => !commonWords.has(w))
          .slice(0, 3);
        if (uniqueWords.length > 0) {
          primary = uniqueWords.join(" ");
          primary = primary.charAt(0).toUpperCase() + primary.slice(1);
        }
      }

      // Secondary (color) — feed extractor first, then diff-based colour words
      let secondary = s.attrs.secondary?.value ?? null;
      if (secondary && isGtin(secondary)) secondary = null;
      if (!secondary) {
        const colourCandidates = allTitleWords[i].filter((w) =>
          !commonWords.has(w) && Object.prototype.hasOwnProperty.call(COLOR_SWATCHES, w),
        );
        if (colourCandidates[0]) {
          secondary = colourCandidates[0].charAt(0).toUpperCase() + colourCandidates[0].slice(1);
        }
      }

      // Absolute fallback — "Standard" instead of "Variante A/B/C".
      // If even the diff produced nothing, strip brand from title and
      // use the first 22 chars so the button is at least informative.
      if (!primary) {
        const cleaned = s.title.replace(new RegExp(`^${s.brand}\\s*`, "i"), "").trim();
        primary = cleaned.length >= 3 ? cleaned.slice(0, 22) : "Standard";
      }
      if (primary.length > 22) primary = primary.slice(0, 21) + "…";

      return { ...s, primaryValue: primary, secondaryValue: secondary };
    });
  }, [siblings, category]);

  const primaryKey = enriched[0]?.attrs?.primary?.key ?? "size";

  // Distinct primary values, preserving insertion order
  const primaryValues = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const e of enriched) {
      if (!seen.has(e.primaryValue)) { seen.add(e.primaryValue); out.push(e.primaryValue); }
    }
    return out;
  }, [enriched]);

  // Distinct secondary (color) values across the whole sibling set
  const allSecondaryValues = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const e of enriched) {
      if (!e.secondaryValue) continue;
      if (!seen.has(e.secondaryValue)) { seen.add(e.secondaryValue); out.push(e.secondaryValue); }
    }
    return out;
  }, [enriched]);

  const currentSibling = enriched.find((e) => e.isCurrent);
  const [selectedPrimary, setSelectedPrimary] = useState<string>(
    currentSibling?.primaryValue ?? primaryValues[0] ?? "Standard",
  );

  const level2Siblings = useMemo(
    () => enriched.filter((e) => e.primaryValue === selectedPrimary),
    [enriched, selectedPrimary],
  );

  const hasLevel2 = allSecondaryValues.length > 0;
  const showPrimary = primaryValues.length > 1;

  const cheapestPrice = siblings.reduce((min, s) => Math.min(min, s.priceChf), Infinity);

  return (
    <div className={`rounded-2xl border border-black/[0.06] bg-white p-4 ${className}`}>
      {/* ── Level 1 — Spec, clean rectangular buttons ── */}
      {showPrimary && (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
              {attributeLabel(primaryKey)} wählen
            </p>
            <p className="text-[11px] text-gray-400">{primaryValues.length} Optionen</p>
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
                  className={`flex min-h-[52px] min-w-[88px] max-w-[160px] flex-col items-center justify-center rounded-lg border px-3 py-2 transition ${
                    isSelected
                      ? "border-gray-900 bg-white text-gray-900 shadow-[inset_0_0_0_1px_#111]"
                      : "border-gray-200 bg-white text-gray-800 hover:border-gray-400"
                  }`}
                >
                  <span className="max-w-[140px] truncate text-[14px] font-semibold tracking-tight">{val}</span>
                  <span className="text-[11px] font-normal text-gray-500">
                    ab CHF {formatChf(cheapestInGroup)}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── Level 2 — Color swatches (circles) ── */}
      {hasLevel2 ? (
        <div className={showPrimary ? "mt-5 border-t border-gray-100 pt-5" : ""}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
              {attributeLabel("color")} wählen
            </p>
            <p className="text-[11px] text-gray-400">
              {level2Siblings.filter((s) => s.secondaryValue).length} verfügbar
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            {level2Siblings.map((s) => {
              if (!s.secondaryValue) return null;
              const isCheapest = s.priceChf === cheapestPrice;
              const swatch = colorSwatch(s.secondaryValue);
              return (
                <div key={s.gtin} className="flex flex-col items-center">
                  <Link
                    href={s.productUrl as Route}
                    aria-current={s.isCurrent ? "page" : undefined}
                    aria-label={s.secondaryValue}
                    className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition ${
                      s.isCurrent
                        ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2"
                        : "border-white ring-1 ring-gray-200 hover:ring-gray-400"
                    }`}
                    style={{ background: swatch }}
                    title={s.secondaryValue}
                  />
                  <span className="mt-1.5 max-w-[80px] truncate text-[11px] text-gray-700">
                    {s.secondaryValue}
                  </span>
                  <span className="text-[10px] font-normal text-gray-500">
                    CHF {formatChf(s.priceChf)}
                  </span>
                  {isCheapest && !s.isCurrent && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600">
                      günstigste
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // No color axis — render the primary values directly (rectangles)
        // when there's only a single primary attribute and no colour to pick.
        !showPrimary && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
              Modell wählen
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {enriched.map((s) => {
                const isCheapest = s.priceChf === cheapestPrice;
                return (
                  <div key={s.gtin} className="group/variant relative flex flex-col">
                    <Link
                      href={s.productUrl as Route}
                      aria-current={s.isCurrent ? "page" : undefined}
                      className={`flex min-h-[52px] min-w-[88px] max-w-[160px] flex-col items-center justify-center rounded-lg border px-3 py-2 transition ${
                        s.isCurrent
                          ? "border-gray-900 bg-white text-gray-900 shadow-[inset_0_0_0_1px_#111]"
                          : "border-gray-200 bg-white text-gray-800 hover:border-gray-400"
                      }`}
                    >
                      <span className="max-w-[140px] truncate text-[14px] font-semibold tracking-tight">{s.primaryValue}</span>
                      <span className="text-[11px] font-normal text-gray-500">
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
                        aria-label={`${s.primaryValue} beim Händler öffnen`}
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
        )
      )}

      <p className="mt-4 text-[11px] text-gray-400">
        Deep-Link direkt zur jeweiligen Variante beim Händler verfügbar.
      </p>
    </div>
  );
}
