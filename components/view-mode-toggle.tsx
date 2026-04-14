"use client";

import { LayoutGrid, List as ListIcon } from "lucide-react";

export type ViewMode = "grid" | "list";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

/**
 * Shared Grid/List toggle — identical markup on the home page and every
 * category page. Responsive sizing:
 *   - mobile (<sm): 44×48 touch target (Apple HIG minimum)
 *   - sm+        : 28×32 compact pill (desktop density)
 *
 * Icons scale the same way so the glyph remains visually centered.
 */
export function ViewModeToggle({ value, onChange, className = "" }: ViewModeToggleProps) {
  return (
    <div
      className={`flex overflow-hidden rounded-md border border-[#e1e1e3] ${className}`}
      role="group"
      aria-label="Ansicht wechseln"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={value === "grid"}
        title="Raster"
        className={`flex h-11 w-12 items-center justify-center transition sm:h-7 sm:w-8 ${
          value === "grid"
            ? "bg-gray-100 text-gray-900"
            : "bg-white text-gray-400 hover:text-gray-600"
        }`}
      >
        <LayoutGrid className="h-[18px] w-[18px] sm:h-3.5 sm:w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={value === "list"}
        title="Liste"
        className={`flex h-11 w-12 items-center justify-center border-l border-[#e1e1e3] transition sm:h-7 sm:w-8 ${
          value === "list"
            ? "bg-gray-100 text-gray-900"
            : "bg-white text-gray-400 hover:text-gray-600"
        }`}
      >
        <ListIcon className="h-[18px] w-[18px] sm:h-3.5 sm:w-3.5" />
      </button>
    </div>
  );
}
