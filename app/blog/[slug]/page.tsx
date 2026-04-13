import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface RelatedLink {
  label: string;
  href: string;
  description?: string;
}

const ARTICLES: Record<string, Article> = {
  "top-5-spring-scents-2026": {
    title: "Top 5 Frühlingsdüfte 2026",
    category: "Beauty",
    date: "8. April 2026",
    readTime: "4 Min.",
    image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=1200&h=600&fit=crop",
    relatedLinks: [
      { label: "Dior Parfum", href: "/brands?q=Dior", description: "Sauvage, J'adore, Miss Dior" },
      { label: "Chanel", href: "/brands?q=Chanel", description: "N°5, Coco Mademoiselle, Bleu" },
      { label: "Lancôme", href: "/brands?q=Lanc%C3%B4me", description: "La Vie Est Belle, Idôle" },
      { label: "YSL", href: "/brands?q=Yves+Saint+Laurent", description: "Libre, Black Opium, MYSLF" },
      { label: "Tom Ford", href: "/brands?q=Tom+Ford", description: "Oud Wood, Tobacco Vanille" },
      { label: "Alle Damendüfte", href: "/category/damendufte" },
      { label: "Alle Herrendüfte", href: "/category/herrendufte" },
    ],
    content: `
Der Frühling 2026 bringt eine neue Welle an exquisiten Düften, die von den grössten Parfümhäusern der Welt kreiert wurden. Von blumig-frischen Noten bis hin zu sinnlichen Holzdüften — hier sind die fünf Parfums, die du diesen Frühling kennen musst.

## 1. Dior Sauvage Eau de Parfum

Dior Sauvage bleibt auch 2026 ein Bestseller. Die Kombination aus Bergamotte, Ambroxan und Vanille macht ihn zum perfekten Begleiter für den Übergang vom Winter in den Frühling. In der Schweiz ab CHF 89.– bei Amazon.de erhältlich.

## 2. Chanel N°5 — Der Klassiker neu interpretiert

Mit der neuen «L'Eau» Edition hat Chanel seinen ikonischsten Duft für eine jüngere Generation neu aufgelegt. Leichter, frischer, aber immer noch unverkennbar N°5. Unser Preisvergleich zeigt: Über Amazon.de sparst du bis zu 25% gegenüber dem Schweizer Ladenpreis.

## 3. Lancôme La Vie Est Belle — Soleil Cristal

Die neueste Erweiterung der «La Vie Est Belle»-Familie ist ein sonniger Cocktail aus Kokosnuss, Ylang-Ylang und weissem Moschus. Perfekt für Frühlingstage mit Sonnenschein. Aktuell ab CHF 84.– im Vergleich.

## 4. YSL Libre Eau de Parfum Intense

Yves Saint Laurent hat mit «Libre Intense» einen Duft geschaffen, der Lavendel und Orangenblüte mit warmer Vanille verbindet. Mutig, modern und perfekt für abendliche Frühlingsspaziergänge.

## 5. Tom Ford Oud Wood

Für Liebhaber von Nischendüften bleibt Tom Ford Oud Wood die Referenz. Die Mischung aus Oud, Rosewood und Kardamom ist zeitlos elegant. Der beste Preis in der Schweiz? Unser Vergleich zeigt bis zu CHF 40.– Ersparnis gegenüber Sephora.

## Fazit

Alle fünf Düfte sind über PreisAlarm.ch im Preisvergleich verfügbar — inklusive Schweizer Zoll, MwSt. und Lieferkosten. Richte dir einen Preisalarm ein und warte, bis dein Wunschpreis erreicht wird.
    `,
  },
  "on-running-guide-schweiz": {
    title: "On Running: Der ultimative Schweizer Guide",
    category: "Sport",
    date: "5. April 2026",
    readTime: "6 Min.",
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1200&h=600&fit=crop",
    relatedLinks: [
      { label: "On Running", href: "/brands?q=On", description: "Cloud 5, Cloudmonster, Cloudnova" },
      { label: "Laufschuhe", href: "/category/schuhe", description: "Alle Laufschuhe im Vergleich" },
      { label: "Nike", href: "/brands?q=Nike" },
      { label: "Adidas", href: "/brands?q=Adidas" },
      { label: "Sport & Outdoor", href: "/category/sport" },
    ],
    content: `
On Running ist die Erfolgsgeschichte der Schweizer Sportindustrie. Gegründet 2010 in Zürich, hat die Marke die Laufschuh-Welt revolutioniert — und ist mittlerweile an der New Yorker Börse kotiert. Welcher On-Schuh passt zu dir?

## Cloud 5 — Der Allrounder

Der Cloud 5 ist der meistverkaufte On-Schuh und ideal für den Alltag. Mit der patentierten CloudTec-Sohle bietet er Dämpfung und Leichtigkeit in einem. Perfekt für Pendler, Stadtläufer und alle, die einen bequemen Schuh suchen.

**Preis in der Schweiz:** Ab CHF 149.– (über Amazon.de inkl. Zoll und MwSt.)

## Cloudmonster 2 — Maximale Dämpfung

Wer mehr Dämpfung für lange Läufe braucht, greift zum Cloudmonster 2. Die übergrossen CloudTec-Elemente absorbieren Stösse und geben Energie zurück. Besonders beliebt bei Marathon-Läufern.

**Preis in der Schweiz:** Ab CHF 169.– im Preisvergleich

## Cloudstratus 3 — Stabilität für Vielläufer

Der Cloudstratus 3 bietet mit seiner doppellagigen CloudTec-Sohle zusätzliche Stabilität. Ideal für Läufer mit höherem Körpergewicht oder solche, die Wert auf Unterstützung legen.

**Preis in der Schweiz:** Ab CHF 179.– im Preisvergleich

## Cloudnova — Street Style meets Performance

Die Cloudnova ist On's Antwort auf den Sneaker-Trend. Schick genug für die Stadt, technisch genug für einen spontanen Lauf. Erhältlich in zahlreichen Farbkombinationen.

## Wo kaufe ich On-Schuhe am günstigsten?

Der Schweizer UVP liegt oft 20–30% über dem EU-Preis. Über Amazon.de oder Zalando sparst du erheblich — und PreisAlarm.ch rechnet dir den echten Schweizer Endpreis inkl. Zoll und MwSt. aus.

**Tipp:** Richte einen Preisalarm ein und warte auf saisonale Sales. Besonders im Januar und Juli fallen die Preise regelmässig.
    `,
  },
  "apple-iphone-2026-geruechte": {
    title: "iPhone 2026: Alle Gerüchte und Preiseinschätzungen",
    category: "Tech",
    date: "3. April 2026",
    readTime: "5 Min.",
    image: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=1200&h=600&fit=crop",
    relatedLinks: [
      { label: "Apple", href: "/brands?q=Apple", description: "iPhone, iPad, MacBook" },
      { label: "Smartphones", href: "/category/smartphones" },
      { label: "Samsung", href: "/brands?q=Samsung" },
      { label: "Google Pixel", href: "/brands?q=Google" },
    ],
    content: `
Apple steht kurz vor der Ankündigung der nächsten iPhone-Generation. Wir fassen zusammen, was bisher bekannt ist — und was das für Schweizer Preise bedeutet.

## Design: Dünneres Gehäuse, grösseres Display

Laut Analysten wird das iPhone 2026 das dünnste iPhone aller Zeiten. Das Pro-Modell soll ein 6.9-Zoll Display mit ProMotion 240Hz erhalten — ein deutliches Upgrade gegenüber den aktuellen 120Hz.

## Kamera: 48MP Periskop-Zoom bei allen Modellen

Erstmals soll auch das Standardmodell eine Periskop-Zoom-Kamera mit 5x optischem Zoom erhalten. Bisher war dies dem Pro Max vorbehalten. Ein grosser Schritt für Hobby-Fotografen.

## Chip: A20 Pro mit 3nm+

Der neue A20-Chip soll auf TSMCs verbessertem 3nm-Prozess basieren und bis zu 20% energieeffizienter sein. Das bedeutet: noch längere Akkulaufzeit bei gleicher Leistung.

## Preis-Prognose für die Schweiz

Basierend auf den bisherigen Preismustern erwarten wir:

- **iPhone 2026 (128GB):** CHF 849–899
- **iPhone 2026 Pro (256GB):** CHF 1'199–1'249
- **iPhone 2026 Pro Max (256GB):** CHF 1'399–1'449

## So sparst du beim iPhone-Kauf

Der günstigste Weg führt oft über Amazon.de. PreisAlarm.ch rechnet dir den echten Schweizer Endpreis aus — inklusive Zoll (CHF 11.50 Vereinfachte Verzollung), MwSt. (8.1%) und Versandkosten.

**Unser Tipp:** Richte jetzt einen Preisalarm für das aktuelle iPhone 15 Pro ein. Sobald das neue Modell erscheint, fallen die Preise der Vorgängergeneration um 15–25%.

## Wann kommt es?

Apple wird das iPhone 2026 voraussichtlich im September 2026 vorstellen. Der Verkaufsstart in der Schweiz folgt typischerweise eine Woche nach der US-Premiere.
    `,
  },
};

interface Article {
  title: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  content: string;
  relatedLinks?: RelatedLink[];
}

export default function BlogArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = ARTICLES[params.slug];
  if (!article) notFound();

  // Simple markdown-like rendering: ## headings and ** bold **
  const paragraphs = article.content
    .trim()
    .split("\n\n")
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero image */}
      <div className="relative h-64 w-full overflow-hidden sm:h-80 lg:h-96">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.image}
          alt={article.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <span className="rounded bg-[#0076bd] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {article.category}
          </span>
          <h1 className="mt-2 max-w-2xl text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            {article.title}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {article.date} · {article.readTime} Lesezeit
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link
          href={"/" as Route}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-[#0076bd] transition hover:text-[#005a94]"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück zur Startseite
        </Link>

        <article className="prose-article">
          {paragraphs.map((p, i) => {
            if (p.startsWith("## ")) {
              return (
                <h2
                  key={i}
                  className="mb-3 mt-8 text-xl font-bold text-slate-900"
                >
                  {p.replace("## ", "")}
                </h2>
              );
            }
            // Bold text with **
            const html = p.replace(
              /\*\*(.+?)\*\*/g,
              '<strong class="font-semibold text-slate-900">$1</strong>',
            );
            return (
              <p
                key={i}
                className="mb-4 text-[15px] leading-relaxed text-gray-600"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          })}
        </article>

        {/* Related Products — direct links to mentioned brands/categories */}
        {article.relatedLinks && article.relatedLinks.length > 0 && (
          <div className="mt-12 border-t border-gray-100 pt-8">
            <h3 className="mb-4 text-base font-bold text-slate-900">
              Im Artikel erwähnt — direkt vergleichen
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {article.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href as Route}
                  className="group flex items-center justify-between rounded-lg border border-[#e1e1e3] bg-white px-4 py-3 transition hover:border-gray-400"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{link.label}</p>
                    {link.description && (
                      <p className="mt-0.5 text-[11px] text-gray-500">{link.description}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-600" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
          <p className="text-sm font-bold text-slate-900">
            Preise vergleichen auf PreisAlarm.ch
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Echter Schweizer Endpreis inkl. Zoll, MwSt. und Lieferkosten.
          </p>
          <Link
            href={"/" as Route}
            className="mt-4 inline-block rounded-full bg-[#D81E05] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b91a04]"
          >
            Jetzt Preise vergleichen
          </Link>
        </div>
      </div>
    </div>
  );
}
