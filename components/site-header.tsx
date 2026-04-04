"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Camera, Heart, Menu, X, ChevronRight, ChevronDown, ArrowRight, User } from "lucide-react";
import { LanguageSwitcher, type LangCode } from "@/components/language-switcher";
import { useAuth } from "@/lib/auth/auth-context";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

const MENU_ITEMS = [
  { label: "IT + Multimedia", slugs: ["smartphones", "laptops", "kopfhoerer", "foto", "tv-audio"], subs: ["Smartphones", "Laptops", "Kopfhörer", "TV & Audio", "Foto & Video"] },
  { label: "Haushalt", slugs: ["haushalt"], subs: ["Staubsauger", "Kaffeemaschinen", "Küchengeräte"] },
  { label: "Sport", slugs: ["sport"], subs: ["Fitness", "Velo", "Wandern"] },
  { label: "Mode", slugs: ["mode", "schuhe"], subs: ["Sneakers", "Laufschuhe", "Jacken", "Jeans"] },
  { label: "Gaming + Spielzeug", slugs: ["gaming"], subs: ["PlayStation", "Xbox", "Nintendo"] },
  { label: "Baby + Eltern", slugs: ["baby"], subs: [] },
  { label: "Beauty + Gesundheit", slugs: ["beauty"], subs: ["Parfum", "Pflege", "Make-up"] },
  { label: "Uhren + Schmuck", slugs: ["uhren"], subs: [] },
  { label: "Bücher + Medien", slugs: ["buecher"], subs: [] },
];

interface SiteHeaderProps {
  query: string;
  onQueryChange: (q: string) => void;
  allProducts?: MockProductWithHistory[];
  onCategorySelect?: (slugs: string[], label: string) => void;
  showVision?: () => void;
}

export function SiteHeader({ query, onQueryChange, allProducts = [], onCategorySelect, showVision }: SiteHeaderProps) {
  const [lang, setLang] = useState<LangCode>("de");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user, isLoggedIn, setShowAuthModal } = useAuth();

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return allProducts.filter((p) =>
      p.product.title.toLowerCase().includes(q) || p.product.brand.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [query, allProducts]);

  const showDropdown = searchFocused && query.length >= 2;

  return (
    <>
      {/* Rainbow bar */}
      <div className="rainbow-bar sticky top-0 z-50" />

      {/* Header */}
      <header className="sticky top-[5px] z-40 bg-white" id="site-header">
        {/* Main row: logo + search + icons */}
        <div className="mx-auto flex h-14 items-center gap-3 px-5 sm:gap-5 sm:px-10 lg:gap-8">
          {/* Logo */}
          <Link href="/" className="shrink-0 text-xl font-black tracking-tight sm:text-2xl">
            SWISS<span className="text-red-600">PRICE</span>
          </Link>

          {/* Search bar — ~45% on desktop, full on mobile */}
          <div ref={searchRef} className="search-shine relative flex-1 lg:max-w-[45%]">
            <div className="flex items-center rounded-full border border-gray-300 bg-white transition-shadow focus-within:border-transparent focus-within:shadow-lg">
              <Search className="ml-3 h-4 w-4 shrink-0 text-gray-400 sm:ml-4" />
              <input type="search" value={query} onChange={(e) => onQueryChange(e.target.value)} onFocus={() => setSearchFocused(true)}
                placeholder="Wonach suchst du?" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base outline-none placeholder:text-gray-400 sm:px-3" />
              <button onClick={() => showVision?.()} className="mr-1 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 sm:mr-2">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Live search dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                {suggestions.map((item) => (
                  <Link key={item.product.gtin} href={`/product/${item.product.gtin}`} onClick={() => { setSearchFocused(false); onQueryChange(""); }}
                    className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.product.imageUrl} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg bg-gray-50 object-contain" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-900">{item.product.title}</p>
                      <p className="text-[11px] text-gray-400">{item.product.brand}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-gray-900">CHF {item.bestPrice.totalChf.toFixed(2)}</span>
                  </Link>
                ))}
                <div className="border-t border-gray-100 px-4 py-2.5">
                  <button onClick={() => setSearchFocused(false)} className="flex items-center gap-1 text-xs font-medium text-blue-600">
                    Alle {suggestions.length} Ergebnisse anzeigen <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
            {showDropdown && suggestions.length === 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-xl">
                <p className="text-sm text-gray-500">Keine Ergebnisse für &ldquo;{query}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Right icons */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            {/* Desktop: black "Anmelden" text button */}
            {isLoggedIn && user ? (
              <Link href="/account" className="hidden rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 sm:block">
                {user.name.split(" ")[0]}
              </Link>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="hidden rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-gray-800 sm:block">
                Anmelden
              </button>
            )}
            {/* Mobile: user icon */}
            <button onClick={() => isLoggedIn ? undefined : setShowAuthModal(true)} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 sm:hidden">
              <User className="h-5 w-5" />
            </button>
            <Link href="/account" className="hidden h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 sm:flex">
              <Heart className="h-5 w-5" />
            </Link>
            <LanguageSwitcher current={lang} onChange={setLang} />
          </div>
        </div>

        {/* ☰ Menü bar — below header, no border between logo and search */}
        <div className="flex items-center px-5 py-1.5 sm:px-10 lg:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            Menü
          </button>
        </div>
        <div className="border-b border-gray-200" />
      </header>

      {/* Mobile menu — full-page below header, Galaxus-style */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[45] overflow-y-auto bg-white lg:hidden" style={{ top: "calc(5px + 56px + 37px)" }}>
          <nav>
            {MENU_ITEMS.map((item) => (
              <div key={item.label}>
                <button
                  onClick={() => {
                    if (item.subs.length > 0) setExpandedMenu(expandedMenu === item.label ? null : item.label);
                    else { onCategorySelect?.(item.slugs, item.label); setMobileMenuOpen(false); }
                  }}
                  className="flex w-full items-center justify-between border-b border-gray-100 px-5 py-4 text-[15px] text-gray-800"
                >
                  <span>{item.label}</span>
                  {item.subs.length > 0 ? (
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition ${expandedMenu === item.label ? "rotate-180" : ""}`} />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                {expandedMenu === item.label && (
                  <div className="border-b border-gray-100 bg-gray-50 py-1">
                    <button onClick={() => { onCategorySelect?.(item.slugs, item.label); setMobileMenuOpen(false); }}
                      className="w-full px-8 py-2.5 text-left text-sm font-medium text-blue-600">Alle in {item.label}</button>
                    {item.subs.map((sub) => (
                      <button key={sub} onClick={() => { onCategorySelect?.(item.slugs, item.label); setMobileMenuOpen(false); }}
                        className="w-full px-8 py-2.5 text-left text-sm text-gray-600 hover:text-gray-900">{sub}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
