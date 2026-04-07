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
 * Galaxus-style breadcrumbs — blue links (#0076bd), gray chevrons,
 * last item in dark text.
 *
 * Gesamtsortiment > Smartphones > Apple iPhone
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-[13px]">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className="h-3 w-3 shrink-0 text-gray-400" />
            )}
            {isLast ? (
              <span className="text-slate-800">{item.label}</span>
            ) : (
              <Link
                href={item.href as Route}
                className="text-[#0076bd] transition hover:text-[#005a94]"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
