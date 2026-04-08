"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, RotateCcw } from "lucide-react";

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
}

const COLORS = [
  { name: "Schwarz", value: "black", hex: "#000000" },
  { name: "Weiss", value: "white", hex: "#FFFFFF" },
  { name: "Grau", value: "gray", hex: "#9CA3AF" },
  { name: "Rot", value: "red", hex: "#EF4444" },
  { name: "Blau", value: "blue", hex: "#3B82F6" },
  { name: "Grün", value: "green", hex: "#22C55E" },
  { name: "Gold", value: "gold", hex: "#EAB308" },
  { name: "Silber", value: "silver", hex: "#C0C0C0" },
];

const RATINGS = [4, 3, 2, 1];

/**
 * Galaxus-style filter bar — full-width 3-column grid of dropdowns.
 */
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
  activeFilterCount,
  dealsOnly = false,
  onDealsOnlyChange,
  onClearAll,
}: FilterBarProps) {
  return (
    <div className="mb-5">
      {/* Row 1: 3-column filter grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <GalaxusDropdown
          label="Marke"
          active={selectedBrands.length > 0}
          badge={selectedBrands.length || undefined}
        >
          <div className="max-h-64 overflow-y-auto p-2">
            {brands.map((brand) => (
              <label
                key={brand}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() =>
                    onBrandsChange(
                      selectedBrands.includes(brand)
                        ? selectedBrands.filter((b) => b !== brand)
                        : [...selectedBrands, brand],
                    )
                  }
                  className="accent-[#D81E05]"
                />
                {brand}
              </label>
            ))}
          </div>
        </GalaxusDropdown>

        <GalaxusDropdown
          label="Preis"
          active={!!(priceMin || priceMax)}
        >
          <div className="p-3">
            <p className="mb-2.5 text-xs font-medium text-gray-500">
              Preisbereich (CHF)
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => onPriceMinChange(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800"
              />
              <span className="text-sm text-gray-400">–</span>
              <input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => onPriceMaxChange(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </div>
        </GalaxusDropdown>

        <GalaxusDropdown
          label="Bewertung"
          active={rating !== null}
        >
          <div className="p-2">
            {RATINGS.map((r) => (
              <button
                key={r}
                onClick={() => onRatingChange(rating === r ? null : r)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm transition ${
                  rating === r
                    ? "bg-gray-100 font-medium text-slate-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <span className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < r ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}>
                      ★
                    </span>
                  ))}
                </span>
                <span>& mehr</span>
              </button>
            ))}
          </div>
        </GalaxusDropdown>
      </div>

      {/* Row 2: Farbe, Angebote + reset */}
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <GalaxusDropdown
          label="Farbe"
          active={selectedColors.length > 0}
          badge={selectedColors.length || undefined}
        >
          <div className="grid grid-cols-4 gap-2.5 p-3">
            {COLORS.map((color) => {
              const isSelected = selectedColors.includes(color.value);
              return (
                <button
                  key={color.value}
                  onClick={() =>
                    onColorsChange(
                      isSelected
                        ? selectedColors.filter((c) => c !== color.value)
                        : [...selectedColors, color.value],
                    )
                  }
                  className={`flex flex-col items-center gap-1 rounded-md p-2 transition ${
                    isSelected
                      ? "bg-gray-100 ring-1 ring-gray-400 dark:bg-gray-800 dark:ring-gray-600"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded-full border border-gray-200 dark:border-gray-600"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-[10px] text-gray-600 dark:text-gray-400">
                    {color.name}
                  </span>
                </button>
              );
            })}
          </div>
        </GalaxusDropdown>

        {/* Angebote toggle */}
        <GalaxusDropdown
          label="Angebote"
          active={dealsOnly}
        >
          <div className="p-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="checkbox"
                checked={dealsOnly}
                onChange={(e) => onDealsOnlyChange?.(e.target.checked)}
                className="accent-[#D81E05]"
              />
              Nur reduzierte Produkte
            </label>
          </div>
        </GalaxusDropdown>

        {/* Reset button */}
        {activeFilterCount > 0 && (
          <div className="flex items-center sm:col-span-2 sm:justify-end">
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 text-sm text-[#0076bd] transition hover:text-[#005a94]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Filter zurücksetzen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Galaxus-style dropdown ───────────────────────────────────
function GalaxusDropdown({
  label,
  active,
  badge,
  children,
}: {
  label: string;
  active: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-md border px-4 py-2.5 text-sm transition ${
          active
            ? "border-gray-400 bg-gray-50 font-medium text-slate-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-[#141414] dark:text-gray-400 dark:hover:border-gray-600"
        }`}
      >
        <span className="flex items-center gap-2">
          {label}
          {badge ? (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D81E05] px-1.5 text-[10px] font-bold text-white">
              {badge}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-[#1a1a1a]">
          {children}
        </div>
      )}
    </div>
  );
}
