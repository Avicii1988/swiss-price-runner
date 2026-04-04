import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth/auth-context";
import { AuthModal } from "@/components/auth-modal";
import { BackToTop } from "@/components/back-to-top";
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
        <AuthProvider>
          <AuthModal />
          {children}
          <BackToTop />

          {/* ── Global Footer ── */}
          <footer className="border-t border-gray-200 bg-white">
            {/* Rainbow bar */}
            <div className="rainbow-bar" />

            {/* Partner logos */}
            <div className="border-b border-gray-100 py-6">
              <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Partner-Netzwerk
              </p>
              <div className="mt-4 flex items-center justify-center gap-10 sm:gap-14">
                <div className="text-center opacity-40 transition hover:opacity-70">
                  <p className="text-lg font-extrabold tracking-tight text-gray-900 sm:text-xl" style={{ letterSpacing: "-0.5px" }}>amazon</p>
                  <p className="mt-0.5 text-[8px] text-gray-400">PartnerNet</p>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div className="text-center opacity-40 transition hover:opacity-70">
                  <p className="text-lg font-extrabold tracking-tight text-gray-900 sm:text-xl" style={{ letterSpacing: "-0.5px" }}>Galaxus</p>
                  <p className="mt-0.5 text-[8px] text-gray-400">Affiliate</p>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div className="text-center opacity-40 transition hover:opacity-70">
                  <p className="text-base font-bold uppercase tracking-[0.2em] text-gray-900 sm:text-lg">Zalando</p>
                  <p className="mt-0.5 text-[8px] text-gray-400">Partner</p>
                </div>
              </div>
            </div>

            {/* Links + legal */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <span className="text-sm font-bold tracking-tight text-gray-900">
                  Swiss<span className="text-red-600">Price</span>Runner
                  <span className="ml-2 text-xs font-normal text-gray-400">&copy; {new Date().getFullYear()}</span>
                </span>
                <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-gray-500">
                  <Link href="/impressum" className="transition hover:text-gray-900">Über uns</Link>
                  <Link href="/impressum" className="transition hover:text-gray-900">Impressum</Link>
                  <Link href="/privacy" className="transition hover:text-gray-900">Datenschutz</Link>
                  <Link href="/account" className="transition hover:text-gray-900">Mein Konto</Link>
                  <a href="mailto:kontakt@swisspricerunner.ch" className="transition hover:text-gray-900">Kontakt</a>
                </nav>
              </div>
              <p className="mt-4 text-center text-[10px] leading-relaxed text-gray-400">
                Preise inkl. geschätzter Zollgebühren und Schweizer MwSt. Alle Angaben ohne Gewähr.
                SwissPriceRunner ist Teilnehmer des Amazon-Partnerprogramms (Amazon PartnerNet).
              </p>
              <p className="mt-1 text-center text-[10px] text-amber-700">
                Affiliate-Hinweis: Diese Website enthält Affiliate-Links.
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
