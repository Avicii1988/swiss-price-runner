"use client";

import Link from "next/link";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { CATEGORIES, SIDEBAR_CATEGORIES } from "@/lib/categories";
import { getCategoryIcon } from "@/lib/category-icons";

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

// Map feed slugs → master parent slug
const FEED_TO_PARENT: Record<string, string> = {
  herrendufte: "parfum", damendufte: "parfum", "unisex-dufte": "parfum",
  geschenksets: "parfum", pflege: "parfum", "make-up": "parfum",
  haarpflege: "parfum", koerperpflege: "parfum", sonnenpflege: "parfum",
};

/** Returns true if the slug looks like valid text (not a numeric ID from a feed) */
function isValidSlug(slug: string): boolean {
  // Reject pure numbers, very short slugs, or slugs that are just IDs
  if (/^\d+$/.test(slug)) return false;
  if (slug.length < 3) return false;
  return true;
}

export function CategorySidebar({ activeCategorySlug, dynamicCategories }: CategorySidebarProps) {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(activeCategorySlug ?? null);

  // Build a map of feed slug → product count from DB (only valid text slugs)
  const feedCounts = new Map<string, number>();
  for (const dc of dynamicCategories ?? []) {
    if (dc.productCount > 0 && isValidSlug(dc.slug) && dc.slug !== "sonstiges" && dc.slug !== "seed") {
      feedCounts.set(dc.slug, dc.productCount);
    }
  }

  // Feed categories that don't belong to any master category (only valid text names)
  const masterSlugs = new Set(CATEGORIES.map((c) => c.slug));
  const mappedSlugs = new Set(Object.keys(FEED_TO_PARENT));
  const HIDDEN = new Set(["sonstiges", "seed", "parfum"]);
  const unmappedFeed = (dynamicCategories ?? []).filter(
    (dc) => !masterSlugs.has(dc.slug) && !mappedSlugs.has(dc.slug)
      && dc.productCount > 0 && isValidSlug(dc.slug)
      && !HIDDEN.has(dc.slug) && !dc.slug.includes("-gt-"),
  );

  return (
    <nav>
      {SIDEBAR_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isExpanded = expandedSlug === cat.slug;

        // Enrich subcategories with real counts from feed
        const enrichedSubs = cat.subcategories
          .map((sub) => ({ ...sub, productCount: feedCounts.get(sub.slug) ?? sub.productCount }))
          .filter((sub) => sub.productCount > 0 || feedCounts.has(sub.slug));

        const hasSubs = enrichedSubs.length > 0;
        const totalCount = enrichedSubs.reduce((s, sub) => s + sub.productCount, 0) || (feedCounts.get(cat.slug) ?? 0);

        return (
          <div key={cat.slug}>
            <div className="flex items-center">
              <Link
                href={`/category/${cat.slug}`}
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

      {/* Unmapped feed categories (only named ones, no junk) */}
      {unmappedFeed.length > 0 && (
        <>
          <div className="my-3 border-t border-gray-100" />
          {unmappedFeed.slice(0, 8).map((dc) => {
            const Icon = getCategoryIcon(dc.slug);
            return (
              <Link key={dc.slug} href={`/category/${dc.slug}`}
                className="group flex items-center justify-between py-[5px] text-[13px] text-gray-500 transition hover:text-gray-900">
                <span className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={1.75} />
                  {dc.name}
                </span>
                <span className="text-[10px] text-gray-300">{dc.productCount}</span>
              </Link>
            );
          })}
        </>
      )}

      {/* Service Links */}
      <div className="mt-5 border-t border-gray-100 pt-4">
        <Link href="/" className="block py-[5px] text-[12px] text-gray-400 transition hover:text-gray-600">
          Shop-Übersicht
        </Link>
        <Link href="/" className="block py-[5px] text-[12px] text-gray-400 transition hover:text-gray-600">
          Marken-Übersicht
        </Link>
      </div>
    </nav>
  );
}
