import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductByGtin, getVariantSiblings } from "@/lib/data";
import { calculateSwissPrice } from "@/lib/pricing/calculator";
import { EXCHANGE_RATE } from "@/lib/integrations/mock-service";
import { getCategoryBySlug } from "@/lib/categories";
import { ProductDetailClient } from "./client";

export const revalidate = 3600; // ISR: regenerate every hour
export const dynamicParams = true; // allow any gtin, not just pre-rendered ones

// Don't pre-render at build time — pages are generated on first request, then cached
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { gtin: string } }): Promise<Metadata> {
  const item = await getProductByGtin(params.gtin);
  if (!item) return { title: "Produkt nicht gefunden – PreisAlarm" };

  const { product, bestPrice } = item;
  const cat = getCategoryBySlug(product.category);

  return {
    title: `${product.title} – Preisvergleich Schweiz | PreisAlarm`,
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

function buildJsonLd(item: NonNullable<Awaited<ReturnType<typeof getProductByGtin>>>) {
  const { product, bestPrice } = item;

  if (product.sources.length === 0) {
    // Feed product with no source breakdown — simple offer
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      brand: { "@type": "Brand", name: product.brand },
      image: product.imageUrl || undefined,
      description: `${product.title} – Preisvergleich Schweiz inkl. Zoll und MwSt.`,
      offers: bestPrice.totalChf > 0 ? {
        "@type": "Offer",
        priceCurrency: "CHF",
        price: bestPrice.totalChf.toFixed(2),
        availability: "https://schema.org/InStock",
      } : undefined,
    };
  }

  const offers = product.sources.map((source) => {
    const bd = calculateSwissPrice({
      amountEur: source.currentPriceEur,
      exchangeRate: EXCHANGE_RATE,
    });
    return {
      "@type": "Offer",
      url: source.url || product.affiliateUrl || undefined,
      priceCurrency: "CHF",
      price: bd.totalChf.toFixed(2),
      seller: { "@type": "Organization", name: source.sourceName },
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    };
  });

  const prices = product.sources.map((s) =>
    calculateSwissPrice({ amountEur: s.currentPriceEur, exchangeRate: EXCHANGE_RATE }).totalChf,
  );

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    brand: { "@type": "Brand", name: product.brand },
    gtin13: product.gtin.replace(/^0+/, "").slice(0, 13),
    image: product.imageUrl || undefined,
    description: `${product.title} – Preisvergleich Schweiz inkl. Zoll und MwSt.`,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: bestPrice.totalChf.toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      priceCurrency: "CHF",
      offerCount: product.sources.length,
      offers,
    },
  };
}

export default async function ProductPage({ params }: { params: { gtin: string } }) {
  const [item, variantSiblings] = await Promise.all([
    getProductByGtin(params.gtin),
    getVariantSiblings(params.gtin),
  ]);
  if (!item) notFound();

  const jsonLd = buildJsonLd(item);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient item={item} allProducts={[]} variantSiblings={variantSiblings} />
    </>
  );
}
