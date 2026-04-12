"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";

interface Shop {
  id: string;
  name: string;
  wordmarkText: string;
  wordmarkColor: string;
  wordmarkWeight: number;
  productCount: number;
}

export default function ShopsClient({ shops }: { shops: Shop[] }) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? shops.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : shops;

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Partner-Shops</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Unsere Partner</h1>
          <p className="mt-1 text-sm text-gray-500">
            Wir vergleichen Preise aus allen angebundenen Schweizer Shops — neutral und transparent.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((shop) => (
            <div key={shop.id}
              className="group flex flex-col items-center rounded-xl border border-[#e1e1e3] bg-white p-5 transition hover:border-gray-300 hover:shadow-sm">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gray-100 bg-white">
                <span className="text-center text-[11px] tracking-wider"
                  style={{ color: shop.wordmarkColor, fontWeight: shop.wordmarkWeight }}>
                  {shop.wordmarkText}
                </span>
              </div>
              <p className="mt-4 text-center text-sm font-bold text-gray-900">{shop.name}</p>
              {shop.productCount > 0 && (
                <p className="mt-0.5 text-[11px] text-gray-400">{shop.productCount.toLocaleString("de-CH")} Angebote</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
