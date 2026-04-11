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

/** Galaxus-style price: "79.–" or "79.50" */
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

  // ── LIST ──
  if (layout === "list") {
    return (
      <div className="group relative flex items-center gap-4 border border-[#e1e1e3] bg-white p-3 transition hover:border-gray-300 sm:gap-5 sm:p-4">
        <Link href={`/product/${product.gtin}`} className="flex flex-1 items-center gap-4 sm:gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-[#f7f7f8] p-1 sm:h-24 sm:w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl || FALLBACK_IMG} alt={product.title} width={80} height={80} loading="lazy"
              className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm text-gray-700">
              <span className="font-bold text-gray-900">{product.brand}</span> {product.title.replace(product.brand, "").trim()}
            </p>
            {sources > 0 && <p className="mt-0.5 text-[10px] text-gray-400">{sources} {sources === 1 ? "Angebot" : "Angebote"}</p>}
          </div>
          <div className="shrink-0 text-right">
            <span className="text-xl font-bold text-gray-900">{hasPrice ? formatPrice(bestPrice.totalChf) : "–"}</span>
          </div>
        </Link>
        <div className="absolute right-3 top-3 flex gap-1">
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAlert?.(item); }}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e1e1e3] bg-white text-gray-300 transition hover:border-[#D81E05] hover:text-[#D81E05]" title="Preisalarm">
            <Bell className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  // ── GRID (Galaxus-style) ──
  return (
    <div className="group relative flex flex-col border border-[#e1e1e3] bg-white transition hover:border-gray-300 hover:shadow-sm">
      {/* Action icons — top right */}
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); authAction(() => toggleFavorite(product.gtin)); }}
          className={`flex h-7 w-7 items-center justify-center rounded-full border bg-white transition ${faved ? "border-red-200 text-red-500" : "border-[#e1e1e3] text-gray-300 hover:text-red-400"}`} title="Favorit">
          <Heart className={`h-3 w-3 ${faved ? "fill-current" : ""}`} />
        </button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); authAction(() => togglePin(product.gtin)); }}
          className={`flex h-7 w-7 items-center justify-center rounded-full border bg-white transition ${pinned ? "border-blue-200 text-blue-500" : "border-[#e1e1e3] text-gray-300 hover:text-blue-400"}`} title="Merken">
          <Pin className={`h-3 w-3 ${pinned ? "fill-current" : ""}`} />
        </button>
      </div>

      <Link href={`/product/${product.gtin}`} className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Image — centered on light gray bg */}
        <div className="aspect-square overflow-hidden bg-[#f7f7f8] p-4">
          <div className="flex h-full w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl || FALLBACK_IMG} alt={product.title} width={200} height={200} loading="lazy"
              className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
          </div>
        </div>

        {/* Price — Galaxus "79.–" format */}
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-xl font-bold tracking-tight text-gray-900">
            {hasPrice ? formatPrice(bestPrice.totalChf) : "–"}
          </span>
        </div>

        {/* Brand + Title */}
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-gray-600">
          <span className="font-bold text-gray-900">{product.brand}</span>{" "}
          {product.title.replace(product.brand, "").trim()}
        </p>

        {/* Bottom row: source count + bell */}
        <div className="mt-auto flex items-center justify-between pt-3">
          {sources > 0 ? (
            <p className="text-[10px] text-gray-400">{sources} {sources === 1 ? "Angebot" : "Angebote"}</p>
          ) : <span />}
          {onAlert && (
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAlert(item); }}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e1e1e3] text-gray-300 transition hover:border-[#D81E05] hover:text-[#D81E05]" title="Preisalarm setzen">
              <Bell className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </Link>
    </div>
  );
}

export function ProductCardSkeleton({ layout = "grid" }: { layout?: "grid" | "list" }) {
  if (layout === "list") {
    return (
      <div className="flex animate-pulse items-center gap-4 border border-[#e1e1e3] bg-white p-3 sm:gap-5 sm:p-4">
        <div className="h-20 w-20 shrink-0 bg-gray-100 sm:h-24 sm:w-24" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-gray-100" />
          <div className="h-3 w-1/2 rounded bg-gray-100" />
        </div>
        <div className="shrink-0"><div className="h-6 w-16 rounded bg-gray-100" /></div>
      </div>
    );
  }

  return (
    <div className="animate-pulse border border-[#e1e1e3] bg-white p-3 sm:p-4">
      <div className="aspect-square bg-[#f7f7f8]" />
      <div className="mt-3 space-y-2">
        <div className="h-6 w-16 rounded bg-gray-100" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}
