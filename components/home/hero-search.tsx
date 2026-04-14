"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Search, TrendingUp } from "lucide-react";

interface HeroSearchProps {
  trending: string[];
  stats: { shops: number; brands: number; offers: number };
}

/**
 * Hero block — magazine-style opener with an oversized headline, a single
 * minimalist search bar, and a Trending-Tags row. Premium, quiet, lots of
 * whitespace. Only shown once on the homepage, above the product rails.
 */
export function HeroSearch({ trending, stats }: HeroSearchProps) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    router.push(`/brands?q=${encodeURIComponent(term)}`);
  };

  return (
    <section className="relative overflow-hidden border-b border-black/5 bg-[#fafafa]">
      {/* subtle radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-20 h-[360px] opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(216,30,5,0.06), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1100px] px-5 pb-10 pt-12 sm:px-8 sm:pb-16 sm:pt-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
          Preisalarm · Schweiz
        </p>
        <h1 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-tight text-gray-900 sm:text-5xl md:text-[56px]">
          Der echte Schweizer&nbsp;Preis.
          <span className="block text-gray-400">Einmal suchen. Immer sparen.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-gray-500 sm:text-[15px]">
          Wir vergleichen Angebote aus {stats.shops}&nbsp;Shops und{" "}
          {stats.brands.toLocaleString("de-CH")}&nbsp;Marken — inklusive Zoll, MwSt. und Versand in die Schweiz.
        </p>

        {/* Search bar */}
        <form onSubmit={submit} className="mt-7 max-w-2xl">
          <div className="group flex h-12 items-center rounded-full border border-gray-200 bg-white pr-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus-within:border-gray-300 focus-within:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] sm:h-14">
            <Search className="ml-5 h-[18px] w-[18px] shrink-0 text-gray-400" />
            <input
              type="search"
              enterKeyHint="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suche nach Marke, Produkt oder GTIN…"
              className="min-w-0 flex-1 bg-transparent px-3 text-[15px] outline-none placeholder:text-gray-400 sm:text-[16px]"
              aria-label="Produkte suchen"
            />
            <button
              type="submit"
              className="flex h-9 shrink-0 items-center rounded-full bg-gray-900 px-5 text-[13px] font-medium text-white transition hover:bg-black sm:h-11 sm:px-6 sm:text-[14px]"
            >
              Suchen
            </button>
          </div>
        </form>

        {/* Trending tags */}
        {trending.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              <TrendingUp className="h-3.5 w-3.5" />
              Trending
            </span>
            {trending.slice(0, 12).map((tag) => (
              <Link
                key={tag}
                href={`/brands?q=${encodeURIComponent(tag)}`}
                className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-gray-700 transition hover:-translate-y-px hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
