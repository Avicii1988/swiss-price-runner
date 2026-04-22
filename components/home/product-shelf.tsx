"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import type { ShelfItem } from "@/lib/data";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

export type ShelfLayout = "grid" | "list";

interface ProductShelfProps {
  title: string;
  subtitle?: string;
  items: ShelfItem[];
  href: string;
  limit?: number;
  layout?: ShelfLayout;
  onAlert?: (item: MockProductWithHistory) => void;
}

/**
 * Home-page thematic shelf — uses the same ProductCard as category pages
 * so the visual language is identical across the app.
 */
export function ProductShelf({
  title,
  subtitle,
  items,
  href,
  limit = 12,
  layout = "grid",
  onAlert,
}: ProductShelfProps) {
  if (items.length === 0) return null;
  const visible = items.slice(0, limit);
  const target = href as Route;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          {subtitle && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              {subtitle}
            </p>
          )}
          <h2 className="mt-0.5 truncate text-[17px] font-semibold tracking-tight text-gray-900 sm:text-lg">
            {title}
          </h2>
        </div>
        <Link
          href={target}
          className="group flex shrink-0 items-center gap-1 text-[12px] font-medium text-gray-600 transition hover:text-gray-900"
        >
          Alle anzeigen
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div
        className={
          layout === "list"
            ? "flex flex-col divide-y divide-[#f0f0f2]"
            // Grid: on mobile (1 col) show divider lines between rows instead of
            // large gaps so the list feels compact; on md+ restore the gap and
            // switch to column dividers (md:border-r handled inside ProductCard).
            : "grid grid-cols-1 divide-y divide-gray-100 md:divide-y-0 md:gap-y-12 md:grid-cols-2 lg:grid-cols-3 md:overflow-hidden"
        }
      >
        {visible.map((item, idx) => (
          <ProductCard
            key={item.product.gtin}
            item={item}
            layout={layout}
            onAlert={onAlert}
            eager={idx < 4}
          />
        ))}
      </div>
    </section>
  );
}
