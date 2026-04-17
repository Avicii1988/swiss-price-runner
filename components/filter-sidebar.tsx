"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
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
  /** Total products matching current filters — shown on mobile CTA. */
  resultCount?: number;
}

// ═══════════════════════════════════════════════════════════════════
// Beliebte Filter (Popular Quick-Toggle Pills)
// ═══════════════════════════════════════════════════════════════════

function PopularPills({
  facets,
  activeFilters,
  onToggle,
  priceMax,
  onPriceMaxChange,
}: {
  facets: Facet[];
  activeFilters: ActiveFilters;
  onToggle: (key: string, value: string, selected: boolean) => void;
  priceMax: string;
  onPriceMaxChange: (v: string) => void;
}) {
  // Pick the top 2 values from the first 2 facets + a price shortcut
  const pills: { key: string; value: string; label: string }[] = [];
  for (const f of facets.slice(0, 2)) {
    for (const v of f.values.slice(0, 2)) {
      pills.push({ key: f.key, value: v.value, label: v.value });
    }
  }

  if (pills.length === 0) return null;

  const priceActive = priceMax === "200";

  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
        Beliebte Filter
      </p>
      <div className="flex flex-wrap gap-2">
        {pills.map((p) => {
          const isActive = activeFilters[p.key]?.has(p.value);
          return (
            <button
              key={`${p.key}-${p.value}`}
              onClick={() => onToggle(p.key, p.value, !isActive)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${
                isActive
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <button
          onClick={() => onPriceMaxChange(priceActive ? "" : "200")}
          className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${
            priceActive
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          Unter CHF 200
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Dropdown Button — one per facet in the horizontal filter bar
// ═══════════════════════════════════════════════════════════════════

function FilterDropdown({
  facet,
  selected,
  onToggle,
}: {
  facet: Facet;
  selected: Set<string>;
  onToggle: (value: string, selected: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);
  const LIMIT = 8;

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const activeCount = selected.size;
  const visible = showAll ? facet.values : facet.values.slice(0, LIMIT);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition ${
          activeCount > 0
            ? "border-gray-900 bg-gray-900 text-white"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
        }`}
      >
        {facet.label}
        {activeCount > 0 && (
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white/20 px-1 text-[10px] font-bold">
            {activeCount}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""} ${activeCount > 0 ? "text-white/70" : "text-gray-400"}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="max-h-[320px] overflow-y-auto p-2">
            {visible.map((fv) => {
              const isSelected = selected.has(fv.value);
              return (
                <label
                  key={fv.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(fv.value, !isSelected)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className={`flex-1 ${isSelected ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                    {fv.value}
                  </span>
                  <span className="shrink-0 text-[11px] text-gray-400">
                    {fv.count}
                  </span>
                </label>
              );
            })}
          </div>
          {facet.values.length > LIMIT && (
            <div className="border-t border-gray-100 px-3 py-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-[12px] font-medium text-[#0076bd] hover:underline"
              >
                {showAll ? "Weniger" : `Alle ${facet.values.length} anzeigen`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Price Dropdown — min/max inputs in a dropdown
// ═══════════════════════════════════════════════════════════════════

function PriceDropdown({
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasValue = priceMin !== "" || priceMax !== "";

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition ${
          hasValue
            ? "border-gray-900 bg-gray-900 text-white"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
        }`}
      >
        Preis
        {hasValue && (
          <span className="text-[11px] font-normal text-white/70">
            {priceMin || "0"} – {priceMax || "∞"}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""} ${hasValue ? "text-white/70" : "text-gray-400"}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[240px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
            Preis (CHF)
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-gray-400">Von</label>
              <input
                type="number"
                placeholder={`${Math.floor(range.min)}`}
                value={priceMin}
                onChange={(e) => onPriceMinChange(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-gray-200 px-2.5 text-[13px] text-gray-800 outline-none focus:border-gray-900"
                min={0}
              />
            </div>
            <span className="mt-4 text-gray-300">–</span>
            <div className="flex-1">
              <label className="text-[10px] text-gray-400">Bis</label>
              <input
                type="number"
                placeholder={`${Math.ceil(range.max)}`}
                value={priceMax}
                onChange={(e) => onPriceMaxChange(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-gray-200 px-2.5 text-[13px] text-gray-800 outline-none focus:border-gray-900"
                min={0}
              />
            </div>
          </div>
          {hasValue && (
            <button
              onClick={() => { onPriceMinChange(""); onPriceMaxChange(""); }}
              className="mt-3 text-[12px] font-medium text-[#0076bd] hover:underline"
            >
              Zurücksetzen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Mobile Filter Drawer
// ═══════════════════════════════════════════════════════════════════

function MobileFilterDrawer({
  open,
  onClose,
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
  resultCount,
}: FilterSidebarProps & { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white lg:hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-600" />
          <span className="text-[15px] font-semibold text-gray-900">Filter</span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Price range */}
        <div className="mb-5">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-gray-500">Preis (CHF)</p>
          <div className="flex items-center gap-3">
            <input type="number" placeholder={`${Math.floor(priceRange.min)}`} value={priceMin}
              onChange={(e) => onPriceMinChange(e.target.value)}
              className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-[14px] outline-none focus:border-gray-900" />
            <span className="text-gray-300">–</span>
            <input type="number" placeholder={`${Math.ceil(priceRange.max)}`} value={priceMax}
              onChange={(e) => onPriceMaxChange(e.target.value)}
              className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-[14px] outline-none focus:border-gray-900" />
          </div>
        </div>

        {/* Facets as accordions */}
        {facets.map((facet) => (
          <MobileFacetAccordion
            key={facet.key}
            facet={facet}
            selected={activeFilters[facet.key] ?? new Set()}
            onToggle={(value, sel) => onFilterChange(facet.key, value, sel)}
          />
        ))}
      </div>

      {/* Footer — sticky CTA */}
      <div className="border-t border-gray-200 px-4 py-3">
        <div className="flex gap-3">
          {activeFilterCount > 0 && (
            <button onClick={onClearAll}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-[14px] font-semibold text-gray-700 transition hover:bg-gray-50">
              Zurücksetzen
            </button>
          )}
          <button onClick={onClose}
            className="flex-1 rounded-xl bg-gray-900 py-3 text-[14px] font-semibold text-white transition hover:bg-gray-800">
            {resultCount != null ? `${resultCount.toLocaleString("de-CH")} Ergebnisse anzeigen` : "Ergebnisse anzeigen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileFacetAccordion({
  facet,
  selected,
  onToggle,
}: {
  facet: Facet;
  selected: Set<string>;
  onToggle: (value: string, selected: boolean) => void;
}) {
  const [open, setOpen] = useState(selected.size > 0);
  const [showAll, setShowAll] = useState(false);
  const LIMIT = 6;
  const visible = showAll ? facet.values : facet.values.slice(0, LIMIT);

  return (
    <div className="mb-3 rounded-xl border border-gray-200">
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="text-[14px] font-semibold text-gray-800">
          {facet.label}
          {selected.size > 0 && <span className="ml-2 text-[12px] font-normal text-[#0076bd]">{selected.size} gewählt</span>}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-gray-100 px-4 pb-3 pt-1">
          {visible.map((fv) => (
            <label key={fv.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg py-2 text-[14px]">
              <input type="checkbox" checked={selected.has(fv.value)}
                onChange={() => onToggle(fv.value, !selected.has(fv.value))}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
              <span className={`flex-1 ${selected.has(fv.value) ? "font-semibold" : ""}`}>{fv.value}</span>
              <span className="text-[12px] text-gray-400">{fv.count}</span>
            </label>
          ))}
          {facet.values.length > LIMIT && (
            <button onClick={() => setShowAll(!showAll)}
              className="mt-1 text-[13px] font-medium text-[#0076bd]">
              {showAll ? "Weniger" : `Alle ${facet.values.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Export — Desktop horizontal bar + Mobile drawer toggle
// ═══════════════════════════════════════════════════════════════════

export function FilterSidebar(props: FilterSidebarProps) {
  const {
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
    resultCount,
  } = props;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const topFacets = facets.slice(0, 4);
  const moreFacets = facets.slice(4);

  // Active filter chips — shown below the dropdown bar so users see
  // what's selected without reopening each dropdown.
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; value: string }[] = [];
    for (const facet of facets) {
      const sel = activeFilters[facet.key];
      if (!sel) continue;
      for (const v of sel) chips.push({ key: facet.key, label: facet.label, value: v });
    }
    return chips;
  }, [facets, activeFilters]);

  return (
    <>
      {/* ── Popular pills ── */}
      <PopularPills
        facets={facets}
        activeFilters={activeFilters}
        onToggle={onFilterChange}
        priceMax={priceMax}
        onPriceMaxChange={onPriceMaxChange}
      />

      {/* ── Desktop: horizontal dropdown bar ── */}
      <div className="mb-4 hidden flex-wrap items-center gap-2 lg:flex">
        {topFacets.map((f) => (
          <FilterDropdown
            key={f.key}
            facet={f}
            selected={activeFilters[f.key] ?? new Set()}
            onToggle={(v, s) => onFilterChange(f.key, v, s)}
          />
        ))}
        <PriceDropdown
          priceMin={priceMin}
          priceMax={priceMax}
          onPriceMinChange={onPriceMinChange}
          onPriceMaxChange={onPriceMaxChange}
          range={priceRange}
        />
        {moreFacets.length > 0 && (
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-medium text-gray-600 transition hover:border-gray-400"
          >
            Mehr Filter
            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition ${showMore ? "rotate-180" : ""}`} />
          </button>
        )}
        {activeFilterCount > 0 && (
          <button
            onClick={onClearAll}
            className="ml-auto text-[12px] font-medium text-[#0076bd] hover:underline"
          >
            Alle zurücksetzen
          </button>
        )}
      </div>

      {/* Extra dropdowns row */}
      {showMore && moreFacets.length > 0 && (
        <div className="mb-4 hidden flex-wrap items-center gap-2 lg:flex">
          {moreFacets.map((f) => (
            <FilterDropdown
              key={f.key}
              facet={f}
              selected={activeFilters[f.key] ?? new Set()}
              onToggle={(v, s) => onFilterChange(f.key, v, s)}
            />
          ))}
        </div>
      )}

      {/* Active filter chips — quick-remove */}
      {activeChips.length > 0 && (
        <div className="mb-4 hidden flex-wrap items-center gap-1.5 lg:flex">
          {activeChips.map((chip) => (
            <button
              key={`${chip.key}-${chip.value}`}
              onClick={() => onFilterChange(chip.key, chip.value, false)}
              className="flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-2.5 pr-1.5 text-[12px] font-medium text-gray-700 transition hover:bg-gray-200"
            >
              {chip.value}
              <X className="h-3 w-3 text-gray-400" />
            </button>
          ))}
        </div>
      )}

      {/* ── Mobile: filter button ── */}
      <div className="mb-4 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-[14px] font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      <MobileFilterDrawer
        {...props}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
    </>
  );
}
