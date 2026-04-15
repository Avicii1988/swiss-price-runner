"use client";

import { getShopSource } from "@/lib/shop-sources";

/**
 * Inline shop wordmark — a compact text-based "chip" that carries the
 * retailer's brand colour and weight (see lib/shop-sources.ts). Used
 * everywhere the user needs to see which shop a price comes from:
 *   - ProductCard (grid + list): the best-shop badge under the price
 *   - PDP source rows: the per-source pill next to "Zum Shop"
 *
 * Kept deliberately small (text, not bitmap logos) so the component
 * renders cheaply even on a 50-item grid and never shifts layout while
 * an external asset loads.
 */
interface ShopLogoProps {
  sourceId: string;
  /** Override the rendered text — useful for feed_default fallbacks. */
  label?: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const SIZES = {
  xs: { text: "text-[9px]", pad: "px-1.5 py-[2px]" },
  sm: { text: "text-[10px]", pad: "px-2 py-[3px]" },
  md: { text: "text-[11px]", pad: "px-2.5 py-1" },
};

export function ShopLogo({ sourceId, label, size = "sm", className = "" }: ShopLogoProps) {
  const shop = getShopSource(sourceId);
  const s = SIZES[size];
  const text = label ?? shop.wordmark.text;

  return (
    <span
      className={`inline-flex items-center rounded-full ring-1 ring-black/[0.04] ${s.pad} ${s.text} ${className}`}
      style={{
        color: shop.wordmark.color,
        fontWeight: shop.wordmark.weight,
        letterSpacing: "-0.01em",
        backgroundColor: `${shop.color}10`,
      }}
    >
      {text}
    </span>
  );
}
