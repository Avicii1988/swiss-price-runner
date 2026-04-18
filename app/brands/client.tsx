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

function getLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export default function BrandsClient({ brands }: { brands: Brand[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter.trim()) return brands;
    const q = filter.toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, filter]);

  // Group by first letter
  const grouped = useMemo(() => {
    const groups: Record<string, Brand[]> = {};
    for (const b of filtered) {
      const letter = getLetter(b.name);
      const key = /[A-Z]/.test(letter) ? letter : "#";
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Beliebte Marken</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Marken-Übersicht</h1>
          <p className="mt-1 text-sm text-gray-500">
            {brands.length.toLocaleString("de-CH")} Marken im Preisvergleich.
          </p>
        </div>

        {/* Search filter */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Marke suchen..."
            className="w-full rounded-full border border-[#e1e1e3] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-400"
          />
        </div>

        {/* Grouped by first letter */}
        {grouped.map(([letter, items]) => (
          <div key={letter} className="mb-8">
            <h2 className="mb-3 text-sm font-bold text-gray-400">{letter}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((brand) => (
                <Link key={brand.name} href={`/brands?q=${encodeURIComponent(brand.name)}`}
                  className="group flex flex-col items-center rounded-xl border border-[#e1e1e3] bg-white p-4 transition hover:border-gray-300 hover:shadow-sm">
                  <BrandLogo name={brand.name} size="md" shape="circle" />
                  <p className="mt-3 line-clamp-1 text-center text-[13px] font-bold text-gray-900">{brand.name}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">{brand.productCount.toLocaleString("de-CH")} Produkte</p>
                  <span className="mt-2 text-[11px] font-medium text-[#0076bd] opacity-0 transition group-hover:opacity-100">
                    Alle Produkte →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-gray-400">Keine Marken gefunden.</p>
        )}
      </div>
    </div>
  );
}
