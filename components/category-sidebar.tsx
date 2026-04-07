"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CATEGORIES, type Category } from "@/lib/categories";

interface CategorySidebarProps {
  activeCategorySlug?: string;
  activeSubSlug?: string;
}

/**
 * Galaxus-style dynamic tree sidebar.
 *
 * Level 0 (Homepage): Show the 14 master categories with icons.
 * Level 1 (Category): Gesamtsortiment > Category (bold red) > subcategories.
 * Level 2 (Subcategory): Gesamtsortiment > Category > Subcategory (bold red).
 */
export function CategorySidebar({
  activeCategorySlug,
  activeSubSlug,
}: CategorySidebarProps) {
  const activeCategory = activeCategorySlug
    ? CATEGORIES.find((c) => c.slug === activeCategorySlug)
    : undefined;

  // ── Level 1+: Dynamic tree path ────────────────────────────
  if (activeCategory) {
    return (
      <nav>
        {/* Gesamtsortiment — root with chevron */}
        <Link
          href="/"
          className="flex items-center justify-between border-b border-gray-200 pb-2.5 text-[14px] font-medium text-slate-800 transition hover:text-slate-900"
        >
          Gesamtsortiment
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>

        {/* Active category — bold red */}
        <Link
          href={`/category/${activeCategory.slug}`}
          className={`mt-3 block text-[14px] font-bold ${
            !activeSubSlug ? "text-[#D81E05]" : "text-slate-900"
          }`}
        >
          {activeCategory.name}
        </Link>

        {/* Subcategories */}
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
                  <span className="text-[10px] text-gray-400">
                    {sub.productCount}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    );
  }

  // ── Level 0: Homepage — flat list of 14 master categories ──
  return (
    <nav>
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="group flex items-center gap-2.5 py-[6px] text-[13px] text-gray-600 transition hover:text-slate-900"
          >
            <Icon
              className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-slate-600"
              strokeWidth={1.75}
            />
            {cat.name}
          </Link>
        );
      })}
    </nav>
  );
}
