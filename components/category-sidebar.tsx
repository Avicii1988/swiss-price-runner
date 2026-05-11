"use client";

import { useState, useMemo, memo, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, Store, Tag } from "lucide-react";
import { CATEGORY_TREE, findCategoryNode, getAncestors, type CategoryNode } from "@/lib/categories";

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

/**
 * Build the set of slugs that should be expanded on mount so the active
 * category's full ancestor chain is open when the page first renders.
 */
function initialExpanded(activeSlug: string | undefined): Set<string> {
  if (!activeSlug) return new Set();
  const chain = getAncestors(activeSlug);
  return new Set(chain.map((n) => n.slug));
}

/**
 * Recursive sidebar that mirrors the Galaxus left-nav:
 *   - Arbitrary depth (tested up to 6 levels).
 *   - Clicking a parent toggles expand/collapse (accordion).
 *   - Clicking the name on a LEAF node navigates directly.
 *   - Clicking the name on a PARENT node shows "Alle anzeigen"
 *     inside the expansion, so parent-clicks don't accidentally
 *     trigger a navigation while the user is browsing the tree.
 *   - Only expanded branches render children → DOM stays light
 *     even with 500+ total nodes.
 *   - The active node's full ancestor chain auto-expands on mount.
 */
export function CategorySidebar({
  activeCategorySlug,
  dynamicCategories,
}: CategorySidebarProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => initialExpanded(activeCategorySlug),
  );

  const feedCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const dc of dynamicCategories ?? []) {
      if (dc.productCount > 0 && dc.slug.length >= 3 && !/^\d+$/.test(dc.slug)) {
        m.set(dc.slug, dc.productCount);
      }
    }
    return m;
  }, [dynamicCategories]);

  // Set of slugs that should be visible: all slugs with products PLUS
  // their full ancestor chains, so parent nodes stay visible when only
  // a child has products. null = no data yet → show everything.
  const visibleSlugs = useMemo<Set<string> | null>(() => {
    if (feedCounts.size === 0) return null;
    const active = new Set<string>();
    for (const [slug] of feedCounts) {
      active.add(slug);
      for (const ancestor of getAncestors(slug)) {
        active.add(ancestor.slug);
      }
    }
    return active;
  }, [feedCounts]);

  const toggle = useCallback((slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  return (
    <nav aria-label="Kategorien">
      {CATEGORY_TREE
        .filter((root) => !visibleSlugs || visibleSlugs.has(root.slug))
        .map((root) => (
          <SidebarNode
            key={root.slug}
            node={root}
            depth={0}
            activeSlug={activeCategorySlug}
            expanded={expanded}
            onToggle={toggle}
            feedCounts={feedCounts}
            visibleSlugs={visibleSlugs}
          />
        ))}

      {/* Service Links — bottom of sidebar */}
      <div className="mt-5 border-t border-gray-100 pt-3">
        <Link
          href="/shops"
          prefetch
          className="group flex items-center gap-2.5 py-[7px] text-[13px] text-gray-600 transition hover:text-gray-900"
        >
          <Store className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-gray-600" strokeWidth={1.75} />
          Shop-Übersicht
        </Link>
        <Link
          href="/brands"
          prefetch
          className="group flex items-center gap-2.5 py-[7px] text-[13px] text-gray-600 transition hover:text-gray-900"
        >
          <Tag className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-gray-600" strokeWidth={1.75} />
          Marken-Übersicht
        </Link>
      </div>
    </nav>
  );
}

// ───────────────────────────────────────────────────────────────────
// Recursive node — memo'd so only the toggled subtree re-renders.
// ───────────────────────────────────────────────────────────────────

interface SidebarNodeProps {
  node: CategoryNode;
  depth: number;
  activeSlug: string | undefined;
  expanded: Set<string>;
  onToggle: (slug: string) => void;
  feedCounts: Map<string, number>;
  visibleSlugs: Set<string> | null;
}

const SidebarNode = memo(function SidebarNode({
  node,
  depth,
  activeSlug,
  expanded,
  onToggle,
  feedCounts,
  visibleSlugs,
}: SidebarNodeProps) {
  const visibleChildren = visibleSlugs
    ? node.children.filter((c) => visibleSlugs.has(c.slug))
    : node.children;
  const hasChildren = visibleChildren.length > 0;
  const isExpanded = expanded.has(node.slug);
  const isActive = activeSlug === node.slug;
  const count = feedCounts.get(node.slug) ?? 0;
  const Icon = node.icon;

  // Indent increases per depth level. Roots (depth 0) have no indent;
  // deeper levels get progressively smaller indents so the tree doesn't
  // shift too far right on narrow sidebars.
  const indent = depth === 0 ? 0 : depth * 14;

  return (
    <div>
      <div
        className="flex items-center"
        style={{ paddingLeft: indent }}
      >
        {/* Expand/collapse chevron — only on parent nodes */}
        {hasChildren ? (
          <button
            onClick={() => onToggle(node.slug)}
            className="flex h-6 w-6 shrink-0 items-center justify-center text-gray-400 transition hover:text-gray-600"
            aria-label={isExpanded ? `${node.name} zuklappen` : `${node.name} aufklappen`}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}

        {/* Node label — link for leaves, toggle for parents */}
        {hasChildren ? (
          <button
            onClick={() => onToggle(node.slug)}
            className={`flex flex-1 items-center gap-2 py-[6px] text-left text-[13px] transition ${
              isActive
                ? "font-bold text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {Icon && depth === 0 && (
              <Icon
                className="h-4 w-4 shrink-0 text-gray-400"
                strokeWidth={1.75}
              />
            )}
            <span className="truncate">{node.name}</span>
          </button>
        ) : (
          <Link
            href={`/category/${node.slug}`}
            prefetch
            className={`flex flex-1 items-center gap-2 py-[6px] text-[13px] transition ${
              isActive
                ? "font-bold text-gray-900"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span className="truncate">{node.name}</span>
            {count > 0 && (
              <span className="ml-auto shrink-0 text-[10px] text-gray-300">
                {count}
              </span>
            )}
          </Link>
        )}
      </div>

      {/* Expanded children — only rendered when open (lazy DOM). */}
      {hasChildren && isExpanded && (
        <div className={depth === 0 ? "mb-1 border-l border-gray-100 ml-3" : ""}>
          {/* "Alle anzeigen" link for parent nodes — navigates to the
              parent's own category page while leaves are browse-targets. */}
          <Link
            href={`/category/${node.slug}`}
            prefetch
            className="flex items-center py-[5px] text-[12px] font-medium text-[#0076bd] transition hover:text-[#005a94]"
            style={{ paddingLeft: indent + 24 }}
          >
            Alle anzeigen
          </Link>
          {visibleChildren.map((child) => (
            <SidebarNode
              key={child.slug}
              node={child}
              depth={depth + 1}
              activeSlug={activeSlug}
              expanded={expanded}
              onToggle={onToggle}
              feedCounts={feedCounts}
              visibleSlugs={visibleSlugs}
            />
          ))}
        </div>
      )}
    </div>
  );
});
