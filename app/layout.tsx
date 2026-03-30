import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwissPriceRunner – Price Comparison for Switzerland",
  description:
    "Compare prices across Amazon.de, Zalando, and Galaxus. See the real landed cost in CHF including VAT, customs, and shipping.",
  keywords: [
    "price comparison",
    "Switzerland",
    "Preisvergleich",
    "Schweiz",
    "Amazon",
    "Galaxus",
    "Zalando",
    "CHF",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de-CH">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}

        {/* ---- Global footer with affiliate disclaimer & legal links ---- */}
        <footer className="border-t border-gray-100 bg-gray-50">
          {/* Affiliate Disclaimer banner */}
          <div className="bg-amber-50 border-b border-amber-100">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
              <p className="text-center text-[11px] leading-relaxed text-amber-800">
                <span className="font-semibold">Affiliate-Hinweis:</span>{" "}
                Diese Website enthält Affiliate-Links. Beim Kauf über diese
                Links erhalten wir eine Provision — für dich entstehen keine
                Mehrkosten. Die Provisionen haben keinen Einfluss auf unsere
                Preisvergleiche oder die Reihenfolge der Angebote.
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-gray-900">
                  Swiss<span className="text-red-600">Price</span>Runner
                </span>
                <span className="text-xs text-gray-400">
                  &copy; {new Date().getFullYear()}
                </span>
              </div>

              <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-gray-500">
                <Link
                  href="/impressum"
                  className="transition hover:text-gray-900"
                >
                  Impressum
                </Link>
                <Link
                  href="/privacy"
                  className="transition hover:text-gray-900"
                >
                  Datenschutz
                </Link>
                <a
                  href="mailto:kontakt@swisspricerunner.ch"
                  className="transition hover:text-gray-900"
                >
                  Kontakt
                </a>
              </nav>
            </div>

            <p className="mt-4 text-center text-[10px] leading-relaxed text-gray-400">
              Preise inkl. geschätzter Zollgebühren und Schweizer MwSt. Alle
              Angaben ohne Gewähr. SwissPriceRunner ist Teilnehmer des
              Amazon-Partnerprogramms (Amazon PartnerNet), einem
              Affiliate-Programm, das zur Bereitstellung eines Mediums für
              Webseiten konzipiert wurde, mittels dessen durch die Platzierung
              von Werbung und Links Werbekostenerstattung verdient werden kann.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
