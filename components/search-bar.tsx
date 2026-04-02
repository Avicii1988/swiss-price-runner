"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface SearchBarProps {
  query: string;
  onChange: (value: string) => void;
  placeholder: string;
  buttonLabel: string;
  products: MockProductWithHistory[];
}

export function SearchBar({
  query,
  onChange,
  placeholder,
  buttonLabel,
  products,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Suggestions: match by title, brand, or category
  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return products
      .filter(
        (p) =>
          p.product.title.toLowerCase().includes(q) ||
          p.product.brand.toLowerCase().includes(q) ||
          p.product.category.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, products]);

  const showDropdown = focused && query.length >= 2 && suggestions.length > 0;

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input row — font-size 16px (text-base) prevents iOS zoom */}
      <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 shadow-md focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10 sm:px-4 sm:py-3">
        <Search className="h-5 w-5 shrink-0 text-gray-400" />
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
        />
        <button className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 active:scale-95 sm:px-5 sm:text-sm">
          {buttonLabel}
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {suggestions.map((item) => (
            <Link
              key={item.product.gtin}
              href={`/product/${item.product.gtin}`}
              onClick={() => { setFocused(false); onChange(""); }}
              className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.product.imageUrl}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded-lg bg-gray-100 object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {highlightMatch(item.product.title, query)}
                </p>
                <p className="text-[11px] text-gray-400">
                  {item.product.brand} &middot; CHF {item.bestPrice.totalChf.toFixed(2)}
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
            </Link>
          ))}

          {/* Show all results link */}
          <div className="border-t border-gray-100 px-4 py-2">
            <button
              onClick={() => setFocused(false)}
              className="text-xs font-medium text-red-600 hover:text-red-700"
            >
              Alle {suggestions.length < 6 ? suggestions.length : `${suggestions.length}+`} Ergebnisse anzeigen
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {focused && query.length >= 2 && suggestions.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-xl">
          <p className="text-sm text-gray-500">Keine Produkte gefunden für &ldquo;{query}&rdquo;</p>
          <p className="mt-1 text-xs text-gray-400">Versuche einen anderen Suchbegriff</p>
        </div>
      )}
    </div>
  );
}

// Highlight matching text in bold
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-red-600">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}
