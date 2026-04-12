"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, RotateCcw, X, SlidersHorizontal } from "lucide-react";

// ── Category-specific filter configs ─────────────────────────

const PARFUM_SIZES = ["30ml", "50ml", "75ml", "100ml", "125ml", "150ml", "200ml"];
const PARFUM_NOTES = ["Blumig", "Holzig", "Orientalisch", "Frisch", "Zitrisch", "Süss", "Würzig"];
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

interface FilterBarProps {
  brands: string[];
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
  priceMin: string;
  priceMax: string;
  onPriceMinChange: (v: string) => void;
  onPriceMaxChange: (v: string) => void;
  rating: number | null;
  onRatingChange: (r: number | null) => void;
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
  dealsOnly?: boolean;
  onDealsOnlyChange?: (v: boolean) => void;
  activeFilterCount: number;
  onClearAll: () => void;
  /** Category slug — determines which filters to show */
  categorySlug?: string;
}

const COLORS = [
  { name: "Schwarz", value: "black", hex: "#000000" },
  { name: "Weiss", value: "white", hex: "#FFFFFF" },
  { name: "Grau", value: "gray", hex: "#9CA3AF" },
  { name: "Rot", value: "red", hex: "#EF4444" },
  { name: "Blau", value: "blue", hex: "#3B82F6" },
  { name: "Grün", value: "green", hex: "#22C55E" },
  { name: "Gold", value: "gold", hex: "#EAB308" },
  { name: "Rosa", value: "pink", hex: "#EC4899" },
];

/** Detect category type for dynamic filters */
function getCategoryType(slug?: string): "parfum" | "mode" | "default" {
  if (!slug) return "default";
  const s = slug.toLowerCase();
  if (["parfum", "herrendufte", "damendufte", "unisex-dufte", "geschenksets"].includes(s)) return "parfum";
  if (["mode", "schuhe", "koerperpflege"].includes(s)) return "mode";
  return "default";
}

export function FilterBar({
  brands,
  selectedBrands,
  onBrandsChange,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  rating,
  onRatingChange,
  selectedColors,
  onColorsChange,
  dealsOnly = false,
  onDealsOnlyChange,
  activeFilterCount,
  onClearAll,
  categorySlug,
}: FilterBarProps) {
  const catType = getCategoryType(categorySlug);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="mb-5">
      {/* Mobile: single Filter button opens fullscreen modal */}
      <div className="sm:hidden">
        <button onClick={() => setMobileOpen(true)}
          className="flex w-full items-center justify-between rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[13px] text-gray-700">
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Desktop filter grid — Galaxus style: 3 columns */}
      <div className="hidden grid-cols-1 gap-2 sm:grid sm:grid-cols-3">
        {/* Marke — always shown */}
        <FilterDrop label="Marke" active={selectedBrands.length > 0} count={selectedBrands.length}>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {brands.map((brand) => (
              <label key={brand} className="flex cursor-pointer items-center gap-2 rounded px-2.5 py-1.5 text-[13px] hover:bg-gray-100">
                <input type="checkbox" checked={selectedBrands.includes(brand)}
                  onChange={() => onBrandsChange(selectedBrands.includes(brand) ? selectedBrands.filter((b) => b !== brand) : [...selectedBrands, brand])}
                  className="accent-[#0076bd]" />
                {brand}
              </label>
            ))}
          </div>
        </FilterDrop>

        {/* Preis — always shown */}
        <FilterDrop label="Preis" active={!!(priceMin || priceMax)}>
          <div className="p-3">
            <p className="mb-2 text-xs text-gray-500">Preisbereich (CHF)</p>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" value={priceMin} onChange={(e) => onPriceMinChange(e.target.value)}
                className="w-24 rounded border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#0076bd]" />
              <span className="text-gray-400">–</span>
              <input type="number" placeholder="Max" value={priceMax} onChange={(e) => onPriceMaxChange(e.target.value)}
                className="w-24 rounded border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#0076bd]" />
            </div>
          </div>
        </FilterDrop>

        {/* Bewertung */}
        <FilterDrop label="Bewertung" active={rating !== null}>
          <div className="p-1.5">
            {[4, 3, 2, 1].map((r) => (
              <button key={r} onClick={() => onRatingChange(rating === r ? null : r)}
                className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm ${rating === r ? "bg-gray-100 font-medium" : "hover:bg-gray-50"}`}>
                <span className="flex">{Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={i < r ? "text-yellow-400" : "text-gray-300"}>★</span>
                ))}</span>
                <span className="text-gray-600">& mehr</span>
              </button>
            ))}
          </div>
        </FilterDrop>

        {/* ── Category-specific filters ── */}

        {/* Parfum: Grösse */}
        {catType === "parfum" && (
          <FilterDrop label="Grösse" active={false}>
            <div className="grid grid-cols-3 gap-1 p-2">
              {PARFUM_SIZES.map((size) => (
                <button key={size} className="rounded border border-gray-200 px-3 py-1.5 text-xs hover:border-[#0076bd] hover:text-[#0076bd]">
                  {size}
                </button>
              ))}
            </div>
          </FilterDrop>
        )}

        {/* Parfum: Duftnote */}
        {catType === "parfum" && (
          <FilterDrop label="Duftnote" active={false}>
            <div className="p-1.5">
              {PARFUM_NOTES.map((note) => (
                <button key={note} className="flex w-full rounded px-3 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-50">
                  {note}
                </button>
              ))}
            </div>
          </FilterDrop>
        )}

        {/* Mode/Schuhe: Grösse */}
        {catType === "mode" && (
          <FilterDrop label="Grösse" active={false}>
            <div className="grid grid-cols-3 gap-1 p-2">
              {CLOTHING_SIZES.map((size) => (
                <button key={size} className="rounded border border-gray-200 px-3 py-1.5 text-xs hover:border-[#0076bd] hover:text-[#0076bd]">
                  {size}
                </button>
              ))}
            </div>
          </FilterDrop>
        )}

        {/* Farbe — mode + default */}
        {catType !== "parfum" && (
          <FilterDrop label="Farbe" active={selectedColors.length > 0} count={selectedColors.length}>
            <div className="grid grid-cols-4 gap-2 p-2.5">
              {COLORS.map((c) => {
                const sel = selectedColors.includes(c.value);
                return (
                  <button key={c.value} onClick={() => onColorsChange(sel ? selectedColors.filter((v) => v !== c.value) : [...selectedColors, c.value])}
                    className={`flex flex-col items-center gap-1 rounded p-1.5 ${sel ? "ring-1 ring-[#0076bd]" : "hover:bg-gray-50"}`}>
                    <span className="h-5 w-5 rounded-full border border-gray-200" style={{ backgroundColor: c.hex }} />
                    <span className="text-[10px] text-gray-500">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </FilterDrop>
        )}

        {/* Angebote */}
        <FilterDrop label="Angebote" active={dealsOnly}>
          <div className="p-2.5">
            <label className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-[13px] hover:bg-gray-50">
              <input type="checkbox" checked={dealsOnly} onChange={(e) => onDealsOnlyChange?.(e.target.checked)} className="accent-[#0076bd]" />
              Nur reduzierte Produkte
            </label>
          </div>
        </FilterDrop>

      </div>

      {/* Reset below grid (desktop) */}
      {activeFilterCount > 0 && (
        <button onClick={onClearAll} className="mt-3 hidden items-center gap-1 text-[12px] text-[#0076bd] hover:text-[#005a94] sm:flex">
          <RotateCcw className="h-3 w-3" /> Filter zurücksetzen
        </button>
      )}

      {/* ═══ Mobile Filter Modal (Galaxus-style) ═══ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] bg-white sm:hidden">
          <div className="rainbow-bar" />
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h2 className="text-[22px] font-bold text-gray-900">Filter</h2>
            <button onClick={() => setMobileOpen(false)} className="text-gray-400">
              <X className="h-6 w-6" />
            </button>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={onClearAll} className="px-5 pb-3 text-[14px] text-gray-400">
              Alle zurücksetzen
            </button>
          )}

          <div className="flex-1 overflow-y-auto pb-24">
            <MobileFilterSection label="Marke" count={selectedBrands.length}>
              <div className="p-2">
                {brands.map((brand) => (
                  <label key={brand} className="flex cursor-pointer items-center gap-2 py-2 text-[14px]">
                    <input type="checkbox" checked={selectedBrands.includes(brand)}
                      onChange={() => onBrandsChange(selectedBrands.includes(brand) ? selectedBrands.filter((b) => b !== brand) : [...selectedBrands, brand])}
                      className="h-4 w-4 accent-[#0076bd]" />
                    {brand}
                  </label>
                ))}
              </div>
            </MobileFilterSection>

            <MobileFilterSection label="Preis" count={priceMin || priceMax ? 1 : 0}>
              <div className="p-4 flex items-center gap-3">
                <input type="number" placeholder="Min CHF" value={priceMin} onChange={(e) => onPriceMinChange(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-gray-400" />
                <span className="text-gray-400">–</span>
                <input type="number" placeholder="Max CHF" value={priceMax} onChange={(e) => onPriceMaxChange(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-gray-400" />
              </div>
            </MobileFilterSection>

            <MobileFilterSection label="Bewertung" count={rating !== null ? 1 : 0}>
              <div className="p-2">
                {[4, 3, 2, 1].map((r) => (
                  <button key={r} onClick={() => onRatingChange(rating === r ? null : r)}
                    className={`flex w-full items-center gap-2 rounded px-3 py-2.5 text-[14px] ${rating === r ? "bg-gray-100 font-medium" : ""}`}>
                    <span className="flex">{Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={i < r ? "text-yellow-400" : "text-gray-300"}>★</span>
                    ))}</span>
                    <span className="text-gray-500">& mehr</span>
                  </button>
                ))}
              </div>
            </MobileFilterSection>

            {catType !== "parfum" && (
              <MobileFilterSection label="Farbe" count={selectedColors.length}>
                <div className="grid grid-cols-4 gap-3 p-4">
                  {COLORS.map((c) => {
                    const sel = selectedColors.includes(c.value);
                    return (
                      <button key={c.value} onClick={() => onColorsChange(sel ? selectedColors.filter((v) => v !== c.value) : [...selectedColors, c.value])}
                        className={`flex flex-col items-center gap-1 rounded p-2 ${sel ? "ring-2 ring-[#0076bd]" : ""}`}>
                        <span className="h-8 w-8 rounded-full border border-gray-200" style={{ backgroundColor: c.hex }} />
                        <span className="text-[11px] text-gray-600">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </MobileFilterSection>
            )}

            {catType === "parfum" && (
              <MobileFilterSection label="Grösse">
                <div className="grid grid-cols-4 gap-2 p-4">
                  {PARFUM_SIZES.map((size) => (
                    <button key={size} className="rounded-full border border-gray-200 px-3 py-2 text-[13px]">
                      {size}
                    </button>
                  ))}
                </div>
              </MobileFilterSection>
            )}

            <MobileFilterSection label="Angebote" count={dealsOnly ? 1 : 0}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-[14px]">
                <input type="checkbox" checked={dealsOnly} onChange={(e) => onDealsOnlyChange?.(e.target.checked)}
                  className="h-4 w-4 accent-[#0076bd]" />
                Nur reduzierte Produkte
              </label>
            </MobileFilterSection>
          </div>

          {/* Sticky bottom button */}
          <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 py-3">
            <button onClick={() => setMobileOpen(false)}
              className="w-full rounded-full bg-gray-100 py-3 text-[15px] font-medium text-gray-900">
              Schliessen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile expandable filter section (Galaxus-style)
function MobileFilterSection({ label, count, children }: { label: string; count?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-gray-100">
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-[15px] text-gray-900">
        <span className="flex items-center gap-2">
          {label}
          {count && count > 0 ? (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-bold text-white">
              {count}
            </span>
          ) : null}
        </span>
        {open ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ── Galaxus-style dropdown ───────────────────────────────────

function FilterDrop({
  label,
  active,
  count,
  children,
}: {
  label: string;
  active: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between gap-2 rounded-full border px-4 py-2.5 text-[13px] transition ${
          active
            ? "border-gray-900 bg-white font-medium text-gray-900"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
        }`}
      >
        <span className="flex items-center gap-1.5">
          {label}
          {count ? (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-bold text-white">
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}
