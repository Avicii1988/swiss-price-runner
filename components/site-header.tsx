"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Camera, Heart, Pin, Menu, X, ChevronRight, ChevronDown, ArrowRight, ArrowLeft, User, Store, Tag } from "lucide-react";
import { LanguageSwitcher, type LangCode } from "@/components/language-switcher";
import { PreisAlarmLogo } from "@/components/preisalarm-logo";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/lib/auth/auth-context";
import { SIDEBAR_CATEGORIES } from "@/lib/categories";
import { useLang } from "@/lib/i18n-context";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface SiteHeaderProps {
  query: string;
  onQueryChange: (q: string) => void;
  allProducts?: MockProductWithHistory[];
  onCategorySelect?: (slugs: string[], label: string) => void;
  showVision?: () => void;
}

export function SiteHeader({ query, onQueryChange, allProducts = [], onCategorySelect, showVision }: SiteHeaderProps) {
  const { lang, setLang, t } = useLang();
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Fetch category counts once on mount (for mobile menu badges)
  useEffect(() => {
    fetch("/api/products/categories").then((r) => r.json()).then((data) => {
      if (data.counts) setCategoryCounts(data.counts);
    }).catch(() => {});
  }, []);

  const [searchFocused, setSearchFocused] = useState(false);
  // Lock body scroll when mobile fullscreen search is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (searchFocused && window.innerWidth < 1024) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [searchFocused]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hideTopRow, setHideTopRow] = useState(false);

  const searchRef = useRef<HTMLFormElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const { user, isLoggedIn, setShowAuthModal } = useAuth();
  const pathname = usePathname();
  const router = useRouter();



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

  // Smart search state
  type ApiProduct = { gtin: string; title: string; brand: string; imageUrl: string | null; price: number | null };
  type BrandSuggestion = { name: string; count: number };
  type CategoryHint = { brand: string; category: string; categoryName: string | null; count: number };
  const [apiResults, setApiResults] = useState<ApiProduct[]>([]);
  const [brandSuggestions, setBrandSuggestions] = useState<BrandSuggestion[]>([]);
  const [categoryHints, setCategoryHints] = useState<CategoryHint[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pa_recent_searches");
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 6));
    } catch { /* ignore */ }
  }, []);

  // Save a term to recent searches
  const saveRecentSearch = useCallback((term: string) => {
    const t = term.trim();
    if (!t || t.length < 2) return;
    try {
      const stored = localStorage.getItem("pa_recent_searches");
      const arr: string[] = stored ? JSON.parse(stored) : [];
      const filtered = arr.filter((s) => s.toLowerCase() !== t.toLowerCase());
      const updated = [t, ...filtered].slice(0, 6);
      localStorage.setItem("pa_recent_searches", JSON.stringify(updated));
      setRecentSearches(updated);
    } catch { /* ignore */ }
  }, []);

  const clearRecentSearches = useCallback(() => {
    try { localStorage.removeItem("pa_recent_searches"); } catch { /* ignore */ }
    setRecentSearches([]);
  }, []);

  // Debounced API search: products + brand suggestions in parallel
  useEffect(() => {
    if (!query.trim() || query.length < 1) {
      setApiResults([]); setBrandSuggestions([]); setCategoryHints([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const [suggestRes, searchRes] = await Promise.all([
          fetch(`/api/products/suggest?q=${encodeURIComponent(query)}&limit=6`).then((r) => r.json()),
          query.length >= 2
            ? fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=4`).then((r) => r.json())
            : Promise.resolve({ results: [] }),
        ]);
        setBrandSuggestions(suggestRes.brands ?? []);
        setCategoryHints(suggestRes.categoryHints ?? []);
        setApiResults(searchRes.results ?? []);
      } catch {
        setApiResults([]); setBrandSuggestions([]); setCategoryHints([]);
      }
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const showDropdown = searchFocused && (query.length >= 1 || recentSearches.length > 0);

  const goToProduct = useCallback((gtin: string) => {
    setSearchFocused(false);
    onQueryChange("");
    // Use window.location for guaranteed navigation
    window.location.href = `/product/${gtin}`;
  }, [onQueryChange]);

  // Form submit (Enter key / mobile keyboard search button)
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    saveRecentSearch(q);
    setSearchFocused(false);
    // If a single product matches exactly, jump to it; else navigate to brand search
    if (apiResults.length > 0) {
      window.location.href = `/product/${apiResults[0].gtin}`;
      return;
    }
    if (brandSuggestions.length > 0) {
      window.location.href = `/brands?q=${encodeURIComponent(brandSuggestions[0].name)}`;
      return;
    }
    // Generic fallback: brand directory filter
    window.location.href = `/brands?q=${encodeURIComponent(q)}`;
  }, [query, apiResults, brandSuggestions, saveRecentSearch, onQueryChange]);

  const searchResultsDropdown = showDropdown ? (
    <div className="absolute left-0 right-0 top-full z-[60] mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
      {/* Recent searches — only when input is empty */}
      {query.length === 0 && recentSearches.length > 0 && (
        <div className="border-b border-gray-100">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Zuletzt gesucht</p>
            <button onMouseDown={(e) => { e.preventDefault(); clearRecentSearches(); }}
              className="text-[11px] text-[#0076bd] hover:underline">Verlauf löschen</button>
          </div>
          {recentSearches.map((term) => (
            <div key={term} role="button" tabIndex={0}
              onMouseDown={() => { onQueryChange(term); saveRecentSearch(term); }}
              className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Search className="h-3.5 w-3.5 text-gray-300" />
              {term}
            </div>
          ))}
        </div>
      )}

      {/* Brand autocomplete (Galaxus-style) */}
      {brandSuggestions.length > 0 && (
        <div className="border-b border-gray-100 py-1">
          {brandSuggestions.map((b) => {
            const q = query.toLowerCase();
            const bLower = b.name.toLowerCase();
            const idx = bLower.indexOf(q);
            const before = idx >= 0 ? b.name.slice(0, idx) : b.name;
            const match = idx >= 0 ? b.name.slice(idx, idx + q.length) : "";
            const after = idx >= 0 ? b.name.slice(idx + q.length) : "";
            return (
              <a key={b.name} href={`/brands?q=${encodeURIComponent(b.name)}`}
                onMouseDown={() => saveRecentSearch(b.name)}
                className="flex cursor-pointer items-center gap-3 px-4 py-2 text-[14px] text-gray-500 hover:bg-gray-50">
                <span className="shrink-0"><BrandLogo name={b.name} size="sm" shape="circle" /></span>
                <span className="flex-1 truncate">
                  {before}<span className="font-bold text-gray-900">{match}</span>{after}
                </span>
                <span className="shrink-0 text-[10px] text-gray-400">{b.count}</span>
              </a>
            );
          })}
        </div>
      )}

      {/* Category hints — "Brand in Category" */}
      {categoryHints.length > 0 && (
        <div className="border-b border-gray-100 py-1">
          {categoryHints.map((h) => (
            <a key={`${h.brand}-${h.category}`} href={`/category/${h.category}`}
              onMouseDown={() => saveRecentSearch(h.brand)}
              className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-[13px] text-gray-500 hover:bg-gray-50">
              <span className="truncate">
                <span className="font-semibold text-gray-900">{h.brand}</span>
                {" "}in{" "}
                <span className="text-gray-500">{h.categoryName || h.category}</span>
              </span>
              <span className="shrink-0 text-[10px] text-gray-400">{h.count}</span>
            </a>
          ))}
        </div>
      )}

      {/* Product preview */}
      {apiResults.length > 0 && (
        <div className="py-1">
          <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Produkte</p>
          {apiResults.map((item) => (
            <div key={item.gtin} role="button" tabIndex={0}
              onMouseDown={() => { saveRecentSearch(query); goToProduct(item.gtin); }}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left hover:bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl || "/placeholder-product.svg"} alt="" width={40} height={40}
                className="h-10 w-10 shrink-0 rounded bg-gray-50 object-contain" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-900">
                  <span className="font-bold">{item.brand}</span> {item.title.replace(item.brand, "").trim()}
                </p>
              </div>
              {item.price && item.price > 0 && (
                <span className="shrink-0 text-sm font-bold text-gray-900">{Math.floor(item.price)}.–</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {query.length >= 2 && apiResults.length === 0 && brandSuggestions.length === 0 && (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500">Keine Ergebnisse für &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  ) : null;

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
            <form ref={searchRef} onSubmit={handleSearchSubmit} className="search-shine relative w-[45%]">
              <div className="flex items-center rounded-full border border-gray-300 bg-white transition-shadow focus-within:border-transparent focus-within:shadow-lg">
                <Search className="ml-5 h-5 w-5 shrink-0 text-gray-400" />
                <input type="search" enterKeyHint="search" value={query} onChange={(e) => onQueryChange(e.target.value)} onFocus={() => setSearchFocused(true)}
                  placeholder={t("searchPlaceholder")} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[16px] outline-none placeholder:text-gray-400" />
                <button type="button" onClick={() => showVision?.()} className="group/cam relative mr-2 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <Camera className="h-5 w-5" />
                  <span className="pointer-events-none absolute -bottom-14 left-1/2 z-50 w-72 -translate-x-1/2 rounded-lg bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-700 opacity-0 shadow-lg ring-1 ring-gray-200 transition group-hover/cam:opacity-100">
                    <strong className="text-slate-800">KI-Bildsuche</strong> — Lade ein Foto hoch und finde das günstigste Angebot in der Schweiz. Powered by OpenAI Vision.
                  </span>
                </button>
              </div>
              {searchResultsDropdown}
            </form>
            <div className="flex-1" />
            {/* Right: Pin + Heart + Lang + Auth */}
            <div className="flex shrink-0 items-center gap-0.5">
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
                <button onClick={() => setShowAuthModal(true)} className="ml-1 rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800">{t("login")}</button>
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
              {t("menu")}
            </button>
            <button
              onClick={() => setSearchFocused(true)}
              className="flex flex-1 items-center rounded-full border border-gray-300 bg-white px-3 py-2 text-left"
              type="button"
            >
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="ml-2 flex-1 truncate text-base text-gray-400">
                {query || t("searchPlaceholder")}
              </span>
            </button>
          </div>
          <div className="border-b border-gray-200" />
        </div>
      </header>

      {/* ═══ Mobile Fullscreen Search Overlay ═══ */}
      {searchFocused && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white lg:hidden">
          <div className="rainbow-bar shrink-0" />
          <form onSubmit={handleSearchSubmit} className="flex shrink-0 items-center gap-2 px-3 py-3">
            <button type="button" onClick={() => setSearchFocused(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-1 items-center rounded-full border border-gray-300 bg-white px-3">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input type="search" enterKeyHint="search" autoFocus
                value={query} onChange={(e) => onQueryChange(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-base outline-none placeholder:text-gray-400" />
              {query && (
                <button type="button" onClick={() => onQueryChange("")}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {/* Suggestions content fills the rest of the viewport */}
          <div className="flex-1 overflow-y-auto">
            {/* Recent searches when input is empty */}
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="border-b border-gray-100">
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-500">Zuletzt gesucht</p>
                  <button onClick={clearRecentSearches}
                    className="text-[12px] text-[#0076bd]">Verlauf löschen</button>
                </div>
                {recentSearches.map((term) => (
                  <button key={term} type="button"
                    onClick={() => { onQueryChange(term); saveRecentSearch(term); }}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left text-[15px] text-gray-700 hover:bg-gray-50">
                    <Search className="h-4 w-4 text-gray-300" />
                    {term}
                  </button>
                ))}
              </div>
            )}

            {/* Brand autocomplete with logos */}
            {brandSuggestions.length > 0 && (
              <div className="border-b border-gray-100 py-1">
                {brandSuggestions.map((b) => {
                  const q = query.toLowerCase();
                  const bLower = b.name.toLowerCase();
                  const idx = bLower.indexOf(q);
                  const before = idx >= 0 ? b.name.slice(0, idx) : b.name;
                  const match = idx >= 0 ? b.name.slice(idx, idx + q.length) : "";
                  const after = idx >= 0 ? b.name.slice(idx + q.length) : "";
                  return (
                    <a key={b.name} href={`/brands?q=${encodeURIComponent(b.name)}`}
                      onClick={() => saveRecentSearch(b.name)}
                      className="flex items-center gap-3 px-5 py-2.5 text-[15px] text-gray-500 hover:bg-gray-50">
                      <span className="shrink-0"><BrandLogo name={b.name} size="sm" shape="circle" /></span>
                      <span className="flex-1 truncate">
                        {before}<span className="font-bold text-gray-900">{match}</span>{after}
                      </span>
                      <span className="shrink-0 text-[11px] text-gray-400">{b.count}</span>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Category hints */}
            {categoryHints.length > 0 && (
              <div className="border-b border-gray-100 py-1">
                {categoryHints.map((h) => (
                  <a key={`${h.brand}-${h.category}`} href={`/category/${h.category}`}
                    onClick={() => saveRecentSearch(h.brand)}
                    className="flex items-center justify-between gap-3 px-5 py-2.5 text-[14px] text-gray-500 hover:bg-gray-50">
                    <span className="truncate">
                      <span className="font-semibold text-gray-900">{h.brand}</span>
                      {" "}in{" "}
                      <span className="text-gray-500">{h.categoryName || h.category}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-400">{h.count}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Product preview */}
            {apiResults.length > 0 && (
              <div className="py-1">
                <p className="px-5 pt-3 pb-2 text-[12px] font-semibold uppercase tracking-wider text-gray-500">Produkte</p>
                {apiResults.map((item) => (
                  <button key={item.gtin} type="button"
                    onClick={() => { saveRecentSearch(query); goToProduct(item.gtin); }}
                    className="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl || "/placeholder-product.svg"} alt="" width={48} height={48}
                      className="h-12 w-12 shrink-0 rounded bg-gray-50 object-contain" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm text-gray-900">
                        <span className="font-bold">{item.brand}</span> {item.title.replace(item.brand, "").trim()}
                      </p>
                    </div>
                    {item.price && item.price > 0 && (
                      <span className="shrink-0 text-sm font-bold text-gray-900">{Math.floor(item.price)}.–</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {query.length >= 2 && apiResults.length === 0 && brandSuggestions.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-500">Keine Ergebnisse für &ldquo;{query}&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile menu — uses master CATEGORIES list directly */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[45] overflow-y-auto bg-white lg:hidden" style={{ top: `calc(9px + ${hideTopRow ? 0 : 44}px + 42px + 1px)` }}>
          {/* Menu header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Alle Kategorien</p>
            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400"><X className="h-4 w-4" /></button>
          </div>
          <nav>
            {SIDEBAR_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isExpanded = expandedMenu === cat.slug;
              // Compute real count: category itself + all subcategory slugs
              const catCount = categoryCounts[cat.slug] ?? 0;
              const subsCount = cat.subcategories.reduce((s, sub) => s + (categoryCounts[sub.slug] ?? 0), 0);
              const totalCount = catCount + subsCount;
              const hasSubs = cat.subcategories.length > 0;

              return (
                <div key={cat.slug}>
                  {hasSubs ? (
                    <button
                      onClick={() => setExpandedMenu(isExpanded ? null : cat.slug)}
                      className="flex w-full items-center gap-3 border-b border-gray-50 px-5 py-3 text-[15px] text-slate-800"
                    >
                      <Icon className={`h-[16px] w-[16px] transition ${isExpanded ? "text-[#D81E05]" : "text-gray-400"}`} strokeWidth={1.75} />
                      <span className={isExpanded ? "font-medium" : ""}>{cat.name}</span>
                      {totalCount > 0 && <span className="ml-auto text-[11px] text-gray-400">{totalCount.toLocaleString("de-CH")}</span>}
                      <ChevronDown className={`ml-2 h-4 w-4 text-gray-300 transition ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  ) : (
                    <Link
                      href={`/category/${cat.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center gap-3 border-b border-gray-50 px-5 py-3 text-[15px] text-slate-800"
                    >
                      <Icon className="h-[16px] w-[16px] text-gray-400" strokeWidth={1.75} />
                      <span>{cat.name}</span>
                      {totalCount > 0 && <span className="ml-auto text-[11px] text-gray-400">{totalCount.toLocaleString("de-CH")}</span>}
                      <ChevronRight className="ml-2 h-4 w-4 text-gray-300" />
                    </Link>
                  )}
                  {isExpanded && (
                    <div className="border-b border-gray-100 bg-gray-50/80 py-1">
                      <Link
                        href={`/category/${cat.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-12 py-2 text-[13px] font-medium text-[#D81E05]"
                      >
                        Alle in {cat.name}
                      </Link>
                      {cat.subcategories.map((sub) => {
                        const subCount = categoryCounts[sub.slug] ?? 0;
                        return (
                        <Link
                          key={sub.slug}
                          href={`/category/${sub.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between px-12 py-2 text-[14px] text-gray-600 transition hover:text-slate-900"
                        >
                          <span>{sub.name}</span>
                          {subCount > 0 && <span className="text-[10px] text-gray-400">{subCount.toLocaleString("de-CH")}</span>}
                        </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {/* Service Links — styled like categories with icons */}
            <div className="mt-2 border-t border-gray-100 pt-2">
              <Link href="/shops" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 border-b border-gray-50 px-5 py-3 text-[15px] text-slate-800">
                <Store className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
                <span>Shop-Übersicht</span>
                <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
              </Link>
              <Link href="/brands" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 border-b border-gray-50 px-5 py-3 text-[15px] text-slate-800">
                <Tag className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
                <span>Marken-Übersicht</span>
                <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
