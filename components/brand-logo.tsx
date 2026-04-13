"use client";

import { useState } from "react";
import { getBrandLogo, brandColor, brandInitial } from "@/lib/brand-logos";

interface BrandLogoProps {
  name: string;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "square";
}

const SIZES = {
  sm: { box: "h-10 w-10", text: "text-sm", padding: "p-1.5" },
  md: { box: "h-14 w-14", text: "text-lg", padding: "p-2" },
  lg: { box: "h-20 w-20", text: "text-xl", padding: "p-3" },
};

/**
 * Brand logo with 2-tier fallback:
 *   1. Clearbit logo (via getBrandLogo)
 *   2. Colored initial avatar (hash-based color)
 * Fails gracefully on 404 — switches to avatar automatically.
 */
export function BrandLogo({ name, size = "md", shape = "circle" }: BrandLogoProps) {
  const [errored, setErrored] = useState(false);
  const logoUrl = getBrandLogo(name);
  const s = SIZES[size];
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-lg";

  // Fallback: hash-colored initial
  if (!logoUrl || errored) {
    return (
      <div className={`flex ${s.box} items-center justify-center ${shapeClass} border border-[#e1e1e3] bg-white`}>
        <span className={`${s.text} font-black`} style={{ color: brandColor(name) }}>
          {brandInitial(name)}
        </span>
      </div>
    );
  }

  // Clearbit logo — contained in white square/circle with border
  return (
    <div className={`flex ${s.box} items-center justify-center ${shapeClass} border border-[#e1e1e3] bg-white ${s.padding} overflow-hidden`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={`${name} Logo`}
        width={64}
        height={64}
        loading="lazy"
        onError={() => setErrored(true)}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}
