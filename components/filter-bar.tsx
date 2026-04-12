"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";

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

  return (
    <div className="mb-5">
      {/* Filter grid — Galaxus style: 3 columns on desktop, matches product grid width */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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

      {/* Reset below grid */}
      {activeFilterCount > 0 && (
        <button onClick={onClearAll} className="mt-3 flex items-center gap-1 text-[12px] text-[#0076bd] hover:text-[#005a94]">
          <RotateCcw className="h-3 w-3" /> Filter zurücksetzen
        </button>
      )}
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
