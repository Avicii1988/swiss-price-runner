"use client";

import Link from "next/link";
import { Bell, Heart, Pin } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { ShopLogo } from "@/components/shop-logo";
import { formatChf } from "@/lib/pricing/format";
import { extractAttributes } from "@/lib/attributes";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

const FALLBACK_IMG = "/placeholder-product.svg";

// Hard cap — anything above this is almost certainly a feed glitch
// (see the 1.2M CHF perfume incident). Mirrored in the importer.
const MAX_REASONABLE_CHF = 50000;

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

function bestShopFor(item: MockProductWithHistory): { sourceId: string; sourceName: string } | null {
  if (!item.product.sources || item.product.sources.length === 0) return null;
  if (item.bestSource) {
    const hit = item.product.sources.find((s) => s.sourceName === item.bestSource);
    if (hit) return { sourceId: hit.sourceId, sourceName: hit.sourceName };
  }
  const [first] = item.product.sources;
  return { sourceId: first.sourceId, sourceName: first.sourceName };
}

function offerSourceIds(item: MockProductWithHistory): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const s of item.product.sources ?? []) {
    if (!s.sourceId || s.sourceId === "feed_default") continue;
    if (seen.has(s.sourceId)) continue;
    seen.add(s.sourceId);
    ids.push(s.sourceId);
  }
  return ids;
}

interface ProductCardProps {
  item: MockProductWithHistory;
  onAlert?: (item: MockProductWithHistory) => void;
  layout?: "grid" | "list";
}

export function ProductCard({ item, onAlert, layout = "grid" }: ProductCardProps) {
  const { product, bestPrice } = item;
  const { isLoggedIn, isFavorite, toggleFavorite, isPinned, togglePin, setShowAuthModal } = useAuth();
  // Treat absurd prices as "ask for a quote" rather than rendering CHF 1.2M
  const hasPrice = bestPrice.totalChf > 0 && bestPrice.totalChf <= MAX_REASONABLE_CHF;
  const priceLabel = hasPrice ? formatChf(bestPrice.totalChf) : null;
  const shopIds = offerSourceIds(item);
  const offerCount = shopIds.length || (product.sources?.length ?? 0);
  const faved = isFavorite(product.gtin);
  const pinned = isPinned(product.gtin);
  const bestShop = bestShopFor(item);

  const authAction = (fn: () => void) => {
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    fn();
  };

  // `X Angebote ab CHF 19.95` / `1 Angebot ab 19.95` / empty.
  const offerLine = (() => {
    if (!priceLabel) return null;
    if (offerCount >= 2) return `${offerCount} Angebote ab CHF ${priceLabel}`;
    if (offerCount === 1) return `1 Angebot ab CHF ${priceLabel}`;
    return null;
  })();

  // Reusable price block: CHF prefix is small + gray + non-bold (Galaxus style)
  const priceBlock = (priceClass: string, prefixClass: string) => (
    <span className={priceClass}>
      {hasPrice ? (
        <>
          <span className={prefixClass}>CHF </span>
          {priceLabel}
        </>
      ) : (
        "Preis auf Anfrage"
      )}
    </span>
  );

  // ───────────────────────────────────────────────────────────────
  // LIST LAYOUT
  // ───────────────────────────────────────────────────────────────
  if (layout === "list") {
    const categoryLabel = product.categoryName || product.category || "Produkt";
    return (
      <div className="group relative border-b border-[#f0f0f2] bg-white px-4 py-5 transition-colors duration-200 hover:bg-[#f8f8f9]">
        <Link href={`/product/${product.gtin}`} className="flex gap-4">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center p-1 sm:h-32 sm:w-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proxyUrl(product.imageUrl)} alt={product.title} width={112} height={112} loading="lazy"
              className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-[13px] font-medium text-[#0076bd]">{categoryLabel}</p>

            {priceBlock(
              "mt-0.5 text-[20px] font-bold text-gray-900",
              "text-[14px] font-normal text-gray-500",
            )}

            <p className="mt-0.5 line-clamp-2 text-[15px] leading-snug text-gray-700">
              <span className="font-bold text-gray-900">{product.brand}</span>{" "}
              {product.title.replace(product.brand, "").trim()}
            </p>

            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
              <div className="flex min-w-0 items-center gap-2">
                {offerLine && (
                  <p className="truncate text-[11px] text-gray-500">{offerLine}</p>
                )}
                {shopIds.length > 0 && (
                  <div className="flex shrink-0 items-center -space-x-1.5">
                    {shopIds.slice(0, 4).map((sid) => (
                      <ShopLogo key={sid} sourceId={sid} iconOnly size="sm" />
                    ))}
                  </div>
                )}
              </div>
              {/* Hover-only action icons — Galaxus pattern */}
              <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); authAction(() => toggleFavorite(product.gtin)); }}
                  className={`p-1 transition ${faved ? "text-[#D81E05]" : "text-[#0076bd] hover:text-[#D81E05]"}`}
                  title="Favorit" aria-label="Favorit">
                  <Heart className={`h-4 w-4 ${faved ? "fill-current" : ""}`} />
                </button>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); authAction(() => togglePin(product.gtin)); }}
                  className={`p-1 transition ${pinned ? "text-[#0076bd]" : "text-[#0076bd]/80 hover:text-[#0076bd]"}`}
                  title="Merken" aria-label="Merken">
                  <Pin className={`h-4 w-4 ${pinned ? "fill-current" : ""}`} />
                </button>
                {onAlert && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAlert(item); }}
                    className="p-1 text-[#0076bd] transition hover:text-[#D81E05]"
                    title="Preisalarm" aria-label="Preisalarm">
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
  // GRID LAYOUT
  // ───────────────────────────────────────────────────────────────
  return (
    <div className="group relative flex flex-col bg-white transition-colors duration-200 hover:bg-[#f8f8f9]">
      <Link href={`/product/${product.gtin}`} className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Image */}
        <div className="aspect-square overflow-hidden p-3">
          <div className="flex h-full w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proxyUrl(product.imageUrl)} alt={product.title} width={240} height={240} loading="lazy"
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
          </div>
        </div>

        {/* Price — CHF text-sm gray non-bold, amount text-2xl extrabold */}
        {priceBlock(
          "mt-3 text-2xl font-extrabold tracking-tight text-gray-900",
          "text-sm font-normal text-gray-400 mr-1",
        )}

        {/* Brand (uppercase) line 1, then model + storage on line 2 */}
        <p className="mt-1 text-[13px] font-bold uppercase tracking-tight text-gray-900">
          {product.brand}
        </p>
        {(() => {
          const attrs = extractAttributes(product.title, "", product.category);
          const model = product.title.replace(new RegExp(`^${product.brand}\\s*`, "i"), "").trim();
          const storage = attrs.primary?.value ?? "";
          // Append storage only when not already present in the model string
          const modelLine = storage && !model.toUpperCase().includes(storage.toUpperCase())
            ? `${model} ${storage}`
            : model;
          return (
            <p className="line-clamp-2 text-[13px] leading-snug text-gray-700">{modelLine}</p>
          );
        })()}

        {/* Offer count line */}
        {offerLine && (
          <p className="mt-1.5 text-[11px] font-medium text-gray-500">{offerLine}</p>
        )}

        {/* Mini-logo row */}
        {shopIds.length > 0 && (
          <div className="mt-1.5 flex items-center -space-x-1.5">
            {shopIds.slice(0, 5).map((sid) => (
              <ShopLogo key={sid} sourceId={sid} iconOnly size="sm" />
            ))}
            {shopIds.length > 5 && (
              <span className="ml-2 text-[10px] font-medium text-gray-400">
                +{shopIds.length - 5}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Hover-only action icons — absolute bottom-right frosted-glass pill.
          Lives outside the Link so clicks don't navigate. z-10 prevents
          any sibling overflow-hidden from clipping the pill. */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-0.5 rounded-full bg-white/90 p-1 shadow backdrop-blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); authAction(() => toggleFavorite(product.gtin)); }}
          className={`rounded-full p-1.5 transition ${faved ? "text-[#D81E05]" : "text-gray-400 hover:text-[#D81E05]"}`}
          title="Favorit" aria-label="Favorit"
        >
          <Heart className={`h-[18px] w-[18px] ${faved ? "fill-current" : ""}`} strokeWidth={1.6} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); authAction(() => togglePin(product.gtin)); }}
          className={`rounded-full p-1.5 transition ${pinned ? "text-[#0076bd]" : "text-gray-400 hover:text-[#0076bd]"}`}
          title="Merken" aria-label="Merken"
        >
          <Pin className={`h-[18px] w-[18px] ${pinned ? "fill-current" : ""}`} strokeWidth={1.6} />
        </button>
        {onAlert && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAlert(item); }}
            className="rounded-full p-1.5 text-gray-400 transition hover:text-[#D81E05]"
            title="Preisalarm" aria-label="Preisalarm"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
        )}
      </div>
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
    <div className="animate-pulse bg-white p-4 sm:p-5">
      <div className="aspect-square rounded bg-gray-50" />
      <div className="mt-4 space-y-2">
        <div className="h-6 w-20 rounded bg-gray-100" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}
