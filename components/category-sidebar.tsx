"use client";

import Link from "next/link";
import { ChevronRight, ChevronDown, Store, Tag } from "lucide-react";
import { useState } from "react";
import { SIDEBAR_CATEGORIES } from "@/lib/categories";

interface DynamicCategory {
  slug: string;
  name: string;
  productCount: number;
}

interface CategorySidebarProps {
  activeCategorySlug?: string;
  activeSubSlug?: string;
  dynamicCategories?: DynamicCategory[];
}

/** Returns true if the slug looks like valid text (not a numeric ID from a feed) */
function isValidSlug(slug: string): boolean {
  if (/^\d+$/.test(slug)) return false;
  if (slug.length < 3) return false;
  return true;
}

export function CategorySidebar({ activeCategorySlug, dynamicCategories }: CategorySidebarProps) {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(activeCategorySlug ?? null);

  // Build a map of feed slug → product count from DB (only valid text slugs).
  // We use this to enrich the subcategory rows with live counts — nothing
  // else. Unmapped / junk categories are intentionally NOT shown here; the
  // sidebar is strictly the curated master list.
  const feedCounts = new Map<string, number>();
  for (const dc of dynamicCategories ?? []) {
    if (dc.productCount > 0 && isValidSlug(dc.slug) && dc.slug !== "sonstiges" && dc.slug !== "seed") {
      feedCounts.set(dc.slug, dc.productCount);
    }
  }

  return (
    <nav>
      {SIDEBAR_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isExpanded = expandedSlug === cat.slug;

        // Enrich subcategories with real counts (show all master-defined subs, even without DB matches)
        const enrichedSubs = cat.subcategories
          .map((sub) => ({ ...sub, productCount: feedCounts.get(sub.slug) ?? 0 }));

        const hasSubs = enrichedSubs.length > 0;

        return (
          <div key={cat.slug}>
            <div className="flex items-center">
              {/* prefetch={true} — the sidebar is always visible so every
                  L1 entry warms up its category RSC payload + chunks on
                  mount. Combined with the cache() wrapper in lib/data.ts
                  and ISR on the route, click → first paint feels instant. */}
              <Link
                href={`/category/${cat.slug}`}
                prefetch
                className={`group flex flex-1 items-center gap-2.5 py-[7px] text-[13px] transition ${
                  activeCategorySlug === cat.slug ? "font-bold text-gray-900" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-gray-600" strokeWidth={1.75} />
                {cat.name}
              </Link>
              {hasSubs && (
                <button onClick={() => setExpandedSlug(isExpanded ? null : cat.slug)}
                  className="flex h-6 w-6 items-center justify-center text-gray-400 hover:text-gray-600">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>

            {/* Subcategories — expandable */}
            {hasSubs && isExpanded && (
              <div className="mb-1 ml-3 border-l border-gray-200 pl-3">
                {enrichedSubs.map((sub) => (
                  <Link key={sub.slug} href={`/category/${sub.slug}`}
                    prefetch
                    className={`flex items-center justify-between py-[5px] text-[12px] transition ${
                      activeCategorySlug === sub.slug ? "font-semibold text-gray-900" : "text-gray-500 hover:text-gray-900"
                    }`}>
                    <span>{sub.name}</span>
                    {sub.productCount > 0 && <span className="text-[10px] text-gray-300">{sub.productCount}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Service Links — styled like categories */}
      <div className="mt-5 border-t border-gray-100 pt-3">
        <Link href="/shops" className="group flex items-center gap-2.5 py-[7px] text-[13px] text-gray-600 transition hover:text-gray-900">
          <Store className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-gray-600" strokeWidth={1.75} />
          Shop-Übersicht
        </Link>
        <Link href="/brands" className="group flex items-center gap-2.5 py-[7px] text-[13px] text-gray-600 transition hover:text-gray-900">
          <Tag className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-gray-600" strokeWidth={1.75} />
          Marken-Übersicht
        </Link>
      </div>
    </nav>
  );
}
