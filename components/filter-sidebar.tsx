"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronUp, X, SlidersHorizontal } from "lucide-react";
import { formatChf } from "@/lib/pricing/format";
import type { Facet, ActiveFilters } from "@/lib/facets";

interface FilterSidebarProps {
  facets: Facet[];
  activeFilters: ActiveFilters;
  onFilterChange: (key: string, value: string, selected: boolean) => void;
  onClearAll: () => void;
  priceMin: string;
  priceMax: string;
  onPriceMinChange: (v: string) => void;
  onPriceMaxChange: (v: string) => void;
  priceRange: { min: number; max: number };
  activeFilterCount: number;
}

/**
 * Galaxus-style dynamic filter sidebar for category pages.
 *
 * - Top 3 facets render as open accordions
 * - Remaining facets collapse under "Mehr Filter"
 * - Price range with min/max inputs
 * - Each value shows its product count
 * - "Filter zurücksetzen" clears everything
 */
export function FilterSidebar({
  facets,
  activeFilters,
  onFilterChange,
  onClearAll,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  priceRange,
  activeFilterCount,
}: FilterSidebarProps) {
  // Top 3 facets are open by default; rest collapsed under "Mehr Filter"
  const [showMore, setShowMore] = useState(false);
  const topFacets = facets.slice(0, 3);
  const moreFacets = facets.slice(3);

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-900">
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-[#D81E05] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-[11px] font-medium text-[#0076bd] hover:underline"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {/* Price Range — always visible */}
      <PriceRangeFilter
        priceMin={priceMin}
        priceMax={priceMax}
        onPriceMinChange={onPriceMinChange}
        onPriceMaxChange={onPriceMaxChange}
        range={priceRange}
      />

      {/* Top 3 facets — open by default */}
      {topFacets.map((facet) => (
        <FacetAccordion
          key={facet.key}
          facet={facet}
          selected={activeFilters[facet.key] ?? new Set()}
          onToggle={(value, sel) => onFilterChange(facet.key, value, sel)}
          defaultOpen
        />
      ))}

      {/* More filters — collapsed until clicked */}
      {moreFacets.length > 0 && (
        <>
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <span>Mehr Filter ({moreFacets.length})</span>
            {showMore ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showMore &&
            moreFacets.map((facet) => (
              <FacetAccordion
                key={facet.key}
                facet={facet}
                selected={activeFilters[facet.key] ?? new Set()}
                onToggle={(value, sel) => onFilterChange(facet.key, value, sel)}
                defaultOpen={false}
              />
            ))}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Price Range Filter
// ─────────────────────────────────────────────────────────────────────

function PriceRangeFilter({
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  range,
}: {
  priceMin: string;
  priceMax: string;
  onPriceMinChange: (v: string) => void;
  onPriceMaxChange: (v: string) => void;
  range: { min: number; max: number };
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
        Preis (CHF)
      </p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          placeholder={`${Math.floor(range.min)}`}
          value={priceMin}
          onChange={(e) => onPriceMinChange(e.target.value)}
          className="h-8 w-full rounded border border-gray-200 px-2 text-[12px] text-gray-800 outline-none focus:border-[#0076bd]"
          min={0}
        />
        <span className="text-[11px] text-gray-400">–</span>
        <input
          type="number"
          placeholder={`${Math.ceil(range.max)}`}
          value={priceMax}
          onChange={(e) => onPriceMaxChange(e.target.value)}
          className="h-8 w-full rounded border border-gray-200 px-2 text-[12px] text-gray-800 outline-none focus:border-[#0076bd]"
          min={0}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Facet Accordion — one per attribute key (brand, storage, color, …)
// ─────────────────────────────────────────────────────────────────────

function FacetAccordion({
  facet,
  selected,
  onToggle,
  defaultOpen,
}: {
  facet: Facet;
  selected: Set<string>;
  onToggle: (value: string, selected: boolean) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);
  const VISIBLE_LIMIT = 6;

  const visibleValues = showAll ? facet.values : facet.values.slice(0, VISIBLE_LIMIT);
  const hasMore = facet.values.length > VISIBLE_LIMIT;
  const activeCount = selected.size;

  return (
    <div className="rounded-lg border border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold text-gray-800">
          {facet.label}
          {activeCount > 0 && (
            <span className="rounded-full bg-gray-900 px-1.5 py-0.5 text-[9px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-3 pb-3 pt-2">
          {visibleValues.map((fv) => {
            const isSelected = selected.has(fv.value);
            return (
              <label
                key={fv.value}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-[5px] text-[12px] transition hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(fv.value, !isSelected)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-[#0076bd] focus:ring-[#0076bd]"
                />
                <span className={`flex-1 truncate ${isSelected ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                  {fv.value}
                </span>
                <span className="shrink-0 text-[10px] text-gray-400">
                  ({fv.count})
                </span>
              </label>
            );
          })}

          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-1 text-[11px] font-medium text-[#0076bd] hover:underline"
            >
              {showAll ? "Weniger anzeigen" : `Alle ${facet.values.length} anzeigen`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
