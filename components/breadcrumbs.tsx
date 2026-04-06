"use client";

import Link from "next/link";
import type { Route } from "next";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Clean breadcrumb trail:
 * Gesamtsortiment > Haushalt > Küchengeräte > Kaffeemaschinen
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-400">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
            {i === 0 ? (
              <Link
                href={item.href as Route}
                className="flex items-center gap-1 transition hover:text-gray-600"
              >
                <Home className="h-3 w-3" />
                {item.label}
              </Link>
            ) : isLast ? (
              <span className="font-medium text-gray-900">{item.label}</span>
            ) : (
              <Link
                href={item.href as Route}
                className="transition hover:text-gray-600"
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
