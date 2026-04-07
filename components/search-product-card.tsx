"use client";

import { ExternalLink, Star } from "lucide-react";
import type { SearchProduct } from "@/lib/hooks/use-search-products";

interface SearchProductCardProps {
  product: SearchProduct;
  layout?: "grid" | "list";
}

/** Category-based Unsplash fallback for missing thumbnails */
function fallbackImage(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("iphone") || lower.includes("samsung") || lower.includes("phone"))
    return "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop";
  if (lower.includes("laptop") || lower.includes("macbook") || lower.includes("notebook"))
    return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop";
  if (lower.includes("headphone") || lower.includes("kopfhörer") || lower.includes("airpod"))
    return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop";
  if (lower.includes("shoe") || lower.includes("schuh") || lower.includes("sneaker"))
    return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop";
  if (lower.includes("parfum") || lower.includes("fragrance") || lower.includes("eau de"))
    return "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop";
  if (lower.includes("watch") || lower.includes("uhr"))
    return "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop";
  return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop";
}

export function SearchProductCard({ product, layout = "grid" }: SearchProductCardProps) {
  const imgSrc = product.thumbnail || fallbackImage(product.title);
  const priceDisplay = product.price ?? (product.extractedPrice ? `CHF ${product.extractedPrice.toFixed(2)}` : null);

  // ── LIST LAYOUT ────────────────────────────────────────────
  if (layout === "list") {
    return (
      <a
        href={product.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-3 transition hover:shadow-md sm:gap-5 sm:p-4"
      >
        {/* Image */}
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-white p-2 sm:h-28 sm:w-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={product.title}
            width={100}
            height={100}
            className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[#0076bd]">{product.source}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-800">
            {product.title}
          </p>
          {product.rating && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {product.rating}
              {product.reviews && <span>({product.reviews})</span>}
            </div>
          )}
          {product.delivery && (
            <p className="mt-0.5 text-[10px] text-gray-400">{product.delivery}</p>
          )}
        </div>

        {/* Price */}
        <div className="shrink-0 text-right">
          {priceDisplay && (
            <span className="text-lg font-bold tracking-tight text-slate-900">
              {priceDisplay}
            </span>
          )}
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#0076bd]">
            <ExternalLink className="h-3 w-3" />
            Zum Shop
          </div>
        </div>
      </a>
    );
  }

  // ── GRID LAYOUT ────────────────────────────────────────────
  return (
    <a
      href={product.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border border-gray-100 bg-white transition hover:shadow-md"
    >
      {/* Image — clean white bg, mix-blend-multiply */}
      <div className="aspect-square overflow-hidden rounded-t-xl bg-white p-5">
        <div className="flex h-full w-full items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={product.title}
            width={200}
            height={200}
            className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3 pt-2.5 sm:p-4 sm:pt-3">
        {/* Source in blue */}
        <p className="text-xs font-medium text-[#0076bd]">{product.source}</p>

        {/* Price */}
        {priceDisplay && (
          <div className="mt-1">
            <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {priceDisplay}
            </span>
          </div>
        )}

        {/* Title */}
        <p className="mt-1 line-clamp-2 text-sm text-slate-700">
          {product.title}
        </p>

        {/* Rating + delivery */}
        <div className="mt-auto pt-2">
          {product.rating && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {product.rating}
              {product.reviews && <span>({product.reviews})</span>}
            </div>
          )}
          {product.delivery && (
            <p className="mt-0.5 text-[10px] text-gray-400">{product.delivery}</p>
          )}
        </div>
      </div>
    </a>
  );
}

/** Skeleton for search product cards */
export function SearchProductCardSkeleton({ layout = "grid" }: { layout?: "grid" | "list" }) {
  if (layout === "list") {
    return (
      <div className="flex animate-pulse items-center gap-4 rounded-xl border border-gray-100 bg-white p-3 sm:gap-5 sm:p-4">
        <div className="h-24 w-24 shrink-0 rounded-lg bg-gray-100 sm:h-28 sm:w-28" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-gray-100" />
          <div className="h-4 w-3/4 rounded bg-gray-100" />
          <div className="h-3 w-1/2 rounded bg-gray-100" />
        </div>
        <div className="shrink-0 space-y-1 text-right">
          <div className="ml-auto h-5 w-16 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white">
      <div className="aspect-square rounded-t-xl bg-gray-100" />
      <div className="space-y-2 p-3 sm:p-4">
        <div className="h-3 w-20 rounded bg-gray-100" />
        <div className="h-5 w-24 rounded bg-gray-100" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}
