"use client";

import Link from "next/link";
import { Bell, Heart, Pin } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { ShopLogo } from "@/components/shop-logo";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

const FALLBACK_IMG = "/placeholder-product.svg";

export function hasValidImage(url: string | undefined | null): boolean {
  if (!url) return false;
  if (url.includes("picsum.photos")) return false;
  return true;
}

/** Proxy external images to avoid 403 referrer blocks */
function proxyUrl(url: string | null | undefined): string {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith("/")) return url; // local
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

function formatPrice(chf: number): string {
  if (chf <= 0) return "–";
  const rounded = Math.round(chf * 100) / 100;
  const frac = rounded % 1;
  if (frac === 0) return `${Math.floor(rounded)}.–`;
  return rounded.toFixed(2);
}

/**
 * Resolve the best-shop source for a product: the source whose breakdown
 * equals `bestPrice`. Falls back to the first source if the match is
 * inconclusive. Centralised so grid + list render the same pill.
 */
function bestShopFor(item: MockProductWithHistory): { sourceId: string; sourceName: string } | null {
  if (!item.product.sources || item.product.sources.length === 0) return null;
  if (item.bestSource) {
    const hit = item.product.sources.find((s) => s.sourceName === item.bestSource);
    if (hit) return { sourceId: hit.sourceId, sourceName: hit.sourceName };
  }
  const [first] = item.product.sources;
  return { sourceId: first.sourceId, sourceName: first.sourceName };
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
  const bestShop = bestShopFor(item);

  const authAction = (fn: () => void) => {
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    fn();
  };

  // ───────────────────────────────────────────────────────────────
  // LIST LAYOUT — horizontal row, matches the screenshot treatment:
  //   [image] · [category link · price · brand title · N Angebote] · [icons]
  // ───────────────────────────────────────────────────────────────
  if (layout === "list") {
    const categoryLabel = product.categoryName || product.category || "Produkt";
    return (
      <div className="group relative border-b border-[#f0f0f2] bg-white px-4 py-4 transition-colors duration-200 hover:bg-[#f8f8f9]">
        <Link href={`/product/${product.gtin}`} className="flex gap-4">
          {/* Image — square, left */}
          <div className="flex h-28 w-28 shrink-0 items-center justify-center p-1 sm:h-32 sm:w-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proxyUrl(product.imageUrl)} alt={product.title} width={112} height={112} loading="lazy"
              className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
          </div>

          {/* Info — right */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Category label (blue, small) */}
            <p className="text-[13px] font-medium text-[#0076bd]">{categoryLabel}</p>

            {/* Price — bold */}
            <p className="mt-0.5 text-[18px] font-bold text-gray-900">
              {hasPrice ? formatPrice(bestPrice.totalChf) : "Preis auf Anfrage"}
            </p>

            {/* Brand bold + title */}
            <p className="mt-0.5 line-clamp-2 text-[14px] leading-snug text-gray-700">
              <span className="font-bold text-gray-900">{product.brand}</span>{" "}
              {product.title.replace(product.brand, "").trim()}
            </p>

            {/* Bottom row: best-shop pill + offers + icons */}
            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
              <div className="flex min-w-0 items-center gap-2">
                {bestShop && hasPrice && (
                  <ShopLogo sourceId={bestShop.sourceId} label={bestShop.sourceName} size="sm" />
                )}
                {sources > 0 && (
                  <p className="truncate text-[11px] text-gray-400">
                    {sources > 1 ? `${sources} Angebote` : "1 Angebot"}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); authAction(() => toggleFavorite(product.gtin)); }}
                  className={`p-1 transition ${faved ? "text-[#D81E05]" : "text-gray-400 hover:text-[#D81E05]"}`}
                  title="Favorit">
                  <Heart className={`h-4 w-4 ${faved ? "fill-current" : ""}`} />
                </button>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); authAction(() => togglePin(product.gtin)); }}
                  className={`p-1 transition ${pinned ? "text-[#0076bd]" : "text-[#0076bd]/70 hover:text-[#0076bd]"}`}
                  title="Merken">
                  <Pin className={`h-4 w-4 ${pinned ? "fill-current" : ""}`} />
                </button>
                {onAlert && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAlert(item); }}
                    className="p-1 text-gray-400 transition hover:text-[#D81E05]"
                    title="Preisalarm">
                    <Bell className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────
  // GRID LAYOUT — stacked card, matches the screenshot treatment:
  //   [icons top-right · image · price · brand title · best-shop + N Angebote]
  // ───────────────────────────────────────────────────────────────
  return (
    <div className="group relative flex flex-col bg-white transition-colors duration-200 hover:bg-[#f8f8f9]">
      {/* Icons — subtle on mobile, fade in on desktop hover */}
      <div className="absolute right-2 top-2 z-10 flex gap-1.5 opacity-40 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); authAction(() => toggleFavorite(product.gtin)); }}
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-white shadow transition-all duration-200 hover:scale-110 ${faved ? "text-[#D81E05]" : "text-gray-500 hover:text-[#D81E05]"}`}
          title="Favorit">
          <Heart className={`h-4 w-4 ${faved ? "fill-current" : ""}`} />
        </button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); authAction(() => togglePin(product.gtin)); }}
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-white shadow transition-all duration-200 hover:scale-110 ${pinned ? "text-[#0076bd]" : "text-gray-500 hover:text-[#0076bd]"}`}
          title="Merken">
          <Pin className={`h-4 w-4 ${pinned ? "fill-current" : ""}`} />
        </button>
      </div>

      <Link href={`/product/${product.gtin}`} className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Image */}
        <div className="aspect-square overflow-hidden p-3">
          <div className="flex h-full w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proxyUrl(product.imageUrl)} alt={product.title} width={200} height={200} loading="lazy"
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
          </div>
        </div>

        {/* Price — Galaxus bold */}
        <span className="mt-2 text-xl font-bold tracking-tight text-gray-900">
          {hasPrice ? formatPrice(bestPrice.totalChf) : "Preis auf Anfrage"}
        </span>

        {/* Brand + Title */}
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-gray-500">
          <span className="font-bold text-gray-900">{product.brand}</span>{" "}
          {product.title.replace(product.brand, "").trim()}
        </p>

        {/* Bottom: best-shop pill + N Angebote + bell */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {bestShop && hasPrice && (
              <ShopLogo sourceId={bestShop.sourceId} label={bestShop.sourceName} size="xs" />
            )}
            {sources > 0 && (
              <p className="truncate text-[10px] text-gray-400">
                {sources > 1 ? `${sources} Angebote` : "1 Angebot"}
              </p>
            )}
          </div>
          {onAlert && (
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAlert(item); }}
              className="shrink-0 text-gray-400 transition-all duration-200 hover:scale-110 hover:text-[#D81E05]"
              title="Preisalarm">
              <Bell className="h-4 w-4" />
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
