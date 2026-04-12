"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Camera, Heart, Pin, Menu, X, ChevronRight, ChevronDown, ArrowRight, User, Store, Tag } from "lucide-react";
import { LanguageSwitcher, type LangCode } from "@/components/language-switcher";
import { PreisAlarmLogo } from "@/components/preisalarm-logo";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hideTopRow, setHideTopRow] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
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

  const suggestions = useMemo(() => {
    // Client-side filtering removed — now handled by debounced API call
    return [] as { gtin: string; title: string; brand: string; imageUrl: string | null; price: number | null }[];
  }, []);

  // Debounced API search
  const [apiResults, setApiResults] = useState<{ gtin: string; title: string; brand: string; imageUrl: string | null; price: number | null }[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setApiResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=8`);
        const data = await res.json();
        setApiResults(data.results ?? []);
      } catch { setApiResults([]); }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const showDropdown = searchFocused && query.length >= 2;

  const goToProduct = useCallback((gtin: string) => {
    setSearchFocused(false);
    onQueryChange("");
    // Use window.location for guaranteed navigation
    window.location.href = `/product/${gtin}`;
  }, [onQueryChange]);

  const searchResultsDropdown = showDropdown ? (
    apiResults.length > 0 ? (
      <div className="absolute left-0 right-0 top-full z-[60] mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        {apiResults.map((item) => (
          <div key={item.gtin} role="button" tabIndex={0}
            onMouseDown={() => goToProduct(item.gtin)}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition hover:bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl || ""} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg bg-gray-50 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-gray-900">{item.title}</p>
              <p className="text-[11px] text-gray-400">{item.brand}</p>
            </div>
            {item.price && item.price > 0 && (
              <span className="shrink-0 text-sm font-bold text-gray-900">{Math.floor(item.price)}.–</span>
            )}
          </div>
        ))}
      </div>
    ) : query.length >= 2 ? (
      <div className="absolute left-0 right-0 top-full z-[60] mt-1 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-xl">
        <p className="text-sm text-gray-500">Keine Ergebnisse für &ldquo;{query}&rdquo;</p>
      </div>
    ) : null
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
            <div ref={searchRef} className="search-shine relative w-[45%]">
              <div className="flex items-center rounded-full border border-gray-300 bg-white transition-shadow focus-within:border-transparent focus-within:shadow-lg">
                <Search className="ml-5 h-5 w-5 shrink-0 text-gray-400" />
                <input type="search" value={query} onChange={(e) => onQueryChange(e.target.value)} onFocus={() => setSearchFocused(true)}
                  placeholder={t("searchPlaceholder")} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[16px] outline-none placeholder:text-gray-400" />
                <button onClick={() => showVision?.()} className="group/cam relative mr-2 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <Camera className="h-5 w-5" />
                  <span className="pointer-events-none absolute -bottom-14 left-1/2 z-50 w-72 -translate-x-1/2 rounded-lg bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-700 opacity-0 shadow-lg ring-1 ring-gray-200 transition group-hover/cam:opacity-100">
                    <strong className="text-slate-800">KI-Bildsuche</strong> — Lade ein Foto hoch und finde das günstigste Angebot in der Schweiz. Powered by OpenAI Vision.
                  </span>
                </button>
              </div>
              {searchResultsDropdown}
            </div>
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
            <div ref={searchRef} className="search-shine relative flex-1">
              <div className="flex items-center rounded-full border border-gray-300 bg-white focus-within:border-transparent">
                <Search className="ml-3 h-4 w-4 text-gray-400" />
                <input type="search" value={query} onChange={(e) => onQueryChange(e.target.value)} onFocus={() => setSearchFocused(true)}
                  placeholder={t("searchPlaceholder")} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base outline-none placeholder:text-gray-400" />
                <button onClick={() => showVision?.()} className="mr-1 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:text-gray-600" title="KI-Bildsuche — Lade ein Foto hoch und finde das günstigste Angebot in der Schweiz. Powered by OpenAI Vision.">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              {searchResultsDropdown}
            </div>
          </div>
          <div className="border-b border-gray-200" />
        </div>
      </header>

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
