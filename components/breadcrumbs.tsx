"use client";

import Link from "next/link";
import type { Route } from "next";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Galaxus-style breadcrumbs — every parent segment is a prefetched
 * link back to its canonical category URL; the last segment (current
 * page) is rendered as plain text with `aria-current="page"` so screen
 * readers announce it correctly and users don't accidentally click the
 * page they're already on.
 *
 * Trail example: Gesamtsortiment > Smartphones > Apple iPhone > iPhone
 * Each parent resolves to its hierarchical URL — e.g. the "Apple iPhone"
 * link points to /category/smartphones/smartphones-apple — so clicks
 * always walk a real node in the tree, never a 404.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.href}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight className="h-3 w-3 shrink-0 text-gray-400" aria-hidden="true" />
              )}
              {isLast ? (
                <span aria-current="page" className="font-medium text-slate-800">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href as Route}
                  prefetch
                  className="text-[#0076bd] transition hover:text-[#005a94] hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
