"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryIcon, prettifySlug } from "@/lib/category-icons";

interface DynamicCategory {
  slug: string;
  name: string;
  productCount: number;
}

interface CategorySidebarProps {
  activeCategorySlug?: string;
  activeSubSlug?: string;
  /** Dynamic categories from DB — if provided, shown after master categories */
  dynamicCategories?: DynamicCategory[];
}

/**
 * Sidebar navigation.
 * Shows master categories (from code) + dynamic feed categories (from DB).
 */
export function CategorySidebar({
  activeCategorySlug,
  activeSubSlug,
  dynamicCategories,
}: CategorySidebarProps) {
  const activeCategory = activeCategorySlug
    ? CATEGORIES.find((c) => c.slug === activeCategorySlug)
    : undefined;

  // Dynamic categories that are NOT in master list, have products, and are clean
  const masterSlugs = new Set(CATEGORIES.map((c) => c.slug));
  const HIDDEN_CATS = new Set(["sonstiges", "seed"]);
  const feedCategories = (dynamicCategories ?? []).filter(
    (dc) => !masterSlugs.has(dc.slug) && !HIDDEN_CATS.has(dc.slug) && dc.productCount > 0 && !dc.slug.includes("-gt-"),
  );

  // ── Inside a category ──────────────────────────────────────
  if (activeCategory) {
    return (
      <nav>
        <Link
          href="/"
          className="flex items-center justify-between border-b border-gray-200 pb-2.5 text-[14px] font-medium text-slate-800 transition hover:text-slate-900"
        >
          Gesamtsortiment
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>

        <Link
          href={`/category/${activeCategory.slug}`}
          className={`mt-3 block text-[14px] font-bold ${
            !activeSubSlug ? "text-[#D81E05]" : "text-slate-900"
          }`}
        >
          {activeCategory.name}
        </Link>

        {activeCategory.subcategories.length > 0 && (
          <div className="mt-1.5 border-l border-gray-200 pl-3">
            {activeCategory.subcategories.map((sub) => {
              const isActive = activeSubSlug === sub.slug;
              return (
                <Link
                  key={sub.slug}
                  href={`/category/${activeCategory.slug}/${sub.slug}`}
                  className={`flex items-center justify-between border-b border-gray-100 py-2 text-[13px] transition last:border-b-0 ${
                    isActive
                      ? "font-bold text-[#D81E05]"
                      : "text-gray-600 hover:text-slate-900"
                  }`}
                >
                  <span>{sub.name}</span>
                  <span className="text-[10px] text-gray-400">{sub.productCount}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    );
  }

  // ── Also check if it's a dynamic (feed) category ───────────
  const activeFeedCat = !activeCategory && activeCategorySlug
    ? feedCategories.find((dc) => dc.slug === activeCategorySlug)
    : null;

  if (activeFeedCat) {
    const Icon = getCategoryIcon(activeFeedCat.slug);
    return (
      <nav>
        <Link
          href="/"
          className="flex items-center justify-between border-b border-gray-200 pb-2.5 text-[14px] font-medium text-slate-800 transition hover:text-slate-900"
        >
          Gesamtsortiment
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>

        <div className="mt-3 flex items-center gap-2 text-[14px] font-bold text-[#D81E05]">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
          {activeFeedCat.name}
        </div>
        <p className="mt-1 text-[11px] text-gray-400">{activeFeedCat.productCount} Produkte</p>
      </nav>
    );
  }

  // ── Homepage: full category list ───────────────────────────
  return (
    <nav>
      {/* Master categories */}
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="group flex items-center gap-2.5 py-[6px] text-[13px] text-gray-600 transition hover:text-slate-900"
          >
            <Icon className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-slate-600" strokeWidth={1.75} />
            {cat.name}
          </Link>
        );
      })}

      {/* Dynamic feed categories */}
      {feedCategories.length > 0 && (
        <>
          <div className="my-3 border-t border-gray-100" />
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
            Weitere Kategorien
          </p>
          {feedCategories.map((dc) => {
            const Icon = getCategoryIcon(dc.slug);
            return (
              <Link
                key={dc.slug}
                href={`/category/${dc.slug}`}
                className="group flex items-center justify-between py-[5px] text-[13px] text-gray-500 transition hover:text-slate-900"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400 transition group-hover:text-slate-600" strokeWidth={1.75} />
                  {dc.name}
                </span>
                <span className="text-[10px] text-gray-400">{dc.productCount}</span>
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );
}
