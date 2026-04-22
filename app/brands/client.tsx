"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { BrandLogo } from "@/components/brand-logo";

interface Brand {
  name: string;
  productCount: number;
}

// All 26 letters + # bucket for non-Latin brand names
const ALL_LETTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];

function getLetter(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

export default function BrandsClient({ brands }: { brands: Brand[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter.trim()) return brands;
    const q = filter.toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, filter]);

  const grouped = useMemo(() => {
    const groups: Record<string, Brand[]> = {};
    for (const b of filtered) {
      const key = getLetter(b.name);
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    }
    // Sort A-Z; # bucket always last
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  const availableLetters = useMemo(
    () => new Set(grouped.map(([l]) => l)),
    [grouped],
  );

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader query={query} onQueryChange={setQuery} />

      {/* ── A-Z sticky jump navigation ── */}
      <div className="sticky top-[76px] z-20 border-b border-[#e1e1e3] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="flex items-center gap-0.5 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ALL_LETTERS.map((letter) => {
              const active = availableLetters.has(letter);
              return active ? (
                <a
                  key={letter}
                  href={`#section-${letter}`}
                  className="flex h-7 min-w-[28px] items-center justify-center rounded text-[11px] font-bold text-[#0076bd] transition hover:bg-blue-50"
                >
                  {letter}
                </a>
              ) : (
                <span
                  key={letter}
                  className="flex h-7 min-w-[28px] select-none items-center justify-center text-[11px] text-gray-300"
                >
                  {letter}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        {/* Page header */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Preisvergleich
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Marken-Verzeichnis
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {brands.length.toLocaleString("de-CH")} Marken im Preisvergleich
          </p>
        </div>

        {/* Search filter */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Marke suchen..."
            className="w-full rounded-full border border-[#e1e1e3] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-400"
          />
        </div>

        {/* Letter groups */}
        {grouped.map(([letter, items]) => (
          <div
            key={letter}
            id={`section-${letter}`}
            className="mb-10 scroll-mt-[120px]"
          >
            {/* Section heading — large letter + separator */}
            <div className="mb-4 flex items-center gap-4">
              <span className="w-8 shrink-0 text-2xl font-black tracking-tight text-gray-900">
                {letter}
              </span>
              <div className="h-px flex-1 bg-gray-100" />
              <span className="shrink-0 text-[11px] text-gray-400">
                {items.length} {items.length === 1 ? "Marke" : "Marken"}
              </span>
            </div>

            {/* Brand grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {items.map((brand) => (
                <Link
                  key={brand.name}
                  href={`/search?q=${encodeURIComponent(brand.name)}`}
                  className="group flex flex-col items-center rounded-xl border border-[#e1e1e3] bg-white p-4 text-center transition hover:border-gray-300 hover:shadow-md"
                >
                  <BrandLogo name={brand.name} size="md" shape="circle" />
                  <p className="mt-3 line-clamp-1 text-[13px] font-bold text-gray-900 transition group-hover:text-[#0076bd]">
                    {brand.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {brand.productCount.toLocaleString("de-CH")} Produkte
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-gray-400">
            Keine Marken gefunden.
          </p>
        )}
      </div>
    </div>
  );
}
