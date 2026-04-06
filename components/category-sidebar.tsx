"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CATEGORIES,
  SIDEBAR_GROUPS,
  type Category,
} from "@/lib/categories";

interface CategorySidebarProps {
  /** Current top-level category slug (undefined = homepage / Gesamtsortiment) */
  activeCategorySlug?: string;
  /** Current subcategory slug (undefined = viewing parent category) */
  activeSubSlug?: string;
}

/**
 * Galaxus-style drill-down sidebar with strict accordion behavior.
 *
 * - Homepage: shows Gesamtsortiment (all top-level groups → categories)
 *   Only one group expanded at a time.
 * - Category page: shows "← Gesamtsortiment", parent highlighted, subcategories listed
 * - Subcategory page: shows "← Parent", subcategory highlighted
 */
export function CategorySidebar({
  activeCategorySlug,
  activeSubSlug,
}: CategorySidebarProps) {
  // Accordion state — find which group contains the active category and expand it by default
  const defaultExpanded = activeCategorySlug
    ? undefined
    : SIDEBAR_GROUPS.find((g) => g.categorySlugs.length > 1)?.label ?? null;
  const [expandedGroup, setExpandedGroup] = useState<string | null>(
    defaultExpanded ?? null,
  );

  const toggleGroup = (label: string) => {
    setExpandedGroup((prev) => (prev === label ? null : label));
  };

  // ── Inside a category ──────────────────────────────────────
  if (activeCategorySlug) {
    const category = CATEGORIES.find((c) => c.slug === activeCategorySlug);
    if (!category) return null;

    return (
      <nav className="space-y-1">
        {/* Back link */}
        <Link
          href="/"
          className="mb-3 flex items-center gap-1.5 text-[13px] text-gray-400 transition hover:text-gray-700"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Gesamtsortiment
        </Link>

        {/* Parent category — always highlighted */}
        <Link
          href={`/category/${category.slug}`}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] font-semibold transition ${
            !activeSubSlug
              ? "bg-red-50 text-red-600"
              : "text-gray-900 hover:bg-gray-50"
          }`}
        >
          <CategoryIcon category={category} active={!activeSubSlug} />
          {category.name}
        </Link>

        {/* Subcategories */}
        {category.subcategories.length > 0 && (
          <div className="ml-2 border-l border-gray-200 pl-3 pt-1">
            {category.subcategories.map((sub) => {
              const isActive = activeSubSlug === sub.slug;
              return (
                <Link
                  key={sub.slug}
                  href={`/category/${category.slug}/${sub.slug}`}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] transition ${
                    isActive
                      ? "bg-red-50 font-semibold text-red-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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

        {/* All categories */}
        <div className="mt-4 border-t border-gray-200 pt-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Alle Kategorien
          </p>
          {CATEGORIES.filter((c) => c.slug !== activeCategorySlug).map(
            (cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
              >
                <CategoryIcon category={cat} active={false} size={14} />
                {cat.name}
              </Link>
            ),
          )}
        </div>
      </nav>
    );
  }

  // ── Homepage: Gesamtsortiment (strict accordion) ───────────
  return (
    <nav>
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
        Gesamtsortiment
      </p>
      {SIDEBAR_GROUPS.map((group) => {
        const Icon = group.icon;
        const cats = CATEGORIES.filter((c) =>
          group.categorySlugs.includes(c.slug),
        );
        const isExpanded = expandedGroup === group.label;

        return (
          <div key={group.label} className="py-0.5">
            {/* Single-category group → direct link */}
            {cats.length === 1 ? (
              <Link
                href={`/category/${cats[0].slug}`}
                className="group flex w-full items-center gap-2.5 py-2 text-left text-[14px] text-gray-600 transition hover:text-gray-900"
              >
                <Icon
                  className="h-[18px] w-[18px] text-gray-400 transition group-hover:text-red-500"
                  strokeWidth={1.75}
                />
                <span>{group.label}</span>
              </Link>
            ) : (
              /* Multi-category group → accordion toggle */
              <>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="group flex w-full items-center gap-2.5 py-2 text-left text-[14px] text-gray-600 transition hover:text-gray-900"
                >
                  <Icon
                    className={`h-[18px] w-[18px] transition ${
                      isExpanded
                        ? "text-red-500"
                        : "text-gray-400 group-hover:text-red-500"
                    }`}
                    strokeWidth={1.75}
                  />
                  <span className={isExpanded ? "font-medium text-gray-900" : ""}>
                    {group.label}
                  </span>
                  <ChevronRight
                    className={`ml-auto h-3.5 w-3.5 text-gray-400 transition ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {isExpanded && (
                  <div className="mb-1 ml-[13px] border-l border-gray-200 pl-3">
                    {cats.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/category/${cat.slug}`}
                        className="block py-1.5 text-[13px] text-gray-500 transition hover:text-gray-900"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ── Helper: render category icon ─────────────────────────────
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
      className={`transition ${
        active ? "text-red-500" : "text-gray-400 group-hover:text-red-500"
      }`}
      style={{ width: size, height: size }}
      strokeWidth={1.75}
    />
  );
}
