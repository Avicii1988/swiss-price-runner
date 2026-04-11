"use client";

import Link from "next/link";
import { Bell, Heart, Pin } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop";

export function hasValidImage(url: string | undefined | null): boolean {
  if (!url) return false;
  if (url.includes("picsum.photos")) return false;
  return true;
}

function formatPrice(chf: number): string {
  if (chf <= 0) return "–";
  const rounded = Math.round(chf * 100) / 100;
  const frac = rounded % 1;
  if (frac === 0) return `${Math.floor(rounded)}.–`;
  return rounded.toFixed(2);
}

interface ProductCardProps {
  item: MockProductWithHistory;
  onAlert?: (item: MockProductWithHistory) => void;
  layout?: "grid" | "list";
}

export function ProductCard({ item, onAlert, layout = "grid" }: ProductCardProps) {
  const { product, bestPrice } = item;
  const { isLoggedIn, isFavorite, toggleFavorite, isPinned, togglePin, setShowAuthModal } = useAuth();
  const hasPrice = bestPrice.totalChf > 0;
  const sources = product.sources?.length ?? 0;
  const faved = isFavorite(product.gtin);
  const pinned = isPinned(product.gtin);

  const authAction = (fn: () => void) => {
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    fn();
  };

  if (layout === "list") {
    return (
      <div className="group relative flex items-center gap-4 border-b border-[#f0f0f2] bg-white p-3 transition-colors duration-200 hover:bg-[#f8f8f9] sm:gap-5 sm:p-4">
        <Link href={`/product/${product.gtin}`} className="flex flex-1 items-center gap-4 sm:gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center p-1 sm:h-24 sm:w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl || FALLBACK_IMG} alt={product.title} width={80} height={80} loading="lazy"
              className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm text-gray-600">
              <span className="font-bold text-gray-900">{product.brand}</span> {product.title.replace(product.brand, "").trim()}
            </p>
            {sources > 0 && <p className="mt-0.5 text-[10px] text-gray-400">{sources} {sources === 1 ? "Angebot" : "Angebote"}</p>}
          </div>
          <span className="shrink-0 text-xl font-bold text-gray-900">{hasPrice ? formatPrice(bestPrice.totalChf) : "–"}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col bg-white transition-colors duration-200 hover:bg-[#f8f8f9]">
      {/* Icons — subtle on mobile, fade in on desktop hover */}
      <div className="absolute right-2 top-2 z-10 flex gap-1.5 opacity-40 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
        <div className="relative">
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); authAction(() => toggleFavorite(product.gtin)); }}
            className={`peer flex h-8 w-8 items-center justify-center rounded-full bg-white shadow transition-all duration-200 hover:scale-110 ${faved ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}>
            <Heart className={`h-4 w-4 ${faved ? "fill-current" : ""}`} />
          </button>
          <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-0.5 text-[10px] text-white opacity-0 transition-opacity peer-hover:opacity-100">
            Favorit
          </span>
        </div>
        <div className="relative">
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); authAction(() => togglePin(product.gtin)); }}
            className={`peer flex h-8 w-8 items-center justify-center rounded-full bg-white shadow transition-all duration-200 hover:scale-110 ${pinned ? "text-blue-500" : "text-gray-500 hover:text-blue-500"}`}>
            <Pin className={`h-4 w-4 ${pinned ? "fill-current" : ""}`} />
          </button>
          <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-0.5 text-[10px] text-white opacity-0 transition-opacity peer-hover:opacity-100">
            Merken
          </span>
        </div>
      </div>

      <Link href={`/product/${product.gtin}`} className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Image */}
        <div className="aspect-square overflow-hidden p-3">
          <div className="flex h-full w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl || FALLBACK_IMG} alt={product.title} width={200} height={200} loading="lazy"
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
          </div>
        </div>

        {/* Price — Galaxus bold */}
        <span className="mt-2 text-xl font-bold tracking-tight text-gray-900">
          {hasPrice ? formatPrice(bestPrice.totalChf) : "–"}
        </span>

        {/* Brand + Title */}
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-gray-500">
          <span className="font-bold text-gray-900">{product.brand}</span>{" "}
          {product.title.replace(product.brand, "").trim()}
        </p>

        {/* Bottom: sources + bell with tooltip */}
        <div className="mt-auto flex items-center justify-between pt-2">
          {sources > 0 ? (
            <p className="text-[10px] text-gray-400">{sources} {sources === 1 ? "Angebot" : "Angebote"}</p>
          ) : <span />}
          {onAlert && (
            <div className="relative">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAlert(item); }}
                className="peer flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:scale-110 hover:text-[#D81E05]">
                <Bell className="h-4 w-4" />
              </button>
              <span className="pointer-events-none absolute -top-7 right-0 whitespace-nowrap rounded bg-gray-900 px-2 py-0.5 text-[10px] text-white opacity-0 transition-opacity peer-hover:opacity-100">
                Preisalarm
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

export function ProductCardSkeleton({ layout = "grid" }: { layout?: "grid" | "list" }) {
  if (layout === "list") {
    return (
      <div className="flex animate-pulse items-center gap-4 border-b border-[#f0f0f2] bg-white p-3 sm:gap-5 sm:p-4">
        <div className="h-20 w-20 shrink-0 rounded bg-gray-50 sm:h-24 sm:w-24" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-gray-100" />
          <div className="h-3 w-1/2 rounded bg-gray-100" />
        </div>
        <div className="h-6 w-16 shrink-0 rounded bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="animate-pulse bg-white p-3 sm:p-4">
      <div className="aspect-square rounded bg-gray-50" />
      <div className="mt-3 space-y-2">
        <div className="h-6 w-16 rounded bg-gray-100" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}
