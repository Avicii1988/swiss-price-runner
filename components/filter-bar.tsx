"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

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
 * Galaxus-style filter section with dropdown filters
 * for: Marke, Preis, Bewertung, Farbe
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
  onClearAll,
}: FilterBarProps) {
  return (
    <div className="mb-4 rounded-xl border border-gray-100 bg-white">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-4">
        {/* Marke dropdown */}
        <FilterDropdown
          label="Marke"
          active={selectedBrands.length > 0}
          badge={selectedBrands.length || undefined}
        >
          <div className="max-h-56 overflow-y-auto p-2">
            {brands.map((brand) => (
              <label
                key={brand}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition hover:bg-gray-50"
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
                  className="accent-red-600"
                />
                {brand}
              </label>
            ))}
          </div>
        </FilterDropdown>

        {/* Preis dropdown */}
        <FilterDropdown
          label="Preis"
          active={!!(priceMin || priceMax)}
        >
          <div className="p-3">
            <p className="mb-2 text-xs font-medium text-gray-500">
              Preisbereich (CHF)
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => onPriceMinChange(e.target.value)}
                className="w-24 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm outline-none focus:border-red-400"
              />
              <span className="text-sm text-gray-400">–</span>
              <input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => onPriceMaxChange(e.target.value)}
                className="w-24 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm outline-none focus:border-red-400"
              />
            </div>
          </div>
        </FilterDropdown>

        {/* Bewertung dropdown */}
        <FilterDropdown
          label="Bewertung"
          active={rating !== null}
        >
          <div className="p-2">
            {RATINGS.map((r) => (
              <button
                key={r}
                onClick={() => onRatingChange(rating === r ? null : r)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  rating === r
                    ? "bg-red-50 font-medium text-red-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={i < r ? "text-yellow-400" : "text-gray-300"}
                    >
                      ★
                    </span>
                  ))}
                </span>
                <span>& mehr</span>
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Farbe dropdown */}
        <FilterDropdown
          label="Farbe"
          active={selectedColors.length > 0}
          badge={selectedColors.length || undefined}
        >
          <div className="grid grid-cols-4 gap-2 p-3">
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
                  className={`flex flex-col items-center gap-1 rounded-lg p-2 transition ${
                    isSelected
                      ? "bg-red-50 ring-1 ring-red-300"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded-full border border-gray-200"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-[10px] text-gray-600">
                    {color.name}
                  </span>
                </button>
              );
            })}
          </div>
        </FilterDropdown>

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <button
            onClick={onClearAll}
            className="ml-auto flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-3 w-3" />
            Filter zurücksetzen ({activeFilterCount})
          </button>
        )}
      </div>
    </div>
  );
}

// ── Dropdown wrapper ─────────────────────────────────────────
function FilterDropdown({
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
        className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
          active
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
        }`}
      >
        {label}
        {badge && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
        <ChevronDown
          className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-gray-200 bg-white shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}
