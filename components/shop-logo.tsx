"use client";

import { useState } from "react";
import { getShopSource, getShopLogoUrl } from "@/lib/shop-sources";

/**
 * Retailer identity chip — used in ProductCard (grid + list),
 * ProductShelf cards, the PDP comparison table and anywhere we need
 * to show "which shop is this price from?".
 *
 * Rendering strategy:
 *   1. Try the Clearbit logo (https://logo.clearbit.com/<domain>)
 *   2. If the image errors (404, network block, ad-blocker) fall back
 *      to the deterministic text wordmark in the shop's brand colour.
 *
 * The component renders a sized chip so adjacent cards don't reflow
 * when the logo loads — the wrapper always occupies its `size` box
 * regardless of whether the image succeeds.
 */
interface ShopLogoProps {
  sourceId: string;
  /** Override the label shown in the text fallback. */
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /**
   * When true, render ONLY the image logo (no text fallback padding).
   * Used for the mini-logo row on product cards, where we want a
   * compact monogram line rather than the full pill treatment.
   */
  iconOnly?: boolean;
}

const PILL_SIZES = {
  xs: { text: "text-[9px]", pad: "px-1.5 py-[2px]", logo: "h-[14px]" },
  sm: { text: "text-[10px]", pad: "px-2 py-[3px]", logo: "h-4" },
  md: { text: "text-[11px]", pad: "px-2.5 py-1", logo: "h-5" },
  lg: { text: "text-[13px]", pad: "px-3 py-1.5", logo: "h-7" },
};

const ICON_SIZES = { xs: "h-4 w-4", sm: "h-5 w-5", md: "h-6 w-6", lg: "h-8 w-8" };

export function ShopLogo({
  sourceId,
  label,
  size = "sm",
  className = "",
  iconOnly = false,
}: ShopLogoProps & { size?: "xs" | "sm" | "md" | "lg" }) {
  const [errored, setErrored] = useState(false);
  const shop = getShopSource(sourceId);
  const logoUrl = getShopLogoUrl(sourceId);
  const displayText = label ?? shop.wordmark.text;

  if (iconOnly) {
    // Compact monogram — used for the "carried by" row at the bottom
    // of a product card. Renders the Clearbit PNG inside a white round
    // chip so logos with transparent backgrounds stay visible on any
    // card accent, and falls back to the brand-coloured initial on
    // error.
    const iconSize = ICON_SIZES[size];
    return (
      <span
        title={shop.name}
        aria-label={shop.name}
        className={`inline-flex ${iconSize} items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-black/[0.08] ${className}`}
      >
        {logoUrl && !errored ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={shop.name}
            className="max-h-full max-w-full object-contain p-[2px]"
            loading="lazy"
            onError={() => setErrored(true)}
          />
        ) : (
          <span
            className="text-[9px] font-black"
            style={{ color: shop.wordmark.color }}
          >
            {(shop.name[0] || "?").toUpperCase()}
          </span>
        )}
      </span>
    );
  }

  const s = PILL_SIZES[size];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ring-1 ring-black/[0.04] ${s.pad} ${className}`}
      style={{ backgroundColor: `${shop.color}10` }}
    >
      {logoUrl && !errored && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          aria-hidden="true"
          className={`${s.logo} w-auto object-contain`}
          loading="lazy"
          onError={() => setErrored(true)}
        />
      )}
      <span
        className={s.text}
        style={{
          color: shop.wordmark.color,
          fontWeight: shop.wordmark.weight,
          letterSpacing: "-0.01em",
        }}
      >
        {displayText}
      </span>
    </span>
  );
}
