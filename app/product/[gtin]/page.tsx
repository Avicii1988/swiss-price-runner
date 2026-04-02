import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getMockProductByGtin,
  getAllGtins,
  EXCHANGE_RATE,
} from "@/lib/integrations/mock-service";
import { calculateSwissPrice } from "@/lib/pricing/calculator";
import { getCategoryBySlug } from "@/lib/categories";
import { ProductDetailClient } from "./client";

// ---------------------------------------------------------------------------
// Static generation for all known GTINs
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return getAllGtins().map((gtin) => ({ gtin }));
}

// ---------------------------------------------------------------------------
// SEO Metadata — Swiss-specific keywords
// ---------------------------------------------------------------------------

export function generateMetadata({ params }: { params: { gtin: string } }): Metadata {
  const item = getMockProductByGtin(params.gtin);
  if (!item) return { title: "Produkt nicht gefunden – SwissPriceRunner" };

  const { product, bestPrice } = item;
  const cat = getCategoryBySlug(product.category);

  return {
    title: `${product.title} – Preisvergleich Schweiz | SwissPriceRunner`,
    description: `${product.title} ab CHF ${bestPrice.totalChf.toFixed(2)} in der Schweiz kaufen. Preisvergleich inkl. Zoll, MwSt. & Lieferkosten. ${product.brand} Schweiz günstigster Preis CHF.`,
    keywords: [
      product.title,
      `${product.brand} Schweiz kaufen`,
      "Preisvergleich Schweiz",
      "Günstigster Preis CHF",
      `${product.brand} Preisvergleich`,
      cat?.name ?? product.category,
      "Amazon.de Schweiz",
      "Galaxus Preisvergleich",
      "Zoll Schweiz",
    ],
    openGraph: {
      title: `${product.title} – CHF ${bestPrice.totalChf.toFixed(2)}`,
      description: `Preisvergleich für ${product.title}: ab CHF ${bestPrice.totalChf.toFixed(2)} inkl. Zoll & MwSt.`,
      images: [product.imageUrl],
    },
  };
}

// ---------------------------------------------------------------------------
// JSON-LD Structured Data (Schema.org/Product)
// ---------------------------------------------------------------------------

function buildJsonLd(params: { gtin: string }) {
  const item = getMockProductByGtin(params.gtin);
  if (!item) return null;

  const { product, bestPrice } = item;

  const offers = product.sources.map((source) => {
    const bd = calculateSwissPrice({
      amountEur: source.currentPriceEur,
      exchangeRate: EXCHANGE_RATE,
    });
    return {
      "@type": "Offer",
      url: source.url,
      priceCurrency: "CHF",
      price: bd.totalChf.toFixed(2),
      seller: {
        "@type": "Organization",
        name: source.sourceName,
      },
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    brand: { "@type": "Brand", name: product.brand },
    gtin13: product.gtin.replace(/^0+/, "").slice(0, 13),
    image: product.imageUrl,
    description: `${product.title} – Preisvergleich Schweiz inkl. Zoll und MwSt.`,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: bestPrice.totalChf.toFixed(2),
      highPrice: Math.max(...product.sources.map((s) => {
        const bd = calculateSwissPrice({ amountEur: s.currentPriceEur, exchangeRate: EXCHANGE_RATE });
        return bd.totalChf;
      })).toFixed(2),
      priceCurrency: "CHF",
      offerCount: product.sources.length,
      offers,
    },
  };
}

// ---------------------------------------------------------------------------
// Page Component (Server)
// ---------------------------------------------------------------------------

export default function ProductPage({ params }: { params: { gtin: string } }) {
  const item = getMockProductByGtin(params.gtin);
  if (!item) notFound();

  const jsonLd = buildJsonLd(params);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient item={item} />
    </>
  );
}
