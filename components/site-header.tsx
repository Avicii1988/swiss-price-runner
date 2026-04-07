"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Camera, Heart, Pin, Menu, X, ChevronRight, ChevronDown, ArrowRight, User, Settings } from "lucide-react";
import { LanguageSwitcher, type LangCode } from "@/components/language-switcher";
import { PreisAlarmLogo } from "@/components/preisalarm-logo";
import { useAuth } from "@/lib/auth/auth-context";
import { SIDEBAR_GROUPS, CATEGORIES } from "@/lib/categories";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

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
  const [loading, setLoading] = useState(false);
  const [hideTopRow, setHideTopRow] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const { user, isLoggedIn, setShowAuthModal } = useAuth();
  const pathname = usePathname();

  const toggleDarkMode = useCallback(() => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
  }, [darkMode]);

  // Loading glow on route change
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [pathname]);

  // Scroll-directional: hide top row on scroll down, show on scroll up
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      if (y > lastScrollY.current && y > 80) {
        setHideTopRow(true); // scrolling down
      } else {
        setHideTopRow(false); // scrolling up
      }
      lastScrollY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const SearchResults = () => (
    <>
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
    </>
  );

  return (
    <>
      {/* Rainbow bar — with gap below */}
      <div className={`rainbow-bar sticky top-0 z-50 transition-shadow ${loading ? "loading" : ""}`} />
      <div className="h-1 bg-white sticky top-[5px] z-[49]" />

      {/* Header */}
      <header ref={headerRef} className="header-shadow sticky top-[9px] z-40 bg-white">
        {/* ── DESKTOP (lg+) ── */}
        <div className="hidden lg:block">
          <div className="mx-auto flex h-[100px] max-w-[1600px] items-center px-10">
            <PreisAlarmLogo size="lg" />
            <div className="flex-1" />
            <div ref={searchRef} className="search-shine relative w-[45%]">
              <div className="flex items-center rounded-full border border-gray-300 bg-white transition-shadow focus-within:border-transparent focus-within:shadow-lg">
                <Search className="ml-5 h-5 w-5 shrink-0 text-gray-400" />
                <input type="search" value={query} onChange={(e) => onQueryChange(e.target.value)} onFocus={() => setSearchFocused(true)}
                  placeholder="Wonach suchst du?" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[16px] outline-none placeholder:text-gray-400" />
                <button onClick={() => showVision?.()} className="mr-2 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
                  <Camera className="h-5 w-5" />
                </button>
              </div>
              <SearchResults />
            </div>
            <div className="flex-1" />
            {/* Right: Pin + Heart + Lang + Auth */}
            <div className="flex shrink-0 items-center gap-0.5">
              <button onClick={toggleDarkMode} className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100 ${darkMode ? "text-yellow-400" : "text-gray-500"}`} title={darkMode ? "Light Mode" : "Dark Mode"}>
                <Settings className="h-5 w-5" />
              </button>
              <LanguageSwitcher current={lang} onChange={setLang} />
              <Link href="/account" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100" title="Merkliste">
                <Pin className="h-5 w-5" />
              </Link>
              <Link href="/account" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100" title="Favoriten">
                <Heart className="h-5 w-5" />
              </Link>
              {isLoggedIn ? (
                <Link href="/account" className="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-gray-900 hover:bg-gray-100">
                  <User className="h-5 w-5 fill-current" />
                </Link>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="ml-1 rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800">Anmelden</button>
              )}
            </div>
          </div>
          <div className="border-b border-gray-200" />
        </div>

        {/* ── MOBILE (<lg): scroll-directional ── */}
        <div className="lg:hidden">
          {/* Row 1: Logo + icons — hides on scroll down */}
          <div className={`flex items-center justify-between px-4 transition-all duration-300 sm:px-6 ${hideTopRow ? "h-0 overflow-hidden opacity-0" : "h-11 opacity-100"}`}>
            <PreisAlarmLogo size="md" />
            <div className="flex items-center gap-0.5">
              <LanguageSwitcher current={lang} onChange={setLang} />
              <Link href="/account" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100" title="Merkliste">
                <Pin className="h-5 w-5" />
              </Link>
              <Link href="/account" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100" title="Favoriten">
                <Heart className="h-5 w-5" />
              </Link>
              {isLoggedIn ? (
                <Link href="/account" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-900 hover:bg-gray-100">
                  <User className="h-5 w-5 fill-current" />
                </Link>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100">
                  <User className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: ☰ Menü + Search — always visible */}
          <div className="flex items-center gap-3 px-4 pb-2 sm:px-6">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-gray-700">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              Menü
            </button>
            <div ref={searchRef} className="search-shine relative flex-1">
              <div className="flex items-center rounded-full border border-gray-300 bg-white focus-within:border-transparent">
                <Search className="ml-3 h-4 w-4 text-gray-400" />
                <input type="search" value={query} onChange={(e) => onQueryChange(e.target.value)} onFocus={() => setSearchFocused(true)}
                  placeholder="Wonach suchst du?" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base outline-none placeholder:text-gray-400" />
                <button onClick={() => showVision?.()} className="mr-1 flex h-7 w-7 items-center justify-center rounded-full text-gray-400">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <SearchResults />
            </div>
          </div>
          <div className="border-b border-gray-200" />
        </div>
      </header>

      {/* Mobile menu — synced with web sidebar SIDEBAR_GROUPS */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[45] overflow-y-auto bg-white lg:hidden" style={{ top: `calc(9px + ${hideTopRow ? 0 : 44}px + 42px + 1px)` }}>
          {/* Menu header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Gesamtsortiment</p>
            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400"><X className="h-4 w-4" /></button>
          </div>
          <nav>
            {SIDEBAR_GROUPS.map((group) => {
              const Icon = group.icon;
              const cats = CATEGORIES.filter((c) => group.categorySlugs.includes(c.slug));
              const isExpanded = expandedMenu === group.label;

              return (
                <div key={group.label}>
                  {cats.length === 1 ? (
                    /* Single category — direct link */
                    <Link
                      href={`/category/${cats[0].slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center gap-3 border-b border-gray-50 px-5 py-3.5 text-[15px] text-slate-800"
                    >
                      <Icon className="h-[18px] w-[18px] text-gray-400" strokeWidth={1.75} />
                      <span>{group.label}</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                    </Link>
                  ) : (
                    /* Multi-category group — accordion */
                    <button
                      onClick={() => setExpandedMenu(isExpanded ? null : group.label)}
                      className="flex w-full items-center gap-3 border-b border-gray-50 px-5 py-3.5 text-[15px] text-slate-800"
                    >
                      <Icon className={`h-[18px] w-[18px] transition ${isExpanded ? "text-[#D81E05]" : "text-gray-400"}`} strokeWidth={1.75} />
                      <span className={isExpanded ? "font-medium" : ""}>{group.label}</span>
                      <ChevronDown className={`ml-auto h-4 w-4 text-gray-300 transition ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  )}
                  {isExpanded && (
                    <div className="border-b border-gray-100 bg-gray-50/80 py-1">
                      {cats.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/category/${cat.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between px-12 py-2.5 text-[14px] text-gray-600 transition hover:text-slate-900"
                        >
                          <span>{cat.name}</span>
                          <span className="text-[10px] text-gray-400">{cat.productCount}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
