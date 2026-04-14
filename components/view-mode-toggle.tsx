"use client";

import { LayoutGrid, List as ListIcon } from "lucide-react";

export type ViewMode = "grid" | "list";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

/**
 * Shared Grid/List toggle — same visual on home + category pages.
 * 28×32 px per button, segmented look with inner divider.
 */
export function ViewModeToggle({ value, onChange, className = "" }: ViewModeToggleProps) {
  return (
    <div className={`flex overflow-hidden rounded-md border border-[#e1e1e3] ${className}`} role="group" aria-label="Ansicht wechseln">
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={value === "grid"}
        title="Raster"
        className={`flex h-7 w-8 items-center justify-center transition ${
          value === "grid"
            ? "bg-gray-100 text-gray-900"
            : "bg-white text-gray-400 hover:text-gray-600"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={value === "list"}
        title="Liste"
        className={`flex h-7 w-8 items-center justify-center border-l border-[#e1e1e3] transition ${
          value === "list"
            ? "bg-gray-100 text-gray-900"
            : "bg-white text-gray-400 hover:text-gray-600"
        }`}
      >
        <ListIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
