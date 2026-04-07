"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CATEGORIES, type Category } from "@/lib/categories";

interface CategorySidebarProps {
  /** Current top-level category slug (undefined = homepage / Gesamtsortiment) */
  activeCategorySlug?: string;
  /** Current subcategory slug */
  activeSubSlug?: string;
}

/**
 * Unified sidebar navigation — identical ALLE KATEGORIEN list on every page.
 *
 * Homepage: flat list of all 14 master categories with icons.
 * Category page: back-link + active category (bold red) with subcategories + ALLE KATEGORIEN below.
 * Subcategory page: same as category page, with active sub highlighted.
 */
export function CategorySidebar({
  activeCategorySlug,
  activeSubSlug,
}: CategorySidebarProps) {
  const activeCategory = activeCategorySlug
    ? CATEGORIES.find((c) => c.slug === activeCategorySlug)
    : undefined;

  return (
    <nav className="space-y-0">
      {/* ── Active category drill-down (only on category/sub pages) ── */}
      {activeCategory && (
        <div className="mb-4">
          {/* Back to Gesamtsortiment */}
          <Link
            href="/"
            className="mb-3 flex items-center gap-1.5 text-[13px] text-gray-400 transition hover:text-gray-700"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Gesamtsortiment
          </Link>

          {/* Active category — bold red */}
          <Link
            href={`/category/${activeCategory.slug}`}
            className={`flex items-center gap-2 text-[14px] font-bold transition ${
              !activeSubSlug ? "text-[#D81E05]" : "text-slate-900 hover:text-[#D81E05]"
            }`}
          >
            <CategoryIcon category={activeCategory} active={!activeSubSlug} />
            {activeCategory.name}
          </Link>

          {/* Subcategories */}
          {activeCategory.subcategories.length > 0 && (
            <div className="ml-2 mt-1 border-l border-gray-200 pl-3">
              {activeCategory.subcategories.map((sub) => {
                const isActive = activeSubSlug === sub.slug;
                return (
                  <Link
                    key={sub.slug}
                    href={`/category/${activeCategory.slug}/${sub.slug}`}
                    className={`flex items-center justify-between py-1.5 text-[13px] transition ${
                      isActive
                        ? "font-semibold text-[#D81E05]"
                        : "text-gray-600 hover:text-slate-900"
                    }`}
                  >
                    <span>{sub.name}</span>
                    <span className="text-[10px] text-gray-400">
                      {sub.productCount}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ALLE KATEGORIEN — static, identical on every page ── */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
          Alle Kategorien
        </p>
        {CATEGORIES.map((cat) => {
          const isActive = cat.slug === activeCategorySlug;
          return (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={`group flex items-center gap-2 py-[5px] text-[13px] transition ${
                isActive
                  ? "font-semibold text-[#D81E05]"
                  : "text-gray-500 hover:text-slate-900"
              }`}
            >
              <CategoryIcon
                category={cat}
                active={isActive}
                size={16}
              />
              {cat.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function CategoryIcon({
  category,
  active,
  size = 18,
}: {
  category: Category;
  active: boolean;
  size?: number;
}) {
  const Icon = category.icon;
  return (
    <Icon
      className={`shrink-0 transition ${
        active
          ? "text-[#D81E05]"
          : "text-gray-400 group-hover:text-slate-600"
      }`}
      style={{ width: size, height: size }}
      strokeWidth={1.75}
    />
  );
}
